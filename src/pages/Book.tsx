import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, ChevronRight, Clock, MapPin, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ThemeButton } from '../components/layout/Header'
import { Avatar, Button, Field, Input, Textarea } from '../components/ui/primitives'
import { PhonePreview, type ChatMessage } from '../components/whatsapp/PhonePreview'
import { BUSINESSES } from '../data/businesses'
import { addDaysKey, dayShort, fmtLong, fmtTime, fromKey, monthShort, todayKey } from '../lib/date'
import { cap, cx, duration, firstName, money } from '../lib/format'
import { buildMessage } from '../lib/messages'
import { slotsFor } from '../lib/stats'
import { loadBusiness, saveBusiness, withNewAppointment } from '../lib/storage'
import type { BusinessData, BusinessId } from '../lib/types'
import { useStore } from '../store/AppStore'

type Step = 0 | 1 | 2 | 3 | 4
const STEPS = ['Servicio', 'Profesional', 'Horario', 'Tus datos']

export default function Book() {
  const { business } = useParams()
  if (!business || !(business in BUSINESSES)) return <Navigate to="/book" replace />
  return <BookFlow key={business} id={business as BusinessId} />
}

function BookFlow({ id }: { id: BusinessId }) {
  const store = useStore()
  const isActive = store.data.businessId === id
  const [local, setLocal] = useState<BusinessData | null>(() => (isActive ? null : loadBusiness(id)))
  const data = isActive ? store.data : local!
  const tpl = BUSINESSES[id]
  const t = tpl.terms

  const [step, setStep] = useState<Step>(0)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [staffId, setStaffId] = useState<string | 'any' | null>(null)
  const [date, setDate] = useState<string>(todayKey())
  const [slot, setSlot] = useState<{ start: number; staffId: string } | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [chat, setChat] = useState<ChatMessage[]>([])

  // Use this business' own accent while booking, then restore the panel's.
  useEffect(() => {
    document.documentElement.style.setProperty('--hue', String(data.settings.hue))
    return () => document.documentElement.style.setProperty('--hue', String(store.data.settings.hue))
  }, [data.settings.hue])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const services = data.services.filter((s) => s.active)
  const service = data.services.find((s) => s.id === serviceId)
  const chosenStaff = data.staff.find((s) => s.id === (slot?.staffId ?? staffId))
  const singleStaff = data.staff.length === 1

  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDaysKey(todayKey(), i)).filter((d) => fromKey(d).getDay() !== 0),
    [],
  )

  const slots = useMemo(() => {
    if (!service || !staffId) return []
    const pool = staffId === 'any' ? data.staff : data.staff.filter((s) => s.id === staffId)
    const byStart = new Map<number, string>()
    for (const p of pool) for (const s of slotsFor(data, p.id, date, service.duration)) if (s.free && !byStart.has(s.start)) byStart.set(s.start, p.id)
    return [...byStart.entries()].sort((a, b) => a[0] - b[0]).map(([start, sid]) => ({ start, staffId: sid }))
  }, [data, service, staffId, date])

  const pickService = (sid: string) => {
    setServiceId(sid)
    setSlot(null)
    if (singleStaff) {
      setStaffId(data.staff[0].id)
      setStep(2)
    } else setStep(1)
  }

  const valid = name.trim().length > 1 && phone.replace(/\D/g, '').length >= 8

  const confirm = () => {
    if (!service || !slot || !valid) return
    const input = { newCustomer: { name, phone }, serviceId: service.id, staffId: slot.staffId, date, start: slot.start, notes }
    if (isActive) store.addAppointment(input, 'online')
    else {
      const res = withNewAppointment(data, input, 'online')
      saveBusiness(res.data)
      setLocal(res.data)
    }
    const staffName = data.staff.find((s) => s.id === slot.staffId)!.name
    const text = buildMessage('confirmation', data, { customer: name, service: service.name, staff: staffName, date, start: slot.start })
    setStep(4)
    setChat([])
    setTimeout(() => setChat([{ id: 'c1', from: 'business', text, time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }]), 1400)
  }

  const back = () => setStep((s) => (s === 2 && singleStaff ? 0 : ((s - 1) as Step)))

  return (
    <div className="min-h-dvh">
      {/* top bar */}
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 md:px-8 md:py-6">
        <Link to="/book" className="grid size-10 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2" aria-label="Otros negocios">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-xs font-medium text-ink-3">Página pública de reservas · demo</span>
        <div className="ml-auto flex items-center gap-1">
          <ThemeButton />
          <Link to="/demo/dashboard" onClick={() => !isActive && store.switchBusiness(id)} className="hidden rounded-full px-3 py-2 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink sm:block">
            Ver panel del negocio →
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-32 md:px-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-10">
        {/* Business card + summary */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div className={cx('overflow-hidden rounded-[32px] bg-surface shadow-soft', step > 0 && 'hidden lg:block')}>
            <div className="relative h-28 bg-accent-soft">
              <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(120% 120% at 100% 0%, var(--accent) 0%, transparent 55%)' }} />
              <span className="absolute -bottom-7 left-6 grid size-16 place-items-center rounded-[22px] bg-surface text-3xl shadow-soft">{tpl.emoji}</span>
            </div>
            <div className="px-6 pb-6 pt-10">
              <h1 className="text-xl font-semibold tracking-tight">{data.settings.name}</h1>
              <p className="text-sm text-ink-3">{tpl.tagline}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-ink-2">
                <span className="flex items-center gap-1.5"><Star size={14} className="fill-current text-warn" /> 4.9 · 212 reseñas</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} /> Roma Norte, CDMX</span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> Lun–Sáb · {data.settings.openHour}:00–{data.settings.closeHour}:00</span>
              </div>
            </div>
          </div>

          {step > 0 && step < 4 && service && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="hidden rounded-[28px] bg-surface p-5 shadow-soft lg:block">
              <p className="mb-3 text-[13px] font-semibold">Tu {t.appointment}</p>
              <SummaryRow label="Servicio" value={`${service.name} · ${duration(service.duration)}`} onEdit={() => setStep(0)} />
              {chosenStaff && !singleStaff && <SummaryRow label={cap(t.staff)} value={chosenStaff.name} onEdit={() => setStep(1)} />}
              {staffId === 'any' && !slot && <SummaryRow label={cap(t.staff)} value="Sin preferencia" onEdit={() => setStep(1)} />}
              {slot && <SummaryRow label="Fecha" value={`${fmtLong(date)} · ${fmtTime(slot.start)}`} onEdit={() => setStep(2)} />}
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                <span className="text-ink-3">Total</span>
                <span className="text-lg font-semibold tabular-nums">{money(service.price)}</span>
              </div>
            </motion.div>
          )}
        </aside>

        {/* Steps */}
        <main className="min-w-0">
          {step < 4 && (
            <div className="mb-6 flex items-center gap-2">
              {step > 0 && (
                <button onClick={back} className="mr-1 grid size-9 place-items-center rounded-full bg-surface text-ink-2 shadow-soft" aria-label="Atrás">
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="flex flex-1 gap-1.5">
                {STEPS.map((label, i) =>
                  i === 1 && singleStaff ? null : (
                    <div key={label} className="flex-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                        <motion.div className="h-full rounded-full bg-accent" initial={false} animate={{ width: step >= i ? '100%' : '0%' }} transition={{ duration: 0.35 }} />
                      </div>
                      <p className={cx('mt-1.5 hidden text-xs sm:block', step === i ? 'font-medium text-ink' : 'text-ink-3')}>{label}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <section>
                  <h2 className="mb-4 text-2xl font-semibold tracking-tight">¿Qué te gustaría reservar?</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => pickService(s.id)}
                        className={cx(`tone-${s.tone} group flex items-center gap-4 rounded-[24px] bg-surface p-4 text-left shadow-soft transition hover:shadow-float`, serviceId === s.id && 'ring-2 ring-accent')}
                      >
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-semibold" style={{ background: 'var(--tone-bg)', color: 'var(--tone-ink)' }}>
                          {s.name.charAt(0)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{s.name}</span>
                          <span className="block text-[13px] text-ink-3">{duration(s.duration)}</span>
                        </span>
                        <span className="text-right">
                          <span className="block font-semibold tabular-nums">{money(s.price)}</span>
                        </span>
                        <ChevronRight size={16} className="text-ink-3 transition group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {step === 1 && (
                <section>
                  <h2 className="mb-4 text-2xl font-semibold tracking-tight">¿Con quién?</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StaffOption
                      selected={staffId === 'any'}
                      onClick={() => { setStaffId('any'); setSlot(null); setStep(2) }}
                      icon={<span className="grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink"><Sparkles size={20} /></span>}
                      title="Sin preferencia"
                      body="El primer horario disponible"
                    />
                    {data.staff.map((p) => (
                      <StaffOption
                        key={p.id}
                        selected={staffId === p.id}
                        onClick={() => { setStaffId(p.id); setSlot(null); setStep(2) }}
                        icon={<Avatar name={p.name} tone={p.tone} size={48} />}
                        title={p.name}
                        body={p.role}
                      />
                    ))}
                  </div>
                </section>
              )}

              {step === 2 && (
                <section>
                  <h2 className="mb-4 text-2xl font-semibold tracking-tight">Elige día y hora</h2>
                  <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:px-0">
                    {days.map((d) => {
                      const dt = fromKey(d)
                      const sel = d === date
                      return (
                        <button
                          key={d}
                          onClick={() => { setDate(d); setSlot(null) }}
                          className={cx('flex w-[60px] shrink-0 flex-col items-center gap-0.5 rounded-[20px] py-3 transition', sel ? 'bg-accent text-accent-fg shadow-[0_8px_18px_-8px_var(--accent)]' : 'bg-surface text-ink shadow-soft hover:bg-surface-2')}
                        >
                          <span className={cx('text-[11px] font-medium uppercase', sel ? 'opacity-80' : 'text-ink-3')}>{dayShort(dt)}</span>
                          <span className="text-lg font-semibold tabular-nums">{dt.getDate()}</span>
                          <span className={cx('text-[10px]', sel ? 'opacity-80' : 'text-ink-3')}>{monthShort(dt)}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-5 rounded-[28px] bg-surface p-4 shadow-soft md:p-5">
                    {slots.length === 0 ? (
                      <p className="py-8 text-center text-sm text-ink-3">No quedan horarios este día. Prueba otro 🙂</p>
                    ) : (
                      <>
                        {(['Mañana', 'Tarde'] as const).map((part) => {
                          const list = slots.filter((s) => (part === 'Mañana' ? s.start < 13 * 60 : s.start >= 13 * 60))
                          if (!list.length) return null
                          return (
                            <div key={part} className="mb-4 last:mb-0">
                              <p className="mb-2 text-xs font-medium text-ink-3">{part}</p>
                              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                                {list.map((s) => (
                                  <button
                                    key={s.start}
                                    onClick={() => setSlot(s)}
                                    className={cx(
                                      'h-11 rounded-2xl text-sm font-medium tabular-nums transition',
                                      slot?.start === s.start ? 'bg-accent text-accent-fg' : 'bg-surface-2 hover:bg-surface-3',
                                    )}
                                  >
                                    {fmtTime(s.start)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                </section>
              )}

              {step === 3 && (
                <section className="max-w-xl">
                  <h2 className="mb-1 text-2xl font-semibold tracking-tight">Tus datos</h2>
                  <p className="mb-5 text-sm text-ink-3">Te enviaremos la confirmación y un recordatorio por WhatsApp.</p>
                  <div className="flex flex-col gap-4 rounded-[28px] bg-surface p-5 shadow-soft md:p-6">
                    <Field label="Nombre">
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre completo" autoComplete="name" autoFocus />
                    </Field>
                    <Field label="WhatsApp">
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="55 1234 5678" inputMode="tel" autoComplete="tel" />
                    </Field>
                    <Field label="¿Algo que debamos saber? (opcional)">
                      <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. es mi primera vez" />
                    </Field>
                    <p className="flex items-center gap-2 text-xs text-ink-3">
                      <ShieldCheck size={14} /> Demo: tus datos solo se guardan en este navegador.
                    </p>
                  </div>
                </section>
              )}

              {step === 4 && service && slot && (
                <section className="grid items-center gap-10 py-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                  <div>
                    <motion.span
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 16 }}
                      className="grid size-16 place-items-center rounded-full bg-ok-soft text-ok"
                    >
                      <Check size={30} strokeWidth={2.6} />
                    </motion.span>
                    <h2 className="mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
                      ¡Listo, {firstName(name)}!
                    </h2>
                    <p className="mt-2 text-ink-2">
                      Tu {t.appointment} de <b className="font-semibold text-ink">{service.name}</b> quedó agendada para el{' '}
                      <b className="font-semibold text-ink">{fmtLong(date).toLowerCase()}</b> a las <b className="font-semibold text-ink">{fmtTime(slot.start)}</b>.
                    </p>
                    <p className="mt-4 text-sm text-ink-3">Te acabamos de enviar la confirmación por WhatsApp →</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link to="/demo/calendar" onClick={() => !isActive && store.switchBusiness(id)}>
                        <Button variant="primary">Verla en el panel del negocio</Button>
                      </Link>
                      <Button
                        variant="soft"
                        onClick={() => {
                          setStep(0)
                          setServiceId(null)
                          setStaffId(null)
                          setSlot(null)
                          setNotes('')
                        }}
                      >
                        Hacer otra reserva
                      </Button>
                    </div>
                  </div>
                  <PhonePreview title={data.settings.name} messages={chat} typing={chat.length === 0} subtitle="cuenta de empresa" />
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Sticky CTA */}
      <AnimatePresence>
        {(step === 2 || step === 3) && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="pb-safe fixed inset-x-0 bottom-0 z-30 bg-bg/85 backdrop-blur-xl"
          >
            <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-8 md:py-4">
              <div className="min-w-0 flex-1 text-sm">
                {slot ? (
                  <>
                    <p className="truncate font-medium">{service?.name} · {fmtTime(slot.start)}</p>
                    <p className="truncate text-ink-3">{fmtLong(date)}{chosenStaff && ` · ${chosenStaff.name}`}</p>
                  </>
                ) : (
                  <p className="text-ink-3">Elige un horario</p>
                )}
              </div>
              {step === 2 ? (
                <Button variant="primary" size="lg" disabled={!slot} onClick={() => setStep(3)}>
                  Continuar
                </Button>
              ) : (
                <Button variant="primary" size="lg" disabled={!valid} onClick={confirm}>
                  Confirmar {t.appointment}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-sm">
      <span className="w-20 shrink-0 text-ink-3">{label}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{value}</span>
      <button onClick={onEdit} className="text-xs font-medium text-accent-ink hover:underline">
        Cambiar
      </button>
    </div>
  )
}

function StaffOption({ selected, onClick, icon, title, body }: { selected: boolean; onClick: () => void; icon: ReactNode; title: string; body: string }) {
  return (
    <button onClick={onClick} className={cx('flex items-center gap-4 rounded-[24px] bg-surface p-4 text-left shadow-soft transition hover:shadow-float', selected && 'ring-2 ring-accent')}>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block text-[13px] text-ink-3">{body}</span>
      </span>
      <ChevronRight size={16} className="text-ink-3" />
    </button>
  )
}
