import api from './client'

export const receptions      = (params) => api.get('operations/receptions/', { params })
export const createReception = (data)    => api.post('operations/receptions/', data)
export const updateReception = (id, data) => api.patch(`operations/receptions/${id}/`, data)

export const addDamagePhoto    = (receptionId, data) =>
  api.post(`operations/receptions/${receptionId}/damage_photos/`, data)
export const removeDamagePhoto = (receptionId, photoId) =>
  api.delete(`operations/receptions/${receptionId}/damage_photos/${photoId}/`)
