<template>
  <div class="container">
    <div class="page-header">
      <h1>🔒 Quản lý Proxy ISP</h1>
      <button class="btn btn-primary" @click="showAddModal = true">➕ Thêm Proxy</button>
    </div>

    <div v-if="loading" class="loading">Đang tải...</div>
    <div v-else>
      <div class="card">
        <div v-if="pagination" class="mb-2" style="color: var(--text-secondary); font-size: 14px;">
          Tổng: {{ pagination.total }} proxies
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Nhà mạng</th>
              <th>Proxy URL</th>
              <th>Trạng thái</th>
              <th>Lần check cuối</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="proxy in proxies" :key="proxy.id">
              <td>{{ proxy.isp_name }}</td>
              <td>
                <code style="font-size: 12px;">{{ maskProxyUrl(proxy.proxy_url) }}</code>
              </td>
              <td>
                <span :class="proxy.status === 'active' ? 'badge badge-success' : 'badge badge-danger'">
                  {{ proxy.status }}
                </span>
              </td>
              <td>{{ formatDate(proxy.last_check) }}</td>
              <td>
                <button class="btn btn-secondary btn-sm" @click="testProxy(proxy.id)" style="margin-right: 5px;">
                  🧪 Test
                </button>
                <button class="btn btn-primary btn-sm" @click="editProxy(proxy)" style="margin-right: 5px;">
                  ✏️ Sửa
                </button>
                <button class="btn btn-danger btn-sm" @click="deleteProxy(proxy.id)">
                  🗑️ Xóa
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Pagination -->
        <Pagination
          v-if="pagination && pagination.totalPages > 1"
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          :total="pagination.total"
          :limit="pagination.limit"
          @page-change="handlePageChange"
          @limit-change="handleLimitChange"
        />
      </div>
    </div>

    <!-- Modal thêm/sửa proxy -->
    <div v-if="showAddModal || editingProxy" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingProxy ? '✏️ Sửa Proxy' : '➕ Thêm Proxy mới' }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="saveProxy">
          <div class="form-group">
            <label>Nhà mạng *</label>
            <select v-model="form.isp_name" required>
              <option value="">Chọn nhà mạng</option>
              <option value="Viettel">Viettel</option>
              <option value="VNPT">VNPT</option>
              <option value="FPT">FPT</option>
              <option value="Mobifone">Mobifone</option>
              <option value="SCTV">SCTV</option>
              <option value="CMC">CMC</option>
            </select>
          </div>
          <div class="form-group">
            <label>Proxy URL *</label>
            <input 
              type="text" 
              v-model="form.proxy_url" 
              placeholder="http://user:pass@ip:port"
              required
            />
            <small style="color: #666; font-size: 12px;">
              Format: http://username:password@ip:port hoặc https://username:password@ip:port
            </small>
          </div>
          <div class="form-group">
            <label>Trạng thái</label>
            <select v-model="form.status">
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button type="button" class="btn btn-secondary" @click="closeModal">Hủy</button>
            <button type="submit" class="btn btn-primary">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
import Pagination from '../components/Pagination.vue'

export default {
  name: 'Proxies',
  components: {
    Pagination
  },
  data() {
    return {
      loading: true,
      proxies: [],
      showAddModal: false,
      editingProxy: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
      },
      form: {
        isp_name: '',
        proxy_url: '',
        status: 'active'
      }
    }
  },
  mounted() {
    this.loadProxies()
  },
  methods: {
    async loadProxies() {
      try {
        this.loading = true
        const params = new URLSearchParams({
          page: this.pagination.page,
          limit: this.pagination.limit
        })
        const response = await api.getProxies(`?${params}`)
        this.proxies = response.data || []
        this.pagination = response.pagination || this.pagination
      } catch (error) {
        console.error('Error loading proxies:', error)
      } finally {
        this.loading = false
      }
    },
    handlePageChange(page) {
      this.pagination.page = page
      this.loadProxies()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    handleLimitChange(limit) {
      this.pagination.limit = limit
      this.pagination.page = 1
      this.loadProxies()
    },
    async testProxy(id) {
      const testDomain = prompt('Nhập domain để test (mặc định: google.com):', 'google.com')
      if (!testDomain) return

      try {
        const response = await api.testProxy(id, testDomain)
        const result = response.data
        alert(`Kết quả test:\nISP: ${result.proxy}\nDomain: ${result.testDomain}\nStatus: ${result.status}\nHTTP Code: ${result.httpCode || 'N/A'}\nResponse Time: ${result.responseTime}ms`)
        this.loadProxies()
      } catch (error) {
        alert('Lỗi khi test proxy: ' + error.message)
      }
    },
    editProxy(proxy) {
      this.editingProxy = proxy
      this.form = {
        isp_name: proxy.isp_name,
        proxy_url: proxy.proxy_url,
        status: proxy.status
      }
    },
    async saveProxy() {
      try {
        if (this.editingProxy) {
          await api.updateProxy(this.editingProxy.id, this.form)
          alert('Cập nhật proxy thành công!')
        } else {
          await api.createProxy(this.form)
          alert('Thêm proxy thành công!')
        }
        this.closeModal()
        this.loadProxies()
      } catch (error) {
        alert('Lỗi: ' + error.message)
      }
    },
    async deleteProxy(id) {
      if (!confirm('Bạn có chắc muốn xóa proxy này?')) {
        return
      }

      try {
        await api.deleteProxy(id)
        alert('Xóa proxy thành công!')
        this.loadProxies()
      } catch (error) {
        alert('Lỗi khi xóa proxy: ' + error.message)
      }
    },
    closeModal() {
      this.showAddModal = false
      this.editingProxy = null
      this.form = {
        isp_name: '',
        proxy_url: '',
        status: 'active'
      }
    },
    maskProxyUrl(url) {
      if (!url) return ''
      try {
        const urlObj = new URL(url)
        if (urlObj.username) {
          return `${urlObj.protocol}//${'*'.repeat(urlObj.username.length)}:${'*'.repeat(urlObj.password?.length || 0)}@${urlObj.hostname}:${urlObj.port}`
        }
        return url
      } catch {
        return url
      }
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('vi-VN')
    }
  }
}
</script>



