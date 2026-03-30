import { getStoredToken } from './auth'

function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL
  if (base && typeof base === 'string' && base.length > 0) {
    const trimmed = base.replace(/\/$/, '')
    return `${trimmed}${path}`
  }
  return path
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = getStoredToken()
  const headers = new Headers(init?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (
    init?.body &&
    !(init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(apiUrl(path), { ...init, headers })
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init)
  const text = await res.text()
  let data: unknown = {}
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      data = {}
    }
  }
  if (!res.ok) {
    const msg =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Ошибка ${String(res.status)}`
    throw new Error(msg)
  }
  return data as T
}

function parseFilenameFromDisposition(header: string | null): string | null {
  if (!header) {
    return null
  }
  const utf8 = /filename\*=UTF-8''([^;\s]+)/i.exec(header)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1])
    } catch {
      return utf8[1]
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header)
  if (quoted?.[1]) {
    return quoted[1]
  }
  const plain = /filename=([^;\s]+)/i.exec(header)
  if (plain?.[1]) {
    return plain[1].replace(/^["']|["']$/g, '')
  }
  return null
}

/**
 * Скачивание Excel с защищённого /api/admin/reports/...
 * Ссылка добавляется в document — иначе часть браузеров не запускает загрузку.
 */
export function downloadExcel(path: string, fallbackName: string): void {
  const token = getStoredToken()
  const headers = new Headers()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = apiUrl(path)

  fetch(url, { headers })
    .then((res) => {
      if (!res.ok) {
        return res.text().then((t) => {
          let msg = t || `HTTP ${String(res.status)}`
          try {
            const j = JSON.parse(t) as { error?: string }
            if (typeof j.error === 'string') {
              msg = j.error
            }
          } catch {
            /* текст как есть */
          }
          throw new Error(msg)
        })
      }
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('text/html')) {
        return res.text().then(() => {
          throw new Error(
            'Сервер вернул HTML вместо Excel. Запустите админку командой npm run dev (порт 5174) — нужен прокси /api на API :3000. Либо укажите VITE_API_BASE_URL на ваш API.',
          )
        })
      }
      const dispo = res.headers.get('Content-Disposition')
      const fromHeader = parseFilenameFromDisposition(dispo)
      const name = fromHeader || fallbackName
      return res.blob().then((blob) => ({ blob, name }))
    })
    .then(({ blob, name }) => {
      if (blob.size === 0) {
        throw new Error('Пустой файл — нет данных за выбранный период или ошибка на сервере.')
      }
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      let downloadName = name || fallbackName
      if (!downloadName.toLowerCase().endsWith('.xlsx')) {
        downloadName = `${downloadName}.xlsx`
      }
      a.download = downloadName
      a.rel = 'noopener'
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(objectUrl)
      }, 250)
    })
    .catch((e) => {
      alert(e instanceof Error ? e.message : 'Ошибка скачивания')
    })
}
