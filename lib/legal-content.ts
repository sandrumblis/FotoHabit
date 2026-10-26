export type LegalDocId = 'privacy' | 'terms'

export const LEGAL_DOCS: Record<
  LegalDocId,
  { title: string; shortTitle: string; path: string; updated: string; sections: Array<{ heading: string; body: string }> }
> = {
  privacy: {
    title: 'Política de Privacidad',
    shortTitle: 'Privacidad',
    path: '/privacidad',
    updated: '26 de octubre de 2026',
    sections: [
      {
        heading: '1. Quiénes somos',
        body: 'FotoHabit («nosotros») es una aplicación de hábitos con validación fotográfica y comunidad. Esta Política describe cómo tratamos los datos personales cuando usas FotoHabit.',
      },
      {
        heading: '2. Datos que tratamos',
        body: 'Podemos tratar: correo electrónico y datos de cuenta (incluido acceso con Google o Apple); nombre de perfil y foto de avatar; publicaciones, pies de foto, rachas y hábitos que creas; informes de contenido; datos técnicos básicos del dispositivo y de uso necesarios para el servicio.',
      },
      {
        heading: '3. Finalidades',
        body: 'Usamos los datos para autenticarte, mostrar tu perfil y feed, validar retos, mantener Mi Red, mejorar la seguridad (incluidos reportes), cumplir obligaciones legales y enviarte avisos operativos del servicio.',
      },
      {
        heading: '4. Base legal',
        body: 'Tratamos datos sobre la base de la ejecución del contrato (prestación de FotoHabit), tu consentimiento cuando sea necesario (p. ej. ciertas comunicaciones) y el interés legítimo en la seguridad y moderación de la comunidad.',
      },
      {
        heading: '5. Conservación y seguridad',
        body: 'Conservamos los datos mientras tu cuenta esté activa y el tiempo adicional necesario por obligaciones legales o resolución de disputas. Aplicamos medidas técnicas razonables; ningún sistema es 100 % seguro.',
      },
      {
        heading: '6. Tus derechos',
        body: 'Puedes solicitar acceso, rectificación, supresión, limitación u oposición, y portabilidad cuando proceda. También puedes eliminar tus propias publicaciones desde el feed. Para ejercer derechos, contacta al soporte indicado en la app.',
      },
      {
        heading: '7. Menores',
        body: 'FotoHabit no está dirigido a menores de 16 años. Si detectamos una cuenta de un menor sin base adecuada, la eliminaremos.',
      },
      {
        heading: '8. Cambios',
        body: 'Podemos actualizar esta Política. La fecha de actualización aparece al inicio. El uso continuado tras cambios relevantes implica que has sido informado; cuando sea necesario pediremos un nuevo consentimiento.',
      },
    ],
  },
  terms: {
    title: 'Términos de Uso',
    shortTitle: 'Términos',
    path: '/terminos',
    updated: '26 de octubre de 2026',
    sections: [
      {
        heading: '1. Aceptación',
        body: 'Al crear una cuenta o usar FotoHabit aceptas estos Términos y la Política de Privacidad. Si no estás de acuerdo, no uses el servicio.',
      },
      {
        heading: '2. El servicio',
        body: 'FotoHabit ofrece herramientas para registrar hábitos, validar pruebas con foto (incluida asistencia de IA) y compartir progreso en Feed Global o Mi Red. Algunas funciones pueden requerir suscripción o límites del plan gratuito.',
      },
      {
        heading: '3. Cuenta y contenido',
        body: 'Eres responsable de tu cuenta y del contenido que publicas (fotos, textos, comentarios). Declaras tener derechos sobre ese contenido y nos concedes una licencia limitada para alojarlo y mostrarlo en FotoHabit según la visibilidad que elijas.',
      },
      {
        heading: '4. Conducta',
        body: 'No está permitido contenido ilegal, abusivo, sexual de menores, spam, acoso, suplantación o que vulnere derechos de terceros. Podemos retirar contenido, limitar cuentas o cooperar con autoridades cuando corresponda. Cualquier usuario puede reportar contenido.',
      },
      {
        heading: '5. Moderación y eliminación',
        body: 'Puedes eliminar tus propias publicaciones. Los reportes nos ayudan a revisar el contenido. No garantizamos tiempos de respuesta concretos ante cada reporte.',
      },
      {
        heading: '6. Disponibilidad',
        body: 'El servicio se ofrece «tal cual». Puede haber interrupciones, errores de validación o cambios de funciones. En la medida permitida por la ley, no respondemos por daños indirectos derivados del uso de FotoHabit.',
      },
      {
        heading: '7. Terminación',
        body: 'Puedes dejar de usar el servicio en cualquier momento. Podemos suspender o cerrar cuentas que incumplan estos Términos.',
      },
      {
        heading: '8. Contacto',
        body: 'Para dudas legales o de soporte, usa los canales de contacto disponibles en FotoHabit.',
      },
    ],
  },
}
