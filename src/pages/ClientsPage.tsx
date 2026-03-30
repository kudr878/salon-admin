import { useEffect, useMemo, useState } from 'react'
import { apiJson } from '../api/client'
import Modal from '../components/Modal'
import AppointmentsListModal, {
  type AppointmentListItem,
} from '../components/AppointmentsListModal'
import { formatDateRu, isoToDateInput } from '../utils/dateInput'
import { clientMatchesNameQuery } from '../utils/clientSearch'
import './Tables.css'

type Client = {
  id: number
  fullName: string
  birthDate: string
  gender: string
  phone: string
  email: string
  bonusCard: string
}

function ClientModal({
  onClose,
  onSaved,
  editing,
}: {
  onClose: () => void
  onSaved: () => void
  editing: Client | null
}) {
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('F')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [bonusCard, setBonusCard] = useState('NONE')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setFullName(editing.fullName)
      setBirthDate(isoToDateInput(editing.birthDate))
      setGender(editing.gender)
      setPhone(editing.phone)
      setEmail(editing.email)
      setBonusCard(editing.bonusCard)
    } else {
      setFullName('')
      setBirthDate('')
      setGender('F')
      setPhone('')
      setEmail('')
      setBonusCard('NONE')
    }
    setError(null)
  }, [editing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const body = {
      fullName,
      birthDate: new Date(birthDate).toISOString(),
      gender,
      phone,
      email,
      bonusCard,
    }
    try {
      if (editing) {
        await apiJson(`/api/admin/clients/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        await apiJson('/api/admin/clients', {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={editing ? 'Редактирование клиента' : 'Новый клиент'}
      onClose={onClose}
      preventClose={loading}
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          ФИО
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Дата рождения
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
          />
        </label>
        <label>
          Пол
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="F">Ж</option>
            <option value="M">М</option>
          </select>
        </label>
        <label>
          Телефон
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Бонусная карта
          <select value={bonusCard} onChange={(e) => setBonusCard(e.target.value)}>
            <option value="NONE">Нет</option>
            <option value="REGULAR">Regular</option>
            <option value="GOLD">Gold</option>
            <option value="PLATINUM">Platinum</option>
          </select>
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="form-submit" disabled={loading}>
          {loading ? 'Сохранение…' : editing ? 'Сохранить' : 'Добавить'}
        </button>
      </form>
    </Modal>
  )
}

export default function ClientsPage() {
  const [rows, setRows] = useState<Client[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalEditing, setModalEditing] = useState<Client | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [apptModal, setApptModal] = useState<{ clientId: number; name: string } | null>(
    null,
  )
  const [apptRows, setApptRows] = useState<AppointmentListItem[]>([])
  const [nameSearch, setNameSearch] = useState('')

  const filteredRows = useMemo(
    () => rows.filter((c) => clientMatchesNameQuery(c.fullName, nameSearch)),
    [rows, nameSearch],
  )

  function load() {
    setError(null)
    apiJson<Client[]>('/api/admin/clients')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (!apptModal) {
      setApptRows([])
      return
    }
    let cancelled = false
    setApptRows([])
    apiJson<AppointmentListItem[]>('/api/admin/appointments')
      .then((list) => {
        if (!cancelled) {
          setApptRows(list.filter((a) => a.clientId === apptModal.clientId))
        }
      })
      .catch(() => {
        if (!cancelled) {
          setApptRows([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [apptModal])

  async function handleDelete(c: Client) {
    if (!confirm(`Удалить клиента «${c.fullName}»?`)) {
      return
    }
    setError(null)
    try {
      await apiJson(`/api/admin/clients/${c.id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  function openCreate() {
    setModalEditing(null)
    setModalOpen(true)
  }

  function openEdit(c: Client) {
    setModalEditing(c)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setModalEditing(null)
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Клиенты</h2>
        <button type="button" className="btn-primary" onClick={openCreate}>
          Новый клиент
        </button>
      </div>
      <div className="page-filter">
        <label>
          Поиск по имени (ФИО)
          <input
            type="search"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="Фамилия, имя или часть ФИО"
            autoComplete="off"
          />
        </label>
      </div>
      {error && <p className="page-error">{error}</p>}
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ФИО</th>
              <th>Дата рождения</th>
              <th>Телефон</th>
              <th>Email</th>
              <th>Пол</th>
              <th>Карта</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty-msg">
                  {rows.length === 0
                    ? 'Клиентов пока нет.'
                    : 'Никого не найдено — измените запрос.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>
                  <button
                    type="button"
                    className="btn-link-name"
                    onClick={() => setApptModal({ clientId: c.id, name: c.fullName })}
                  >
                    {c.fullName}
                  </button>
                </td>
                <td>{formatDateRu(c.birthDate)}</td>
                <td>{c.phone}</td>
                <td>{c.email}</td>
                <td>{c.gender === 'M' ? 'М' : 'Ж'}</td>
                <td>{c.bonusCard}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="btn-table" onClick={() => openEdit(c)}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn-table btn-table--danger"
                      onClick={() => handleDelete(c)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <ClientModal
          editing={modalEditing}
          onClose={closeModal}
          onSaved={() => load()}
        />
      )}
      {apptModal && (
        <AppointmentsListModal
          key={`appt-client-${apptModal.clientId}`}
          title={`Записи клиента: ${apptModal.name}`}
          onClose={() => setApptModal(null)}
          mode="byClient"
          rows={apptRows}
        />
      )}
    </div>
  )
}
