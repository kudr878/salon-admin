import { useMemo, useState } from 'react'
import Modal from './Modal'

export type AppointmentListItem = {
  id: number
  masterId: number
  clientId: number
  scheduledAt: string
  status: string
  priceToPay: unknown
  master: { fullName: string }
  client: { fullName: string }
  services: { name: string }[]
}

const statusRu: Record<string, string> = {
  ACTIVE: 'Активна',
  CANCELLED: 'Отменена',
  COMPLETED: 'Завершена',
}

type TabId = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

function tabForStatus(status: string): TabId {
  if (status === 'COMPLETED') {
    return 'COMPLETED'
  }
  if (status === 'CANCELLED') {
    return 'CANCELLED'
  }
  return 'ACTIVE'
}

type AppointmentsListModalProps = {
  title: string
  onClose: () => void
  rows: AppointmentListItem[]
  mode: 'byMaster' | 'byClient'
}

export default function AppointmentsListModal({
  title,
  onClose,
  rows,
  mode,
}: AppointmentsListModalProps) {
  const [tab, setTab] = useState<TabId>('ACTIVE')

  const sorted = useMemo(
    () =>
      [...rows].sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      ),
    [rows],
  )

  const counts = useMemo(() => {
    let active = 0
    let completed = 0
    let cancelled = 0
    for (const a of sorted) {
      const t = tabForStatus(a.status)
      if (t === 'COMPLETED') {
        completed += 1
      } else if (t === 'CANCELLED') {
        cancelled += 1
      } else {
        active += 1
      }
    }
    return { active, completed, cancelled }
  }, [sorted])

  const filtered = useMemo(
    () => sorted.filter((a) => tabForStatus(a.status) === tab),
    [sorted, tab],
  )

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'ACTIVE', label: 'Активные', count: counts.active },
    { id: 'COMPLETED', label: 'Завершённые', count: counts.completed },
    { id: 'CANCELLED', label: 'Отменённые', count: counts.cancelled },
  ]

  return (
    <Modal title={title} onClose={onClose} boxClassName="modal-box--wide">
      {sorted.length === 0 ? (
        <p className="form-hint">Записей нет.</p>
      ) : (
        <>
          <div className="appt-modal-tabs" role="tablist" aria-label="Статус записей">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={
                  tab === t.id ? 'appt-modal-tab appt-modal-tab--active' : 'appt-modal-tab'
                }
                onClick={() => setTab(t.id)}
              >
                {t.label} ({t.count})
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="form-hint">В этом разделе записей нет.</p>
          ) : (
            <div className="table-wrap modal-appointments-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    {mode === 'byClient' && <th>Мастер</th>}
                    {mode === 'byMaster' && <th>Клиент</th>}
                    <th>Услуги</th>
                    <th>Дата и время</th>
                    <th>Статус</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id}>
                      <td>{a.id}</td>
                      {mode === 'byClient' && <td>{a.master.fullName}</td>}
                      {mode === 'byMaster' && <td>{a.client.fullName}</td>}
                      <td>{a.services.map((s) => s.name).join(', ')}</td>
                      <td>{new Date(a.scheduledAt).toLocaleString('ru-RU')}</td>
                      <td>{statusRu[a.status] || a.status}</td>
                      <td>{String(a.priceToPay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
