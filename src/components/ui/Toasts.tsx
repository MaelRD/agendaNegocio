import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, MessageCircle, XCircle } from 'lucide-react'
import { useStore } from '../../store/AppStore'
import { cx } from '../../lib/format'

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const Icon = t.tone === 'whatsapp' ? MessageCircle : t.tone === 'bad' ? XCircle : t.tone === 'info' ? Info : CheckCircle2
          return (
            <motion.button
              key={t.id}
              layout
              onClick={() => dismissToast(t.id)}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-surface p-3.5 pr-5 text-left shadow-float"
            >
              <span
                className={cx(
                  'grid size-9 shrink-0 place-items-center rounded-xl',
                  t.tone === 'whatsapp' && 'bg-[#e3f6ea] text-[#1f9d55] dark:bg-[#183326] dark:text-[#5fd391]',
                  t.tone === 'bad' && 'bg-bad-soft text-bad',
                  t.tone === 'info' && 'bg-accent-soft text-accent-ink',
                  (!t.tone || t.tone === 'ok') && 'bg-ok-soft text-ok',
                )}
              >
                <Icon size={18} />
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block text-sm font-medium text-ink">{t.title}</span>
                {t.body && <span className="mt-0.5 block truncate text-[13px] text-ink-3">{t.body}</span>}
              </span>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
