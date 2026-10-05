import { CalendarClock, CalendarDays, Clock, MessageCircle, Phone, Send, StickyNote, User, XCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { fmtLong, fmtTime } from '../../lib/date'
import { cap, cx, duration, money } from '../../lib/format'
import { AUTOMATIONS } from '../../lib/messages'
import { useStore } from '../../store/AppStore'
import { useUI } from '../../store/ui'
import { ChatBubble } from '../whatsapp/PhonePreview'
import { Avatar, Button, StatusBadge, Textarea } from '../ui/primitives'
import { Sheet } from '../ui/Sheet'

const SOURCE = { online: 'Reserva en línea', whatsapp: 'Vía WhatsApp', admin: 'Creada en el panel' }

export function AppointmentPanel({ id, onClose }: { id: string | null; onClose: () => void }) {
  const store = useStore()
  const { openReschedule } = useUI()
  const appt = store.data.appointments.find((a) => a.id === id)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const customer = appt && store.customer(appt.customerId)
  const service = appt && store.service(appt.serviceId)
  const staff = appt && store.staff(appt.staffId)
  const t = store.template.terms
  const live = appt && (appt.status === 'confirmed' || appt.status === 'pending')

  const close = () => {
    setConfirmCancel(false)
    onClose()
  }

  const Row = ({ icon: Icon, label, children }: { icon: typeof User; label: string; children: ReactNode }) => (
    <div className="flex items-start gap-3 py-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-3">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-ink-3">{label}</p>
        <div className="text-sm font-medium text-ink">{children}</div>
      </div>
    </div>
  )

  return (
    <Sheet
      open={!!appt}
      onClose={close}
      variant="panel"
      width={440}
      title={service?.name}
      subtitle={appt && `${fmtTime(appt.start)} – ${fmtTime(appt.start + appt.duration)} · ${duration(appt.duration)}`}
      footer={
        appt &&
        live && (
          <div className="flex flex-col gap-2">
            {confirmCancel ? (
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm text-ink-2">¿Cancelar y avisar por WhatsApp?</p>
                <Button variant="ghost" size="sm" onClick={() => setConfirmCancel(false)}>
                  No
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    store.updateAppointment(appt.id, { status: 'cancelled' })
                    store.sendWhatsApp(appt.id, 'manual', `Hola, tu ${t.appointment} de ${service?.name} del ${fmtLong(appt.date).toLowerCase()} fue cancelada. Si quieres reagendar, responde a este mensaje.`)
                    store.toast({ title: `${cap(t.appointment)} cancelada`, body: 'Se notificó por WhatsApp', tone: 'bad' })
                    setConfirmCancel(false)
                  }}
                >
                  Sí, cancelar
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="primary"
                  onClick={() => {
                    store.sendWhatsApp(appt.id, 'reminder24')
                    store.toast({ title: 'WhatsApp enviado', body: `Recordatorio para ${customer?.name}`, tone: 'whatsapp' })
                  }}
                >
                  <Send size={16} /> Enviar WhatsApp
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="soft"
                    onClick={() => {
                      close()
                      openReschedule(appt.id)
                    }}
                  >
                    <CalendarClock size={16} /> Reagendar
                  </Button>
                  <Button variant="danger" onClick={() => setConfirmCancel(true)}>
                    <XCircle size={16} /> Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        )
      }
    >
      {appt && customer && service && staff && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <StatusBadge status={appt.status} />
            <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-ink-2">{SOURCE[appt.source]}</span>
            <span className="ml-auto text-sm font-semibold tabular-nums">{money(appt.price)}</span>
          </div>

          <Link
            to={`/demo/customers?c=${customer.id}`}
            onClick={close}
            className="flex items-center gap-3 rounded-3xl bg-surface-2 p-3 transition hover:bg-surface-3"
          >
            <Avatar name={customer.name} size={44} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{customer.name}</p>
              <p className="flex items-center gap-1.5 text-ui text-ink-3">
                <Phone size={12} /> {customer.phone}
              </p>
            </div>
            <span className="text-xs text-ink-3">Ver ficha →</span>
          </Link>

          <div className="divide-y divide-line">
            <Row icon={User} label={cap(t.staff)}>
              <span className="flex items-center gap-2">
                <Avatar name={staff.name} tone={staff.tone} size={22} /> {staff.name}
              </span>
            </Row>
            <Row icon={CalendarDays} label="Fecha">
              {fmtLong(appt.date)}
            </Row>
            <Row icon={Clock} label="Hora">
              {fmtTime(appt.start)} – {fmtTime(appt.start + appt.duration)}
            </Row>
            <Row icon={StickyNote} label="Notas">
              <NotesEditor
                key={appt.id}
                value={appt.notes}
                onSave={(notes) => {
                  store.updateAppointment(appt.id, { notes })
                  store.toast({ title: 'Nota guardada', tone: 'ok' })
                }}
              />
            </Row>
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 text-ui font-semibold text-ink">
              <MessageCircle size={15} className="text-[#2b8a57]" /> WhatsApp
              <span className="font-normal text-ink-3">· {appt.messages.length} mensajes</span>
            </p>
            {appt.messages.length === 0 ? (
              <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-ink-3">Aún no se han enviado mensajes.</p>
            ) : (
              <div className="flex flex-col gap-2 rounded-3xl bg-[#efeae3] p-3 dark:bg-[#121317]">
                {appt.messages.map((m) => (
                  <ChatBubble
                    key={m.id}
                    m={{
                      id: m.id,
                      text: m.text,
                      from: 'business',
                      time: new Date(m.at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
                      label: m.kind === 'manual' ? 'Manual' : AUTOMATIONS.find((a) => a.id === m.kind)?.title,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}

function NotesEditor({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  if (!editing)
    return (
      <button onClick={() => setEditing(true)} className={cx('text-left', !value && 'font-normal text-ink-3')}>
        {value || 'Agregar nota…'}
      </button>
    )
  return (
    <div className="mt-1 flex flex-col gap-2">
      <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[72px]" />
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            onSave(draft)
            setEditing(false)
          }}
        >
          Guardar
        </Button>
      </div>
    </div>
  )
}
