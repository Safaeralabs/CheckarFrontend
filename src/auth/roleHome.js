const ADMIN_ROLES = ['supervisor', 'admin']
const OPERATOR_ROLES = ['operator', 'inspector', 'supervisor', 'admin']

export function getRoleHome(role) {
  if (role === 'customer') return '/cliente'
  if (ADMIN_ROLES.includes(role)) return '/admin-panel'
  if (OPERATOR_ROLES.includes(role)) return '/operacion'
  return '/login'
}
