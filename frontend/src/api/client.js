import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Attach the JWT token to every outgoing request, if we have one
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('wardrobex_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-logout on 401 (expired/invalid token)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('wardrobex_token')
      localStorage.removeItem('wardrobex_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
