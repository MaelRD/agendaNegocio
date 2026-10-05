import { addDaysKey, diffDays, nowMinutes, todayKey, toKey, weekDays } from './date'
import type { Appointment, BusinessData, Customer } from './types'

export const isActive = (a: Appointment) => a.status !== 'cancelled' && a.status !== 'no-show'

export function dayStats(data: BusinessData, date = todayKey()) {
  const list = data.appointments.filter((a) => a.date === date)
  const live = list.filter(isActive)
  const capacity = data.staff.length * (data.settings.closeHour - data.settings.openHour) * 60
  const booked = live.reduce((s, a) => s + a.duration, 0)
  return {
    total: list.filter((a) => a.status !== 'cancelled').length,
    confirmed: list.filter((a) => a.status === 'confirmed' || a.status === 'completed').length,
    pending: list.filter((a) => a.status === 'pending').length,
    cancelled: list.filter((a) => a.status === 'cancelled').length,
    revenue: live.reduce((s, a) => s + a.price, 0),
    occupancy: capacity ? Math.min(100, Math.round((booked / capacity) * 100)) : 0,
  }
}

export function weekSeries(data: BusinessData, anchor = new Date()) {
  return weekDays(anchor).map((d) => {
    const key = toKey(d)
    return {
      key,
      date: d,
      count: data.appointments.filter((a) => a.date === key && isActive(a)).length,
    }
  })
}

export function topServices(data: BusinessData, days = 30) {
  const today = todayKey()
  const from = addDaysKey(today, -days)
  const counts = new Map<string, number>()
  for (const a of data.appointments) {
    if (!isActive(a) || a.date < from || a.date > today) continue
    counts.set(a.serviceId, (counts.get(a.serviceId) ?? 0) + 1)
  }
  return data.services
    .map((s) => ({ service: s, count: counts.get(s.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
}

export function newCustomers(data: BusinessData, days = 30) {
  const from = addDaysKey(todayKey(), -days)
  return data.customers.filter((c) => c.createdAt >= from).length
}

export type CustomerStatus = 'Frecuente' | 'Nuevo' | 'En riesgo' | 'Activo'

export interface CustomerSummary {
  customer: Customer
  visits: number
  spent: number
  last?: Appointment
  next?: Appointment
  history: Appointment[]
  status: CustomerStatus
}

export function summarizeCustomers(data: BusinessData): CustomerSummary[] {
  const today = todayKey()
  const now = nowMinutes()
  const byCustomer = new Map<string, Appointment[]>()
  for (const a of data.appointments) {
    const list = byCustomer.get(a.customerId)
    if (list) list.push(a)
    else byCustomer.set(a.customerId, [a])
  }

  return data.customers.map((customer) => {
    const history = (byCustomer.get(customer.id) ?? []).sort((a, b) =>
      a.date === b.date ? b.start - a.start : a.date < b.date ? 1 : -1,
    )
    const isPast = (a: Appointment) => a.date < today || (a.date === today && a.start + a.duration <= now)
    const done = history.filter((a) => a.status === 'completed')
    const upcoming = history.filter((a) => !isPast(a) && isActive(a))
    const last = done[0]
    const next = upcoming[upcoming.length - 1]
    const visits = done.length
    const spent = done.reduce((s, a) => s + a.price, 0)
    let status: CustomerStatus = 'Activo'
    if (visits >= 5) status = 'Frecuente'
    if (visits <= 1 && diffDays(today, customer.createdAt) < 45) status = 'Nuevo'
    if (!next && last && diffDays(today, last.date) > 35) status = 'En riesgo'
    return { customer, visits, spent, last, next, history, status }
  })
}

/** Free slots for a staff member on a date, every 30 min. */
export function slotsFor(data: BusinessData, staffId: string, date: string, duration: number, ignoreId?: string) {
  const open = data.settings.openHour * 60
  const close = data.settings.closeHour * 60
  const taken = data.appointments.filter(
    (a) => a.staffId === staffId && a.date === date && a.status !== 'cancelled' && a.id !== ignoreId,
  )
  const isToday = date === todayKey()
  const now = nowMinutes()
  const slots: { start: number; free: boolean }[] = []
  for (let t = open; t + duration <= close; t += 30) {
    const clash = taken.some((a) => t < a.start + a.duration && a.start < t + duration)
    slots.push({ start: t, free: !clash && !(isToday && t <= now) })
  }
  return slots
}
