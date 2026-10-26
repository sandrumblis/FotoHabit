export const HABIT_CHALLENGE_DAYS = 21

export type HabitPhase = 'adaptacion' | 'consistencia' | 'consolidacion' | 'mantenimiento'

export type HabitCategoryId =
  | 'actividad-fisica'
  | 'orden-limpieza'
  | 'comida-saludable'
  | 'enfoque-mente'
  | 'ahorro-finanzas'
  | 'sueno-descanso'
  | 'sin-humos'

export type DailyChallenge = {
  day: number
  phase: HabitPhase
  title: string
  description: string
  tip: string
}

export type HabitCategoryMeta = {
  id: HabitCategoryId
  title: string
  description: string
  color: string
  glowClass: string
}

export const PHASE_META: Record<
  Exclude<HabitPhase, 'mantenimiento'>,
  { label: string; week: string; focus: string }
> = {
  adaptacion: {
    label: 'Adaptación',
    week: 'Semana 1 · Días 1–7',
    focus: 'Toma de contacto sin fricción',
  },
  consistencia: {
    label: 'Consistencia',
    week: 'Semana 2 · Días 8–14',
    focus: 'Ritmo e intensidad gradual',
  },
  consolidacion: {
    label: 'Consolidación',
    week: 'Semana 3 · Días 15–21',
    focus: 'Maestría para sellar el hábito',
  },
}

export const HABIT_CATEGORIES: HabitCategoryMeta[] = [
  {
    id: 'actividad-fisica',
    title: 'Actividad Física',
    description:
      'Construye un cuerpo activo y vital mediante pequeños hábitos de movimiento diario.',
    color: '#00f0ff',
    glowClass: 'neon-cyan',
  },
  {
    id: 'orden-limpieza',
    title: 'Orden y Limpieza',
    description:
      'Transforma tu entorno en un espacio claro y sereno, un pequeño rincón cada día.',
    color: '#ffe600',
    glowClass: 'neon-yellow',
  },
  {
    id: 'comida-saludable',
    title: 'Comida Saludable y Equilibrada',
    description:
      'Nutre tu bienestar con comida real, color, hidratación y el placer de comer con conciencia.',
    color: '#39ff14',
    glowClass: 'neon-lime',
  },
  {
    id: 'enfoque-mente',
    title: 'Enfoque y Mente',
    description:
      'Entrena tu atención y crea calma mental con rituales de lectura, respiración y yoga suave.',
    color: '#bc13fe',
    glowClass: 'neon-fuchsia',
  },
  {
    id: 'ahorro-finanzas',
    title: 'Ahorro y Finanzas',
    description:
      'Gana claridad y control sobre tu dinero con gestos diarios pequeños y sostenibles.',
    color: '#ffb800',
    glowClass: 'neon-yellow',
  },
  {
    id: 'sueno-descanso',
    title: 'Sueño y Descanso',
    description:
      'Diseña noches reparadoras con rituales que preparan tu mente y tu espacio para dormir.',
    color: '#7b61ff',
    glowClass: 'neon-purple',
  },
  {
    id: 'sin-humos',
    title: 'Sin Humos',
    description:
      'Libera tus pulmones y fortalece tu nueva identidad libre de humo, un día a la vez.',
    color: '#ff4d6d',
    glowClass: 'neon-cyan',
  },
]

function phaseForDay(day: number): HabitPhase {
  if (day <= 7) return 'adaptacion'
  if (day <= 14) return 'consistencia'
  return 'consolidacion'
}

function buildDays(
  entries: Array<{ title: string; description: string; tip?: string }>,
): DailyChallenge[] {
  return entries.map((entry, index) => {
    const day = index + 1
    return {
      day,
      phase: phaseForDay(day),
      title: entry.title,
      description: entry.description,
      tip: entry.tip ?? 'Captura una foto como prueba de este reto.',
    }
  })
}

export const HABIT_CHALLENGES: Record<HabitCategoryId, DailyChallenge[]> = {
  'comida-saludable': buildDays([
    {
      title: 'Hidratación consciente',
      description:
        'Foto a tu vaso de agua o infusión favorita para empezar el día con energía.',
    },
    {
      title: 'Energía frutal',
      description:
        'Foto a tu fruta de temporada favorita (del tamaño o color que te apetezca).',
    },
    {
      title: 'El plato colorido',
      description:
        'Foto a tu comida principal con al menos dos vegetales de colores vivos en el plato.',
    },
    {
      title: 'Desayuno reconfortante',
      description:
        'Foto a tu desayuno casero favorito (tostada, bol de avena, yogur o lo que te haga empezar bien el día).',
    },
    {
      title: 'Toque crujiente',
      description:
        'Foto a un puñado de frutos secos o semillas naturales añadidos a tu plato o como snack.',
    },
    {
      title: 'Cocina casera libre',
      description:
        'Foto a un plato sencillo preparado por ti en casa disfrutando del proceso.',
    },
    {
      title: 'Infusión o té relajante',
      description:
        'Foto a tu momento de pausa con una bebida caliente o agua saborizada natural.',
    },
    {
      title: 'Platos con vida',
      description:
        'Foto a un almuerzo o cena donde los vegetales sean los grandes protagonistas.',
    },
    {
      title: 'El poder de los cereales integrales',
      description:
        'Foto a tu opción de pan, arroz, pasta o grano integral favorito.',
    },
    {
      title: 'Snacking nutritivo',
      description:
        'Foto a un tentempié saludable (fruta, yogur natural, bastoncitos de zanahoria con hummus, etc.).',
    },
    {
      title: 'Proteína de calidad',
      description:
        'Foto a tu plato principal con tu fuente de proteína favorita (pescado, legumbres, huevos, tofu o carne).',
    },
    {
      title: 'Hidratación activa',
      description:
        'Foto a tu botella reutilizable o vaso grande de agua en tu lugar de trabajo o estudio.',
    },
    {
      title: 'El placer de compartir',
      description:
        'Foto a un plato casero compartido en buena compañía (familia, amigos o pareja).',
    },
    {
      title: 'Aliño casero',
      description:
        'Foto a tu plato con un toque de aceite de oliva virgen extra, hierbas aromáticas o especias naturales.',
    },
    {
      title: 'Variedad de mercado',
      description:
        'Foto a la compra fresca o ingredientes coloridos listos en tu cocina.',
    },
    {
      title: 'Tupper con mimo',
      description:
        'Foto a tu comida preparada en casa para llevar si te toca comer fuera hoy.',
    },
    {
      title: 'Cocina de aprovechamiento',
      description:
        'Foto a una receta creativa hecha con lo que tenía la nevera para evitar desperdiciar.',
    },
    {
      title: 'Hidratación con toque natural',
      description:
        'Foto a tu agua con unas rodajas de limón, pepino o menta fresca.',
    },
    {
      title: 'Comida consciente',
      description:
        'Foto a tu plato disfrutándolo con calma y sin pantallas de por medio.',
    },
    {
      title: 'Receta favorita saludable',
      description:
        'Foto a ese plato nutritivo que te encanta cocinar y repetir siempre.',
    },
    {
      title: '¡3 semanas de nutrición consciente!',
      description:
        'Foto a tu plato equilibrado favorito celebrando el cuidado de tu bienestar interior.',
    },
  ]),

  'ahorro-finanzas': buildDays([
    {
      title: 'Inaugura tu bote de ahorro',
      description: 'Moneda o billete introducido en tu hucha o bote.',
    },
    {
      title: 'Revisión de suscripciones',
      description: 'Nota escrita a mano en libreta con tus suscripciones anotadas.',
    },
    {
      title: 'Evitar compra por impulso',
      description:
        'Nota manuscrita con algo que querías comprar hoy pero dejaste en espera.',
    },
    {
      title: 'Ahorro de transporte',
      description:
        'Zapatillas o transporte público en lugar de pedir un taxi/VTC.',
    },
    {
      title: 'Ticket bajo control',
      description: 'Un ticket de compra necesario donde hayas revisado el total.',
    },
    {
      title: 'Monedas del cambio',
      description: 'Monedas del cambio de hoy guardadas directamente en tu hucha.',
    },
    {
      title: 'Limpieza de armarios',
      description:
        'Un objeto o prenda que ibas a comprar pero recordaste que ya tenías.',
    },
    {
      title: 'Cero gastos extras hoy',
      description: 'Nota en una libreta anotando "$0 en antojos hoy".',
    },
    {
      title: 'Auditoría de gasto hormiga',
      description:
        'Apuntar en un papel un pequeño gasto innecesario que hayas evitado o detectado hoy.',
    },
    {
      title: 'Presupuesto de la semana',
      description: 'Hoja de libreta con el límite de gasto semanal escrito.',
    },
    {
      title: 'Moneda al bote diario',
      description: 'Aporte constante a tu hucha o caja de ahorro.',
    },
    {
      title: 'Lista de necesidades vs. deseos',
      description: 'Papel dividido en dos columnas con tus prioridades escritas.',
    },
    {
      title: 'Ahorro de luz/energía',
      description:
        'Interruptores o regleta apagada para evitar consumo innecesario.',
    },
    {
      title: 'Cero compras online hoy',
      description:
        'Pantalla del móvil con la cesta de la compra vacía o app cerrada.',
    },
    {
      title: 'Hucha a mitad de mes',
      description: 'Foto mostrando el progreso de monedas acumuladas en tu bote.',
    },
    {
      title: 'Comida hecha en casa',
      description:
        'Taper o comida preparada en casa para evitar salir de restaurante.',
    },
    {
      title: 'Ahorro en entretenimiento',
      description:
        'Paseo, lectura o actividad gratuita disfrutada en tu tiempo libre.',
    },
    {
      title: 'Revisar tarifas habituales',
      description:
        'Anotación en tu libreta con una idea para optimizar facturas.',
    },
    {
      title: 'Café de casa para el día',
      description:
        'Taza o termo de café/té preparado en casa (evitando la cafetería).',
    },
    {
      title: 'Billete guardado',
      description: 'Billete de papel reservado en tu fondo de ahorro.',
    },
    {
      title: 'Pausa de 24h para antojos',
      description:
        'Nota anotando un capricho visto hoy que vas a esperar 24h antes de comprar.',
    },
  ]),

  'enfoque-mente': buildDays([
    {
      title: 'Página del día',
      description: 'Leer al menos un par de páginas en un libro físico o e-Reader.',
    },
    {
      title: 'Taza de desconexión',
      description:
        'Tomar un café o infusión en la mesa disfrutando del momento, con cero pantallas.',
    },
    {
      title: 'Las 3 prioridades',
      description:
        'Anotar rápidamente en un papel o post-it las 3 únicas tareas clave del día.',
    },
    {
      title: 'Paseo en silencio',
      description:
        'Dar un paseo al aire libre mirando al frente y sin llevar auriculares puestos.',
    },
    {
      title: 'Rincón de calma',
      description:
        'Crear un espacio tranquilo en casa con luz natural o tenue para desconectar 5 minutos.',
    },
    {
      title: 'Pantalla apagada',
      description:
        'Portátil o TV totalmente apagados con un libro o revista sobre la mesa.',
    },
    {
      title: 'Avance de lectura',
      description:
        'Marcar tu progreso en el libro con un marcapáginas y una breve frase de lo leído.',
    },
    {
      title: 'Momento de respiración consciente',
      description:
        'Abrir la ventana o hacer 3 respiraciones profundas con los ojos cerrados para hacer una pausa mental.',
    },
    {
      title: 'Idea del día',
      description:
        'Apuntar en una línea una idea interesante o pensamiento positivo que te haya venido a la mente.',
    },
    {
      title: 'Escritorio limpio',
      description:
        'Despejar la mesa dejando únicamente el libro o cuaderno que vas a utilizar.',
    },
    {
      title: 'Bloque de lectura',
      description: 'Avanzar unas cuantas páginas en tu lectura y hacer foto al libro abierto.',
    },
    {
      title: 'Estiramiento o mini sesión de yoga',
      description:
        'Dedicar 5 minutos a estirar con calma o hacer un par de posturas de yoga sencillas en una esterilla o alfombra.',
    },
    {
      title: 'Luz natural',
      description:
        'Leer o reflexionar sentado cerca de una ventana aprovechando la luz del día.',
    },
    {
      title: 'Plan exprés',
      description:
        'Anotar de forma muy esquemática la planificación simple de tu semana en un papel.',
    },
    {
      title: 'Pausa visual',
      description:
        'Hacer un descanso de pantallas mirando a lo lejos o a un punto fijo durante unos minutos.',
    },
    {
      title: 'Capítulo completado',
      description: 'Terminar un capítulo y mostrar el libro listo para el siguiente.',
    },
    {
      title: 'Yoga suave o movilidad',
      description:
        'Foto a tu esterilla o rincón de calma preparado para una sesión corta de estiramientos relajantes.',
    },
    {
      title: 'Esquema rápido',
      description:
        'Trazar un pequeño esquema mental o flechas en un papel para ordenar una idea.',
    },
    {
      title: 'Check de logro',
      description:
        'Marcar con una gran cruz o check en un papel la meta de concentración cumplida hoy.',
    },
    {
      title: 'Paseo consciente',
      description: 'Salir a caminar observando los detalles del entorno sin prisa alguna.',
    },
    {
      title: 'Meta cumplida',
      description:
        'Mostrar el lomo del libro casi o totalmente finalizado tras estas tres semanas.',
    },
  ]),

  'orden-limpieza': buildDays([
    {
      title: 'Sábanas estiradas',
      description: 'Foto a tu cama perfectamente hecha.',
    },
    {
      title: 'Fregadero despejado',
      description: 'Foto al fregadero limpio y sin platos acumulados.',
    },
    {
      title: 'Mesita de noche',
      description: 'Foto a tu mesita de noche recogida y sin trastos sobrantes.',
    },
    {
      title: 'Sofá de revista',
      description: 'Foto al sofá con los cojines colocados y mantas dobladas.',
    },
    {
      title: 'Mesa de comer libre',
      description: 'Foto a la mesa del salón/comedor completamente despejada.',
    },
    {
      title: 'Sábanas estiradas',
      description: 'Foto a tu cama perfectamente hecha.',
    },
    {
      title: 'Basura fuera',
      description: 'Foto al cubo de basura limpio o bolsa de reciclaje cerrada para tirar.',
    },
    {
      title: 'Espejo reluciente',
      description: 'Foto al espejo del baño o habitación limpio.',
    },
    {
      title: 'Cajón bajo control',
      description: 'Foto a un cajón (de ropa, cubiertos o cables) organizado.',
    },
    {
      title: 'Encimera de la cocina',
      description: 'Foto a la superficie de la cocina limpia y recogida.',
    },
    {
      title: 'Ropa doblada',
      description: 'Foto a un montón de ropa recién doblada o guardada.',
    },
    {
      title: 'Zona de abrigo/bolsos',
      description: 'Foto al perchero o zona de la entrada en orden.',
    },
    {
      title: 'Suelo limpio',
      description: 'Foto del cubo de fregar lleno o suelo reluciente.',
    },
    {
      title: 'Platos limpios',
      description: 'Foto de fregadero despejado y vajilla guardada.',
    },
    {
      title: 'Cama impecable (Nivel 2)',
      description: 'Foto a la cama hecha con almohadas alineadas.',
    },
    {
      title: 'Armario ordenado',
      description: 'Foto a una sección de tu armario bien colgada.',
    },
    {
      title: 'Nevera organizada',
      description: 'Foto al interior de la nevera limpia y con cosas ordenadas.',
    },
    {
      title: 'Estantería o balda',
      description: 'Foto a una balda o estante de libros/adornos recogido.',
    },
    {
      title: 'Cristales limpios',
      description: 'Foto de una ventana limpia.',
    },
    {
      title: 'Despensa/Mando',
      description:
        'Foto a un armario de comida organizada o mesa de centro despejada.',
    },
    {
      title: '¡3 semanas de orden!',
      description: 'Foto a tu rincón favorito bien ordenado.',
    },
  ]),

  'actividad-fisica': buildDays([
    {
      title: 'Calzado listo',
      description:
        'Foto a tus zapatillas puestas en los pies dentro de casa o en la calle.',
    },
    {
      title: 'Primer paseo',
      description: 'Foto de camino mientras caminas al aire libre.',
    },
    {
      title: 'Sentadillas express',
      description: 'Foto en el salón con ropa cómoda o toalla lista en el suelo.',
    },
    {
      title: 'Cambio de elevador',
      description: 'Foto a las escaleras de tu edificio/calle (reto: subir a pie).',
    },
    {
      title: 'Estiramiento mañanero',
      description:
        'Foto a tus manos tocando los pies o esterilla/toalla en el suelo.',
    },
    {
      title: 'Paseo con objetivo',
      description: 'Foto/vídeo de ejercicio en la tele o dispositivo.',
    },
    {
      title: 'Descanso activo',
      description: 'Foto a ti dando un paseo tranquilo.',
    },
    {
      title: 'Ropa de acción',
      description:
        'Foto a tu ropa de deporte (selfie de cuerpo entero listo para moverte).',
    },
    {
      title: 'Marcha de 10 minutos',
      description: 'Foto de tu camino durante una caminata a paso ligero.',
    },
    {
      title: 'Vídeo/Rutina en pantalla',
      description:
        'Foto a la pantalla del TV/portátil/móvil con un vídeo de rutina de ejercicio en casa.',
    },
    {
      title: 'Abdominales o core',
      description:
        'Foto a tu espacio de ejercicio en el suelo de casa o gym con botella de agua cerca.',
    },
    {
      title: 'Pasos en movimiento',
      description: 'Foto de escaleras desde arriba.',
    },
    {
      title: 'Flexiones/Fuerza suave',
      description: 'Foto con tu ropa de deporte.',
    },
    {
      title: 'Check-in de energía',
      description:
        'Selfie o foto a tus zapatillas/botella tras terminar 15 minutos de ejercicio.',
    },
    {
      title: 'Paseo de aire fresco',
      description:
        'Foto a un árbol, parque o paisaje urbano durante tu caminata.',
    },
    {
      title: 'Cardio en casa',
      description:
        'Foto a la pantalla con una clase de baile, zumba o cardio en casa.',
    },
    {
      title: 'Escalones extra',
      description: 'Foto a unas escaleras que hayas subido a pie.',
    },
    {
      title: 'Movilidad de espalda/cuello',
      description: 'Foto en el rincón de estiramientos de casa o gym.',
    },
    {
      title: 'Caminata con música/podcast',
      description: 'Foto con tus auriculares y zapatillas puestas.',
    },
    {
      title: 'Circuito de cuerpo completo',
      description:
        'Foto a tus materiales caseros o gym (botellas de agua usadas como pesas, esterilla, etc.).',
    },
    {
      title: '¡3 semanas activo!',
      description:
        'Foto en exterior o en tu espacio de entreno mostrando el logro final.',
    },
  ]),

  'sin-humos': buildDays([
    {
      title: 'Limpieza de ceniceros y mecheros',
      description:
        'Foto a tus ceniceros guardados/limpios o tirados para dejar el espacio libre de tentaciones.',
    },
    {
      title: 'Sustituto del café o momentos clave',
      description:
        'Foto a un vaso de agua con hielo, infusión o chicle cuando te entre la primera gana de fumar.',
    },
    {
      title: 'Aire limpio al despertar',
      description:
        'Foto a tu ventana abierta ventilando la habitación para llenar la casa de aire fresco.',
    },
    {
      title: 'Manos ocupadas',
      description:
        'Foto a una pelota antiestrés, bolígrafo o pasatiempo utilizado para canalizar la inquietud de las manos.',
    },
    {
      title: 'Ahorro directo de tabaco',
      description:
        'Foto a las monedas o billete que habrías gastado hoy en un paquete depositados en una hucha.',
    },
    {
      title: 'Espacio 100% libre de humo',
      description: 'Foto a tu coche, escritorio o salón impecable y con buen olor.',
    },
    {
      title: 'Registro de la primera semana',
      description:
        'Foto a una nota escrita con el número de días logrados (¡7 días libres de humo!).',
    },
    {
      title: 'Pausa de respiración en vez de pausa para fumar',
      description:
        'Foto a un lugar al aire libre o parque donde hayas hecho 5 respiraciones profundas.',
    },
    {
      title: 'Snack crujiente anti-ansiedad',
      description:
        'Foto a palitos de zanahoria, manzana o frutos secos usados como sustituto en momentos críticos.',
    },
    {
      title: 'Lavado de cara o dientes en momentos de ganas',
      description:
        'Foto al lavabo tras cepillarte los dientes para cambiar el sabor de la boca y cortar la ansiedad.',
    },
    {
      title: 'Cambio de ruta habitual',
      description:
        'Foto a un camino o calle diferente al volver a casa para evitar los lugares asociados al cigarrillo.',
    },
    {
      title: 'Apoyo en personas de confianza',
      description:
        'Foto a un mensaje enviado a un amigo/familiar o nota recordando por quién o para qué estás dejándolo.',
    },
    {
      title: 'Bebida reconfortante',
      description:
        'Foto a un té, manzanilla o zumo natural en el momento en que solías fumar el cigarrillo de la tarde/noche.',
    },
    {
      title: 'Hucha del no-fumador (Día 14)',
      description:
        'Foto al bote donde acumulas todo lo ahorrado en estas dos semanas.',
    },
    {
      title: 'Aromas y sentidos renovados',
      description:
        'Foto a tu colonia favorita o una vela aromática disfrutando de la recuperación del olfato.',
    },
    {
      title: 'Ejercicio o paseo sin fatiga',
      description:
        'Foto a tus zapatillas o reloj tras una caminata sin sentir el ahogo habitual.',
    },
    {
      title: 'Recompensa saludable',
      description:
        'Foto a un pequeño capricho o detalle comprado con el dinero que has ahorrado al no fumar.',
    },
    {
      title: 'Limpieza o lavado de ropa',
      description:
        'Foto a tu ropa recién lavada o sábanas limpias con olor a suavizante, sin rastro de humo.',
    },
    {
      title: 'Superar la prueba de fuego',
      description:
        'Foto a una salida o reunión social disfrutada sin haber encendido ningún cigarrillo.',
    },
    {
      title: 'Nota para los días difíciles',
      description:
        'Foto a un papel escrito con tus 3 razones principales para mantenerte libre de humo para siempre.',
    },
    {
      title: '¡3 semanas libre de humo!',
      description:
        'Selfie triunfal o foto a tu hucha del ahorro celebrando el cambio de vida y pulmones limpios.',
    },
  ]),

  'sueno-descanso': buildDays([
    {
      title: 'Cama invitada al descanso',
      description:
        'Foto a tu cama hecha y bien ventilada antes de que caiga la noche.',
    },
    {
      title: 'Taza de infusión relajante',
      description:
        'Foto a una manzanilla, tila o té sin cafeína tomado antes de dormir.',
    },
    {
      title: 'Mesita de noche despejada',
      description:
        'Foto a tu mesita de noche ordenada, limpia y sin pantallas cerca antes de dormir.',
    },
    {
      title: 'Luz tenue nocturna',
      description:
        'Foto a la habitación iluminada solo con una lámpara cálida o tenue 30 minutos antes de acostarte.',
    },
    {
      title: 'Lectura de reposo',
      description:
        'Foto a un libro físico o e-Reader en la mesita en lugar de mirar pantallas.',
    },
    {
      title: 'Habitación a temperatura fresca',
      description:
        'Foto a la ventana entreabierta o al dormitorio despejado y preparado para dormir fresco.',
    },
    {
      title: 'Registro de horario regular',
      description:
        'Foto a una nota o alarma configurada a la misma hora para acostarte o despertarte.',
    },
    {
      title: 'Cero pantallas 30 minutos antes',
      description:
        'Foto a la TV y portátil apagados con tiempo de margen antes de dormir.',
    },
    {
      title: 'Cena ligera nocturna',
      description:
        'Foto a una cena suave preparada temprano para facilitar la digestión antes de acostarte.',
    },
    {
      title: 'Duchas o baño reconfortante',
      description:
        'Foto a la toalla o ambiente del baño tras un baño o ducha de agua templada antes de dormir.',
    },
    {
      title: 'Estiramiento nocturno suave',
      description:
        'Foto a tu esterilla o alfombra tras hacer 3 estiramientos suaves de espalda y cuello.',
    },
    {
      title: 'Oscuridad total',
      description:
        'Foto a tus persianas totalmente bajadas o antifaz listo sobre la almohada.',
    },
    {
      title: 'Respiración para calmar la mente',
      description:
        'Foto a tu espacio de descanso preparado para hacer 5 respiraciones lentas antes de apagar la luz.',
    },
    {
      title: 'Luz solar al despertar',
      description:
        'Foto a la ventana abierta al levantarte para recibir la luz natural de la mañana.',
    },
    {
      title: 'Aromaterapia o aroma suave',
      description:
        'Foto a una bruma de almohada, aceite esencial de lavanda o ambiente fresco.',
    },
    {
      title: 'Vaciado de mente nocturno',
      description:
        'Foto a una libreta en la mesita con una palabra o idea anotada para no llevar preocupaciones a la cama.',
    },
    {
      title: 'Sin cafeína por la tarde',
      description:
        'Foto a tu agua o bebida sin estimulantes tomada a partir de mitad de la tarde.',
    },
    {
      title: 'Calzado relajado de casa',
      description:
        'Foto a tus zapatillas de estar por casa o pies descansando tras un día activo.',
    },
    {
      title: 'Pausa de siesta o descanso consciente',
      description:
        'Foto a un rincón de descanso preparado para una pausa de 15-20 minutos durante el día.',
    },
    {
      title: 'Ropa de cama limpia',
      description:
        'Foto a las sábanas o funda de almohada recién cambiadas para una sensación de frescor total.',
    },
    {
      title: '¡3 semanas de sueño reparador!',
      description:
        'Foto a tu dormitorio en paz o a un mensaje de celebración anotando lo bien que te sientes tras este ciclo.',
    },
  ]),
}

export function getPhaseForDay(day: number): HabitPhase {
  if (day >= 22) return 'mantenimiento'
  return phaseForDay(Math.min(Math.max(day, 1), HABIT_CHALLENGE_DAYS))
}

/** Día en curso (sin tope: niveles infinitos). */
export function getCurrentDay(completed: number): number {
  return Math.max(completed + 1, 1)
}

export function getChallenge(categoryId: HabitCategoryId, day: number): DailyChallenge {
  const safeDay = Math.max(1, Math.floor(day))
  if (safeDay > HABIT_CHALLENGE_DAYS) {
    return {
      day: safeDay,
      phase: 'mantenimiento',
      title: 'Consolidación del Hábito',
      description:
        'Sube tu foto diaria relacionada con este objetivo para mantener tu racha.',
      tip: 'Cualquier prueba relacionada con tu objetivo cuenta. La constancia es el hábito.',
    }
  }
  return HABIT_CHALLENGES[categoryId][safeDay - 1]
}

export function getCategoryMeta(categoryId: HabitCategoryId): HabitCategoryMeta {
  return HABIT_CATEGORIES.find((c) => c.id === categoryId)!
}

export function getChallengesByWeek(categoryId: HabitCategoryId): Array<{
  phase: HabitPhase
  label: string
  week: string
  focus: string
  challenges: DailyChallenge[]
}> {
  const list = HABIT_CHALLENGES[categoryId]
  return (
    ['adaptacion', 'consistencia', 'consolidacion'] as Array<
      Exclude<HabitPhase, 'mantenimiento'>
    >
  ).map((phase) => ({
    phase,
    ...PHASE_META[phase],
    challenges: list.filter((c) => c.phase === phase),
  }))
}
