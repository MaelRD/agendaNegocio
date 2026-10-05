import { AnimatePresence, motion } from 'framer-motion'
import { Check, UserPlus, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fmtLong, fmtTime, todayKey } from '../../lib/date'
import { cap, cx, duration, money } from '../../lib/format'
import { slotsFor } from '../../lib/stats'
import type { Appointment } from '../../lib/types'
import { useStore } from '../../store/AppStore'
import type { NewPrefill } from '../../store/ui'
import { Avatar, Button, Field, Input, Segmented, Select, Textarea } from '../ui/primitives'
import { Sheet } from '../ui/Sheet'

/** Create (no `editing`) or reschedule (`editing`) an appointment. */
export function AppointmentForm({
  open,
  onClose,
  prefill,
  editing,
}: {
  open: boolean
  onClose: () => void
  prefill?: NewPrefill
  editing?: Appointment
}) {
  const store = useStore()
  const { data, template } = store
  const t = template.terms
  const services = data.services.filter((s) => s.active)

  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [customerId, setCustomerId] = useState('')
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [date, setDate] = useState(todayKey())
  const [start, setStart] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) return
    setDone(false)
    setMode('existing')
    setNewName('')
    setNewPhone('')
    if (editing) {
      setCustomerId(editing.customerId)
      setServiceId(editing.serviceId)
      setStaffId(editing.staffId)
      setDate(editing.date)
      setStart(editing.start)
      setNotes(editing.notes)
    } else {
      setCustomerId(prefill?.customerId ?? '')
      setServiceId(services[0]?.id ?? '')
      setStaffId(prefill?.staffId ?? data.staff[0].id)
      setDate(prefill?.date ?? todayKey())
      setStart(prefill?.start ?? null)
      setNotes('')
    }
  }, [open])

  const service = data.services.find((s) => s.id === serviceId)
  const slots = useMemo(
    () => (service && staffId ? slotsFor(data, staffId, date, service.duration, editing?.id) : []),
    [data, staffId, date, service, editing?.id],
  )

  // If the prefilled / chosen time stopped being valid, drop it.
  useEffect(() => {
    if (!done && start !== null && !slots.some((s) => s.start === start && s.free)) setStart(null)
  }, [slots, start, done])

  const sortedCustomers = useMemo(() => [...data.customers].sort((a, b) => a.name.localeCompare(b.name)), [data.customers])
  const hasCustomer = editing || (mode === 'existing' ? !!customerId : newName.trim().length > 1 && newPhone.replace(/\D/g, '').length >= 8)
  const valid = hasCustomer && service && staffId && date && start !== null

  const submit = () => {
    if (!valid || start === null) return
    if (editing) {
      store.updateAppointment(editing.id, { date, start, staffId, serviceId, duration: service!.duration, price: service!.price, notes, status: 'confirmed' })
      store.sendWhatsApp(editing.id, 'manual', `Hola, tu ${t.appointment} fue reagendada para el ${fmtLong(date).toLowerCase()} a las ${fmtTime(start)}. ¡Te esperamos!`)
      store.toast({ title: `${cap(t.appointment)} reagendada`, body: `${fmtLong(date)} · ${fmtTime(start)}`, tone: 'ok' })
      onClose()
      return
    }
    const appt = store.addAppointment({
      customerId: mode === 'existing' ? customerId : undefined,
      newCustomer: mode === 'new' ? { name: newName, phone: newPhone } : undefined,
      serviceId,
      staffId,
      date,
      start,
      notes,
    })
    setDone(true)
    if (appt.messages.length) {
      setTimeout(() => store.toast({ title: 'WhatsApp de confirmación enviado', body: service!.name + ' · ' + fmtTime(start), tone: 'whatsapp' }), 900)
    }
    setTimeout(onClose, 1500)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={editing ? `Reagendar ${t.appointment}` : `Nueva ${t.appointment}`}
      subtitle={editing ? store.customer(editing.customerId)?.name : 'Se guarda al instante en la agenda'}
      width={560}
      footer={
        !done && (
          <div className="flex items-center justify-between gap-3">
            <p className="hidden truncate text-[13px] text-ink-3 sm:block">
              {service && start !== null ? `${fmtLong(date)} · ${fmtTime(start)} · ${duration(service.duration)}` : 'Elige un horario disponible'}
            </p>
            <div className="flex flex-1 justify-end gap-2 sm:flex-none">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button variant="primary" disabled={!valid} onClick={submit} className="flex-1 sm:flex-none">
                {editing ? 'Guardar cambios' : `Agendar ${t.appointment}`}
              </Button>
            </div>
          </div>
        )
      }
    >
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-14 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.05 }}
              className="grid size-16 place-items-center rounded-full bg-ok-soft text-ok"
            >
              <motion.span initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}>
                <Check size={30} strokeWidth={2.6} />
              </motion.span>
            </motion.span>
            <p className="mt-5 text-lg font-semibold">¡{cap(t.appointment)} agendada!</p>
            <p className="mt-1 text-sm text-ink-3">
              {service?.name} · {start !== null && fmtTime(start)}
            </p>
          </motion.div>
        ) : (
          <motion.div key="form" exit={{ opacity: 0 }} className="flex flex-col gap-5">
            {!editing && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-ink-2">{cap(t.client)}</span>
                  <Segmented
                    id="cust-mode"
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: 'existing', label: <span className="flex items-center gap-1.5"><Users size={13} />Existente</span> },
                      { value: 'new', label: <span className="flex items-center gap-1.5"><UserPlus size={13} />Nuevo</span> },
                    ]}
                  />
                </div>
                {mode === 'existing' ? (
                  <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                    <option value="">Selecciona {t.client === 'clienta' ? 'una clienta' : `un ${t.client}`}…</option>
                    {sortedCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <Input placeholder="Nombre completo" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                    <Input placeholder="WhatsApp" inputMode="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            <Field label="Servicio">
              <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {duration(s.duration)} · {money(s.price)}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-ink-2">{cap(t.staff)}</span>
              <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
                {data.staff.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setStaffId(p.id)}
                    className={cx(
                      'flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm transition',
                      staffId === p.id ? 'bg-accent-soft font-medium text-accent-ink ring-1 ring-accent/30' : 'bg-surface-2 text-ink-2 hover:bg-surface-3',
                    )}
                  >
                    <Avatar name={p.name} tone={p.tone} size={28} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Fecha">
              <Input type="date" value={date} min={todayKey()} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </Field>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-medium text-ink-2">Hora</span>
              {slots.length === 0 ? (
                <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink-3">Sin horarios ese día.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {slots.map((s) => (
                    <button
                      key={s.start}
                      disabled={!s.free}
                      onClick={() => setStart(s.start)}
                      className={cx(
                        'h-10 rounded-xl text-[13px] font-medium tabular-nums transition',
                        start === s.start
                          ? 'bg-accent text-accent-fg shadow-[0_6px_14px_-6px_var(--accent)]'
                          : s.free
                            ? 'bg-surface-2 text-ink hover:bg-surface-3'
                            : 'bg-transparent text-ink-3/50 line-through',
                      )}
                    >
                      {fmtTime(s.start)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Field label="Notas">
              <Textarea placeholder="Preferencias, alergias, referencias…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  )
}
