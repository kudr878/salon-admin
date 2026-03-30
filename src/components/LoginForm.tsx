import { type FormEvent, useState } from 'react'
import {
  loginRequest,
  setStoredLogin,
  setStoredRole,
  setStoredToken,
  type AdminRole,
} from '../api/auth'
import './LoginForm.css'

type LoginFormProps = {
  onLoggedIn: (role: AdminRole) => void
}

export default function LoginForm({ onLoggedIn }: LoginFormProps) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginRequest(login.trim(), password)
      setStoredToken(res.token)
      setStoredRole(res.role)
      setStoredLogin(res.login)
      onLoggedIn(res.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2 className="login-heading">Вход</h2>
        <label className="login-field">
          <span>Логин</span>
          <input
            type="text"
            name="login"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
        </label>
        <label className="login-field">
          <span>Пароль</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="login-submit" disabled={loading}>
          {loading ? 'Вход…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
