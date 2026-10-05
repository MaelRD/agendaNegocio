import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MiniCalendar } from '../components/calendar/MiniCalendar'
import { TimeGrid, type GridColumn } from '../components/calendar/TimeGrid'
import { Avatar, Button, Card, Segmented } from '../components/ui/primitives'
import { useIsMobile } from '../components/ui/Sheet'
import { addDaysKey, dayShort, fmtLong, fromKey, monthName, toKey, todayKey, weekDays } from '../lib/date'
import { cap, cx, firstName } from '../lib/format'
import { dayStats } from '../lib/stats'
import { useStore } from '../store/AppStore'
import { useUI } from '../store/ui'

type View = 'week' | 'day'

export default function CalendarPage() {
  const { data, template } = useStore()
  const { openNew, openAppointment } = useUI()
  const mobile = useIsMobile()
  const [params, setParams] = useSearchParams()
  const [date, setDate] = useState(params.get('date') ?? todayKey())
  const [view, setView] = useState<View>('week')
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const t = template.terms
  const effectiveView: View = mobile ? 'day' : view

  useEffect(() => {
    const p = params.get('date')
    if (p && p !== date) setDate(p)
  }, [params])

  const go = (key: string) => {
    setDate(key)
    setParams({ date: key }, { replace: true })
  }

  const busy = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of data.appointments) if (a.status !== 'cancelled') m.set(a.date, (m.get(a.date) ?? 0) + 1)
    return m
  }, [data.appointments])

  const visible = data.appointments.filter((a) => !hidden.has(a.staffId))
  const days = weekDays(fromKey(date))
  const today = todayKey()

  const columns: GridColumn[] =
    effectiveView === 'week'
      ? days.map((d) => {
          const key = toKey(d)
          const isToday = key === today
          return {
            id: key,
            date: key,
            muted: d.getDay() === 0,
            events: visible.filter((a) => a.date === key),
            header: (
              <button onClick={() => { go(key); setView('day') }} className="group flex w-full flex-col items-center gap-1">
                <span className={cx('text-2xs font-medium uppercase tracking-wider', isToday ? 'text-accent-ink' : 'text-ink-3')}>{dayShort(d)}</span>
                <span
                  className={cx(
                    'grid size-9 place-items-center rounded-full text-lg font-semibold tabular-nums transition',
                    isToday ? 'bg-accent text-accent-fg shadow-[0_6px_14px_-6px_var(--accent)]' : key === date ? 'bg-surface-3' : 'group-hover:bg-surface-2',
                  )}
                >
                  {d.getDate()}
                </span>
              </button>
            ),
          }
        })
      : data.staff
          .filter((p) => !hidden.has(p.id))
          .map((p) => ({
            id: p.id,
            date,
            staffId: p.id,
            events: visible.filter((a) => a.date === date && a.staffId === p.id),
            header: (
              <div className="flex items-center justify-center gap-2">
                <Avatar name={p.name} tone={p.tone} size={28} />
                <span className="truncate text-ui font-semibold">{mobile ? firstName(p.name) : p.name}</span>
              </div>
            ),
          }))

  const step = effectiveView === 'week' ? 7 : 1
  const title =
    effectiveView === 'week'
      ? `${cap(monthName(days[0]))}${days[0].getMonth() !== days[6].getMonth() ? ' – ' + monthName(days[6]) : ''} ${days[6].getFullYear()}`
      : fmtLong(date)

  const toggle = (id: string) =>
    setHidden((h) => {
      const n = new Set(h)
      if (n.has(id)) n.delete(id)
      else if (n.size < data.staff.length - 1) n.add(id)
      return n
    })

  const s = dayStats(data, date)

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Secondary column */}
      <aside className="hidden flex-col gap-4 lg:flex">
        <Card className="p-5">
          <MiniCalendar selected={date} onSelect={go} busy={busy} highlightWeek={effectiveView === 'week'} />
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-ui font-semibold text-ink">{cap(t.staffPlural)}</p>
          <div className="flex flex-col gap-1">
            {data.staff.map((p) => {
              const on = !hidden.has(p.id)
              return (
                <button key={p.id} onClick={() => toggle(p.id)} className={`tone-${p.tone} flex items-center gap-3 rounded-2xl px-2 py-2 text-left transition hover:bg-surface-2`}>
                  <span
                    className="grid size-5 place-items-center rounded-md transition"
                    style={{ background: on ? 'var(--tone-bar)' : 'transparent', boxShadow: on ? 'none' : 'inset 0 0 0 1.5px var(--tone-bar)' }}
                  >
                    {on && (
                      <svg width="11" height="11" viewBox="0 0 12 12">
                        <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className={cx('flex-1 text-sm', on ? 'font-medium text-ink' : 'text-ink-3')}>{p.name}</span>
                  <span className="text-xs text-ink-3">{p.role}</span>
                </button>
              )
            })}
          </div>
        </Card>
        <Card className="bg-surface-2 p-5 shadow-none">
          <p className="text-ui text-ink-3">{fmtLong(date)}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xl font-semibold tabular-nums">{s.total}</p>
              <p className="text-xs text-ink-3">{t.appointments}</p>
            </div>
            <div>
              <p className="text-xl font-semibold tabular-nums">{s.occupancy}%</p>
              <p className="text-xs text-ink-3">ocupación</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-2xs text-ink-3">
            <span className="flex items-center gap-1.5"><i className="h-3 w-4 rounded bg-surface" />Confirmada</span>
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-warn" />Pendiente</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-4 rounded opacity-60" style={{ background: 'repeating-linear-gradient(135deg, var(--ink-3) 0 2px, transparent 2px 5px)' }} />Cancelada</span>
          </div>
        </Card>
      </aside>

      {/* Main calendar */}
      <Card className="min-w-0 p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-2 px-1 pb-3 md:gap-3 md:px-2">
          <div className="flex items-center">
            <button onClick={() => go(addDaysKey(date, -step))} aria-label="Anterior" className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => go(addDaysKey(date, step))} aria-label="Siguiente" className="grid size-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2">
              <ChevronRight size={18} />
            </button>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={title}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="min-w-0 flex-1 truncate text-lg font-semibold md:flex-none md:text-xl"
            >
              {title}
            </motion.h1>
          </AnimatePresence>
          {date !== today && (
            <Button size="sm" variant="soft" onClick={() => go(today)}>
              <CalendarDays size={14} /> Hoy
            </Button>
          )}
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Segmented id="cal-view" value={view} onChange={setView} options={[{ value: 'week', label: 'Semana' }, { value: 'day', label: 'Día' }]} />
            <Button variant="primary" size="sm" className="h-10 px-4" onClick={() => openNew({ date })}>
              <Plus size={16} /> Nueva {t.appointment}
            </Button>
          </div>
        </div>

        {/* Mobile: week strip */}
        {mobile && (
          <div className="mb-3 grid grid-cols-7 gap-1 px-1">
            {days.map((d) => {
              const key = toKey(d)
              const sel = key === date
              const n = busy.get(key) ?? 0
              return (
                <button key={key} onClick={() => go(key)} className={cx('flex flex-col items-center gap-1 rounded-2xl py-2 transition', sel ? 'bg-accent text-accent-fg' : 'text-ink')}>
                  <span className={cx('text-2xs font-medium uppercase', sel ? 'opacity-80' : 'text-ink-3')}>{dayShort(d).slice(0, 2)}</span>
                  <span className={cx('text-md font-semibold tabular-nums', key === today && !sel && 'text-accent-ink')}>{d.getDate()}</span>
                  <span className={cx('size-1 rounded-full', n ? (sel ? 'bg-accent-fg' : 'bg-ink-3/60') : 'bg-transparent')} />
                </button>
              )
            })}
          </div>
        )}

        {/* Tablet & mobile: staff chips */}
        <div className="scrollbar-none mb-3 flex gap-2 overflow-x-auto px-1 lg:hidden">
          {data.staff.map((p) => {
            const on = !hidden.has(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={cx(`tone-${p.tone} flex shrink-0 items-center gap-2 rounded-full py-1 pl-1 pr-3 text-ui font-medium transition`, !on && 'opacity-45')}
                style={{ background: 'var(--tone-bg)', color: 'var(--tone-ink)' }}
              >
                <Avatar name={p.name} tone={p.tone} size={24} className="ring-2 ring-surface" />
                {firstName(p.name)}
              </button>
            )
          })}
        </div>

        <TimeGrid
          columns={columns}
          open={data.settings.openHour}
          close={data.settings.closeHour}
          minColWidth={effectiveView === 'week' ? 104 : mobile ? Math.max(96, (window.innerWidth - 100) / Math.max(columns.length, 1)) : 160}
          compactCards={effectiveView === 'week'}
          onSlot={(d, start, staffId) => openNew({ date: d, start, staffId })}
          onEvent={openAppointment}
        />
      </Card>
    </div>
  )
}
