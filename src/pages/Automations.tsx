import { motion } from 'framer-motion'
import { BellRing, CalendarCheck2, CalendarPlus, Clock3, HeartHandshake, MessageCircle, RotateCcw, Star, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PhonePreview, type ChatMessage } from '../components/whatsapp/PhonePreview'
import { Button, Toggle } from '../components/ui/primitives'
import { addDaysKey, fmtTime, todayKey } from '../lib/date'
import { cap, cx } from '../lib/format'
import { AUTOMATIONS, buildMessage, quickReplies } from '../lib/messages'
import type { AutomationId } from '../lib/types'
import { useStore } from '../store/AppStore'

const ICONS: Record<AutomationId, LucideIcon> = {
  confirmation: CalendarCheck2,
  reminder24: BellRing,
  reminder2: Clock3,
  followup: Star,
  winback: HeartHandshake,
}

const FLOW = [
  { icon: CalendarPlus, label: 'Reserva creada' },
  { icon: MessageCircle, label: 'WhatsApp enviado' },
  { icon: BellRing, label: 'Recordatorio' },
  { icon: CalendarCheck2, label: 'Cita confirmada' },
]

export default function Automations() {
  const { data, template, toggleAutomation, toast } = useStore()
  const t = template.terms
  const [focus, setFocus] = useState<AutomationId | null>(null)
  const [shown, setShown] = useState<ChatMessage[]>([])
  const [typing, setTyping] = useState(false)
  const [run, setRun] = useState(0)
  const timers = useRef<number[]>([])

  // A realistic sample: the next appointment of the business.
  const sample = useMemo(() => {
    const tomorrow = addDaysKey(todayKey(), 1)
    const a = data.appointments.find((x) => x.date >= tomorrow && x.status !== 'cancelled') ?? data.appointments[0]
    return {
      customer: data.customers.find((c) => c.id === a.customerId)!.name,
      service: data.services.find((s) => s.id === a.serviceId)!.name,
      staff: data.staff.find((s) => s.id === a.staffId)!.name,
      date: a.date,
      start: a.start,
    }
  }, [data.appointments, data.customers, data.services, data.staff])

  const enabledIds = data.automations.filter((a) => a.enabled).map((a) => a.id)
  const script = useMemo(() => {
    const ids = !focus || enabledIds.includes(focus) ? enabledIds : [...enabledIds, focus]
    const ordered = AUTOMATIONS.filter((a) => ids.includes(a.id))
    const msgs: ChatMessage[] = []
    for (const a of ordered) {
      msgs.push({ id: `${a.id}-b`, from: 'business', text: buildMessage(a.id, data, sample), time: fmtTime(sample.start - 60), label: a.title })
      const reply = quickReplies(a.id)
      if (reply) msgs.push({ id: `${a.id}-c`, from: 'client', text: reply, time: fmtTime(sample.start - 58) })
    }
    // Only the conversation up to the focused automation is "live".
    const cut = msgs.findIndex((m) => m.id === `${focus}-c`)
    return !focus || cut === -1 ? msgs : msgs.slice(0, cut + 1)
  }, [enabledIds.join(), focus, sample, data.settings.name])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setShown([])
    let at = 300
    script.forEach((m) => {
      timers.current.push(window.setTimeout(() => setTyping(m.from === 'business'), at))
      at += m.from === 'business' ? 900 : 700
      timers.current.push(
        window.setTimeout(() => {
          setTyping(false)
          setShown((s) => [...s, m])
        }, at),
      )
      at += 500
    })
    return () => timers.current.forEach(clearTimeout)
  }, [script, run])

  const on = enabledIds.length
  const sent = data.appointments.reduce((n, a) => n + a.messages.length, 0)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <section className="flex flex-col gap-6 pt-2">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-ink">
            <MessageCircle size={13} /> WhatsApp automático
          </span>
          <h1 className="mt-4 text-[34px] font-semibold leading-[1.1] tracking-tight md:text-[44px]">
            Automatiza tu <span className="font-serif font-normal italic text-accent-ink">agenda</span>
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2 md:text-base">
            Tus {t.clients} reciben confirmaciones y recordatorios por WhatsApp sin que tengas que escribir nada. Menos ausencias, menos mensajes a mano, más
            {' '}{t.appointments} cumplidas.
          </p>
        </div>

        {/* Flow */}
        <div className="rounded-[28px] bg-surface p-5 shadow-soft md:p-7">
          <div className="flex flex-col md:flex-row md:items-start">
            {FLOW.map((step, i) => (
              <div key={step.label} className={cx('flex flex-col md:flex-row md:items-start', i < FLOW.length - 1 && 'md:flex-1')}>
                <div className="flex items-center gap-3 md:w-28 md:flex-col md:gap-3 md:text-center">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.12, type: 'spring', stiffness: 400, damping: 22 }}
                    className={cx('grid size-12 shrink-0 place-items-center rounded-2xl', i === FLOW.length - 1 ? 'bg-accent text-accent-fg' : 'bg-accent-soft text-accent-ink')}
                  >
                    <step.icon size={20} />
                  </motion.span>
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="relative my-1 ml-[23px] h-6 w-[2px] overflow-hidden rounded-full bg-surface-2 md:mx-2 md:my-0 md:mt-[23px] md:h-[2px] md:w-auto md:flex-1">
                    <motion.span
                      className="absolute inset-0 rounded-full bg-accent"
                      initial={{ scaleX: 0, scaleY: 0 }}
                      animate={{ scaleX: [0, 1, 1], scaleY: [0, 1, 1], opacity: [1, 1, 0] }}
                      style={{ originX: 0, originY: 0 }}
                      transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6, delay: 0.4 + i * 0.45, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-ink-3">
              <b className="font-semibold text-ink">{on} de {AUTOMATIONS.length}</b> activas · {sent} mensajes enviados
            </p>
          </div>
          {AUTOMATIONS.map((a, i) => {
            const enabled = enabledIds.includes(a.id)
            const Icon = ICONS[a.id]
            const focused = focus === a.id
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setFocus(a.id)}
                className={cx(
                  'cursor-pointer rounded-[28px] bg-surface p-5 shadow-soft transition md:p-6',
                  focused ? 'ring-2 ring-accent/50' : 'hover:shadow-float',
                )}
              >
                <div className="flex items-start gap-4">
                  <span className={cx('grid size-12 shrink-0 place-items-center rounded-2xl transition', enabled ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-ink-3')}>
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{a.title.replace('cita', t.appointment)}</p>
                        <p className="mt-0.5 text-sm text-ink-2">{a.description.replace('su cita', `su ${t.appointment}`).replace('un cliente', `un ${t.client}`).replace('Contacta clientes', `Contacta ${t.clients}`)}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Toggle
                          on={enabled}
                          label={a.title}
                          onChange={() => {
                            toggleAutomation(a.id)
                            setFocus(a.id)
                            toast({ title: enabled ? 'Automatización pausada' : 'Automatización activada', body: a.title, tone: enabled ? 'info' : 'ok' })
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium text-ink-2">{a.when}</span>
                      <span className="text-ink-3">{a.impact}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <PhonePreview title={data.settings.name} messages={shown} typing={typing} subtitle="cuenta de empresa" />
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setRun((r) => r + 1)}>
              <RotateCcw size={14} /> Repetir conversación
            </Button>
          </div>
          <p className="mx-auto mt-1 max-w-[280px] text-center text-xs text-ink-3">
            Vista previa con una {t.appointment} real de tu agenda. Toca una automatización para ver su mensaje.
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-ink-3">{cap(t.appointments)} de ejemplo · En producción se conecta a la API oficial de WhatsApp Business.</p>
    </div>
  )
}
