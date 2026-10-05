import { motion } from 'framer-motion'
import { CalendarX2, Globe, MessageCircle, Monitor, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar, Card, Empty, Segmented, StatusBadge } from '../components/ui/primitives'
import { addDaysKey, fmtRelative, fmtTime, nowMinutes, todayKey } from '../lib/date'
import { cap, cx, duration, firstName, money } from '../lib/format'
import type { AppointmentStatus } from '../lib/types'
import { useStore } from '../store/AppStore'
import { useUI } from '../store/ui'

type Range = 'today' | 'upcoming' | 'past'
const SRC = { online: Globe, whatsapp: MessageCircle, admin: Monitor }

export default function Appointments() {
  const { data, template, customer, service, staff } = useStore()
  const { openAppointment } = useUI()
  const [range, setRange] = useState<Range>('upcoming')
  const [status, setStatus] = useState<AppointmentStatus | 'all'>('all')
  const [q, setQ] = useState('')
  const t = template.terms
  const today = todayKey()

  const groups = useMemo(() => {
    const now = nowMinutes()
    const needle = q.trim().toLowerCase()
    const list = data.appointments
      .filter((a) => {
        if (range === 'today' && a.date !== today) return false
        if (range === 'upcoming' && (a.date < today || a.date > addDaysKey(today, 14) || (a.date === today && a.start + a.duration < now))) return false
        if (range === 'past' && (a.date > today || a.date < addDaysKey(today, -30) || (a.date === today && a.start + a.duration >= now))) return false
        if (status !== 'all' && a.status !== status) return false
        if (needle) {
          const hay = `${customer(a.customerId)?.name} ${service(a.serviceId)?.name} ${staff(a.staffId)?.name}`.toLowerCase()
          if (!hay.includes(needle)) return false
        }
        return true
      })
      .sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1))
    if (range === 'past') list.reverse()
    const m = new Map<string, typeof list>()
    for (const a of list) {
      const g = m.get(a.date)
      if (g) g.push(a)
      else m.set(a.date, [a])
    }
    return [...m.entries()].slice(0, 12)
  }, [data.appointments, range, status, q, today, customer, service, staff])

  const statuses: { value: AppointmentStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'confirmed', label: 'Confirmadas' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'cancelled', label: 'Canceladas' },
    ...(range === 'past' ? [{ value: 'completed' as const, label: 'Completadas' }] : []),
  ]

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">{cap(t.appointments)}</h1>
          <p className="text-[15px] text-ink-3">Todo lo agendado, sin importar si llegó por el link, WhatsApp o el panel.</p>
        </div>
        <Segmented id="appt-range" value={range} onChange={(r) => { setRange(r); setStatus('all') }} options={[
          { value: 'today', label: 'Hoy' },
          { value: 'upcoming', label: 'Próximas' },
          { value: 'past', label: 'Pasadas' },
        ]} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-surface px-4 shadow-soft">
          <Search size={16} className="text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar ${t.client}, servicio o ${t.staff}…`} className="h-full flex-1 bg-transparent outline-none placeholder:text-ink-3" />
        </label>
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {statuses.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={cx('h-9 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition', status === s.value ? 'bg-ink text-bg' : 'bg-surface text-ink-2 shadow-soft hover:text-ink')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <Card>
          <Empty icon={<CalendarX2 size={22} />} title={`No hay ${t.appointments} aquí`} body="Prueba con otro filtro o crea una nueva desde el botón +." />
        </Card>
      ) : (
        groups.map(([date, list], gi) => (
          <motion.section key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(gi * 0.04, 0.3) }}>
            <div className="mb-2 flex items-baseline gap-2 px-2">
              <h2 className="text-sm font-semibold">{fmtRelative(date)}</h2>
              <span className="text-xs text-ink-3">{list.length} {list.length === 1 ? t.appointment : t.appointments}</span>
            </div>
            <Card className="overflow-hidden p-1.5">
              {list.map((a) => {
                const c = customer(a.customerId)
                const sv = service(a.serviceId)
                const p = staff(a.staffId)
                const Src = SRC[a.source]
                return (
                  <button key={a.id} onClick={() => openAppointment(a.id)} className="flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left transition hover:bg-surface-2 md:gap-4 md:px-4">
                    <div className="w-12 shrink-0">
                      <p className="text-[15px] font-semibold tabular-nums">{fmtTime(a.start)}</p>
                      <p className="text-[11px] text-ink-3">{duration(a.duration)}</p>
                    </div>
                    <Avatar name={c?.name ?? '?'} size={38} className="hidden sm:inline-grid" />
                    <div className="min-w-0 flex-1">
                      <p className={cx('truncate text-sm font-medium', a.status === 'cancelled' && 'text-ink-3 line-through')}>{c?.name}</p>
                      <p className="truncate text-[13px] text-ink-3">
                        {sv?.name}
                        <span className="md:hidden"> · {p && firstName(p.name)}</span>
                      </p>
                    </div>
                    <div className={`tone-${p?.tone} hidden w-36 items-center gap-2 md:flex`}>
                      <span className="size-2 rounded-full" style={{ background: 'var(--tone-bar)' }} />
                      <span className="truncate text-[13px] text-ink-2">{p?.name}</span>
                    </div>
                    <span className="hidden w-6 text-ink-3 lg:block" title={a.source}>
                      <Src size={15} />
                    </span>
                    <span className="hidden w-16 text-right text-sm tabular-nums text-ink-2 sm:block">{money(a.price)}</span>
                    <StatusBadge status={a.status} className="shrink-0" />
                  </button>
                )
              })}
            </Card>
          </motion.section>
        ))
      )}
    </div>
  )
}
