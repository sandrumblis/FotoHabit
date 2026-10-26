import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const SYSTEM_PROMPT_CHALLENGE = `Actúa como un juez amigable y flexible de Kore (Kore Habits).
Tu trabajo es evaluar si la foto del usuario tiene relación lógica con el reto diario.

Reglas (prioriza siempre la validación):
- Si el usuario ha intentado hacer el reto o la foto muestra una intención mínima relacionada con el hábito, VALIDA la foto.
- Sé generoso: selfies parciales, entorno, objetos relacionados, comida, ejercicio, orden, lectura, etc. cuentan.
- Solo RECHAZA fotos que sean totalmente negras, blancas/vacías, borrosas por completo sin contenido reconocible, o que no guarden ninguna relación obvia con el reto.
- Responde SIEMPRE en español.
- Si validas, escribe un mensaje de ánimo corto, personalizado y motivador (1-2 frases) aludiendo al reto.
- Si rechazas, escribe un mensaje amable y constructivo explicando qué falta (sin tono punitivo).

Responde ÚNICAMENTE con JSON válido (sin markdown):
{"valid": true|false, "message": "texto"}`

const SYSTEM_PROMPT_MAINTENANCE = `Actúa como un juez amigable y flexible de Kore (Kore Habits) en modo Hábito Creado (Nivel 4+ / día 22+).
El usuario ya completó el ciclo de 21 días. Premia la CONSTANCIA.

Reglas (muy permisivas):
- Valida cualquier imagen que guarde una relación GENERAL con el objetivo principal del hábito (no hace falta un reto concreto).
- Selfies, entorno, objetos, comida, movimiento, orden, lectura, descanso… relacionados de forma mínima con el objetivo → VALIDA.
- Celebra la racha con mensajes positivos, energéticos y breves (1-2 frases), mencionando que suma un día más al hábito.
- Solo RECHAZA fotos totalmente negras, vacías, borrosas sin contenido, o sin ninguna relación obvia con el objetivo.
- Responde SIEMPRE en español.

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
    ? `Modo mantenimiento (día ${day ?? '22+'}).\nObjetivo principal: ${objective}\nTítulo de la tarjeta: ${title}\nDescripción: ${description}\n\nEvalúa si la foto guarda relación general con el objetivo y premia la constancia.`
    : `Reto actual:\nTítulo: ${title}\nDescripción: ${description}\nObjetivo: ${objective}\n\nEvalúa esta foto.`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
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

  return parsed
}

function demoValidate(title: string, maintenance: boolean, objective: string): VisionResult {
  if (maintenance) {
    return {
      valid: true,
      message: `¡Otro día de fuego en ${objective}! Tu constancia suma. Sigue subiendo de nivel.`,
    }
  }
  return {
    valid: true,
    message: `¡Genial! Tu foto para «${title}» queda registrada. Sigue así, cada día suma.`,
  }
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

    let result: VisionResult

    if (!apiKey) {
      result = demoValidate(title, maintenance, objective)
    } else {
      result = await callOpenAIVision({
        apiKey,
        model,
        dataUrl,
        title,
        description: description || title,
        objective,
        maintenance,
        day,
      })
    }

    if (!result.message) {
      result.message = result.valid
        ? maintenance
          ? `¡Día sumado a tu racha de ${objective}! Sigue en modo libre.`
          : `¡Reto «${title}» validado! Sigue construyendo tu racha.`
        : 'No hemos podido validar esta foto. Prueba con otra más clara y relacionada con el objetivo.'
    }

    return NextResponse.json({
      valid: result.valid,
      message: result.message,
      demo: !apiKey,
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
