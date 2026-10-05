import { buildMessage } from './messages'
import { DATA_VERSION, refresh, seedBusiness } from './seed'
import { uid } from './format'
import type { Appointment, BusinessData, BusinessId, Customer } from './types'

const PREFIX = 'agenda-demo'
export const ACTIVE_KEY = `${PREFIX}:active`
export const THEME_KEY = `${PREFIX}:theme`
export const dataKey = (id: BusinessId) => `${PREFIX}:data:${id}`

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const readActive = (): BusinessId =>
  safe(() => (localStorage.getItem(ACTIVE_KEY) as BusinessId) || 'nails', 'nails')

export const writeActive = (id: BusinessId) => safe(() => localStorage.setItem(ACTIVE_KEY, id), undefined)

export function loadBusiness(id: BusinessId): BusinessData {
  const stored = safe(() => {
    const raw = localStorage.getItem(dataKey(id))
    return raw ? (JSON.parse(raw) as BusinessData) : null
  }, null)
  if (stored && stored.version === DATA_VERSION) return refresh(stored)
  const fresh = seedBusiness(id)
  saveBusiness(fresh)
  return fresh
}

export const saveBusiness = (data: BusinessData) =>
  safe(() => localStorage.setItem(dataKey(data.businessId), JSON.stringify(data)), undefined)

export const clearBusiness = (id: BusinessId) => safe(() => localStorage.removeItem(dataKey(id)), undefined)

export interface NewAppointmentInput {
  customerId?: string
  newCustomer?: { name: string; phone: string; email?: string }
  serviceId: string
  staffId: string
  date: string
  start: number
  notes: string
  status?: Appointment['status']
}

/** Pure: returns the updated business data plus the created appointment. */
export function withNewAppointment(
  data: BusinessData,
  input: NewAppointmentInput,
  source: Appointment['source'],
): { data: BusinessData; appointment: Appointment; customer: Customer } {
  let customers = data.customers
  let customer = input.customerId ? customers.find((c) => c.id === input.customerId) : undefined

  if (!customer && input.newCustomer) {
    const phoneDigits = input.newCustomer.phone.replace(/\D/g, '')
    customer = customers.find((c) => phoneDigits && c.phone.replace(/\D/g, '').endsWith(phoneDigits.slice(-10)))
    if (!customer) {
      customer = {
        id: `c${uid()}`,
        name: input.newCustomer.name.trim(),
        phone: input.newCustomer.phone.trim(),
        email: input.newCustomer.email?.trim() ?? '',
        notes: '',
        createdAt: input.date,
        tags: [],
      }
      customers = [customer, ...customers]
    }
  }
  if (!customer) throw new Error('Customer required')

  const service = data.services.find((s) => s.id === input.serviceId)!
  const staff = data.staff.find((s) => s.id === input.staffId)!
  const confirmOn = data.automations.find((a) => a.id === 'confirmation')?.enabled

  const appointment: Appointment = {
    id: `a${uid()}`,
    customerId: customer.id,
    serviceId: service.id,
    staffId: staff.id,
    date: input.date,
    start: input.start,
    duration: service.duration,
    status: input.status ?? (confirmOn ? 'confirmed' : 'pending'),
    notes: input.notes,
    source,
    price: service.price,
    messages: confirmOn
      ? [
          {
            id: uid(),
            kind: 'confirmation',
            at: new Date().toISOString(),
            text: buildMessage('confirmation', data, {
              customer: customer.name,
              service: service.name,
              staff: staff.name,
              date: input.date,
              start: input.start,
            }),
          },
        ]
      : [],
  }

  const notifications =
    source === 'online'
      ? [
          {
            id: uid(),
            title: 'Nueva reserva en línea',
            body: `${customer.name} · ${service.name}`,
            at: new Date().toISOString(),
            read: false,
            kind: 'booking' as const,
          },
          ...data.notifications,
        ].slice(0, 20)
      : data.notifications

  return {
    data: { ...data, customers, appointments: [...data.appointments, appointment], notifications },
    appointment,
    customer,
  }
}
