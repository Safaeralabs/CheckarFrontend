import { API_BASE_URL } from '../config'

export async function apiRequest(path, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Token ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let detail = response.statusText || 'No fue posible procesar la solicitud.'
    try {
      const payload = await response.json()
      detail = payload.detail || Object.values(payload).flat().join(' ') || detail
    } catch {
      // Keep fallback detail from status text when response body is unavailable.
    }
    throw new Error(detail)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
