import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react'
import { cx } from '../../lib/format'

export function useIsMobile(query = '(max-width: 767px)') {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const fn = () => setM(mq.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [query])
  return m
}

/**
 * One overlay, three shapes: centered modal or right-side panel on desktop,
 * bottom sheet (drag down to close) on phones.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'modal',
  width = 520,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  variant?: 'modal' | 'panel'
  width?: number
}) {
  const mobile = useIsMobile()
  const controls = useDragControls()
  const startDrag = (e: RPointerEvent) => mobile && controls.start(e)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const shape = mobile
    ? {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
        className: 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px]',
        style: {},
      }
    : variant === 'panel'
      ? {
          initial: { x: 40, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: 40, opacity: 0 },
          className: 'right-3 top-3 bottom-3 rounded-[28px]',
          style: { width },
        }
      : {
          initial: { y: 16, opacity: 0, scale: 0.98 },
          animate: { y: 0, opacity: 1, scale: 1 },
          exit: { y: 8, opacity: 0, scale: 0.98 },
          className: 'left-1/2 top-[6vh] max-h-[88vh] -translate-x-1/2 rounded-[28px]',
          style: { width: `min(${width}px, calc(100vw - 32px))` },
        }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-[rgb(20_18_30/0.28)] backdrop-blur-[3px] dark:bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className={cx('pointer-events-none absolute inset-0', !mobile && variant === 'modal' && 'overflow-y-auto')}>
            <motion.div
              initial={shape.initial}
              animate={shape.animate}
              exit={shape.exit}
              transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }}
              drag={mobile ? 'y' : false}
              dragControls={controls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) onClose()
              }}
              style={shape.style}
              className={cx(
                'pointer-events-auto absolute flex flex-col overflow-hidden bg-surface shadow-float',
                shape.className,
              )}
            >
              {mobile && (
                <div onPointerDown={startDrag} className="flex shrink-0 touch-none justify-center pb-1 pt-2.5">
                  <div className="h-1.5 w-10 rounded-full bg-surface-3" />
                </div>
              )}
              {(title || subtitle) && (
                <div onPointerDown={startDrag} className="flex shrink-0 touch-none items-start justify-between gap-4 px-6 pb-2 pt-3 md:touch-auto md:pt-6">
                  <div className="min-w-0">
                    {title && <h3 className="text-lg font-semibold tracking-tight text-ink">{title}</h3>}
                    {subtitle && <div className="mt-0.5 text-sm text-ink-3">{subtitle}</div>}
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="-mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-3 transition hover:bg-surface-2 hover:text-ink"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-2">
                {children}
              </div>
              {footer && <div className="pb-safe shrink-0 border-t border-line bg-surface px-6 py-4">{footer}</div>}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
