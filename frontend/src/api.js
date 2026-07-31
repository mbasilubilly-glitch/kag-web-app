import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

// "Remember Me" support: token lives in localStorage (survives browser
// restarts) when the user opted in at sign-in, or sessionStorage (cleared
// when the browser closes) otherwise. Read from whichever has it; always
// write to whichever the user chose at sign-in time.
export function getAuthToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
}

export function setAuthToken(token, rememberMe) {
  if (rememberMe) {
    localStorage.setItem('authToken', token)
    sessionStorage.removeItem('authToken')
  } else {
    sessionStorage.setItem('authToken', token)
    localStorage.removeItem('authToken')
  }
}

export function clearAuthToken() {
  localStorage.removeItem('authToken')
  sessionStorage.removeItem('authToken')
}

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Without a timeout, a stalled request (flaky connection, sleeping dev
  // server) hangs the UI spinner forever with no feedback - looks like the
  // app is broken rather than the network being slow.
  timeout: 60000,
})

instance.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 on a request that carried no token just means the endpoint
    // requires auth and the visitor is anonymous (e.g. an incidental call
    // from a public page) - not a real session expiring. Only force a
    // sign-in redirect when we actually had a token that got invalidated.
    if (error.response?.status === 401 && getAuthToken()) {
      clearAuthToken()
      localStorage.removeItem('isAdmin')
      localStorage.removeItem('isSuperAdmin')
      localStorage.removeItem('isMediaTeam')
      localStorage.removeItem('userRole')
      window.dispatchEvent(new Event('authChanged'))
      if (typeof window !== 'undefined' && window.location?.pathname !== '/signin') {
        window.location.href = '/signin'
      }
    }
    return Promise.reject(error)
  }
)

export default instance
