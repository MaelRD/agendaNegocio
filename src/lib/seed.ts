import { BUSINESSES, CUSTOMER_NOTES, FIRST_NAMES, LAST_NAMES } from '../data/businesses'
import { addDaysKey, diffDays, fromKey, nowMinutes, todayKey } from './date'
import { buildMessage } from './messages'
import type { Appointment, AppointmentStatus, BusinessData, BusinessId, Customer } from './types'

export const DATA_VERSION = 7

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)

export function seedBusiness(id: BusinessId): BusinessData {
  const tpl = BUSINESSES[id]
  const rand = rng(hash(id) + 11)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const today = todayKey()
  const open = 9 * 60
  const close = 19 * 60

  // Customers — names are shuffled per business so each demo feels distinct.
  const COUNT = 72
  const firsts = [...FIRST_NAMES].sort(() => rand() - 0.5)
  const lasts = [...LAST_NAMES].sort(() => rand() - 0.5)
  const plain = (x: string) => x.toLowerCase().replace(/\s/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const customers: Customer[] = Array.from({ length: COUNT }, (_, i) => {
    const first = firsts[i % firsts.length]
    const last = lasts[(i + Math.floor(i / firsts.length) * 7) % lasts.length]
    const phone = `+52 55 ${String(1000 + Math.floor(rand() * 8999))} ${String(1000 + Math.floor(rand() * 8999))}`
    return {
      id: `c${i}`,
      name: `${first} ${last}`,
      phone,
      email: `${plain(first)}.${plain(last)}@mail.com`,
      notes: pick(CUSTOMER_NOTES),
      // The last few are recent sign-ups so "new customers" isn't empty.
      createdAt: i >= COUNT - 8 ? addDaysKey(today, -2 - Math.floor(rand() * 24)) : addDaysKey(today, -Math.floor(rand() * 140) - 75),
      tags: [],
    }
  })
  // A handful stopped coming ~6 weeks ago: they show up as "en riesgo".
  const lapsed = new Set(customers.slice(40, 46).map((c) => c.id))

  // Weighted customer pick: the first few are regulars.
  const weights = customers.map((_, i) => (i < 8 ? 7 : i < 30 ? 3 : 1))
  const total = weights.reduce((a, b) => a + b, 0)
  const pickCustomer = () => {
    let r = rand() * total
    for (let i = 0; i < customers.length; i++) {
      r -= weights[i]
      if (r <= 0) return customers[i]
    }
    return customers[0]
  }

  const services = tpl.services.map((s) => ({ ...s }))
  const staff = tpl.staff.map((s) => ({ ...s }))
  const appointments: Appointment[] = []
  const now = nowMinutes()

  // Popular services come first in each template.
  const pickService = () => services[Math.floor(Math.pow(rand(), 1.7) * services.length)]

  for (let offset = -70; offset <= 24; offset++) {
    const date = addDaysKey(today, offset)
    const bookedToday = new Set<string>()
    const weekday = fromKey(date).getDay()
    if (weekday === 0 && offset !== 0) continue // closed on Sundays (but keep today alive)
    const busy = weekday === 6 ? 1.25 : 1
    const fade = offset > 10 ? 0.45 : offset > 4 ? 0.7 : 1 // future fills up less

    for (const member of staff) {
      let t = open + Math.floor(rand() * 3) * 30
      while (t < close - 30) {
        const service = pickService()
        if (t + service.duration > close) break
        const roll = rand()
        if (roll < 0.74 * busy * fade) {
          const unfit = (c: Customer) => bookedToday.has(c.id) || c.createdAt > date || (lapsed.has(c.id) && offset > -40)
          let customer = pickCustomer()
          for (let tries = 0; tries < 10 && unfit(customer); tries++) customer = pickCustomer()
          if (unfit(customer)) {
            t += service.duration
            continue
          }
          bookedToday.add(customer.id)
          let status: AppointmentStatus
          const isPast = offset < 0 || (offset === 0 && t + service.duration <= now)
          const r = rand()
          if (isPast) status = r < 0.88 ? 'completed' : r < 0.95 ? 'cancelled' : 'no-show'
          else if (offset <= 1) status = r < 0.76 ? 'confirmed' : r < 0.93 ? 'pending' : 'cancelled'
          else status = r < 0.74 ? 'confirmed' : r < 0.95 ? 'pending' : 'cancelled'

          const appt: Appointment = {
            id: `a${appointments.length}`,
            customerId: customer.id,
            serviceId: service.id,
            staffId: member.id,
            date,
            start: t,
            duration: service.duration,
            status,
            notes: rand() < 0.15 ? pick(['Primera vez.', 'Trae referencia en el celular.', 'Pidió puntualidad.', 'Pago por transferencia.']) : '',
            source: rand() < 0.55 ? 'online' : rand() < 0.5 ? 'whatsapp' : 'admin',
            price: service.price,
            messages: [],
          }
          appointments.push(appt)
        }
        t += service.duration + Math.round((tpl.gap * (0.4 + rand() * 1.4)) / 15) * 15
      }
    }
  }

  const data: BusinessData = {
    version: DATA_VERSION,
    businessId: id,
    seededOn: today,
    settings: { name: tpl.name, hue: tpl.hue, phone: '+52 55 1234 5678', openHour: 9, closeHour: 19 },
    services,
    staff,
    customers,
    appointments,
    automations: [
      { id: 'confirmation', enabled: true },
      { id: 'reminder24', enabled: true },
      { id: 'reminder2', enabled: true },
      { id: 'followup', enabled: false },
      { id: 'winback', enabled: false },
    ],
    notifications: [],
  }

  // Attach a plausible message trail to upcoming appointments.
  for (const a of appointments) {
    if (a.status === 'cancelled') continue
    const d = diffDays(a.date, today)
    if (d < -1 || d > 3) continue
    const c = customers.find((x) => x.id === a.customerId)!
    const ctx = {
      customer: c.name,
      service: services.find((s) => s.id === a.serviceId)!.name,
      staff: staff.find((s) => s.id === a.staffId)!.name,
      date: a.date,
      start: a.start,
    }
    const at = (daysBefore: number, minutes = 0) => {
      const dt = fromKey(a.date)
      dt.setMinutes(a.start - minutes)
      dt.setDate(dt.getDate() - daysBefore)
      return dt.toISOString()
    }
    a.messages.push({ id: `${a.id}m1`, kind: 'confirmation', text: buildMessage('confirmation', data, ctx), at: at(4) })
    if (d <= 1) a.messages.push({ id: `${a.id}m2`, kind: 'reminder24', text: buildMessage('reminder24', data, ctx), at: at(1) })
  }

  const recent = appointments
    .filter((a) => a.source === 'online' && a.status !== 'cancelled' && diffDays(a.date, today) >= 0)
    .slice(0, 3)
  const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
  data.notifications = [
    ...recent.map((a, i) => {
      const c = customers.find((x) => x.id === a.customerId)!
      const s = services.find((x) => x.id === a.serviceId)!
      return {
        id: `n${i}`,
        title: 'Nueva reserva en línea',
        body: `${c.name} · ${s.name}`,
        at: ago(12 + i * 47),
        read: i > 0,
        kind: 'booking' as const,
      }
    }),
    {
      id: 'nw',
      title: 'Recordatorios enviados',
      body: 'Se enviaron los recordatorios de mañana por WhatsApp.',
      at: ago(160),
      read: true,
      kind: 'message',
    },
  ]

  return data
}

/**
 * Keeps a persisted demo alive over time: if it was seeded weeks ago, shift every date
 * forward by whole weeks (so weekdays line up) and settle statuses that are now in the past.
 */
export function refresh(data: BusinessData): BusinessData {
  const today = todayKey()
  const delta = diffDays(today, data.seededOn)
  const weeks = Math.floor(delta / 7)
  const shift = weeks * 7
  const now = nowMinutes()

  const appointments = data.appointments.map((a) => {
    const date = shift ? addDaysKey(a.date, shift) : a.date
    const d = diffDays(date, today)
    const past = d < 0 || (d === 0 && a.start + a.duration <= now)
    const status: AppointmentStatus = past && (a.status === 'confirmed' || a.status === 'pending') ? 'completed' : a.status
    return { ...a, date, status }
  })

  return {
    ...data,
    seededOn: shift ? addDaysKey(data.seededOn, shift) : data.seededOn,
    customers: shift ? data.customers.map((c) => ({ ...c, createdAt: addDaysKey(c.createdAt, shift) })) : data.customers,
    appointments,
  }
}
