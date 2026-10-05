import { motion } from 'framer-motion'
import { ArrowUpRight, CalendarPlus, Copy, MessageCircle, TrendingUp, UserPlus, Wallet, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, Button, Card, SectionTitle, StatusBadge } from '../components/ui/primitives'
import { addDaysKey, dayShort, diffDays, fmtLong, fmtTime, greeting, nowMinutes, todayKey } from '../lib/date'
import { cap, cx, firstName, moneyPlain } from '../lib/format'
import { dayStats, isActive, newCustomers, topServices, weekSeries } from '../lib/stats'
import { useStore } from '../store/AppStore'
import { useUI } from '../store/ui'

const fade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.04 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
})

export default function Dashboard() {
  const { data, template, customer, service, staff, toast } = useStore()
  const { openNew, openAppointment } = useUI()
  const t = template.terms
  const today = todayKey()
  const s = dayStats(data)
  const yesterday = dayStats(data, addDaysKey(today, -7))
  const week = weekSeries(data)
  const max = Math.max(...week.map((d) => d.count), 1)
  const top = topServices(data).slice(0, 4)
  const topMax = Math.max(...top.map((x) => x.count), 1)
  const fresh = newCustomers(data)
  const now = nowMinutes()

  let upcoming = data.appointments
    .filter((a) => a.date === today && a.start + a.duration > now && isActive(a))
    .sort((a, b) => a.start - b.start)
  let upcomingLabel = 'Hoy'
  if (upcoming.length === 0) {
    const tomorrow = addDaysKey(today, 1)
    upcoming = data.appointments.filter((a) => a.date === tomorrow && isActive(a)).sort((a, b) => a.start - b.start)
    upcomingLabel = 'Mañana'
  }

  const enabled = data.automations.filter((a) => a.enabled).length
  const sentWeek = data.appointments.reduce(
    (n, a) => n + a.messages.filter((m) => diffDays(today, m.at.slice(0, 10)) <= 7).length,
    0,
  )
  const revenueDelta = yesterday.revenue ? Math.round(((s.revenue - yesterday.revenue) / yesterday.revenue) * 100) : 0
  const bookUrl = `${location.origin}/book/${data.businessId}`

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        {/* Greeting + day summary */}
        <motion.section {...fade(0)} className="flex flex-col gap-5 pt-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-ink-3">{fmtLong(today)}</p>
            <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-tight md:text-[40px]">
              {greeting()}, <span className="font-serif text-[1.12em] font-normal italic text-accent-ink">{firstName(template.staff[0].name)}</span> 👋
            </h1>
            <p className="mt-1.5 text-[15px] text-ink-2">
              Tienes <b className="font-semibold text-ink">{s.total} {t.appointments}</b> hoy
              {upcoming.length > 0 && upcomingLabel === 'Hoy' && (
                <>
                  {' '}· la próxima a las <b className="font-semibold text-ink">{fmtTime(upcoming[0].start)}</b>
                </>
              )}
              .
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={() => openNew()} className="self-start md:self-auto">
            <CalendarPlus size={18} /> Nueva {t.appointment}
          </Button>
        </motion.section>

        <motion.div {...fade(1)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5 sm:col-span-2 lg:col-span-1 lg:row-span-1">
            <p className="text-[13px] text-ink-3">{cap(t.appointments)} hoy</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight">{s.total}</p>
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-surface-2">
              {[
                [s.confirmed, 'bg-ok'],
                [s.pending, 'bg-warn'],
                [s.cancelled, 'bg-bad'],
              ].map(([n, c], i) => (
                <motion.span
                  key={i}
                  className={cx('h-full', c as string, i > 0 && 'ml-0.5')}
                  initial={{ width: 0 }}
                  animate={{ width: `${((n as number) / Math.max(s.total + s.cancelled, 1)) * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-2">
              <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-ok" />{s.confirmed} confirmadas</span>
              <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-warn" />{s.pending} pendientes</span>
              <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-bad" />{s.cancelled} {s.cancelled === 1 ? 'cancelada' : 'canceladas'}</span>
            </div>
          </Card>

          <Stat icon={Wallet} label="Ingresos estimados" value={moneyPlain(s.revenue)} note={revenueDelta ? `${revenueDelta > 0 ? '+' : ''}${revenueDelta}% vs. semana pasada` : 'hoy'} up={revenueDelta >= 0} />
          <Stat icon={UserPlus} label={t.client === 'clienta' ? 'Clientas nuevas' : `${cap(t.clients)} nuevos`} value={String(fresh)} note="últimos 30 días" up />
          <Card className="flex items-center gap-4 p-5">
            <Ring value={s.occupancy} />
            <div>
              <p className="text-[13px] text-ink-3">Ocupación</p>
              <p className="text-2xl font-semibold tabular-nums tracking-tight">{s.occupancy}%</p>
              <p className="text-xs text-ink-3">{data.staff.length} {data.staff.length === 1 ? t.staff : t.staffPlural}</p>
            </div>
          </Card>
        </motion.div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-5">
          <motion.div {...fade(2)} className="lg:col-span-3">
            <Card className="h-full p-6">
              <SectionTitle
                title="Reservas de la semana"
                action={<span className="text-[13px] text-ink-3">{week.reduce((a, d) => a + d.count, 0)} en total</span>}
              />
              <div className="mt-6 flex h-44 items-end gap-2 sm:gap-4">
                {week.map((d, i) => {
                  const isToday = d.key === today
                  return (
                    <div key={d.key} className="group flex flex-1 flex-col items-center gap-2">
                      <span className={cx('text-xs font-medium tabular-nums transition', isToday ? 'text-ink' : 'text-ink-3 opacity-0 group-hover:opacity-100')}>
                        {d.count}
                      </span>
                      <div className="relative flex h-32 w-full items-end justify-center">
                        <motion.div
                          className={cx('w-full max-w-[44px] rounded-[12px]', isToday ? 'bg-accent' : 'bg-accent-soft group-hover:bg-surface-3')}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
                          transition={{ delay: 0.15 + i * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span className={cx('text-xs', isToday ? 'font-semibold text-ink' : 'text-ink-3')}>{dayShort(d.date)}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>

          <motion.div {...fade(3)} className="lg:col-span-2">
            <Card className="h-full p-6">
              <SectionTitle title="Servicios más solicitados" action={<span className="text-[13px] text-ink-3">30 días</span>} />
              <div className="mt-5 flex flex-col gap-4">
                {top.map(({ service: sv, count }, i) => (
                  <div key={sv.id} className={`tone-${sv.tone}`}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate font-medium">{sv.name}</span>
                      <span className="tabular-nums text-ink-3">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-2">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'var(--tone-bar)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / topMax) * 100}%` }}
                        transition={{ delay: 0.2 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Automation + link strip */}
        <motion.div {...fade(4)} className="grid gap-4 md:grid-cols-2">
          <Link to="/demo/automations" className="group">
            <Card className="flex h-full items-center gap-4 bg-accent-soft p-5 shadow-none transition group-hover:brightness-[0.98]">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface text-accent-ink shadow-soft">
                <Workflow size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-accent-ink">{enabled} automatizaciones activas</p>
                <p className="text-[13px] text-accent-ink/75">{sentWeek} WhatsApps enviados esta semana, sin escribir uno solo.</p>
              </div>
              <ArrowUpRight size={18} className="text-accent-ink transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Card>
          </Link>
          <Card className="flex items-center gap-4 p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-ink-2">
              <MessageCircle size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Tu link de reservas</p>
              <p className="truncate text-[13px] text-ink-3">{bookUrl.replace(/^https?:\/\//, '')}</p>
            </div>
            <Button
              size="icon"
              variant="soft"
              aria-label="Copiar link"
              onClick={() => {
                navigator.clipboard?.writeText(bookUrl).catch(() => {})
                toast({ title: 'Link copiado', body: 'Compártelo en Instagram o WhatsApp', tone: 'info' })
              }}
            >
              <Copy size={16} />
            </Button>
          </Card>
        </motion.div>
      </div>

      {/* Secondary panel */}
      <motion.aside {...fade(2)} className="flex flex-col gap-4">
        <Card className="p-2">
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <h2 className="text-[15px] font-semibold">Próximas {t.appointments}</h2>
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-2">{upcomingLabel}</span>
          </div>
          {upcoming.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-3">No hay {t.appointments} próximas.</p>}
          <div className="flex flex-col">
            {upcoming.slice(0, 6).map((a, i) => {
              const c = customer(a.customerId)
              const sv = service(a.serviceId)
              const p = staff(a.staffId)
              return (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  onClick={() => openAppointment(a.id)}
                  className="flex items-center gap-3 rounded-[20px] px-3 py-3 text-left transition hover:bg-surface-2"
                >
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-[15px] font-semibold tabular-nums">{fmtTime(a.start)}</p>
                  </div>
                  <span className={`tone-${p?.tone} h-10 w-1 shrink-0 rounded-full`} style={{ background: 'var(--tone-bar)' }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c?.name}</p>
                    <p className="truncate text-[13px] text-ink-3">
                      {sv?.name} · {p && firstName(p.name)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} className="hidden sm:inline-flex xl:hidden 2xl:inline-flex" />
                  <span className={cx('size-2 shrink-0 rounded-full sm:hidden xl:block 2xl:hidden', a.status === 'confirmed' ? 'bg-ok' : 'bg-warn')} />
                </motion.button>
              )
            })}
          </div>
          <Link to="/demo/calendar" className="mx-2 mb-2 mt-1 flex items-center justify-center rounded-2xl py-3 text-[13px] font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink">
            Ver calendario completo
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold">Equipo hoy</h2>
          <div className="mt-4 flex flex-col gap-3.5">
            {data.staff.map((p) => {
              const mine = data.appointments.filter((a) => a.date === today && a.staffId === p.id && isActive(a))
              const mins = mine.reduce((n, a) => n + a.duration, 0)
              const pct = Math.round((mins / ((data.settings.closeHour - data.settings.openHour) * 60)) * 100)
              return (
                <div key={p.id} className={`tone-${p.tone} flex items-center gap-3`}>
                  <Avatar name={p.name} tone={p.tone} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="tabular-nums text-ink-3">{mine.length}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-surface-2">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: 'var(--tone-bar)' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </motion.aside>
    </div>
  )
}

function Stat({ icon: Icon, label, value, note, up }: { icon: typeof Wallet; label: string; value: string; note: string; up?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-3">{label}</p>
        <span className="grid size-8 place-items-center rounded-xl bg-surface-2 text-ink-2">
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className={cx('mt-1 flex items-center gap-1 text-xs', up ? 'text-ok' : 'text-bad')}>
        <TrendingUp size={12} className={up ? '' : 'rotate-180'} /> <span className="text-ink-3">{note}</span>
      </p>
    </Card>
  )
}

function Ring({ value }: { value: number }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
      <motion.circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (value / 100) * c }}
        transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )
}
