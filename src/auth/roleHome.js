const ADMIN_ROLES = ['supervisor', 'admin']
const OPERATOR_ROLES = ['operator', 'inspector', 'supervisor', 'admin']

// No hay portal de cliente: el software es de uso interno del CDA.
export function getRoleHome(role) {
  if (ADMIN_ROLES.includes(role)) return '/admin-panel'
  if (OPERATOR_ROLES.includes(role)) return '/operacion'
  return '/login'
}
