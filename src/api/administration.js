import api from './client'

export const getDashboardSummary = () => api.get('admin-panel/dashboard-summary/')
export const getRTMVencimiento  = (dias = 60) => api.get(`admin-panel/rtm-vencimiento/?dias=${dias}`)
export const getReports         = (dias = 30) => api.get(`admin-panel/reports/?dias=${dias}`)
export const getSystemLogs      = (params = {}) => api.get('operations/logs/', { params })
