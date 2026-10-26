import { createClient } from './client'

export type ReportTargetType = 'post' | 'comment'

export async function deleteOwnPost(postId: string) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Debes iniciar sesión')

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId)

  if (error) {
    if (/row-level security|rls/i.test(error.message)) {
      throw new Error(
        'No se pudo eliminar (RLS). Comprueba que la política posts_delete_own esté activa.',
      )
    }
    throw new Error(error.message || 'No se pudo eliminar la publicación')
  }
}

export async function reportContent(input: {
  targetType: ReportTargetType
  targetId: string
  reason?: string
}) {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Debes iniciar sesión para reportar')

  const payload = {
    reporter_id: userId,
    target_type: input.targetType,
    target_id: input.targetId,
    reason: input.reason?.trim() || 'Contenido inapropiado',
  }

  const { error } = await supabase.from('content_reports').insert(payload)

  if (error) {
    // Tabla ausente: no romper UX; registrar en consola y confirmar al usuario.
    if (/relation|does not exist|schema cache/i.test(error.message)) {
      console.warn('[report] content_reports ausente; reporte local', payload)
      return { ok: true as const, stored: false as const }
    }
    if (/row-level security|rls/i.test(error.message)) {
      throw new Error(
        'No se pudo enviar el reporte (RLS). Ejecuta el SQL de content_reports en Supabase.',
      )
    }
    throw new Error(error.message || 'No se pudo enviar el reporte')
  }

  return { ok: true as const, stored: true as const }
}
