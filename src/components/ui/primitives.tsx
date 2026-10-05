import { motion } from 'framer-motion'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cx, initials } from '../../lib/format'
import type { AppointmentStatus, Tone } from '../../lib/types'

type Variant = 'primary' | 'soft' | 'ghost' | 'danger' | 'outline'

export function Button({
  variant = 'soft',
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' | 'icon' }) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background,color,transform,box-shadow] duration-150 active:scale-[0.97] disabled:opacity-50',
        size === 'sm' && 'h-8 px-3 text-ui',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-md',
        size === 'icon' && 'size-10',
        variant === 'primary' && 'bg-accent text-accent-fg shadow-[0_6px_16px_-6px_var(--accent)] hover:brightness-110',
        variant === 'soft' && 'bg-surface-2 text-ink hover:bg-surface-3',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        variant === 'danger' && 'bg-bad-soft text-bad hover:brightness-95',
        variant === 'outline' && 'bg-surface text-ink shadow-soft hover:bg-surface-2',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-[28px] bg-surface shadow-soft', className)}>{children}</div>
}

export function Avatar({ name, tone, size = 36, className }: { name: string; tone?: Tone; size?: number; className?: string }) {
  const t = tone ?? ((([...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 5) + 1) as Tone)
  return (
    <span
      className={cx(`tone-${t} inline-grid shrink-0 place-items-center rounded-full font-semibold`, className)}
      style={{ width: size, height: size, fontSize: size * 0.36, background: 'var(--tone-bg)', color: 'var(--tone-ink)' }}
    >
      {initials(name)}
    </span>
  )
}

const STATUS: Record<AppointmentStatus, { label: string; cls: string }> = {
  confirmed: { label: 'Confirmada', cls: 'bg-ok-soft text-ok' },
  pending: { label: 'Pendiente', cls: 'bg-warn-soft text-warn' },
  cancelled: { label: 'Cancelada', cls: 'bg-bad-soft text-bad' },
  completed: { label: 'Completada', cls: 'bg-surface-2 text-ink-2' },
  'no-show': { label: 'No asistió', cls: 'bg-bad-soft text-bad' },
}

export const statusLabel = (s: AppointmentStatus) => STATUS[s].label

export function StatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', STATUS[status].cls, className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS[status].label}
    </span>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cx(
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors duration-200',
        on ? 'bg-accent' : 'bg-surface-3',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        className={cx('size-5 rounded-full bg-white shadow-sm', on ? 'ml-auto' : 'ml-0')}
      />
    </button>
  )
}

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('flex flex-col gap-1.5', className)}>
      <span className="text-ui font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink-3">{hint}</span>}
    </label>
  )
}

const inputCls =
  'h-11 w-full rounded-2xl bg-surface-2 px-4 text-ink outline-none ring-accent/40 transition placeholder:text-ink-3 focus:bg-surface focus:ring-2'

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, p.className)} />

export const Select = ({ children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={cx(inputCls, 'appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10', p.className)} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239a95ad' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}>
    {children}
  </select>
)

export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={cx(inputCls, 'h-auto min-h-[88px] resize-none py-3', p.className)} />
)

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  id,
  className,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  id: string
  className?: string
}) {
  return (
    <div className={cx('inline-flex rounded-full bg-surface-2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'relative h-8 rounded-full px-3.5 text-ui font-medium transition-colors',
            value === o.value ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
          )}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-0 rounded-full bg-surface shadow-soft"
              transition={{ type: 'spring', stiffness: 500, damping: 38 }}
            />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

export function Tooltip({ label, children, side = 'right' }: { label: string; children: ReactNode; side?: 'right' | 'bottom' }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cx(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-bg opacity-0 shadow-float transition-[opacity,transform] duration-150 group-hover/tt:opacity-100 group-has-[:focus-visible]/tt:opacity-100',
          side === 'right' && 'left-full top-1/2 ml-3 -translate-x-1 -translate-y-1/2 group-hover/tt:translate-x-0',
          side === 'bottom' && 'left-1/2 top-full mt-2 -translate-x-1/2 -translate-y-1 group-hover/tt:translate-y-0',
        )}
      >
        {label}
      </span>
    </span>
  )
}

export function SectionTitle({ title, action, className }: { title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex items-center justify-between gap-3', className)}>
      <h2 className="text-md font-semibold text-ink">{title}</h2>
      {action}
    </div>
  )
}

export function Empty({ icon, title, body }: { icon: ReactNode; title: string; body?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-ink-3">{icon}</span>
      <p className="mt-1 font-medium text-ink">{title}</p>
      {body && <p className="max-w-xs text-sm text-ink-3">{body}</p>}
    </div>
  )
}
