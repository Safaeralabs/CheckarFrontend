import api from './client'

export const invoices = (params) => api.get('billing/invoices/', { params })
