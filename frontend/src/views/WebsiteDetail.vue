<template>
  <div class="container">
    <div v-if="loading" class="loading">Đang tải...</div>
    <div v-else-if="website">
      <div style="margin-bottom: 24px">
        <router-link to="/websites" class="btn btn-secondary"
          >← Quay lại</router-link
        >
      </div>

      <div class="page-header">
        <h1>🌐 {{ website.domain }}</h1>
      </div>

      <!-- Thông tin website -->
      <div class="card">
        <h2>ℹ️ Thông tin Website</h2>
        <table class="table">
          <tr>
            <th>Domain</th>
            <td>{{ website.domain }}</td>
          </tr>
          <tr>
            <th>Team</th>
            <td>{{ website.team_name || "-" }}</td>
          </tr>
          <tr>
            <th>Keyword</th>
            <td>
              <span v-if="website.keyword" class="badge badge-info">{{
                website.keyword
              }}</span>
              <span v-else>-</span>
            </td>
          </tr>
          <tr>
            <th>Trạng thái</th>
            <td>
              <span
                v-if="website.status"
                :class="getStatusBadgeClass(website.status)"
              >
                {{ website.status }}
              </span>
              <span v-else>-</span>
            </td>
          </tr>
          <tr>
            <th>Ghi chú</th>
            <td>{{ website.note || "-" }}</td>
          </tr>
        </table>
        <button
          class="btn btn-primary"
          @click="checkBlock"
          style="margin-top: 15px"
        >
          Check chặn ngay
        </button>
      </div>

      <!-- Trạng thái chặn theo ISP -->
      <div class="card">
        <h2>🔒 Trạng thái chặn theo Nhà mạng</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Nhà mạng</th>
              <th>Trạng thái</th>
              <th>HTTP Code</th>
              <th>Lỗi</th>
              <th>Thời gian check</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="block in website.blockStatus" :key="block.id">
              <td>{{ block.isp_name }}</td>
              <td>
                <span :class="getBlockStatusClass(block.status)">
                  {{ block.status }}
                </span>
              </td>
              <td>{{ block.http_code || "-" }}</td>
              <td>{{ block.error_message || "-" }}</td>
              <td>{{ formatDate(block.checked_at) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="!website.blockStatus || website.blockStatus.length === 0">
          Chưa có dữ liệu check chặn
        </p>
      </div>

      <!-- Keyword và Ranking -->
      <div class="card">
        <div class="flex-between" style="margin-bottom: 20px">
          <h2 style="margin: 0">📈 Keyword & Ranking</h2>
          <div>
            <button
              v-if="website.keyword"
              class="btn btn-success"
              @click="checkRanking"
              style="margin-right: 10px"
            >
              📊 Check Ranking
            </button>
            <button class="btn btn-primary" @click="showAddKeywordModal = true">
              {{ website.keyword ? "✏️ Sửa Keyword" : "➕ Thêm Keyword" }}
            </button>
          </div>
        </div>

        <div v-if="website.keyword">
          <p>
            <strong>Keyword hiện tại:</strong>
            <span class="badge badge-info">{{ website.keyword }}</span>
          </p>
          <p style="margin-top: 10px">
            <strong>Ranking:</strong>
            <span
              v-if="website.ranking"
              class="badge badge-info"
              style="margin-left: 10px"
            >
              #{{ website.ranking }}
            </span>
            <span v-else style="color: #666; margin-left: 10px"
              >Chưa check</span
            >
          </p>
        </div>
        <p v-else style="color: #666">
          Chưa có keyword. Hãy thêm keyword để check ranking.
        </p>
      </div>

      <!-- Redirect Info -->
      <div class="card" style="margin-top: 24px">
        <div class="flex-between" style="margin-bottom: 20px">
          <h2 style="margin: 0">🔗 Redirect Info</h2>
          <button
            v-if="website.domain"
            class="btn btn-info"
            @click="checkRedirect"
            :disabled="loading"
          >
            🔗 Check Redirect
          </button>
        </div>
        <div v-if="redirectInfo">
          <p style="margin: 5px 0">
            <strong>Status Code:</strong>
            <span
              class="badge"
              :class="
                redirectInfo.isRedirect ? 'badge-warning' : 'badge-success'
              "
            >
              {{ redirectInfo.statusCode }}
            </span>
          </p>
          <p v-if="redirectInfo.isRedirect" style="margin: 5px 0">
            <strong>Redirect Type:</strong>
            <span class="badge badge-warning">{{
              redirectInfo.redirectType
            }}</span>
          </p>
          <p
            v-if="redirectInfo.redirectUrl"
            style="margin: 5px 0; word-break: break-all"
          >
            <strong>Redirect to:</strong> {{ redirectInfo.redirectUrl }}
          </p>
          <p
            v-if="
              redirectInfo.finalRedirectUrl &&
              redirectInfo.finalRedirectUrl !== redirectInfo.redirectUrl
            "
            style="margin: 5px 0; word-break: break-all"
          >
            <strong>Final URL:</strong> {{ redirectInfo.finalRedirectUrl }}
          </p>
          <p v-if="!redirectInfo.isRedirect" style="margin: 5px 0">
            <span class="badge badge-success">No Redirect</span>
          </p>
        </div>
        <p v-else style="color: #666">
          Chưa check redirect. Click "Check Redirect" để kiểm tra.
        </p>
      </div>
    </div>
    <div v-else>
      <p>Không tìm thấy website</p>
    </div>

    <!-- Modal thêm từ khóa -->
    <div
      v-if="showAddKeywordModal"
      class="modal"
      @click.self="closeKeywordModal"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ website.keyword ? "✏️ Sửa từ khóa" : "➕ Thêm từ khóa" }}</h2>
          <button class="close-btn" @click="closeKeywordModal">&times;</button>
        </div>
        <form @submit.prevent="saveKeyword">
          <div class="form-group">
            <label>Từ khóa *</label>
            <input
              type="text"
              v-model="keywordForm.keyword"
              placeholder="Nhập từ khóa..."
              required
            />
            <small style="color: #666"
              >Nhập một từ khóa duy nhất để check ranking</small
            >
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeKeywordModal"
            >
              Hủy
            </button>
            <button type="submit" class="btn btn-primary">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../services/api";

export default {
  name: "WebsiteDetail",
  data() {
    return {
      loading: true,
      website: null,
      showAddKeywordModal: false,
      redirectInfo: null,
      keywordForm: {
        keyword: "",
      },
    };
  },
  mounted() {
    this.loadWebsite();
  },
  methods: {
    async loadWebsite() {
      try {
        this.loading = true;
        const response = await api.getWebsite(this.$route.params.id);
        this.website = response.data;

        // Set keyword vào form nếu có
        if (this.website.keyword) {
          this.keywordForm.keyword = this.website.keyword;
        }
      } catch (error) {
        console.error("Error loading website:", error);
        alert("Lỗi khi tải thông tin website: " + error.message);
      } finally {
        this.loading = false;
      }
    },
    async checkBlock() {
      try {
        await api.checkWebsiteBlock(this.website.id);
        this.loadWebsite();
      } catch (error) {
        console.error("Lỗi khi check chặn:", error);
      }
    },
    async checkRanking() {
      if (!this.website.keyword || !this.website.keyword.trim()) {
        return;
      }

      try {
        this.loading = true;
        const response = await api.checkWebsiteRanking(this.website.id);
        const data = response.data;

        // Cập nhật ranking ngay
        if (data.website && data.website.ranking !== undefined) {
          this.website.ranking = data.website.ranking;
        }

        this.loadWebsite();
      } catch (error) {
        console.error("Error checking ranking:", error);
      } finally {
        this.loading = false;
      }
    },
    async checkRedirect() {
      if (!this.website.domain) {
        return;
      }

      try {
        this.loading = true;
        // API interceptor đã trả về response.data rồi, nên result đã là { success, data } rồi
        const result = await api.checkWebsiteRedirect(this.website.id);

        if (result && result.success && result.data) {
          this.redirectInfo = result.data;
        } else {
          console.error("Redirect check failed - invalid response:", result);
        }
      } catch (error) {
        console.error("Error checking redirect:", error);
        alert(
          "Lỗi khi check redirect: " +
            (error.response?.data?.error || error.message)
        );
      } finally {
        this.loading = false;
      }
    },
    async saveKeyword() {
      try {
        const keywordInput = this.keywordForm.keyword.trim();
        if (!keywordInput) {
          alert("Vui lòng nhập từ khóa!");
          return;
        }

        // Cập nhật website với keyword mới
        await api.updateWebsite(this.website.id, {
          domain: this.website.domain,
          team_id: this.website.team_id,
          keyword: keywordInput,
          status: this.website.status,
          note: this.website.note,
        });

        alert("Cập nhật keyword thành công!");
        this.closeKeywordModal();
        this.loadWebsite();
      } catch (error) {
        alert("Lỗi: " + error.message);
      }
    },
    closeKeywordModal() {
      this.showAddKeywordModal = false;
      this.keywordForm = {
        keyword: "",
      };
    },
    getStatusBadgeClass(status) {
      const map = {
        active: "badge badge-success",
        redirect: "badge badge-info",
        error: "badge badge-danger",
        blocked: "badge badge-danger",
      };
      return map[status] || "badge";
    },
    getBlockStatusClass(status) {
      const map = {
        OK: "badge badge-success",
        BLOCK_DNS: "badge badge-danger",
        BLOCK_HTTP: "badge badge-danger",
        BLOCK_HTTPS: "badge badge-danger",
        BLOCK_UNKNOWN: "badge badge-warning",
      };
      return map[status] || "badge";
    },
    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN");
    },
  },
};
</script>
