const TOKEN_KEY = 'salon_admin_token'
const ROLE_KEY = 'salon_admin_role'
const LOGIN_KEY = 'salon_admin_login'

export type AdminRole = 'ADMIN' | 'DIRECTOR'

function authUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL
  if (base && typeof base === 'string' && base.length > 0) {
    const trimmed = base.replace(/\/$/, '')
    return `${trimmed}${path}`
  }
  return path
}

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function getStoredRole(): AdminRole | null {
  const r = sessionStorage.getItem(ROLE_KEY)
  if (r === 'ADMIN' || r === 'DIRECTOR') {
    return r
  }
  return null
}

export function setStoredRole(role: AdminRole): void {
  sessionStorage.setItem(ROLE_KEY, role)
}

export function setStoredLogin(login: string): void {
  sessionStorage.setItem(LOGIN_KEY, login)
}

export function getStoredLogin(): string | null {
  return sessionStorage.getItem(LOGIN_KEY)
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(ROLE_KEY)
  sessionStorage.removeItem(LOGIN_KEY)
}

export async function loginRequest(
  login: string,
  password: string,
): Promise<{ token: string; role: AdminRole; login: string }> {
  const response = await fetch(authUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  })
  const data: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const err =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : 'Ошибка входа'
    throw new Error(err)
  }
  if (typeof data !== 'object' || data === null || !('token' in data)) {
    throw new Error('Некорректный ответ сервера')
  }
  const row = data as { token: string; role?: string; login?: string }
  if (typeof row.token !== 'string') {
    throw new Error('Некорректный ответ сервера')
  }
  const role = row.role === 'DIRECTOR' ? 'DIRECTOR' : 'ADMIN'
  return {
    token: row.token,
    role,
    login: typeof row.login === 'string' ? row.login : login,
  }
}

export async function meRequest(token: string): Promise<{
  ok: boolean
  role?: AdminRole
  login?: string
}> {
  const response = await fetch(authUrl('/api/auth/me'), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    return { ok: false }
  }
  const data: unknown = await response.json().catch(() => ({}))
  if (typeof data !== 'object' || data === null) {
    return { ok: false }
  }
  const row = data as { role?: string; login?: string }
  const role = row.role === 'DIRECTOR' ? 'DIRECTOR' : 'ADMIN'
  return {
    ok: true,
    role,
    login: typeof row.login === 'string' ? row.login : undefined,
  }
}
