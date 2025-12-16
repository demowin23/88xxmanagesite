import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - thêm token vào header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 unauthorized
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    // Nếu 401, xóa token và redirect về login
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      // Redirect sẽ được xử lý trong router guard
      window.location.href = '/login'
    }
    const message = error.response?.data?.error || error.message || 'Có lỗi xảy ra'
    return Promise.reject(new Error(message))
  }
)

export default {
  // Websites
  getWebsites(url = '/websites') {
    return api.get(url.startsWith('/') ? url : `/websites${url}`)
  },
  getWebsite(id) {
    return api.get(`/websites/${id}`)
  },
  createWebsite(data) {
    return api.post('/websites', data)
  },
  updateWebsite(id, data) {
    return api.put(`/websites/${id}`, data)
  },
  deleteWebsite(id) {
    return api.delete(`/websites/${id}`)
  },
  getWebsiteBlockStatus(id) {
    return api.get(`/websites/${id}/block-status`)
  },
  checkWebsiteRanking(id, options = {}) {
    return api.post(`/websites/${id}/check-ranking`, { options })
  },
  checkWebsiteRedirect(id) {
    return api.get(`/websites/${id}/check-redirect`)
  },

  // Proxies
  getProxies() {
    return api.get('/proxies')
  },
  getActiveProxies() {
    return api.get('/proxies/active')
  },
  getProxy(id) {
    return api.get(`/proxies/${id}`)
  },
  createProxy(data) {
    return api.post('/proxies', data)
  },
  updateProxy(id, data) {
    return api.put(`/proxies/${id}`, data)
  },
  deleteProxy(id) {
    return api.delete(`/proxies/${id}`)
  },
  testProxy(id, testDomain) {
    return api.post(`/proxies/${id}/test`, { testDomain })
  },

  // Block Check
  checkWebsiteBlock(websiteId) {
    return api.post(`/block-check/check/${websiteId}`)
  },
  checkBatchBlock(websiteIds) {
    return api.post('/block-check/check-batch', { websiteIds })
  },


  // Dashboard
  getDashboardOverview() {
    return api.get('/dashboard/overview')
  },
  getBlockedWebsites(url = '/dashboard/blocked-websites') {
    return api.get(url.startsWith('/') ? url : `/dashboard/blocked-websites${url}`)
  },
  getRankingChanges() {
    return api.get('/dashboard/ranking-changes')
  },

  // Teams
  getTeams(url = '/teams') {
    return api.get(url.startsWith('/') ? url : `/teams${url}`)
  },
  getTeam(id) {
    return api.get(`/teams/${id}`)
  },
  createTeam(data) {
    return api.post('/teams', data)
  },
  updateTeam(id, data) {
    return api.put(`/teams/${id}`, data)
  },
  deleteTeam(id) {
    return api.delete(`/teams/${id}`)
  },

  // Auth
  login(username, password) {
    return api.post('/auth/login', { username, password })
  },
  getCurrentUser() {
    return api.get('/auth/me')
  }
}



