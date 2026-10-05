import { AnimatePresence, motion } from 'framer-motion'
import { CheckCheck, ChevronLeft, Phone, Video } from 'lucide-react'
import { Fragment, useEffect, useRef, type ReactNode } from 'react'
import { cx } from '../../lib/format'

export interface ChatMessage {
  id: string
  text: string
  from: 'business' | 'client'
  time: string
  label?: string
}

/** Renders *bold* the way chat apps do. */
function rich(text: string) {
  return text.split('\n').map((line, i, arr) => (
    <Fragment key={i}>
      {line.split(/(\*[^*]+\*)/g).map((part, j) =>
        part.startsWith('*') && part.endsWith('*') ? (
          <strong key={j} className="font-semibold">
            {part.slice(1, -1)}
          </strong>
        ) : (
          <Fragment key={j}>{part}</Fragment>
        ),
      )}
      {i < arr.length - 1 && <br />}
    </Fragment>
  ))
}

export function ChatBubble({ m }: { m: ChatMessage }) {
  const mine = m.from === 'business'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={cx('flex shrink-0 flex-col', mine ? 'items-end' : 'items-start')}
    >
      {m.label && <span className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wider text-[#7c8a80] dark:text-[#8fa196]">{m.label}</span>}
      <div
        className={cx(
          'max-w-[86%] rounded-[18px] px-3.5 py-2.5 text-[13px] leading-[1.45] shadow-[0_1px_1px_rgb(0_0_0/0.06)]',
          mine
            ? 'rounded-br-md bg-[#d9f5df] text-[#13261a] dark:bg-[#1f4a33] dark:text-[#e3f5e8]'
            : 'rounded-bl-md bg-white text-[#1d1d22] dark:bg-[#2a2c33] dark:text-[#ecedf0]',
        )}
      >
        {rich(m.text)}
        <span className="float-right ml-3 mt-1.5 inline-flex translate-y-0.5 items-center gap-0.5 text-[10px] opacity-55">
          {m.time}
          {mine && <CheckCheck size={13} className="text-[#3b9be8]" />}
        </span>
      </div>
    </motion.div>
  )
}

export function PhonePreview({
  title,
  subtitle = 'en línea',
  messages,
  typing,
  footer,
  className,
}: {
  title: string
  subtitle?: string
  messages: ChatMessage[]
  typing?: boolean
  footer?: ReactNode
  className?: string
}) {
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = list.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, typing])

  return (
    <div
      className={cx(
        'relative mx-auto w-full max-w-[300px] rounded-[44px] bg-[#16151c] p-[9px] shadow-[0_30px_60px_-24px_rgb(30_20_60/0.45),inset_0_0_0_1.5px_rgb(255_255_255/0.08)]',
        className,
      )}
    >
      <div className="relative flex h-[560px] flex-col overflow-hidden rounded-[36px] bg-[#efeae3] dark:bg-[#121317]">
        {/* status bar */}
        <div className="flex h-9 shrink-0 items-end justify-between bg-[#f7f5f0] px-7 pb-1 text-[11px] font-semibold text-[#1d1d22] dark:bg-[#1b1c21] dark:text-white">
          <span>9:41</span>
          <span className="absolute left-1/2 top-2 h-[22px] w-[84px] -translate-x-1/2 rounded-full bg-[#16151c]" />
          <span className="flex items-center gap-1">
            <span className="flex items-end gap-[1.5px]">
              {[4, 6, 8, 10].map((h) => (
                <span key={h} className="w-[2.5px] rounded-sm bg-current" style={{ height: h }} />
              ))}
            </span>
            <span className="ml-1 h-[10px] w-[20px] rounded-[3px] border border-current p-[1px]">
              <span className="block h-full w-3/4 rounded-[1px] bg-current" />
            </span>
          </span>
        </div>
        {/* chat header */}
        <div className="flex shrink-0 items-center gap-2.5 bg-[#f7f5f0] px-3 pb-2.5 pt-1.5 shadow-[0_1px_0_rgb(0_0_0/0.06)] dark:bg-[#1b1c21]">
          <ChevronLeft size={20} className="text-[#2b8a57]" />
          <span className="grid size-8 place-items-center rounded-full bg-accent text-[12px] font-semibold text-accent-fg">
            {title.charAt(0)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-semibold text-[#1d1d22] dark:text-white">{title}</p>
            <p className="text-[10.5px] text-[#7c8a80]">{typing ? 'escribiendo…' : subtitle}</p>
          </div>
          <Video size={18} className="text-[#2b8a57]" />
          <Phone size={16} className="ml-2 text-[#2b8a57]" />
        </div>
        {/* messages */}
        <div
          ref={list}
          className="scrollbar-none flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(120 110 90 / 0.09) 1px, transparent 0)',
            backgroundSize: '14px 14px',
          }}
        >
          <div className="flex-1" />
          <span className="mx-auto mb-1 shrink-0 rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-[#6b6f78] dark:bg-white/10 dark:text-[#a8abb3]">
            Mensajes automáticos · cifrado
          </span>
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <ChatBubble key={m.id} m={m} />
            ))}
            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex w-14 items-center justify-center gap-1 rounded-[18px] rounded-bl-md bg-white py-3 dark:bg-[#2a2c33]"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="size-1.5 rounded-full bg-[#9aa0a8]"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* composer */}
        {footer ?? (
          <div className="flex shrink-0 items-center gap-2 bg-[#f7f5f0] px-3 py-2.5 dark:bg-[#1b1c21]">
            <div className="h-8 flex-1 rounded-full bg-white px-3 text-[12px] leading-8 text-[#9aa0a8] dark:bg-[#2a2c33]">Mensaje</div>
            <span className="grid size-8 place-items-center rounded-full bg-[#2b8a57] text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5v-17l19 8.5-19 8.5Zm2-3.1 11.9-5.4L5 6.6v3.9l6 1.5-6 1.5v3.9Z" />
              </svg>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
