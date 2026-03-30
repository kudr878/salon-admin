import { useEffect, useState } from 'react'
import { apiJson } from '../api/client'
import Modal from '../components/Modal'
import './Tables.css'

type Service = { id: number; name: string; price: unknown; categoryId: number }
type Category = { id: number; name: string; services: Service[] }

function CategoryModal({
  onClose,
  onSaved,
  editing,
}: {
  onClose: () => void
  onSaved: () => void
  editing: Category | null
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setName(editing ? editing.name : '')
    setError(null)
  }, [editing])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (editing) {
        await apiJson(`/api/admin/categories/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name }),
        })
      } else {
        await apiJson('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify({ name }),
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
      title={editing ? 'Редактирование категории' : 'Новая категория'}
      onClose={onClose}
      preventClose={loading}
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Название
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="form-submit" disabled={loading}>
          {loading ? 'Сохранение…' : editing ? 'Сохранить' : 'Создать'}
        </button>
      </form>
    </Modal>
  )
}

function ServiceModal({
  categoryId,
  categoryName,
  categories,
  editing,
  onClose,
  onSaved,
}: {
  categoryId: number
  categoryName: string
  categories: { id: number; name: string }[]
  editing: Service | null
  onClose: () => void
  onSaved: () => void
}) {
  const [catId, setCatId] = useState(categoryId)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setCatId(editing.categoryId)
      setName(editing.name)
      setPrice(String(editing.price))
    } else {
      setCatId(categoryId)
      setName('')
      setPrice('')
    }
    setError(null)
  }, [editing, categoryId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const body = {
        categoryId: catId,
        name,
        price: Number(price),
      }
      if (editing) {
        await apiJson(`/api/admin/services/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
      } else {
        await apiJson('/api/admin/services', {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Ошибка'
      if (msg === 'Failed to fetch') {
        msg =
          'Нет ответа от сервера. Проверьте, что API запущен (порт 3000), и перезагрузите страницу.'
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const title = editing
    ? `Редактирование услуги`
    : `Новая услуга: ${categoryName}`

  return (
    <Modal title={title} onClose={onClose} preventClose={loading}>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Категория
          <select value={catId} onChange={(e) => setCatId(Number(e.target.value))} required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Наименование
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Цена (₽)
          <input
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="form-submit" disabled={loading}>
          {loading ? 'Сохранение…' : editing ? 'Сохранить' : 'Добавить'}
        </button>
      </form>
    </Modal>
  )
}

export default function ServicesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [catEditing, setCatEditing] = useState<Category | null>(null)
  const [svcModal, setSvcModal] = useState<{
    categoryId: number
    categoryName: string
    editing: Service | null
  } | null>(null)

  function load() {
    setError(null)
    apiJson<Category[]>('/api/admin/categories')
      .then(setCategories)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
  }

  useEffect(() => {
    load()
  }, [])

  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name }))

  async function deleteCategory(cat: Category) {
    if (
      !confirm(
        `Удалить категорию «${cat.name}»? (если есть услуги или мастера — удаление не пройдёт)`,
      )
    ) {
      return
    }
    setError(null)
    try {
      await apiJson(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  async function deleteService(s: Service, categoryName: string) {
    if (!confirm(`Удалить услугу «${s.name}» (${categoryName})?`)) {
      return
    }
    setError(null)
    try {
      await apiJson(`/api/admin/services/${s.id}`, { method: 'DELETE' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления')
    }
  }

  function openCreateCategory() {
    setCatEditing(null)
    setCatModalOpen(true)
  }

  function openEditCategory(cat: Category) {
    setCatEditing(cat)
    setCatModalOpen(true)
  }

  function closeCategoryModal() {
    setCatModalOpen(false)
    setCatEditing(null)
  }

  return (
    <div className="page">
      <div className="page-head">
        <h2 className="page-title">Услуги по категориям</h2>
        <button type="button" className="btn-primary" onClick={openCreateCategory}>
          Новая категория
        </button>
      </div>
      {error && <p className="page-error">{error}</p>}
      <div className="services-cols">
        {categories.map((cat) => (
          <div key={cat.id} className="services-cat">
            <div className="services-cat-head">
              <h3 className="services-cat-title">{cat.name}</h3>
              <div className="table-actions">
                <button type="button" className="btn-table" onClick={() => openEditCategory(cat)}>
                  Изменить
                </button>
                <button
                  type="button"
                  className="btn-table btn-table--danger"
                  onClick={() => deleteCategory(cat)}
                >
                  Удалить
                </button>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary"
              style={{ marginBottom: '0.5rem' }}
              onClick={() =>
                setSvcModal({ categoryId: cat.id, categoryName: cat.name, editing: null })
              }
            >
              + Услуга
            </button>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Услуга</th>
                    <th>Цена</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cat.services.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{String(s.price)}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-table"
                            onClick={() =>
                              setSvcModal({
                                categoryId: cat.id,
                                categoryName: cat.name,
                                editing: s,
                              })
                            }
                          >
                            Изменить
                          </button>
                          <button
                            type="button"
                            className="btn-table btn-table--danger"
                            onClick={() => deleteService(s, cat.name)}
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
          </div>
        ))}
      </div>
      {catModalOpen && (
        <CategoryModal
          editing={catEditing}
          onClose={closeCategoryModal}
          onSaved={() => load()}
        />
      )}
      {svcModal && (
        <ServiceModal
          key={svcModal.editing ? svcModal.editing.id : `new-${svcModal.categoryId}`}
          categoryId={svcModal.categoryId}
          categoryName={svcModal.categoryName}
          categories={categoryOptions}
          editing={svcModal.editing}
          onClose={() => setSvcModal(null)}
          onSaved={() => load()}
        />
      )}
    </div>
  )
}
