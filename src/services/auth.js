import api from './api'

const AUTH_TOKEN_KEY = 'auth_token'
const AUTH_USER_KEY = 'auth_user'

export default {
  // Login
  async login(username, password) {
    try {
      const response = await api.login(username, password)
      if (response.success && response.data) {
        // Lưu token và user info
        localStorage.setItem(AUTH_TOKEN_KEY, response.data.token)
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data.user))
        return response.data
      }
      throw new Error('Login failed')
    } catch (error) {
      throw error
    }
  },

  // Logout
  logout() {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem(AUTH_USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  },

  // Get token
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY)
  },

  // Check if authenticated
  isAuthenticated() {
    return !!this.getToken()
  },

  // Check if admin
  isAdmin() {
    const user = this.getCurrentUser()
    return user && user.role === 'admin'
  },

  // Check if team user
  isTeamUser() {
    const user = this.getCurrentUser()
    return user && user.role === 'team'
  },

  // Get user team_id
  getUserTeamId() {
    const user = this.getCurrentUser()
    return user ? user.team_id : null
  }
}

