import type { AdminRole } from '../api/auth'
import './Sidebar.css'

export type AdminTab =
  | 'appointments'
  | 'clients'
  | 'masters'
  | 'services'
  | 'reports'

type SidebarProps = {
  active: AdminTab
  onSelect: (tab: AdminTab) => void
  role: AdminRole | null
}

const items: { id: AdminTab; label: string }[] = [
  { id: 'appointments', label: 'Записи на приём' },
  { id: 'clients', label: 'Клиенты' },
  { id: 'masters', label: 'Мастера' },
  { id: 'services', label: 'Услуги' },
  { id: 'reports', label: 'Отчёты' },
]

export default function Sidebar({ active, onSelect, role }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Разделы админки">
      <div className="sidebar-brand">Салон</div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              item.id === active ? 'sidebar-link sidebar-link--active' : 'sidebar-link'
            }
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {role && (
        <p className="sidebar-role">
          {role === 'DIRECTOR' ? 'Директор' : 'Администратор'}
        </p>
      )}
    </aside>
  )
}
