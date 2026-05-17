import api from './client'

// Registros de inspección
export const records         = (params) => api.get('inspections/records/', { params })
export const getRecord       = (id)     => api.get(`inspections/records/${id}/`)
export const createRecord    = (data)   => api.post('inspections/records/', data)
export const advanceStatus   = (id, next_status) => api.post(`inspections/records/${id}/advance_status/`, { next_status })

// Pre-evaluación
export const preEvalItems    = (params) => api.get('inspections/pre-evaluation/', { params })
export const savePreEvalItem = (data)   => api.post('inspections/pre-evaluation/', data)
export const updatePreEvalItem = (id, data) => api.patch(`inspections/pre-evaluation/${id}/`, data)

// Checklist técnico
export const checklistItems  = (params) => api.get('inspections/checklist/', { params })
export const saveChecklistItem = (data) => api.post('inspections/checklist/', data)
export const updateChecklist = (id, data) => api.patch(`inspections/checklist/${id}/`, data)

// Presión de neumáticos
export const tirePressure    = (params) => api.get('inspections/tire-pressure/', { params })
export const createTireRecord = (data)  => api.post('inspections/tire-pressure/', data)
export const updateTireRecord = (id, data) => api.patch(`inspections/tire-pressure/${id}/`, data)
export const saveAxle        = (data)   => api.post('inspections/tire-pressure-axles/', data)
export const updateAxle      = (id, data) => api.patch(`inspections/tire-pressure-axles/${id}/`, data)

// Fotos
export const photos          = (params) => api.get('inspections/photos/', { params })
export const uploadPhoto     = (formData) => api.post('inspections/photos/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const deletePhoto     = (id)     => api.delete(`inspections/photos/${id}/`)

// Certificados
export const certificates    = (params) => api.get('inspections/certificates/', { params })
