import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CalendarCheck, ExternalLink, MessageCircle, Moon, Plus, Sun, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fmtAgo, fmtLong, todayKey } from '../../lib/date'
import { cx, moneyPlain } from '../../lib/format'
import { dayStats } from '../../lib/stats'
import { useStore } from '../../store/AppStore'
import { useUI } from '../../store/ui'
import { Avatar, Button, Tooltip } from '../ui/primitives'
import { LogoMark } from './LogoMark'

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-[15px] font-semibold tabular-nums tracking-tight text-ink">{value}</span>
      <span className="text-[13px] text-ink-3">{label}</span>
    </div>
  )
}

function Notifications() {
  const { data, markNotificationsRead } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = data.notifications.filter((n) => !n.read).length

  useEffect(() => {
    if (!open) return
    const fn = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Tooltip label="Notificaciones" side="bottom">
        <button
          onClick={() => {
            setOpen((o) => !o)
            if (unread) setTimeout(markNotificationsRead, 1200)
          }}
          aria-label="Notificaciones"
          className="relative grid size-10 place-items-center rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
        >
          <Bell size={19} strokeWidth={1.8} />
          {unread > 0 && (
            <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-fg ring-2 ring-bg">
              {unread}
            </span>
          )}
        </button>
      </Tooltip>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-32px))] origin-top-right rounded-3xl bg-surface p-2 shadow-float"
          >
            <p className="px-3 pb-1 pt-2 text-[13px] font-semibold text-ink">Actividad</p>
            {data.notifications.length === 0 && <p className="px-3 py-6 text-center text-sm text-ink-3">Sin novedades</p>}
            {data.notifications.slice(0, 6).map((n) => {
              const Icon = n.kind === 'booking' ? CalendarCheck : n.kind === 'cancel' ? XCircle : MessageCircle
              return (
                <div key={n.id} className="flex gap-3 rounded-2xl px-3 py-2.5 hover:bg-surface-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      {n.title}
                      {!n.read && <span className="size-1.5 rounded-full bg-accent" />}
                    </p>
                    <p className="truncate text-[13px] text-ink-3">{n.body}</p>
                  </div>
                  <span className="shrink-0 pt-0.5 text-xs text-ink-3">{fmtAgo(n.at)}</span>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ThemeButton() {
  const { theme, toggleTheme } = useStore()
  return (
    <Tooltip label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'} side="bottom">
      <button
        onClick={toggleTheme}
        aria-label="Cambiar tema"
        className="grid size-10 place-items-center overflow-hidden rounded-full text-ink-2 transition hover:bg-surface-2 hover:text-ink"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={{ y: 12, opacity: 0, rotate: -30 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -12, opacity: 0, rotate: 30 }}
            transition={{ duration: 0.18 }}
          >
            {theme === 'dark' ? <Sun size={19} strokeWidth={1.8} /> : <Moon size={19} strokeWidth={1.8} />}
          </motion.span>
        </AnimatePresence>
      </button>
    </Tooltip>
  )
}

export function Header() {
  const { data, template } = useStore()
  const { openNew } = useUI()
  const navigate = useNavigate()
  const s = dayStats(data)

  return (
    <header className="sticky top-0 z-40 bg-bg/85 backdrop-blur-xl">
      {/* Mobile */}
      <div className="flex h-16 items-center gap-3 px-4 md:hidden">
        <LogoMark size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-tight tracking-tight">{data.settings.name}</p>
          <p className="text-xs text-ink-3">Agenda inteligente</p>
        </div>
        <ThemeButton />
        <Notifications />
      </div>

      {/* Tablet / desktop */}
      <div className="hidden min-h-[84px] items-center gap-6 px-6 md:flex lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold tracking-tight">{data.settings.name}</p>
          <p className="text-[13px] text-ink-3">Agenda inteligente · {template.kind}</p>
        </div>

        <div className="hidden items-center gap-5 rounded-full bg-surface px-5 py-2.5 shadow-soft xl:flex">
          <Metric value={String(s.total)} label={template.terms.appointments + ' hoy'} />
          <span className="h-4 w-px bg-line" />
          <Metric value={moneyPlain(s.revenue)} label="estimado" />
          <span className="h-4 w-px bg-line" />
          <Metric value={`${s.occupancy}%`} label="ocupación" />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to={`/book/${data.businessId}`}
            target="_blank"
            className="mr-2 hidden items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-ink-2 transition hover:bg-surface-2 hover:text-ink lg:inline-flex"
          >
            Página de reservas <ExternalLink size={14} />
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/demo/calendar?date=${todayKey()}`)}
            className="mr-1 h-10 px-4"
            title={fmtLong(todayKey())}
          >
            Hoy
          </Button>
          <Notifications />
          <ThemeButton />
          <Button variant="primary" className={cx('ml-2 hidden lg:inline-flex')} onClick={() => openNew()}>
            <Plus size={17} /> Nueva {template.terms.appointment}
          </Button>
          <Link to="/demo/settings" className="ml-2" aria-label="Perfil">
            <Avatar name={template.staff[0].name} tone={template.staff[0].tone} size={40} className="ring-4 ring-surface" />
          </Link>
        </div>
      </div>
    </header>
  )
}
