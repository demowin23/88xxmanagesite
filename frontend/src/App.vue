<template>
  <div id="app">
    <div class="navbar">
      <div class="container">
        <h1>🚀 Website Management</h1>
        <nav>
          <router-link to="/">📊 Dashboard</router-link>
          <router-link to="/websites">🌐 Websites</router-link>
          <router-link v-if="currentUser && currentUser.role === 'admin'" to="/teams">👥 Teams</router-link>
          <router-link v-if="currentUser && currentUser.role === 'admin'" to="/proxies">🔒 Proxies</router-link>
        </nav>
        <div class="user-info">
          <span class="username">{{ currentUser?.username }}</span>
          <span class="role-badge" :class="currentUser?.role === 'admin' ? 'admin' : 'team'">
            {{ currentUser?.role === 'admin' ? 'Admin' : 'Team' }}
          </span>
          <button class="btn btn-sm btn-secondary" @click="handleLogout">Đăng xuất</button>
        </div>
      </div>
    </div>
    <router-view />
  </div>
</template>

<script>
import auth from './services/auth'

export default {
  name: 'App',
  data() {
    return {
      currentUser: null
    }
  },
  computed: {
    isAdmin() {
      return this.currentUser && this.currentUser.role === 'admin'
    }
  },
  mounted() {
    this.updateCurrentUser()
    // Update user info khi route thay đổi (sau khi login)
    this.$watch(() => this.$route.path, () => {
      this.updateCurrentUser()
    })
    // Listen for login event
    window.addEventListener('user-logged-in', this.updateCurrentUser)
  },
  beforeUnmount() {
    window.removeEventListener('user-logged-in', this.updateCurrentUser)
  },
  methods: {
    updateCurrentUser() {
      this.currentUser = auth.getCurrentUser()
    },
    handleLogout() {
      auth.logout()
      this.currentUser = null
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-weight: 500;
  color: var(--text-primary);
}

.role-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.role-badge.admin {
  background: #10b981;
  color: white;
}

.role-badge.team {
  background: #3b82f6;
  color: white;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}
</style>



