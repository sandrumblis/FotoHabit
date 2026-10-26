export const FREE_ACTIVE_OBJECTIVES_LIMIT = 2

export type KoreProPlanId = 'monthly' | 'yearly' | 'lifetime'

export type KoreProPlan = {
  id: KoreProPlanId
  name: string
  priceLabel: string
  periodLabel: string
  detail: string
  badge?: string
  highlight?: boolean
}

export const KORE_PRO_PLANS: KoreProPlan[] = [
  {
    id: 'monthly',
    name: 'Mensual',
    priceLabel: '4,99 €',
    periodLabel: '/ mes',
    detail: 'Ideal para empezar mes a mes',
  },
  {
    id: 'yearly',
    name: 'Anual',
    priceLabel: '29,99 €',
    periodLabel: '/ año',
    detail: 'Ahorro del 50% · ~2,50 € / mes',
    badge: 'Más popular',
    highlight: true,
  },
  {
    id: 'lifetime',
    name: 'Acceso vitalicio',
    priceLabel: '69,99 €',
    periodLabel: 'pago único',
    detail: 'Early Adopter · primeros usuarios',
    badge: 'Early Adopter',
  },
]

export const KORE_PRO_FEATURES = [
  'Objetivos ilimitados activos a la vez',
  'Retos en grupo con amigos',
  'Creación de objetivos personalizados',
  'Estadísticas avanzadas de fueguitos y constancia',
] as const

export const KORE_FREE_FEATURES = [
  'Feed de la comunidad Kore',
  `Hasta ${FREE_ACTIVE_OBJECTIVES_LIMIT} objetivos activos`,
  'Validación por IA con foto',
  'Perfiles básicos y rachas personales',
] as const
