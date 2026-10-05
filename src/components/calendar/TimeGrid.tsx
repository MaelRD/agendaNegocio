import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { fmtTime, nowMinutes, pad, todayKey } from '../../lib/date'
import { cx, firstName } from '../../lib/format'
import type { Appointment } from '../../lib/types'
import { useStore } from '../../store/AppStore'

export interface GridColumn {
  id: string
  header: ReactNode
  date: string
  staffId?: string
  events: Appointment[]
  muted?: boolean
}

const HOUR = 76

/** Assigns side-by-side lanes to overlapping events. */
function lanes(events: Appointment[]) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.duration - a.duration)
  const out = new Map<string, { lane: number; of: number }>()
  let cluster: Appointment[] = []
  let laneEnds: number[] = []
  let clusterEnd = -1
  const flush = () => {
    const of = laneEnds.length
    cluster.forEach((e) => (out.get(e.id)!.of = of))
    cluster = []
    laneEnds = []
  }
  for (const e of sorted) {
    if (e.start >= clusterEnd && cluster.length) flush()
    let lane = laneEnds.findIndex((end) => end <= e.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(0)
    }
    laneEnds[lane] = e.start + e.duration
    out.set(e.id, { lane, of: 1 })
    cluster.push(e)
    clusterEnd = Math.max(clusterEnd, e.start + e.duration)
  }
  flush()
  return out
}

export function TimeGrid({
  columns,
  open,
  close,
  minColWidth,
  onSlot,
  onEvent,
  compactCards,
}: {
  columns: GridColumn[]
  open: number
  close: number
  minColWidth: number
  onSlot: (date: string, start: number, staffId?: string) => void
  onEvent: (id: string) => void
  compactCards?: boolean
}) {
  const { customer, service, staff } = useStore()
  const hours = Array.from({ length: close - open }, (_, i) => open + i)
  const [hover, setHover] = useState<{ col: string; min: number } | null>(null)
  const [now, setNow] = useState(nowMinutes())
  const scroller = useRef<HTMLDivElement>(null)
  const today = todayKey()

  useEffect(() => {
    const id = setInterval(() => setNow(nowMinutes()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Start scrolled near the current time.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const target = Math.max(0, ((Math.min(Math.max(now, open * 60), close * 60) - open * 60) / 60) * HOUR - 120)
    el.scrollTop = target
  }, [])

  const minuteFromEvent = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const raw = open * 60 + (y / HOUR) * 60
    return Math.min(Math.floor(raw / 30) * 30, close * 60 - 30)
  }

  const showNow = now >= open * 60 && now <= close * 60

  return (
    <div ref={scroller} className="scrollbar-thin relative max-h-[calc(100dvh-230px)] min-h-[420px] overflow-auto rounded-[24px] md:max-h-[calc(100dvh-200px)]">
      <div className="relative" style={{ minWidth: 56 + columns.length * minColWidth }}>
        {/* headers */}
        <div className="sticky top-0 z-20 flex bg-surface/95 backdrop-blur">
          <div className="sticky left-0 z-10 w-14 shrink-0 bg-surface/95" />
          {columns.map((c) => (
            <div key={c.id} className="min-w-0 flex-1 px-1 pb-3 pt-4" style={{ minWidth: minColWidth }}>
              {c.header}
            </div>
          ))}
        </div>

        <div className="h-2" />
        <div className="relative flex">
          {/* time gutter */}
          <div className="sticky left-0 z-10 w-14 shrink-0 bg-surface">
            {hours.map((h) => (
              <div key={h} className="relative" style={{ height: HOUR }}>
                <span className="absolute -top-2 right-3 text-[11px] font-medium tabular-nums text-ink-3">{pad(h)}:00</span>
              </div>
            ))}
          </div>

          {columns.map((col) => {
            const placed = lanes(col.events)
            const isToday = col.date === today
            return (
              <div
                key={col.id}
                className={cx('relative min-w-0 flex-1 border-l border-line', col.muted && 'bg-surface-2/40', isToday && 'bg-accent-soft/25')}
                style={{ minWidth: minColWidth, height: hours.length * HOUR }}
                onMouseMove={(e) => {
                  if ((e.target as HTMLElement).closest('[data-event]')) return setHover(null)
                  const min = minuteFromEvent(e)
                  if (!hover || hover.col !== col.id || hover.min !== min) setHover({ col: col.id, min })
                }}
                onMouseLeave={() => setHover(null)}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('[data-event]')) return
                  onSlot(col.date, minuteFromEvent(e), col.staffId)
                }}
              >
                {hours.map((h, i) => (
                  <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-line" style={{ top: i * HOUR }}>
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-line opacity-60" style={{ top: HOUR / 2 }} />
                  </div>
                ))}

                {hover?.col === col.id && (
                  <div
                    className="pointer-events-none absolute inset-x-1 flex items-center gap-1 rounded-xl bg-accent-soft/80 px-2 text-[11px] font-medium text-accent-ink"
                    style={{ top: ((hover.min - open * 60) / 60) * HOUR + 2, height: HOUR / 2 - 4 }}
                  >
                    <Plus size={12} /> {fmtTime(hover.min)}
                  </div>
                )}

                {col.events.filter((a) => a.start < close * 60 && a.start + a.duration > open * 60).map((a) => {
                  const p = staff(a.staffId)
                  const c = customer(a.customerId)
                  const sv = service(a.serviceId)
                  const pos = placed.get(a.id)!
                  const top = ((a.start - open * 60) / 60) * HOUR
                  const height = (a.duration / 60) * HOUR
                  const short = height < 44
                  const cancelled = a.status === 'cancelled' || a.status === 'no-show'
                  const narrow = compactCards || pos.of > 1
                  return (
                    <motion.button
                      data-event
                      key={a.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                      onClick={() => onEvent(a.id)}
                      className={cx(
                        `tone-${p?.tone ?? 1} absolute overflow-hidden rounded-[14px] text-left shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow hover:z-10 hover:shadow-float`,
                        cancelled && 'opacity-55',
                      )}
                      style={{
                        top: top + 2,
                        height: Math.max(height - 4, 22),
                        left: `calc(${(pos.lane / pos.of) * 100}% + 3px)`,
                        width: `calc(${100 / pos.of}% - 6px)`,
                        background: cancelled
                          ? 'repeating-linear-gradient(135deg, var(--tone-bg) 0 6px, transparent 6px 12px)'
                          : 'var(--tone-bg)',
                        color: 'var(--tone-ink)',
                      }}
                    >
                      <span className="absolute inset-y-1.5 left-1.5 w-[3px] rounded-full" style={{ background: 'var(--tone-bar)' }} />
                      {a.status === 'pending' && <span title="Pendiente" className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-warn ring-2 ring-[var(--tone-bg)]" />}
                      <span className={cx('flex h-full flex-col pl-3.5 pr-2', short ? 'justify-center' : 'pt-1.5')}>
                        <span className={cx('truncate text-[12px] font-semibold leading-tight', cancelled && 'line-through')}>
                          {c ? (narrow ? firstName(c.name) : c.name) : '—'}
                        </span>
                        {!short && <span className="truncate text-[11px] leading-snug opacity-80">{sv?.name}</span>}
                        {height >= 70 && (
                          <span className="mt-auto truncate pb-1.5 text-[10.5px] font-medium tabular-nums opacity-70">
                            {fmtTime(a.start)} – {fmtTime(a.start + a.duration)}
                          </span>
                        )}
                      </span>
                    </motion.button>
                  )
                })}

                {isToday && showNow && (
                  <div className="pointer-events-none absolute inset-x-0 z-[5] flex items-center" style={{ top: ((now - open * 60) / 60) * HOUR }}>
                    <span className="-ml-1 size-2 rounded-full bg-bad" />
                    <span className="h-[1.5px] flex-1 bg-bad" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
