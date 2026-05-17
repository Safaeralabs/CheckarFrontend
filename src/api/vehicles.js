import api from './client'

export const list    = (params) => api.get('vehicles/', { params })
export const get     = (id)     => api.get(`vehicles/${id}/`)
export const create  = (data)   => api.post('vehicles/', data)
export const update  = (id, data) => api.patch(`vehicles/${id}/`, data)
export const remove  = (id)     => api.delete(`vehicles/${id}/`)
