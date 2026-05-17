import api from './client'

export const login = (data) => api.post('auth/login/', data)
export const register = (data) => api.post('auth/register/', { ...data, role: 'customer' })
export const registroPublico = (data) => api.post('auth/registro-publico/', data)
export const logout = () => api.post('auth/logout/')
export const me = () => api.get('auth/users/me/')
