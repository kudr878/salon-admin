import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { clientMatchesNameQuery } from '../utils/clientSearch'

type Client = { id: number; fullName: string }

type ClientSelectWithSearchProps = {
  clients: Client[]
  clientId: string
  setClientId: (v: string) => void
  disabled?: boolean
}

export default function ClientSelectWithSearch({
  clients,
  clientId,
  setClientId,
  disabled,
}: ClientSelectWithSearchProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const clientIdRef = useRef(clientId)
  clientIdRef.current = clientId
  const clientsRef = useRef(clients)
  clientsRef.current = clients

  const selected = useMemo(
    () => clients.find((c) => String(c.id) === clientId),
    [clients, clientId],
  )

  useEffect(() => {
    if (!open) {
      setText(selected?.fullName ?? '')
    }
  }, [selected?.fullName, selected?.id, open])

  const filtered = useMemo(() => {
    const q = text.trim()
    if (!q) {
      return clients
    }
    return clients.filter((c) => clientMatchesNameQuery(c.fullName, text))
  }, [clients, text])

  useEffect(() => {
    if (!open || disabled) {
      return
    }
    function onDocDown(e: MouseEvent | TouchEvent) {
      const node = e.target as Node
      if (wrapRef.current?.contains(node)) {
        return
      }
      setOpen(false)
      const id = clientIdRef.current
      const list = clientsRef.current
      if (id) {
        const s = list.find((c) => String(c.id) === id)
        setText(s?.fullName ?? '')
      } else {
        setText('')
      }
    }
    document.addEventListener('mousedown', onDocDown)
    document.addEventListener('touchstart', onDocDown, { passive: true })
    return () => {
      document.removeEventListener('mousedown', onDocDown)
      document.removeEventListener('touchstart', onDocDown)
    }
  }, [open, disabled])

  function pick(c: Client) {
    setClientId(String(c.id))
    setText(c.fullName)
    setOpen(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setText(v)
    setOpen(true)
    if (!v.trim()) {
      setClientId('')
      return
    }
    if (selected && v !== selected.fullName) {
      setClientId('')
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    if (disabled) {
      return
    }
    setOpen(true)
    if (selected) {
      e.target.select()
    }
  }

  return (
    <div className="form-client-combo" ref={wrapRef}>
      <label>
        Клиент
        <input
          type="text"
          value={text}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="Введите ФИО и выберите из списка"
          disabled={disabled}
          autoComplete="off"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listId}
        />
      </label>
      {open && !disabled && (
        <ul className="form-client-combo-list" id={listId} role="listbox">
          {filtered.length === 0 ? (
            <li className="form-client-combo-empty">Нет совпадений</li>
          ) : (
            filtered.slice(0, 80).map((c) => (
              <li key={c.id} role="presentation">
                <button
                  type="button"
                  className="form-client-combo-item"
                  role="option"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(c)
                  }}
                >
                  {c.fullName}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
