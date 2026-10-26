import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

/** Mensaje fijo cuando la foto no corresponde al reto (UI + API). */
export const PHOTO_MISMATCH_MESSAGE =
  'La foto no coincide con el reto de hoy, prueba de nuevo'

const SYSTEM_PROMPT_CHALLENGE = `Eres el juez ESTRICTO de FotoHabit (nunca digas Kore ni Kore Habits).
Tu único trabajo: decidir si la imagen muestra claramente evidencia del RETO DE HOY descrito por el usuario.

Criterio de aceptación (estricto):
- Debes ver en la foto elementos visuales que coincidan de forma reconocible con la descripción del reto (objetos, acción, comida, contexto).
- Ejemplos de RECHAZO: si el reto pide una infusión/té y la foto es una pared, un selfie irrelevante, un paisaje o cualquier cosa no relacionada → RECHAZA.
- Si el reto pide vegetales/ensalada y la foto no muestra comida vegetal reconocible → RECHAZA.
- Si el reto pide ejercicio y no hay indicios de actividad/equipamiento/entorno de entrenamiento → RECHAZA.
- Fotos negras, vacías, ilegibles, memes genéricos o capturas de pantalla ajenas al reto → RECHAZA.
- En caso de duda razonable sobre si la foto muestra el reto → RECHAZA (no inventes coincidencias).

Criterio de aceptación (solo si hay evidencia clara):
- Si la foto muestra de forma evidente el reto pedido → VALIDA.
- Ángulos imperfectos o calidad media están bien SI el contenido del reto es reconocible.

Mensajes:
- Responde SIEMPRE en español.
- Si validas: 1-2 frases de ánimo concretas al reto (sin mencionar Kore).
- Si rechazas: usa EXACTAMENTE este mensaje (sin cambios):
  "${PHOTO_MISMATCH_MESSAGE}"

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"valid": true|false, "message": "texto"}`

const SYSTEM_PROMPT_MAINTENANCE = `Eres el juez ESTRICTO de FotoHabit en modo Hábito Creado / mantenimiento (nunca digas Kore ni Kore Habits).
El usuario ya pasó el ciclo inicial. Aun así, la foto DEBE relacionarse de forma clara y reconocible con el OBJETIVO principal del hábito.

Criterio estricto:
- Debe haber evidencia visual del objetivo (no basta "cualquier cosa").
- Si la foto es una pared, techo, suelo vacío, selfie irrelevante u objeto sin relación con el objetivo → RECHAZA.
- En caso de duda → RECHAZA.

Si validas: mensaje breve celebrando la constancia (1-2 frases), sin mencionar Kore.
Si rechazas: usa EXACTAMENTE:
"${PHOTO_MISMATCH_MESSAGE}"

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"valid": true|false, "message": "texto"}`

type VisionResult = {
  valid: boolean
  message: string
}

function parseVisionJson(raw: string): VisionResult | null {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/\{[\s\S]*\}/)
  const payload = fenced?.[0] ?? trimmed
  try {
    const parsed = JSON.parse(payload) as { valid?: unknown; message?: unknown }
    if (typeof parsed.valid !== 'boolean' || typeof parsed.message !== 'string') return null
    return { valid: parsed.valid, message: parsed.message.trim() }
  } catch {
    return null
  }
}

function normalizeResult(result: VisionResult): VisionResult {
  if (result.valid) {
    // Nunca filtrar marca antigua en mensajes de éxito
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

Analiza la imagen. ¿Muestra evidencia clara y reconocible de este objetivo?
Si NO coincide de forma evidente, rechaza.`
    : `Reto de hoy (debes contrastarlo CON la imagen):
Título: ${title}
Descripción del reto: ${description}
Objetivo / categoría: ${objective}

Instrucción: comprueba EXPLÍCITAMENTE si lo que aparece en la foto coincide con esa descripción.
Si la foto muestra otra cosa (pared, objeto irrelevante, escena no relacionada), rechaza.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
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
              image_url: { url: dataUrl, detail: 'high' },
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Vision API error ${response.status}: ${detail.slice(0, 280)}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
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
  try {
    const form = await request.formData()
    const image = form.get('image')
    const title = String(form.get('title') ?? '').trim()
    const description = String(form.get('description') ?? '').trim()
    const objective = String(form.get('objective') ?? '').trim() || title
    const mode = String(form.get('mode') ?? '').trim()
    const dayRaw = String(form.get('day') ?? '').trim()
    const day = dayRaw ? Number(dayRaw) : undefined
    const maintenance =
      mode === 'maintenance' || (typeof day === 'number' && !Number.isNaN(day) && day >= 22)

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json(
        { valid: false, message: 'Necesitamos una foto para validar el reto.' },
        { status: 400 },
      )
    }

    if (!title) {
      return NextResponse.json(
        { valid: false, message: 'Falta el título del reto.' },
        { status: 400 },
      )
    }

    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { valid: false, message: 'El archivo debe ser una imagen (JPG, PNG, etc.).' },
        { status: 400 },
      )
    }

    if (image.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { valid: false, message: 'La imagen es demasiado grande. Prueba con una de menos de 8 MB.' },
        { status: 400 },
      )
    }

    const bytes = Buffer.from(await image.arrayBuffer())
    const mime = image.type || 'image/jpeg'
    const dataUrl = `data:${mime};base64,${bytes.toString('base64')}`

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    const model = process.env.OPENAI_VISION_MODEL?.trim() || 'gpt-4o-mini'

    // Sin clave de visión no se puede validar con rigor: no registrar progreso.
    if (!apiKey) {
      return NextResponse.json({
        valid: false,
        message: PHOTO_MISMATCH_MESSAGE,
        demo: true,
        maintenance,
        reason: 'missing_openai_key',
      })
    }

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

    return NextResponse.json({
      valid: result.valid,
      message: result.valid
        ? result.message || `¡Reto «${title}» validado! Sigue construyendo tu racha.`
        : PHOTO_MISMATCH_MESSAGE,
      demo: false,
      maintenance,
    })
  } catch (error) {
    console.error('[validate-photo]', error)
    return NextResponse.json(
      {
        valid: false,
        message:
          'No pudimos revisar la foto ahora mismo. Inténtalo de nuevo en unos segundos.',
      },
      { status: 500 },
    )
  }
}
