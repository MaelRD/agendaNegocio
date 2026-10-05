import { createContext, useContext } from 'react'

export interface NewPrefill {
  date?: string
  start?: number
  staffId?: string
  customerId?: string
}

export interface UI {
  openNew: (prefill?: NewPrefill) => void
  openAppointment: (id: string) => void
  openReschedule: (id: string) => void
}

export const UIContext = createContext<UI>({
  openNew: () => {},
  openAppointment: () => {},
  openReschedule: () => {},
})

export const useUI = () => useContext(UIContext)
