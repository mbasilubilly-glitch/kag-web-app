import api, { setAuthToken } from '../api'

// Shared by SignIn.jsx and AdminLogin.jsx so both entry points agree on
// exactly the same role-flag logic after a successful token exchange -
// role is always backend-derived, the user never picks one.
export async function applySession(accessToken, rememberMe) {
  setAuthToken(accessToken, rememberMe)

  const profileResponse = await api.get('/auth/profile/')
  const role = profileResponse.data.profile?.role || 'Visitor'

  const isSystemAdmin = role === 'Administrator' || role === 'Pastor'
  const isSuperAdmin = !!(profileResponse.data.is_staff && profileResponse.data.is_superuser)
  localStorage.setItem('isAdmin', isSystemAdmin ? 'true' : 'false')
  localStorage.setItem('isSuperAdmin', isSuperAdmin ? 'true' : 'false')
  localStorage.setItem('isMediaTeam', profileResponse.data.is_media_team ? 'true' : 'false')
  localStorage.setItem('userRole', role)

  window.dispatchEvent(new Event('authChanged'))

  return { role, isSystemAdmin, isSuperAdmin }
}
