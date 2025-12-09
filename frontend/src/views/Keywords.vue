<template>
  <div class="container">
    <h1>Quản lý Từ khóa</h1>

    <div v-if="loading" class="loading">Đang tải...</div>
    <div v-else>
      <!-- Filter -->
      <div class="card" style="margin-bottom: 20px;">
        <div class="form-group">
          <label>Lọc theo Website</label>
          <select v-model="selectedWebsiteId" @change="loadKeywords">
            <option value="">Tất cả</option>
            <option v-for="website in websites" :key="website.id" :value="website.id">
              {{ website.domain }}
            </option>
          </select>
        </div>
      </div>

      <!-- Danh sách từ khóa -->
      <div class="card" v-for="keyword in keywords" :key="keyword.id">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <h3>{{ keyword.keyword }}</h3>
            <p style="color: #666; margin: 5px 0;">
              <strong>Website:</strong> {{ getWebsiteName(keyword.website_id) }}<br>
              <strong>Target URL:</strong> {{ keyword.target_url || '-' }}<br>
              <strong>Ghi chú:</strong> {{ keyword.note || '-' }}
            </p>
            <div style="margin-top: 10px;">
              <span :class="keyword.is_active ? 'badge badge-success' : 'badge badge-secondary'">
                {{ keyword.is_active ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
          <div>
            <button class="btn btn-primary" @click="checkRanking(keyword.id)" style="margin-right: 5px;">
              Check Ranking
            </button>
            <button class="btn btn-secondary" @click="viewHistory(keyword.id)" style="margin-right: 5px;">
              Lịch sử
            </button>
            <button class="btn btn-danger" @click="deleteKeyword(keyword.id)">
              Xóa
            </button>
          </div>
        </div>

        <!-- Ranking hiện tại -->
        <div v-if="keyword.currentRank" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
          <strong>Ranking hiện tại:</strong> 
          <span v-if="keyword.currentRank.position" class="badge badge-success">
            Vị trí {{ keyword.currentRank.position }}
          </span>
          <span v-else class="badge badge-warning">Không tìm thấy</span>
          <span v-if="keyword.currentRank.found_url" style="margin-left: 10px; color: #666; font-size: 12px;">
            ({{ keyword.currentRank.found_url }})
          </span>
        </div>
      </div>

      <p v-if="keywords.length === 0" style="text-align: center; padding: 40px; color: #666;">
        Chưa có từ khóa nào
      </p>
    </div>

    <!-- Modal lịch sử ranking -->
    <div v-if="showHistoryModal" class="modal" @click.self="closeHistoryModal">
      <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
          <h2>Lịch sử Ranking: {{ selectedKeyword?.keyword }}</h2>
          <button class="close-btn" @click="closeHistoryModal">&times;</button>
        </div>
        <div v-if="rankHistory.length > 0">
          <Line :data="chartData" :options="chartOptions" style="max-height: 300px;" />
          <table class="table" style="margin-top: 20px;">
            <thead>
              <tr>
                <th>Vị trí</th>
                <th>URL tìm thấy</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in rankHistory" :key="item.id">
                <td>
                  <span v-if="item.position" class="badge badge-success">
                    {{ item.position }}
                  </span>
                  <span v-else class="badge badge-warning">N/A</span>
                </td>
                <td>{{ item.found_url || '-' }}</td>
                <td>{{ formatDate(item.checked_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else>Chưa có dữ liệu lịch sử</p>
      </div>
    </div>
  </div>
</template>

<script>
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import api from '../services/api'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default {
  name: 'Keywords',
  components: {
    Line
  },
  data() {
    return {
      loading: true,
      keywords: [],
      websites: [],
      selectedWebsiteId: '',
      showHistoryModal: false,
      selectedKeyword: null,
      rankHistory: [],
      chartData: null,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            reverse: true,
            title: {
              display: true,
              text: 'Vị trí (càng thấp càng tốt)'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Biểu đồ thay đổi Ranking'
          }
        }
      }
    }
  },
  mounted() {
    this.loadWebsites()
    this.loadKeywords()
  },
  methods: {
    async loadWebsites() {
      try {
        const response = await api.getWebsites()
        this.websites = response.data || []
      } catch (error) {
        console.error('Error loading websites:', error)
      }
    },
    async loadKeywords() {
      try {
        this.loading = true
        let keywords = []

        if (this.selectedWebsiteId) {
          const response = await api.getKeywordsByWebsite(this.selectedWebsiteId)
          keywords = response.data || []
        } else {
          // Load tất cả keywords từ tất cả websites
          const allKeywords = []
          for (const website of this.websites) {
            try {
              const response = await api.getKeywordsByWebsite(website.id)
              if (response.data) {
                allKeywords.push(...response.data)
              }
            } catch (error) {
              console.error(`Error loading keywords for website ${website.id}:`, error)
            }
          }
          keywords = allKeywords
        }

        // Load ranking hiện tại cho mỗi keyword
        for (const keyword of keywords) {
          try {
            const historyRes = await api.getKeywordRankHistory(keyword.id)
            if (historyRes.data && historyRes.data.length > 0) {
              keyword.currentRank = historyRes.data[0]
            }
          } catch (error) {
            console.error(`Error loading rank for keyword ${keyword.id}:`, error)
          }
        }

        this.keywords = keywords
      } catch (error) {
        console.error('Error loading keywords:', error)
        alert('Lỗi khi tải danh sách từ khóa: ' + error.message)
      } finally {
        this.loading = false
      }
    },
    async checkRanking(id) {
      if (!confirm('Bạn có chắc muốn check ranking cho từ khóa này?')) {
        return
      }

      try {
        await api.checkKeywordRanking(id)
        alert('Check ranking hoàn tất!')
        this.loadKeywords()
      } catch (error) {
        alert('Lỗi khi check ranking: ' + error.message)
      }
    },
    async viewHistory(id) {
      try {
        const keyword = this.keywords.find(k => k.id === id)
        if (!keyword) return

        this.selectedKeyword = keyword
        const response = await api.getKeywordRankHistory(id)
        this.rankHistory = response.data || []

        // Tạo dữ liệu cho biểu đồ
        if (this.rankHistory.length > 0) {
          const sortedHistory = [...this.rankHistory].reverse()
          this.chartData = {
            labels: sortedHistory.map(item => {
              const date = new Date(item.checked_at)
              return date.toLocaleDateString('vi-VN')
            }),
            datasets: [{
              label: 'Vị trí',
              data: sortedHistory.map(item => item.position || null),
              borderColor: '#007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              tension: 0.4
            }]
          }
        }

        this.showHistoryModal = true
      } catch (error) {
        alert('Lỗi khi tải lịch sử: ' + error.message)
      }
    },
    async deleteKeyword(id) {
      if (!confirm('Bạn có chắc muốn xóa từ khóa này?')) {
        return
      }

      try {
        await api.deleteKeyword(id)
        alert('Xóa từ khóa thành công!')
        this.loadKeywords()
      } catch (error) {
        alert('Lỗi khi xóa từ khóa: ' + error.message)
      }
    },
    closeHistoryModal() {
      this.showHistoryModal = false
      this.selectedKeyword = null
      this.rankHistory = []
      this.chartData = null
    },
    getWebsiteName(websiteId) {
      const website = this.websites.find(w => w.id === websiteId)
      return website ? website.domain : 'N/A'
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('vi-VN')
    }
  }
}
</script>





