export type BusinessId = 'nails' | 'dental' | 'tattoo' | 'psych' | 'barber' | 'coach'

export type Tone = 1 | 2 | 3 | 4 | 5

export type AppointmentStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no-show'

export interface Terms {
  /** "cita", "sesión" */
  appointment: string
  appointments: string
  /** "cliente", "paciente" */
  client: string
  clients: string
  /** "profesional", "doctor", "artista" */
  staff: string
  staffPlural: string
}

export interface Service {
  id: string
  name: string
  duration: number // minutes
  price: number
  category: string
  active: boolean
  tone: Tone
}

export interface Staff {
  id: string
  name: string
  role: string
  tone: Tone
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  notes: string
  createdAt: string // YYYY-MM-DD
  tags: string[]
}

export interface Appointment {
  id: string
  customerId: string
  serviceId: string
  staffId: string
  date: string // YYYY-MM-DD
  start: number // minutes from 00:00
  duration: number
  status: AppointmentStatus
  notes: string
  source: 'admin' | 'online' | 'whatsapp'
  price: number
  messages: SentMessage[]
}

export interface SentMessage {
  id: string
  kind: AutomationId | 'manual'
  text: string
  at: string // ISO
}

export type AutomationId = 'confirmation' | 'reminder24' | 'reminder2' | 'followup' | 'winback'

export interface Automation {
  id: AutomationId
  enabled: boolean
}

export interface AppNotification {
  id: string
  title: string
  body: string
  at: string // ISO
  read: boolean
  kind: 'booking' | 'message' | 'cancel' | 'system'
}

export interface BusinessSettings {
  name: string
  hue: number
  phone: string
  openHour: number
  closeHour: number
}

export interface BusinessData {
  version: number
  businessId: BusinessId
  seededOn: string // YYYY-MM-DD
  settings: BusinessSettings
  services: Service[]
  staff: Staff[]
  customers: Customer[]
  appointments: Appointment[]
  automations: Automation[]
  notifications: AppNotification[]
}
