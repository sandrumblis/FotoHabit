import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Mensaje fijo cuando la foto no corresponde al reto (UI + API). */
export const PHOTO_MISMATCH_MESSAGE =
  'La foto no coincide con el reto de hoy, prueba de nuevo'

const API_UNAVAILABLE_MESSAGE =
  'No pudimos revisar la foto ahora mismo. La damos por válida para que no pierdas el día — ¡sigue con tu racha!'

const SYSTEM_PROMPT_CHALLENGE = `Eres el juez amable y flexible de FotoHabit (nunca digas Kore ni Kore Habits).
Tu trabajo: decidir si la foto tiene relación razonable con el RETO DE HOY.

Criterio de aceptación (flexible, prioriza validar):
- VALIDA si la imagen muestra el reto, una intención clara o algo relacionado con el contexto del hábito (objetos, comida, entorno, actividad, selfie parcial, etc.).
- Ángulos imperfectos, calidad media o encuadres incompletos están bien si hay relación lógica con el reto.
- En caso de duda razonable → VALIDA (no castigues intentos honestos).

Solo RECHAZA cuando:
- La foto está totalmente negra, blanca/vacía, ilegible o sin contenido reconocible.
- La foto no guarda NINGUNA relación obvia con el reto (ej. pared vacía cuando piden una infusión, meme genérico sin contexto).

Mensajes:
- Responde SIEMPRE en español.
- Si validas: 1-2 frases de ánimo concretas al reto (sin mencionar Kore).
- Si rechazas: usa EXACTAMENTE este mensaje (sin cambios):
  "${PHOTO_MISMATCH_MESSAGE}"

Responde ÚNICAMENTE con JSON válido (sin markdown ni texto extra):
{"valid": true|false, "message": "texto"}`

const SYSTEM_PROMPT_MAINTENANCE = `Eres el juez amable y flexible de FotoHabit en modo Hábito Creado / mantenimiento (nunca digas Kore ni Kore Habits).
El usuario ya pasó el ciclo inicial. Premia la CONSTANCIA.

Criterio flexible:
- VALIDA cualquier imagen con relación general al objetivo del hábito (no hace falta un reto concreto).
- Selfies, entorno, objetos, comida, movimiento, orden, lectura, descanso… relacionados de forma mínima → VALIDA.
- En caso de duda → VALIDA.
- Solo RECHAZA fotos negras/vacías/ilegibles o sin ninguna relación con el objetivo.

Si validas: mensaje breve celebrando la constancia (1-2 frases), sin mencionar Kore.
Si rechazas: usa EXACTAMENTE:
"${PHOTO_MISMATCH_MESSAGE}"

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"valid": true|false, "message": "texto"}`

type VisionResult = {
  valid: boolean
  message: string
}

function jsonOk(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function softPass(title: string, extra?: Record<string, unknown>) {
  return jsonOk({
    valid: true,
    message:
      title && title !== 'Reto del día'
        ? `No pudimos revisar la foto ahora mismo. Damos por válido «${title}» para que no pierdas el día.`
        : API_UNAVAILABLE_MESSAGE,
    softPass: true,
    ...extra,
  })
}

function parseVisionJson(raw: string): VisionResult | null {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/\{[\s\S]*\}/)
  const payload = fenced?.[0] ?? trimmed
  try {
    const parsed = JSON.parse(payload) as { valid?: unknown; message?: unknown }
    if (typeof parsed.valid !== 'boolean') return null
    const message =
      typeof parsed.message === 'string' && parsed.message.trim()
        ? parsed.message.trim()
        : parsed.valid
          ? '¡Reto validado! Sigue construyendo tu racha.'
          : PHOTO_MISMATCH_MESSAGE
    return { valid: parsed.valid, message }
  } catch {
    return null
  }
}

function normalizeResult(result: VisionResult): VisionResult {
  if (result.valid) {
    return {
      valid: true,
      message: result.message
        .replace(/\bKore Habits\b/gi, 'FotoHabit')
        .replace(/\bKore\b/gi, 'FotoHabit'),
    }
  }
  return {
    valid: false,
    message: PHOTO_MISMATCH_MESSAGE,
  }
}

async function callOpenAIVision(params: {
  apiKey: string
  model: string
  dataUrl: string
  title: string
  description: string
  objective: string
  maintenance: boolean
  day?: number
}): Promise<VisionResult> {
  const { apiKey, model, dataUrl, title, description, objective, maintenance, day } = params
  const system = maintenance ? SYSTEM_PROMPT_MAINTENANCE : SYSTEM_PROMPT_CHALLENGE

  const userText = maintenance
    ? `Modo mantenimiento (día ${day ?? '22+'}).
Objetivo principal del hábito: ${objective}
Título: ${title}
Descripción de referencia: ${description}

¿La imagen guarda relación razonable con este objetivo? En caso de duda, valida.`
    : `Reto de hoy:
Título: ${title}
Descripción del reto: ${description}
Objetivo / categoría: ${objective}

¿La foto tiene relación lógica o intención relacionada con este reto?
Sé flexible: valida intentos honestos. Solo rechaza si no hay ninguna relación o la imagen está vacía.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 220,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'low' },
            },
          ],
        },
      ],
    }),
  })

  const rawBody = await response.text()
  if (!response.ok) {
    throw new Error(`Vision API error ${response.status}: ${rawBody.slice(0, 280)}`)
  }

  let data: { choices?: Array<{ message?: { content?: string } }> }
  try {
    data = JSON.parse(rawBody) as typeof data
  } catch {
    throw new Error('OpenAI devolvió un cuerpo no JSON')
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('La IA no devolvió contenido')
  }

  const parsed = parseVisionJson(content)
  if (!parsed) {
    throw new Error('Respuesta de visión inválida')
  }

  return normalizeResult(parsed)
}

export async function POST(request: Request) {
  let title = 'Reto del día'
  let maintenance = false

  try {
    const form = await request.formData()
    const image = form.get('image')
    title = String(form.get('title') ?? '').trim() || title
    const description = String(form.get('description') ?? '').trim()
    const objective = String(form.get('objective') ?? '').trim() || title
    const mode = String(form.get('mode') ?? '').trim()
    const dayRaw = String(form.get('day') ?? '').trim()
    const day = dayRaw ? Number(dayRaw) : undefined
    maintenance =
      mode === 'maintenance' || (typeof day === 'number' && !Number.isNaN(day) && day >= 22)

    if (!(image instanceof File) || image.size === 0) {
      return jsonOk(
        { valid: false, message: 'Necesitamos una foto para validar el reto.' },
        400,
      )
    }

    if (!String(form.get('title') ?? '').trim()) {
      return jsonOk({ valid: false, message: 'Falta el título del reto.' }, 400)
    }

    if (!image.type.startsWith('image/')) {
      return jsonOk(
        { valid: false, message: 'El archivo debe ser una imagen (JPG, PNG, etc.).' },
        400,
      )
    }

    if (image.size > 8 * 1024 * 1024) {
      return jsonOk(
        {
          valid: false,
          message: 'La imagen es demasiado grande. Prueba con una de menos de 8 MB.',
        },
        400,
      )
    }

    const bytes = Buffer.from(await image.arrayBuffer())
    const mime = image.type || 'image/jpeg'
    const dataUrl = `data:${mime};base64,${bytes.toString('base64')}`

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    const model = process.env.OPENAI_VISION_MODEL?.trim() || 'gpt-4o-mini'

    // Sin clave: soft-pass para no bloquear al usuario con un error técnico.
    if (!apiKey) {
      return softPass(title, { demo: true, maintenance, reason: 'missing_openai_key' })
    }

    try {
      const result = await callOpenAIVision({
        apiKey,
        model,
        dataUrl,
        title,
        description: description || title,
        objective,
        maintenance,
        day,
      })

      return jsonOk({
        valid: result.valid,
        message: result.valid
          ? result.message || `¡Reto «${title}» validado! Sigue construyendo tu racha.`
          : PHOTO_MISMATCH_MESSAGE,
        demo: false,
        maintenance,
      })
    } catch (visionError) {
      // Fallo de red / API / parse: JSON limpio + soft-pass (aviso elegante).
      console.error('[validate-photo] vision', visionError)
      return softPass(title, { demo: false, maintenance, reason: 'vision_unavailable' })
    }
  } catch (error) {
    console.error('[validate-photo]', error)
    // Nunca HTML ni texto plano: siempre JSON parseable por el cliente.
    return softPass(title, { maintenance, reason: 'server_error' })
  }
}
