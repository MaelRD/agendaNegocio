import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BUSINESSES, type BusinessTemplate } from '../data/businesses'
import { buildMessage } from '../lib/messages'
import { uid } from '../lib/format'
import {
  ACTIVE_KEY,
  THEME_KEY,
  clearBusiness,
  dataKey,
  loadBusiness,
  readActive,
  saveBusiness,
  withNewAppointment,
  writeActive,
  type NewAppointmentInput,
} from '../lib/storage'
import type {
  Appointment,
  AutomationId,
  BusinessData,
  BusinessId,
  BusinessSettings,
  Customer,
  Service,
  Staff,
} from '../lib/types'

export interface Toast {
  id: string
  title: string
  body?: string
  tone?: 'ok' | 'whatsapp' | 'info' | 'bad'
}

interface Store {
  data: BusinessData
  template: BusinessTemplate
  theme: 'light' | 'dark'
  toggleTheme: () => void
  switchBusiness: (id: BusinessId) => void
  updateSettings: (patch: Partial<BusinessSettings>) => void
  resetDemo: () => void

  customer: (id: string) => Customer | undefined
  service: (id: string) => Service | undefined
  staff: (id: string) => Staff | undefined

  addAppointment: (input: NewAppointmentInput, source?: Appointment['source']) => Appointment
  updateAppointment: (id: string, patch: Partial<Appointment>) => void
  sendWhatsApp: (id: string, kind?: AutomationId | 'manual', text?: string) => void
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  saveService: (service: Service) => void
  toggleAutomation: (id: AutomationId) => void
  markNotificationsRead: () => void

  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

const Ctx = createContext<Store | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BusinessData>(() => loadBusiness(readActive()))
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })
  const [toasts, setToasts] = useState<Toast[]>([])
  const skipSave = useRef(false)

  // Persist on every change (except when the change came from another tab).
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveBusiness(data)
  }, [data])

  useEffect(() => {
    document.documentElement.style.setProperty('--hue', String(data.settings.hue))
  }, [data.settings.hue])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111018' : '#F6F4F1')
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid()
    setToasts((list) => [...list.slice(-2), { ...t, id }])
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 4200)
  }, [])

  // Live sync with the public booking page opened in another tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACTIVE_KEY && e.newValue && e.newValue !== data.businessId) {
        setData(loadBusiness(e.newValue as BusinessId))
        return
      }
      if (e.key !== dataKey(data.businessId) || !e.newValue) return
      const next = JSON.parse(e.newValue) as BusinessData
      const fresh = next.notifications.find((n) => !n.read && !data.notifications.some((o) => o.id === n.id))
      skipSave.current = true
      setData(next)
      if (fresh) toast({ title: fresh.title, body: fresh.body, tone: 'ok' })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [data.businessId, data.notifications, toast])

  const switchBusiness = useCallback((id: BusinessId) => {
    writeActive(id)
    setData(loadBusiness(id))
  }, [])

  const resetDemo = useCallback(() => {
    clearBusiness(data.businessId)
    setData(loadBusiness(data.businessId))
  }, [data.businessId])

  const updateSettings = useCallback(
    (patch: Partial<BusinessSettings>) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    [],
  )

  const addAppointment = useCallback(
    (input: NewAppointmentInput, source: Appointment['source'] = 'admin') => {
      const result = withNewAppointment(data, input, source)
      setData(result.data)
      return result.appointment
    },
    [data],
  )

  const updateAppointment = useCallback(
    (id: string, patch: Partial<Appointment>) =>
      setData((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
    [],
  )

  const sendWhatsApp = useCallback(
    (id: string, kind: AutomationId | 'manual' = 'manual', text?: string) =>
      setData((d) => ({
        ...d,
        appointments: d.appointments.map((a) => {
          if (a.id !== id) return a
          const c = d.customers.find((x) => x.id === a.customerId)!
          const msg =
            text ??
            buildMessage(kind, d, {
              customer: c.name,
              service: d.services.find((s) => s.id === a.serviceId)?.name ?? '',
              staff: d.staff.find((s) => s.id === a.staffId)?.name ?? '',
              date: a.date,
              start: a.start,
            })
          return { ...a, messages: [...a.messages, { id: uid(), kind, text: msg, at: new Date().toISOString() }] }
        }),
      })),
    [],
  )

  const updateCustomer = useCallback(
    (id: string, patch: Partial<Customer>) =>
      setData((d) => ({ ...d, customers: d.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
    [],
  )

  const saveService = useCallback(
    (service: Service) =>
      setData((d) => {
        const exists = d.services.some((s) => s.id === service.id)
        return {
          ...d,
          services: exists ? d.services.map((s) => (s.id === service.id ? service : s)) : [...d.services, service],
        }
      }),
    [],
  )

  const toggleAutomation = useCallback(
    (id: AutomationId) =>
      setData((d) => ({
        ...d,
        automations: d.automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
      })),
    [],
  )

  const markNotificationsRead = useCallback(
    () => setData((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) })),
    [],
  )

  const maps = useMemo(() => {
    const c = new Map(data.customers.map((x) => [x.id, x]))
    const s = new Map(data.services.map((x) => [x.id, x]))
    const p = new Map(data.staff.map((x) => [x.id, x]))
    return { c, s, p }
  }, [data.customers, data.services, data.staff])

  const value: Store = {
    data,
    template: BUSINESSES[data.businessId],
    theme,
    toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    switchBusiness,
    updateSettings,
    resetDemo,
    customer: (id) => maps.c.get(id),
    service: (id) => maps.s.get(id),
    staff: (id) => maps.p.get(id),
    addAppointment,
    updateAppointment,
    sendWhatsApp,
    updateCustomer,
    saveService,
    toggleAutomation,
    markNotificationsRead,
    toasts,
    toast,
    dismissToast: (id) => setToasts((l) => l.filter((t) => t.id !== id)),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}
