import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Websites from '../views/Websites.vue'
import WebsiteDetail from '../views/WebsiteDetail.vue'
import Proxies from '../views/Proxies.vue'
import Teams from '../views/Teams.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/websites',
    name: 'Websites',
    component: Websites
  },
  {
    path: '/websites/:id',
    name: 'WebsiteDetail',
    component: WebsiteDetail
  },
  {
    path: '/proxies',
    name: 'Proxies',
    component: Proxies
  },
  {
    path: '/teams',
    name: 'Teams',
    component: Teams
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router



