import api from './client'

export const branches     = ()       => api.get('scheduling/branches/')
export const services     = (params) => api.get('scheduling/services/', { params })
export const slots        = (params) => api.get('scheduling/slots/', { params })
export const appointments = (params) => api.get('scheduling/appointments/', { params })
export const createAppt   = (data)   => api.post('scheduling/appointments/', data)
export const cancelAppt   = (id)     => api.post(`scheduling/appointments/${id}/cancel/`)
