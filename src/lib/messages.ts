import { BUSINESSES } from '../data/businesses'
import { fmtDayMonth, fmtTime } from './date'
import { firstName } from './format'
import type { AutomationId, BusinessData } from './types'

export interface MessageContext {
  customer: string
  service: string
  staff: string
  date: string
  start: number
}

export interface AutomationMeta {
  id: AutomationId
  title: string
  description: string
  when: string
  impact: string
}

export const AUTOMATIONS: AutomationMeta[] = [
  {
    id: 'confirmation',
    title: 'Confirmación de reserva',
    description: 'Envía automáticamente un WhatsApp cuando un cliente agenda.',
    when: 'Al crear la reserva',
    impact: 'El cliente sabe al instante que su lugar está apartado.',
  },
  {
    id: 'reminder24',
    title: 'Recordatorio 24 horas antes',
    description: 'Reduce cancelaciones recordando al cliente su cita.',
    when: '24 h antes',
    impact: 'Pide confirmar con un toque, o reagendar si no puede.',
  },
  {
    id: 'reminder2',
    title: 'Recordatorio 2 horas antes',
    description: 'Un último aviso con la dirección y la hora exacta.',
    when: '2 h antes',
    impact: 'Menos retrasos y menos “se me olvidó”.',
  },
  {
    id: 'followup',
    title: 'Mensaje después de la cita',
    description: 'Agradece la visita y pide una reseña en Google.',
    when: '3 h después',
    impact: 'Más reseñas sin tener que pedirlas en persona.',
  },
  {
    id: 'winback',
    title: 'Recuperación de clientes',
    description: 'Contacta clientes que llevan tiempo sin reservar.',
    when: 'Tras 45 días sin visita',
    impact: 'Recupera ingresos de clientes que ya te conocen.',
  },
]

export function buildMessage(id: AutomationId | 'manual', data: BusinessData, ctx: MessageContext) {
  const b = BUSINESSES[data.businessId]
  const name = firstName(ctx.customer)
  const day = fmtDayMonth(ctx.date)
  const time = fmtTime(ctx.start)
  const biz = data.settings.name
  const t = b.terms

  switch (id) {
    case 'confirmation':
      return `Hola ${name} 👋\n\nTu ${t.appointment} quedó confirmada.\n\n*${ctx.service}*\n📅 ${day}\n🕐 ${time}\n👤 ${ctx.staff}\n\nTe esperamos en ${biz}.`
    case 'reminder24':
      return `Hola ${name}, te recordamos tu ${t.appointment} de mañana 🗓️\n\n*${ctx.service}* · ${time}\n\nResponde *1* para confirmar o *2* para reagendar.`
    case 'reminder2':
      return `¡Nos vemos en 2 horas, ${name}! ⏰\n\n${ctx.service} a las ${time} con ${ctx.staff}.\n\n${b.reminderTip}`
    case 'followup':
      return `Gracias por venir hoy, ${name} 💜\n\n¿Nos ayudas con una reseña? Nos toma 30 segundos y nos ayuda muchísimo:\n🔗 g.page/${biz.toLowerCase().replace(/[^a-z]/g, '')}`
    case 'winback':
      return `Hola ${name}, ¡te extrañamos en ${biz}! ✨\n\nEsta semana tenemos espacios libres. ¿Te apartamos uno?\n\nResponde con el día que te acomode.`
    case 'manual':
      return `Hola ${name}, te escribimos de ${biz} sobre tu ${t.appointment} del ${day} a las ${time}.`
  }
}

export function quickReplies(id: AutomationId | 'manual'): string | null {
  switch (id) {
    case 'confirmation':
      return '¡Perfecto, gracias! 🙌'
    case 'reminder24':
      return '1'
    case 'reminder2':
      return 'Voy en camino 🚗'
    case 'followup':
      return '¡Claro! Me encantó ✨'
    case 'winback':
      return '¿Tienen el jueves en la tarde?'
    default:
      return null
  }
}
