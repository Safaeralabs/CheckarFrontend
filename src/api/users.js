import api from './client'

export const listInternal = (params) =>
  api.get('auth/users/', { params: { internal: true, page_size: 200, ...params } })

export const createUser = (data) => api.post('auth/users/', data)

export const updateUser = (id, data) => api.patch(`auth/users/${id}/`, data)

export const resetPassword = (id, new_password) =>
  api.post(`auth/users/${id}/reset-password/`, { new_password })
