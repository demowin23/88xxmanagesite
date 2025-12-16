import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Websites from '../views/Websites.vue'
import WebsiteDetail from '../views/WebsiteDetail.vue'
import Proxies from '../views/Proxies.vue'
import Teams from '../views/Teams.vue'
import Login from '../views/Login.vue'
import auth from '../services/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/websites',
    name: 'Websites',
    component: Websites,
    meta: { requiresAuth: true }
  },
  {
    path: '/websites/:id',
    name: 'WebsiteDetail',
    component: WebsiteDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/proxies',
    name: 'Proxies',
    component: Proxies,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/teams',
    name: 'Teams',
    component: Teams,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Router guard
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const isAuthenticated = auth.isAuthenticated()
  const isAdmin = auth.isAdmin()

  if (requiresAuth && !isAuthenticated) {
    // Cần đăng nhập nhưng chưa đăng nhập
    next('/login')
  } else if (requiresAdmin && !isAdmin) {
    // Cần admin nhưng không phải admin
    next('/')
  } else if (to.path === '/login' && isAuthenticated) {
    // Đã đăng nhập nhưng vào trang login
    next('/')
  } else {
    next()
  }
})

export default router



