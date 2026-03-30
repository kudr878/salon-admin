import { useEffect, useState } from 'react'
import {
  clearStoredToken,
  getStoredToken,
  meRequest,
  type AdminRole,
} from './api/auth'
import LoginForm from './components/LoginForm'
import Sidebar, { type AdminTab } from './components/Sidebar'
import AppointmentsPage from './pages/AppointmentsPage'
import ClientsPage from './pages/ClientsPage'
import MastersPage from './pages/MastersPage'
import ServicesPage from './pages/ServicesPage'
import ReportsPage from './pages/ReportsPage'
import './App.css'

export default function App() {
  const [sessionOk, setSessionOk] = useState(false)
  const [ready, setReady] = useState(false)
  const [role, setRole] = useState<AdminRole | null>(null)
  const [tab, setTab] = useState<AdminTab>('appointments')

  useEffect(() => {
    let cancelled = false

    async function check() {
      const token = getStoredToken()
      if (!token) {
        if (!cancelled) {
          setSessionOk(false)
          setRole(null)
          setReady(true)
        }
        return
      }
      const me = await meRequest(token)
      if (cancelled) {
        return
      }
      if (me.ok && me.role) {
        setSessionOk(true)
        setRole(me.role)
      } else {
        clearStoredToken()
        setSessionOk(false)
        setRole(null)
      }
      setReady(true)
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  function handleLogout() {
    clearStoredToken()
    setSessionOk(false)
    setRole(null)
  }

  function handleLoggedIn(r: AdminRole) {
    setSessionOk(true)
    setRole(r)
  }

  if (!ready) {
    return (
      <div className="admin-app admin-app--center">
        <p className="admin-loading">Проверка сессии…</p>
      </div>
    )
  }

  if (!sessionOk) {
    return (
      <div className="admin-app admin-app--center">
        <LoginForm onLoggedIn={handleLoggedIn} />
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <Sidebar active={tab} onSelect={setTab} role={role} />
      <div className="admin-content">
        <header className="admin-topbar">
          <span className="admin-topbar-title">Админ-панель салона</span>
          <button type="button" className="admin-logout" onClick={handleLogout}>
            Выйти
          </button>
        </header>
        <main className="admin-main-pad">
          {tab === 'appointments' && <AppointmentsPage />}
          {tab === 'clients' && <ClientsPage />}
          {tab === 'masters' && <MastersPage />}
          {tab === 'services' && <ServicesPage />}
          {tab === 'reports' && <ReportsPage role={role} />}
        </main>
      </div>
    </div>
  )
}
