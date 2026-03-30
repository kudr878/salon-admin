import { useEffect, useState } from 'react'
import { apiJson } from '../api/client'
import Modal from '../components/Modal'
import AppointmentSlotFields from '../components/AppointmentSlotFields'
import AppointmentsListModal from '../components/AppointmentsListModal'
import ClientSelectWithSearch from '../components/ClientSelectWithSearch'
import {
  dateHourToIsoLocal,
  parseAppointmentSlot,
  todayDateInputValue,
} from '../utils/salonCalendar'
import './Tables.css'

type Master = { id: number; fullName: string; categories: { id: number }[] }
type Client = { id: number; fullName: string }
type Service = { id: number; name: string; categoryId: number }
type Category = { id: number; name: string }
type Appointment = {
  id: number
  masterId: number
  clientId: number
  scheduledAt: string
  status: string
  priceToPay: unknown
  master: Master
  client: Client
  services: { id: number; name: string }[]
}

const statusRu: Record<string, string> = {
  ACTIVE: 'Активна',
  CANCELLED: 'Отменена',
  COMPLETED: 'Завершена',
}

function AppointmentModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: () => void
}) {
  const [masters, setMasters] = useState<Master[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [masterId, setMasterId] = useState('')
  const [clientId, setClientId] = useState('')
  const [dateStr, setDateStr] = useState(todayDateInputValue)
  const [hour, setHour] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [picked, setPicked] = useState<Record<number, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const categoryNum = categoryId ? Number(categoryId) : NaN
  const servicesInCategory = Number.isFinite(categoryNum)
    ? services.filter((s) => s.categoryId === categoryNum)
    : []
  const mastersInCategory = Number.isFinite(categoryNum)
    ? masters.filter((m) => m.categories.some((c) => c.id === categoryNum))
    : []

  useEffect(() => {
    let cancelled = false
    Promise.all([
      apiJson<Master[]>('/api/admin/masters'),
      apiJson<Client[]>('/api/admin/clients'),
      apiJson<Service[]>('/api/admin/services'),
      apiJson<Category[]>('/api/admin/categories'),
      apiJson<Appointment[]>('/api/admin/appointments'),
    ])
      .then(([m, c, s, cat, appt]) => {
        if (!cancelled) {
          setMasters(m)
          setClients(c)
          setServices(s)
          setCategories(cat.map((x) => ({ id: x.id, name: x.name })))
          setAppointments(appt)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function toggleService(id: number) {
    setPicked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setCategoryId(e.target.value)
    setPicked({})
    setMasterId('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!categoryId) {
      setError('Выберите категорию')
      return
    }
    const mids = Object.keys(picked)
      .filter((k) => picked[Number(k)])
      .map(Number)
    if (mids.length === 0) {
      setError('Выберите хотя бы одну услугу')
      return
    }
    if (mastersInCategory.length === 0) {
      setError('Нет мастеров в выбранной категории')
      return
    }
    if (!masterId) {
      setError('Выберите мастера')
      return
    }
    if (!clientId) {
      setError('Выберите клиента: введите ФИО и нажмите на строку в списке')
      return
    }
    if (!dateStr || hour === '') {
      setError('Выберите дату и свободный час')
      return
    }
    setLoading(true)
    try {
      await apiJson('/api/admin/appointments', {
        method: 'POST',
        body: JSON.stringify({
          masterId: Number(masterId),
          clientId: Number(clientId),
          scheduledAt: dateHourToIsoLocal(dateStr, Number(hour)),
          serviceIds: mids,
          status,
        }),
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Новая запись" onClose={onClose}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Категория
          <select value={categoryId} onChange={handleCategoryChange} required>
            <option value="">— Выберите категорию —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {categoryId && (
          <div className="form-services">
            <span className="form-services-heading">Услуги в категории</span>
            <div className="form-services-list">
              {servicesInCategory.length === 0 ? (
                <p className="form-hint">В этой категории пока нет услуг</p>
              ) : (
                servicesInCategory.map((s) => (
                  <label key={s.id} className="form-check">
                    <input
                      type="checkbox"
                      checked={!!picked[s.id]}
                      onChange={() => toggleService(s.id)}
                    />
                    {s.name}
                  </label>
                ))
              )}
            </div>
          </div>
        )}
        <label>
          Мастер
          <select
            value={masterId}
            onChange={(e) => setMasterId(e.target.value)}
            required={mastersInCategory.length > 0}
            disabled={!categoryId || mastersInCategory.length === 0}
          >
            <option value="">
              {!categoryId
                ? '— Сначала выберите категорию —'
                : mastersInCategory.length === 0
                  ? '— Нет мастеров —'
                  : '— Выберите мастера —'}
            </option>
            {mastersInCategory.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </label>
        <ClientSelectWithSearch
          clients={clients}
          clientId={clientId}
          setClientId={setClientId}
        />
        <AppointmentSlotFields
          dateStr={dateStr}
          setDateStr={setDateStr}
          hour={hour}
          setHour={setHour}
          masterId={masterId}
          appointments={appointments}
        />
        <label>
          Статус
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">Активна</option>
            <option value="CANCELLED">Отменена</option>
            <option value="COMPLETED">Завершена</option>
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="form-submit" disabled={loading}>
          {loading ? 'Сохранение…' : 'Создать запись'}
        </button>
      </form>
    </Modal>
  )
}

function EditAppointmentModal({
  appointment,
  onClose,
  onSaved,
}: {
  appointment: Appointment
  onClose: () => void
  onSaved: () => void
}) {
  const [masters, setMasters] = useState<Master[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [masterId, setMasterId] = useState('')
  const [clientId, setClientId] = useState('')
  const [dateStr, setDateStr] = useState('')
  const [hour, setHour] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [picked, setPicked] = useState<Record<number, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [formReady, setFormReady] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])

  const categoryNum = categoryId ? Number(categoryId) : NaN
  const servicesInCategory = Number.isFinite(categoryNum)
    ? services.filter((s) => s.categoryId === categoryNum)
    : []
  const mastersInCategory = Number.isFinite(categoryNum)
    ? masters.filter((m) => m.categories.some((c) => c.id === categoryNum))
    : []

  useEffect(() => {
    let cancelled = false
    Promise.all([
      apiJson<Master[]>('/api/admin/masters'),
      apiJson<Client[]>('/api/admin/clients'),
      apiJson<Service[]>('/api/admin/services'),
      apiJson<Category[]>('/api/admin/categories'),
      apiJson<Appointment[]>('/api/admin/appointments'),
    ])
      .then(([m, c, s, cat, appt]) => {
        if (!cancelled) {
          setMasters(m)
          setClients(c)
          setServices(s)
          setCategories(cat.map((x) => ({ id: x.id, name: x.name })))
          setAppointments(appt)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (services.length === 0) {
      setFormReady(false)
      return
    }
    const slot = parseAppointmentSlot(appointment.scheduledAt)
    if (appointment.services.length === 0) {
      setCategoryId('')
      setPicked({})
      setMasterId(String(appointment.masterId))
      setClientId(String(appointment.clientId))
      setDateStr(slot.dateStr)
      setHour(slot.hour)
      setStatus(appointment.status)
      setFormReady(true)
      setError(null)
      return
    }
    const pickedInit: Record<number, boolean> = {}
    for (const s of appointment.services) {
      pickedInit[s.id] = true
    }
    setPicked(pickedInit)
    const first = appointment.services[0]
    const svc = services.find((x) => x.id === first.id)
    if (svc) {
      setCategoryId(String(svc.categoryId))
    } else {
      setCategoryId('')
    }
    setMasterId(String(appointment.masterId))
    setClientId(String(appointment.clientId))
    setDateStr(slot.dateStr)
    setHour(slot.hour)
    setStatus(appointment.status)
    setFormReady(true)
    setError(null)
  }, [appointment, services])

  function toggleService(id: number) {
    setPicked((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setCategoryId(e.target.value)
    setPicked({})
    setMasterId('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!categoryId) {
      setError('Выберите категорию')
      return
    }
    const mids = Object.keys(picked)
      .filter((k) => picked[Number(k)])
      .map(Number)
    if (mids.length === 0) {
      setError('Выберите хотя бы одну услугу')
      return
    }
    if (mastersInCategory.length === 0) {
      setError('Нет мастеров в выбранной категории')
      return
    }
    if (!masterId) {
      setError('Выберите мастера')
      return
    }
    if (!clientId) {
      setError('Выберите клиента: введите ФИО и нажмите на строку в списке')
      return
    }
    if (!dateStr || hour === '') {
      setError('Выберите дату и свободный час')
      return
    }
    setLoading(true)
    try {
      await apiJson(`/api/admin/appointments/${appointment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          masterId: Number(masterId),
          clientId: Number(clientId),
          scheduledAt: dateHourToIsoLocal(dateStr, Number(hour)),
          serviceIds: mids,
          status,
        }),
      })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Редактирование записи" onClose={onClose} preventClose={loading}>
      {!formReady ? (
        <p className="form-hint">Загрузка…</p>
      ) : (
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Категория
            <select value={categoryId} onChange={handleCategoryChange} required>
              <option value="">— Выберите категорию —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          {categoryId && (
            <div className="form-services">
              <span className="form-services-heading">Услуги в категории</span>
              <div className="form-services-list">
                {servicesInCategory.length === 0 ? (
                  <p className="form-hint">В этой категории пока нет услуг</p>
                ) : (
                  servicesInCategory.map((s) => (
                    <label key={s.id} className="form-check">
                      <input
                        type="checkbox"
                        checked={!!picked[s.id]}
                        onChange={() => toggleService(s.id)}
                      />
                      {s.name}
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
          <label>
            Мастер
            <select
              value={masterId}
              onChange={(e) => setMasterId(e.target.value)}
              required={mastersInCategory.length > 0}
              disabled={!categoryId || mastersInCategory.length === 0}
            >
              <option value="">
                {!categoryId
                  ? '— Сначала выберите категорию —'
                  : mastersInCategory.length === 0
                    ? '— Нет мастеров —'
                    : '— Выберите мастера —'}
              </option>
              {mastersInCategory.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </label>
          <ClientSelectWithSearch
            clients={clients}
            clientId={clientId}
            setClientId={setClientId}
          />
          <AppointmentSlotFields
            dateStr={dateStr}
            setDateStr={setDateStr}
            hour={hour}
            setHour={setHour}
            masterId={masterId}
            appointments={appointments}
            excludeAppointmentId={appointment.id}
          />
          <label>
            Статус
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">Активна</option>
              <option value="CANCELLED">Отменена</option>
              <option value="COMPLETED">Завершена</option>
            </select>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="form-submit" disabled={loading}>
            {loading ? 'Сохранение…' : 'Сохранить'}
          </button>
        </form>
      )}
    </Modal>
  )
}

export default function AppointmentsPage() {
  const [rows, setRows] = useState<Appointment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Appointment | null>(null)
  const [masterListModal, setMasterListModal] = useState<{
    id: number
    name: string
  } | null>(null)
  const [clientListModal, setClientListModal] = useState<{
    id: number
    name: string
  } | null>(null)

  function load() {
    setError(null)
    apiJson<Appointment[]>('/api/admin/appointments')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(a: Appointment) {
    if (!confirm(`Удалить запись №${a.id}?`)) {
      return
    }
    setError(null)
    try {
      await apiJson(`/api/admin/appointments/${a.id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Записи на приём</h2>
        <button type="button" className="btn-primary" onClick={() => setModal(true)}>
          Новая запись
        </button>
      </div>
      {error && <p className="page-error">{error}</p>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Мастер</th>
              <th>Клиент</th>
              <th>Услуги</th>
              <th>Дата и время</th>
              <th>Статус</th>
              <th>Сумма</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>
                  <button
                    type="button"
                    className="btn-link-name"
                    onClick={() =>
                      setMasterListModal({ id: a.masterId, name: a.master.fullName })
                    }
                  >
                    {a.master.fullName}
                  </button>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-link-name"
                    onClick={() =>
                      setClientListModal({ id: a.clientId, name: a.client.fullName })
                    }
                  >
                    {a.client.fullName}
                  </button>
                </td>
                <td>{a.services.map((s) => s.name).join(', ')}</td>
                <td>{new Date(a.scheduledAt).toLocaleString('ru-RU')}</td>
                <td>{statusRu[a.status] || a.status}</td>
                <td>{String(a.priceToPay)}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="btn-table" onClick={() => setEditing(a)}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn-table btn-table--danger"
                      onClick={() => handleDelete(a)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <AppointmentModal
          onClose={() => setModal(false)}
          onSaved={() => load()}
        />
      )}
      {editing && (
        <EditAppointmentModal
          appointment={editing}
          onClose={() => setEditing(null)}
          onSaved={() => load()}
        />
      )}
      {masterListModal && (
        <AppointmentsListModal
          key={`appt-master-${masterListModal.id}`}
          title={`Записи мастера: ${masterListModal.name}`}
          onClose={() => setMasterListModal(null)}
          mode="byMaster"
          rows={rows.filter((r) => r.masterId === masterListModal.id)}
        />
      )}
      {clientListModal && (
        <AppointmentsListModal
          key={`appt-client-${clientListModal.id}`}
          title={`Записи клиента: ${clientListModal.name}`}
          onClose={() => setClientListModal(null)}
          mode="byClient"
          rows={rows.filter((r) => r.clientId === clientListModal.id)}
        />
      )}
    </div>
  )
}
