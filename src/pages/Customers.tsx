import { motion } from 'framer-motion'
import { CalendarPlus, Mail, MessageCircle, Phone, Search, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Avatar, Button, Card, Empty, Segmented, StatusBadge, Textarea } from '../components/ui/primitives'
import { Sheet } from '../components/ui/Sheet'
import { fmtShort, fmtTime } from '../lib/date'
import { cap, cx, money, moneyPlain } from '../lib/format'
import { summarizeCustomers, type CustomerStatus, type CustomerSummary } from '../lib/stats'
import { useStore } from '../store/AppStore'
import { useUI } from '../store/ui'

const STATUS_CLS: Record<CustomerStatus, string> = {
  Frecuente: 'bg-accent-soft text-accent-ink',
  Nuevo: 'bg-ok-soft text-ok',
  'En riesgo': 'bg-warn-soft text-warn',
  Activo: 'bg-surface-2 text-ink-2',
}

const statusLabel = (s: CustomerStatus, client: string) =>
  s === 'Frecuente' ? `${cap(client)} frecuente` : s === 'Nuevo' ? (client.endsWith('a') ? 'Nueva' : 'Nuevo') : s

export default function Customers() {
  const { data, template } = useStore()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<CustomerStatus | 'all'>('all')
  const t = template.terms
  const all = useMemo(() => summarizeCustomers(data), [data])
  const openId = params.get('c')
  const selected = all.find((x) => x.customer.id === openId)

  const list = all
    .filter((x) => (filter === 'all' || x.status === filter) && x.customer.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.spent - a.spent)

  const totals = {
    all: all.length,
    frequent: all.filter((x) => x.status === 'Frecuente').length,
    risk: all.filter((x) => x.status === 'En riesgo').length,
    ltv: Math.round(all.reduce((s, x) => s + x.spent, 0) / Math.max(all.length, 1)),
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1 pt-2">
        <h1 className="text-[28px] font-semibold tracking-tight">{cap(t.clients)}</h1>
        <p className="text-[15px] text-ink-3">Un mini CRM que se llena solo con cada reserva.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Total', String(totals.all)],
          ['Frecuentes', String(totals.frequent)],
          ['En riesgo', String(totals.risk)],
          ['Gasto promedio', moneyPlain(totals.ltv)],
        ].map(([l, v]) => (
          <div key={l} className="rounded-[22px] bg-surface-2 px-5 py-4">
            <p className="text-[13px] text-ink-3">{l}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-surface px-4 shadow-soft">
          <Search size={16} className="text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Buscar ${t.client}…`} className="h-full flex-1 bg-transparent outline-none placeholder:text-ink-3" />
        </label>
        <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Segmented
            id="cust-filter"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'Frecuente', label: 'Frecuentes' },
              { value: 'Nuevo', label: 'Nuevos' },
              { value: 'En riesgo', label: 'En riesgo' },
            ]}
          />
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <Empty icon={<UsersRound size={22} />} title="Sin resultados" />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((x, i) => (
            <motion.button
              key={x.customer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.3) }}
              whileHover={{ y: -2 }}
              onClick={() => setParams({ c: x.customer.id })}
              className="flex flex-col gap-4 rounded-[28px] bg-surface p-5 text-left shadow-soft transition-shadow hover:shadow-float"
            >
              <div className="flex items-center gap-3">
                <Avatar name={x.customer.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{x.customer.name}</p>
                  <p className="text-[13px] text-ink-3">
                    {x.visits} {x.visits === 1 ? t.appointment : t.appointments} · {moneyPlain(x.spent)} gastados
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                <div className="rounded-2xl bg-surface-2 px-3 py-2">
                  <p className="text-[11px] text-ink-3">Última visita</p>
                  <p className="font-medium">{x.last ? fmtShort(x.last.date) : '—'}</p>
                </div>
                <div className="rounded-2xl bg-surface-2 px-3 py-2">
                  <p className="text-[11px] text-ink-3">Próxima {t.appointment}</p>
                  <p className={cx('font-medium', x.next && 'text-accent-ink')}>{x.next ? fmtShort(x.next.date) : '—'}</p>
                </div>
              </div>
              <span className={cx('self-start rounded-full px-2.5 py-1 text-xs font-medium', STATUS_CLS[x.status])}>{statusLabel(x.status, t.client)}</span>
            </motion.button>
          ))}
        </div>
      )}

      <CustomerSheet summary={selected} onClose={() => setParams({})} />
    </div>
  )
}

function CustomerSheet({ summary, onClose }: { summary?: CustomerSummary; onClose: () => void }) {
  const { template, service, staff, updateCustomer, toast } = useStore()
  const { openNew, openAppointment } = useUI()
  const [tab, setTab] = useState<'info' | 'history' | 'notes'>('info')
  const [draft, setDraft] = useState<string | null>(null)
  const t = template.terms
  const c = summary?.customer

  return (
    <Sheet
      open={!!summary}
      onClose={() => {
        setTab('info')
        setDraft(null)
        onClose()
      }}
      variant="panel"
      width={460}
      title={c?.name}
      subtitle={summary && statusLabel(summary.status, t.client)}
    >
      {summary && c && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={c.name} size={64} />
            <div className="grid flex-1 grid-cols-3 gap-2 text-center">
              {[
                [String(summary.visits), cap(t.appointments)],
                [moneyPlain(summary.spent), 'Gastado'],
                [summary.last ? fmtShort(summary.last.date) : '—', 'Última'],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-surface-2 px-2 py-2.5">
                  <p className="truncate text-[15px] font-semibold tabular-nums">{v}</p>
                  <p className="text-[11px] text-ink-3">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="primary" onClick={() => { onClose(); openNew({ customerId: c.id }) }}>
              <CalendarPlus size={16} /> Agendar
            </Button>
            <Button variant="soft" onClick={() => toast({ title: 'WhatsApp abierto', body: `Chat con ${c.name}`, tone: 'whatsapp' })}>
              <MessageCircle size={16} /> WhatsApp
            </Button>
          </div>

          <Segmented
            id="cust-tab"
            value={tab}
            onChange={setTab}
            className="self-start"
            options={[
              { value: 'info', label: 'Información' },
              { value: 'history', label: `Historial (${summary.history.length})` },
              { value: 'notes', label: 'Notas' },
            ]}
          />

          {tab === 'info' && (
            <div className="flex flex-col divide-y divide-line">
              <InfoRow icon={Phone} label="WhatsApp" value={c.phone} />
              <InfoRow icon={Mail} label="Correo" value={c.email} />
              <InfoRow icon={CalendarPlus} label={`${cap(t.client)} desde`} value={fmtShort(c.createdAt)} />
              {summary.next && (
                <button onClick={() => openAppointment(summary.next!.id)} className="mt-3 rounded-3xl bg-accent-soft p-4 text-left">
                  <p className="text-xs text-accent-ink/80">Próxima {t.appointment}</p>
                  <p className="mt-0.5 font-semibold text-accent-ink">
                    {service(summary.next.serviceId)?.name} · {fmtShort(summary.next.date)}, {fmtTime(summary.next.start)}
                  </p>
                </button>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="flex flex-col gap-1">
              {summary.history.slice(0, 20).map((a) => (
                <button key={a.id} onClick={() => openAppointment(a.id)} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left hover:bg-surface-2">
                  <div className="w-14 shrink-0 text-[13px] font-medium tabular-nums">{fmtShort(a.date)}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{service(a.serviceId)?.name}</p>
                    <p className="truncate text-xs text-ink-3">con {staff(a.staffId)?.name}</p>
                  </div>
                  <span className="text-[13px] tabular-nums text-ink-2">{money(a.price)}</span>
                  <StatusBadge status={a.status} className="hidden sm:inline-flex" />
                </button>
              ))}
            </div>
          )}

          {tab === 'notes' && (
            <div className="flex flex-col gap-3">
              <Textarea
                value={draft ?? c.notes}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Preferencias, alergias, cumpleaños…"
                className="min-h-[140px]"
              />
              <Button
                variant="primary"
                disabled={draft === null || draft === c.notes}
                onClick={() => {
                  updateCustomer(c.id, { notes: draft ?? '' })
                  setDraft(null)
                  toast({ title: 'Notas guardadas', tone: 'ok' })
                }}
                className="self-end"
              >
                Guardar notas
              </Button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-ink-3">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-ink-3">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
