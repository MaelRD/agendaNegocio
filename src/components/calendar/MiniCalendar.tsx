import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { fromKey, monthGrid, monthName, startOfWeek, toKey, todayKey } from '../../lib/date'
import { cap, cx } from '../../lib/format'

const WD = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function MiniCalendar({
  selected,
  onSelect,
  busy,
  highlightWeek,
}: {
  selected: string
  onSelect: (key: string) => void
  busy: Map<string, number>
  highlightWeek?: boolean
}) {
  const [cursor, setCursor] = useState(() => fromKey(selected))
  const days = useMemo(() => monthGrid(cursor), [cursor])
  const today = todayKey()
  const weekStart = toKey(startOfWeek(fromKey(selected)))
  const weekEndDate = startOfWeek(fromKey(selected))
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEnd = toKey(weekEndDate)

  const shift = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between pl-1">
        <p className="text-[15px] font-semibold">
          {cap(monthName(cursor))} <span className="font-normal text-ink-3">{cursor.getFullYear()}</span>
        </p>
        <div className="flex">
          <button onClick={() => shift(-1)} aria-label="Mes anterior" className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => shift(1)} aria-label="Mes siguiente" className="grid size-8 place-items-center rounded-full text-ink-3 hover:bg-surface-2 hover:text-ink">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-ink-3">
        {WD.map((d, i) => (
          <span key={i} className="pb-2">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d) => {
          const key = toKey(d)
          const out = d.getMonth() !== cursor.getMonth()
          const inWeek = highlightWeek && key >= weekStart && key <= weekEnd
          const isSel = key === selected
          const n = busy.get(key) ?? 0
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={cx(
                'relative mx-auto grid h-9 w-full place-items-center text-[13px] tabular-nums transition',
                inWeek && 'bg-surface-2',
                inWeek && key === weekStart && 'rounded-l-xl',
                inWeek && key === weekEnd && 'rounded-r-xl',
              )}
            >
              <span
                className={cx(
                  'grid size-8 place-items-center rounded-full transition',
                  isSel ? 'bg-accent font-semibold text-accent-fg' : key === today ? 'font-semibold text-accent-ink' : out ? 'text-ink-3/60' : 'text-ink hover:bg-surface-3',
                )}
              >
                {d.getDate()}
              </span>
              {n > 0 && !isSel && (
                <span className={cx('absolute bottom-0.5 size-1 rounded-full', n > 8 ? 'bg-accent' : 'bg-ink-3/50')} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
