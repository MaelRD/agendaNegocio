import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../../store/AppStore'
import { UIContext, type NewPrefill, type UI } from '../../store/ui'
import { AppointmentForm } from '../appointments/AppointmentForm'
import { AppointmentPanel } from '../appointments/AppointmentPanel'
import { Toasts } from '../ui/Toasts'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const { data } = useStore()
  const { pathname } = useLocation()
  const [newOpen, setNewOpen] = useState(false)
  const [prefill, setPrefill] = useState<NewPrefill | undefined>()
  const [panelId, setPanelId] = useState<string | null>(null)
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)

  const ui = useMemo<UI>(
    () => ({
      openNew: (p) => {
        setPrefill(p)
        setNewOpen(true)
      },
      openAppointment: setPanelId,
      openReschedule: setRescheduleId,
    }),
    [],
  )

  const editing = data.appointments.find((a) => a.id === rescheduleId)

  return (
    <UIContext.Provider value={ui}>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1 px-4 pb-28 pt-2 md:px-6 md:pb-8 lg:px-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname + data.businessId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <MobileNav />
      <AppointmentForm open={newOpen} onClose={() => setNewOpen(false)} prefill={prefill} />
      <AppointmentForm open={!!editing} onClose={() => setRescheduleId(null)} editing={editing} />
      <AppointmentPanel id={panelId} onClose={() => setPanelId(null)} />
      <Toasts />
    </UIContext.Provider>
  )
}
