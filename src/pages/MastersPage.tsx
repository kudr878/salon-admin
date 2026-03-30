import { useEffect, useState } from 'react'
import { apiJson } from '../api/client'
import Modal from '../components/Modal'
import AppointmentsListModal, {
  type AppointmentListItem,
} from '../components/AppointmentsListModal'
import { formatDateRu, isoToDateInput, isoToDatetimeLocal } from '../utils/dateInput'
import './Tables.css'

type Cat = { id: number; name: string }
type Master = {
  id: number
  fullName: string
  birthDate: string
  phone: string
  gender: string
  hiredAt: string
  leftAt: string | null
  photoId: string | null
  categories: Cat[]
}

function MasterModal({
  onClose,
  onSaved,
  editing,
}: {
  onClose: () => void
  onSaved: () => void
  editing: Master | null
}) {
  const [categories, setCategories] = useState<Cat[]>([])
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('F')
  const [phone, setPhone] = useState('')
  const [hiredAt, setHiredAt] = useState('')
  const [leftAt, setLeftAt] = useState('')
  const [photoId, setPhotoId] = useState('')
  const [picked, setPicked] = useState<Record<number, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiJson<Cat[]>('/api/admin/categories')
      .then((list) => setCategories(list.map((c) => ({ id: c.id, name: c.name }))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (editing) {
      setFullName(editing.fullName)
      setBirthDate(isoToDateInput(editing.birthDate))
      setGender(editing.gender)
      setPhone(editing.phone)
      setHiredAt(isoToDatetimeLocal(editing.hiredAt))
      setLeftAt(editing.leftAt ? isoToDatetimeLocal(editing.leftAt) : '')
      setPhotoId(editing.photoId || '')
    } else {
      setFullName('')
      setBirthDate('')
      setGender('F')
      setPhone('')
      setHiredAt('')
      setLeftAt('')
      setPhotoId('')
    }
    setError(null)
  }, [editing])

  useEffect(() => {
    if (!editing || categories.length === 0) {
      if (!editing) {
        setPicked({})
      }
      return
    }
    const next: Record<number, boolean> = {}
    for (const c of editing.categories) {
      next[c.id] = true
    }
    setPicked(next)
  }, [editing, categories])

  function toggleCat(id: number) {
    setPicked((p) => ({ ...p, [id]: !p[id] }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const categoryIds = Object.keys(picked)
      .filter((k) => picked[Number(k)])
      .map(Number)
    if (categoryIds.length === 0) {
      setError('Выберите хотя бы одну категорию')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        fullName,
        birthDate: new Date(birthDate).toISOString(),
        gender,
        phone,
        hiredAt: new Date(hiredAt).toISOString(),
        categoryIds,
      }
      if (editing) {
        body.leftAt = leftAt.trim() ? new Date(leftAt).toISOString() : null
        body.photoId = photoId.trim() ? photoId.trim() : null
      } else if (photoId.trim()) {
        body.photoId = photoId.trim()
      }
      if (editing) {
        await apiJson(`/api/admin/masters/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        await apiJson('/api/admin/masters', {
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
      title={editing ? 'Редактирование мастера' : 'Новый мастер'}
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
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
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
          Принят на работу
          <input type="datetime-local" value={hiredAt} onChange={(e) => setHiredAt(e.target.value)} required />
        </label>
        {editing && (
          <label>
            Окончание работы (оставьте пустым, если работает)
            <input type="datetime-local" value={leftAt} onChange={(e) => setLeftAt(e.target.value)} />
          </label>
        )}
        <label>
          Код фото (001, 002…)
          <input value={photoId} onChange={(e) => setPhotoId(e.target.value)} placeholder="необязательно" />
        </label>
        <div className="form-services">
          <span className="form-services-heading">Категории</span>
          <div className="form-services-list">
            {categories.map((c) => (
              <label key={c.id} className="form-check">
                <input
                  type="checkbox"
                  checked={!!picked[c.id]}
                  onChange={() => toggleCat(c.id)}
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="form-submit" disabled={loading}>
          {loading ? 'Сохранение…' : editing ? 'Сохранить' : 'Добавить'}
        </button>
      </form>
    </Modal>
  )
}

export default function MastersPage() {
  const [rows, setRows] = useState<Master[]>([])
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalEditing, setModalEditing] = useState<Master | null>(null)
  const [apptModal, setApptModal] = useState<{ masterId: number; name: string } | null>(
    null,
  )
  const [apptRows, setApptRows] = useState<AppointmentListItem[]>([])

  function load() {
    setError(null)
    apiJson<Master[]>('/api/admin/masters')
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
          setApptRows(list.filter((a) => a.masterId === apptModal.masterId))
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

  async function handleDelete(m: Master) {
    if (!confirm(`Удалить мастера «${m.fullName}»?`)) {
      return
    }
    setError(null)
    try {
      await apiJson(`/api/admin/masters/${m.id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  function openCreate() {
    setModalEditing(null)
    setModalOpen(true)
  }

  function openEdit(m: Master) {
    setModalEditing(m)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setModalEditing(null)
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Мастера</h2>
        <button type="button" className="btn-primary" onClick={openCreate}>
          Новый мастер
        </button>
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
              <th>Фото</th>
              <th>Начало работы</th>
              <th>Окончание работы</th>
              <th>Категории</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td>
                  <button
                    type="button"
                    className="btn-link-name"
                    onClick={() => setApptModal({ masterId: m.id, name: m.fullName })}
                  >
                    {m.fullName}
                  </button>
                </td>
                <td>{formatDateRu(m.birthDate)}</td>
                <td>{m.phone}</td>
                <td>{m.photoId || '—'}</td>
                <td>{new Date(m.hiredAt).toLocaleString('ru-RU')}</td>
                <td>{m.leftAt ? new Date(m.leftAt).toLocaleString('ru-RU') : '—'}</td>
                <td>{m.categories.map((c) => c.name).join(', ')}</td>
                <td>
                  <div className="table-actions">
                    <button type="button" className="btn-table" onClick={() => openEdit(m)}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn-table btn-table--danger"
                      onClick={() => handleDelete(m)}
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
      {modalOpen && (
        <MasterModal editing={modalEditing} onClose={closeModal} onSaved={() => load()} />
      )}
      {apptModal && (
        <AppointmentsListModal
          key={`appt-master-${apptModal.masterId}`}
          title={`Записи мастера: ${apptModal.name}`}
          onClose={() => setApptModal(null)}
          mode="byMaster"
          rows={apptRows}
        />
      )}
    </div>
  )
}
