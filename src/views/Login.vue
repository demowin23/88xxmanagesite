<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>🔐 Đăng nhập</h1>
        <p>Website Management System</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Tên đăng nhập</label>
          <input
            id="username"
            type="text"
            v-model="form.username"
            placeholder="Nhập tên đăng nhập"
            required
            autocomplete="username"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Mật khẩu</label>
          <div style="position: relative;">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="form.password"
              placeholder="Nhập mật khẩu"
              required
              autocomplete="current-password"
              style="padding-right: 40px;"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; padding: 5px; color: var(--text-secondary);"
              :title="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
            >
              <span v-if="showPassword">👁️</span>
              <span v-else>👁️‍🗨️</span>
            </button>
          </div>
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
      </form>
      
      <div class="login-footer">
        <p style="color: var(--text-secondary); font-size: 12px;">
          Mặc định: admin / admin123
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import auth from '../services/auth'
import { useRouter } from 'vue-router'

export default {
  name: 'Login',
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      loading: false,
      error: null,
      showPassword: false
    }
  },
  mounted() {
    // Nếu đã đăng nhập, redirect về dashboard
    if (auth.isAuthenticated()) {
      this.$router.push('/')
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = null
      
      try {
        const result = await auth.login(this.form.username, this.form.password)
        
        if (result && result.user) {
          // Emit event để App.vue update
          window.dispatchEvent(new CustomEvent('user-logged-in'))
          // Redirect về dashboard
          this.$router.push('/')
        } else {
          this.error = 'Đăng nhập thất bại'
        }
      } catch (error) {
        this.error = error.message || 'Tên đăng nhập hoặc mật khẩu không đúng'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  margin: 0 0 10px 0;
  color: var(--text-primary);
  font-size: 28px;
}

.login-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.btn-block {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-weight: 600;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>

