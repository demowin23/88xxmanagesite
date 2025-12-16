<template>
  <div class="container">
    <div class="page-header">
      <h1>🌐 Danh sách Website</h1>
      <div class="page-header-actions">
        <button
          class="btn btn-success"
          @click="checkAllRankings"
          :disabled="loading || websites.length === 0"
        >
          ⚡ Check Ranking Tất Cả
        </button>
        <button class="btn btn-primary" @click="showAddModal = true">
          ➕ Thêm Website
        </button>
      </div>
    </div>

    <!-- Filter section -->
    <div class="filter-card">
      <h3>🔍 Bộ lọc</h3>
      <div class="filter-grid">
        <div class="form-group" style="margin-bottom: 0">
          <label>🔎 Tìm kiếm theo tên</label>
          <input
            type="text"
            v-model="filters.search"
            placeholder="Nhập domain..."
            @input="applyFilters"
          />
        </div>
        <div v-if="isAdmin" class="form-group" style="margin-bottom: 0">
          <label>👥 Team</label>
          <select v-model="filters.team_id" @change="applyFilters">
            <option value="">Tất cả</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">
              {{ team.name }}
            </option>
          </select>
        </div>
        <div style="display: flex; align-items: flex-end">
          <button class="btn btn-secondary" @click="resetFilters">
            🔄 Xóa bộ lọc
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Đang tải...</div>
    <div v-else>
      <div class="card">
        <div
          v-if="pagination"
          class="mb-2"
          style="color: var(--text-secondary); font-size: 14px"
        >
          Tổng: {{ pagination.total }} website
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Team</th>
              <th>Keywords</th>
              <th>Ranking</th>
              <th>Redirect Status</th>
              <th>Check chặn</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="website in websites" :key="website.id">
              <td>
                <router-link :to="`/websites/${website.id}`">
                  {{ website.domain }}
                </router-link>
              </td>
              <td>{{ website.team_name || "-" }}</td>
              <td>
                <div
                  v-if="website.editingKeyword"
                  style="display: flex; align-items: center; gap: 5px"
                >
                  <input
                    type="text"
                    v-model="website.editingKeywordValue"
                    @blur="saveKeyword(website)"
                    @keyup.enter="saveKeyword(website)"
                    @keyup.esc="cancelEditKeyword(website)"
                    style="
                      padding: 4px 8px;
                      border: 2px solid var(--primary);
                      border-radius: var(--radius);
                      font-size: 12px;
                      width: 100%;
                    "
                    autofocus
                  />
                </div>
                <div
                  v-else
                  style="
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    cursor: pointer;
                  "
                  @click="startEditKeyword(website)"
                >
                  <span v-if="website.keyword" class="badge badge-info">{{
                    website.keyword
                  }}</span>
                  <span v-else class="badge badge-secondary">Chưa có</span>
                  <span
                    style="
                      font-size: 12px;
                      color: var(--text-secondary);
                      opacity: 0.6;
                    "
                    >✏️</span
                  >
                </div>
              </td>
              <td>
                <span v-if="website.ranking" class="badge badge-info">
                  #{{ website.ranking }}
                </span>
                <span v-else>N/A</span>
              </td>
              <td>
                <span
                  v-if="website.checkingRedirect"
                  class="badge badge-secondary"
                >
                  ⏳ Checking...
                </span>
                <span
                  v-else-if="website.redirectStatus === 'error'"
                  class="badge badge-danger"
                  title="Error checking redirect"
                >
                  Error
                </span>
                <span
                  v-else-if="website.redirectStatus === '301'"
                  class="badge badge-warning tooltip-wrapper"
                >
                  301
                  <span class="tooltip-text">{{
                    getRedirectTooltip(website)
                  }}</span>
                </span>
                <span
                  v-else-if="website.redirectStatus === '200'"
                  class="badge badge-success"
                >
                  200
                </span>
                <span
                  v-else
                  class="badge badge-secondary"
                  @click="checkRedirect(website.id)"
                  style="cursor: pointer"
                  title="Click to check redirect"
                >
                  Check
                </span>
              </td>
              <td>
                <div
                  v-if="website.blockStatus && website.blockStatus.length > 0"
                  style="display: flex; flex-wrap: wrap; gap: 5px"
                >
                  <span
                    v-for="(block, idx) in website.blockStatus"
                    :key="`${block.isp_name}-${idx}`"
                    :class="getBlockStatusClass(block.status)"
                    :title="getBlockStatusTooltip(block)"
                    style="cursor: help; font-size: 12px"
                  >
                    {{ block.isp_name }}: {{ formatBlockStatus(block.status) }}
                  </span>
                </div>
                <span v-else style="color: #999; font-size: 12px"
                  >Chưa check</span
                >
              </td>
              <td>
                <button
                  class="btn btn-success btn-sm"
                  @click="checkRanking(website.id)"
                  :disabled="website.checkingRanking || !website.keyword"
                  style="margin-right: 5px"
                >
                  {{
                    website.checkingRanking
                      ? "⏳ Đang check..."
                      : "📈 Check Ranking"
                  }}
                </button>
                <button
                  class="btn btn-secondary btn-sm"
                  @click="checkBlock(website.id)"
                  style="margin-right: 5px"
                >
                  🔒 Check chặn
                </button>
                <button
                  class="btn btn-info btn-sm"
                  @click="checkRedirect(website.id)"
                  :disabled="website.checkingRedirect"
                  style="margin-right: 5px"
                >
                  🔗 Redirect
                </button>
                <button
                  class="btn btn-primary btn-sm"
                  @click="editWebsite(website)"
                  style="margin-right: 5px"
                >
                  ✏️ Sửa
                </button>
                <button
                  class="btn btn-danger btn-sm"
                  @click="deleteWebsite(website.id)"
                >
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

    <!-- Modal thêm/sửa website -->
    <div v-if="showAddModal || editingWebsite" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>
            {{ editingWebsite ? "✏️ Sửa Website" : "➕ Thêm Website mới" }}
          </h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="saveWebsite">
          <div class="form-group">
            <label>Domain *</label>
            <input
              type="text"
              v-model="form.domain"
              placeholder="example.com"
              required
            />
          </div>
          <div class="flex-between">
            <div class="form-group">
              <label>Team</label>
              <select v-model="form.team_id" :disabled="!isAdmin">
                <option value="">Chọn team</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">
                  {{ team.name }}
                </option>
              </select>
              <small
                v-if="!isAdmin"
                style="
                  color: var(--text-secondary);
                  font-size: 12px;
                  display: block;
                  margin-top: 5px;
                "
              >
                Team user chỉ có thể tạo website cho team của mình
              </small>
            </div>
          </div>
          <div class="form-group">
            <label>Từ khóa (Keyword)</label>
            <input
              type="text"
              v-model="form.keyword"
              placeholder="Nhập từ khóa để check ranking..."
            />
            <small style="color: #666"
              >Dùng để check ranking (Quốc gia: Việt Nam, Ngôn ngữ: Tiếng
              Việt)</small
            >
          </div>
          <div v-if="!editingWebsite && form.keyword" class="form-group">
            <label>
              <input
                type="checkbox"
                v-model="form.checkRankingAfterCreate"
                style="margin-right: 5px"
              />
              Check ranking ngay sau khi tạo (sử dụng 1 search credit)
            </label>
          </div>
          <div class="form-group">
            <label>Ghi chú</label>
            <textarea
              v-model="form.note"
              placeholder="Ghi chú thêm..."
            ></textarea>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 10px">
            <button type="button" class="btn btn-secondary" @click="closeModal">
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
import auth from "../services/auth";
import Pagination from "../components/Pagination.vue";

export default {
  name: "Websites",
  components: {
    Pagination,
  },
  computed: {
    isAdmin() {
      return auth.isAdmin();
    },
  },
  data() {
    return {
      loading: true,
      websites: [],
      teams: [],
      showAddModal: false,
      editingWebsite: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
      },
      filters: {
        search: "",
        team_id: "",
      },
      form: {
        domain: "",
        team_id: "",
        keyword: "",
        checkRankingAfterCreate: false,
        note: "",
      },
    };
  },
  mounted() {
    this.loadTeams();
    this.loadWebsites();
  },
  methods: {
    async loadTeams() {
      try {
        // Load tất cả teams cho dropdown (không cần pagination)
        const response = await api.getTeams();
        this.teams = response.data || [];
      } catch (error) {
        console.error("Error loading teams:", error);
      }
    },
    async loadWebsites() {
      try {
        this.loading = true;
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
        };
        if (this.filters.search) params.search = this.filters.search;
        // Team user không được filter team khác, chỉ xem team của mình
        if (this.isAdmin && this.filters.team_id)
          params.team_id = this.filters.team_id;

        const queryString = new URLSearchParams(params).toString();
        const url = `/websites?${queryString}`;
        const response = await api.getWebsites(url);
        // Thêm editingKeyword state và redirect status cho mỗi website
        this.websites = (response.data || []).map((website) => ({
          ...website,
          editingKeyword: false,
          editingKeywordValue: website.keyword || "",
          checkingRedirect: false,
          redirectStatus: null, // null, '200', '301', 'error'
          redirectUrl: null,
        }));

        // Tự động check redirect cho tất cả websites
        this.checkAllRedirects();
        this.pagination = response.pagination || this.pagination;
      } catch (error) {
        console.error("Error loading websites:", error);
      } finally {
        this.loading = false;
      }
    },
    handlePageChange(page) {
      this.pagination.page = page;
      this.loadWebsites();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    handleLimitChange(limit) {
      this.pagination.limit = limit;
      this.pagination.page = 1;
      this.loadWebsites();
    },
    startEditKeyword(website) {
      website.editingKeyword = true;
      website.editingKeywordValue = website.keyword || "";
    },
    cancelEditKeyword(website) {
      website.editingKeyword = false;
      website.editingKeywordValue = website.keyword || "";
    },
    async saveKeyword(website) {
      if (website.editingKeywordValue === website.keyword) {
        website.editingKeyword = false;
        return;
      }

      try {
        const keywordValue = website.editingKeywordValue?.trim() || null;
        await api.updateWebsite(website.id, {
          domain: website.domain,
          team_id: website.team_id,
          keyword: keywordValue,
          status: website.status,
          note: website.note,
        });

        // Cập nhật keyword trong danh sách
        website.keyword = keywordValue;
        website.editingKeyword = false;
      } catch (error) {
        console.error("Error saving keyword:", error);
        // Khôi phục giá trị cũ nếu lỗi
        website.editingKeywordValue = website.keyword || "";
        website.editingKeyword = false;
      }
    },
    applyFilters() {
      this.pagination.page = 1; // Reset về trang đầu khi filter
      this.loadWebsites();
    },
    resetFilters() {
      this.filters = {
        search: "",
        team_id: "",
      };
      this.loadWebsites();
    },
    async checkAllRankings() {
      const websitesWithKeyword = this.websites.filter(
        (w) => w.keyword && w.keyword.trim()
      );

      if (websitesWithKeyword.length === 0) {
        return;
      }

      try {
        this.loading = true;

        for (let i = 0; i < websitesWithKeyword.length; i++) {
          const website = websitesWithKeyword[i];
          try {
            await this.checkRanking(website.id);

            // Delay giữa các request
            if (i < websitesWithKeyword.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          } catch (error) {
            console.error(`Error checking ${website.domain}:`, error);
          }
        }

        await this.loadWebsites();
      } catch (error) {
        console.error("Error checking all rankings:", error);
      } finally {
        this.loading = false;
      }
    },
    async checkRanking(websiteId) {
      const website = this.websites.find((w) => w.id === websiteId);

      if (!website?.keyword || !website.keyword.trim()) {
        return;
      }

      try {
        // Cập nhật trạng thái loading cho website này
        const websiteIndex = this.websites.findIndex((w) => w.id === websiteId);
        if (websiteIndex !== -1) {
          this.websites[websiteIndex].checkingRanking = true;
        }

        const response = await api.checkWebsiteRanking(websiteId);
        const data = response.data;

        // Cập nhật ranking ngay trong danh sách
        if (websiteIndex !== -1) {
          if (data.website && data.website.ranking !== undefined) {
            this.websites[websiteIndex].ranking = data.website.ranking;
          }
        }

        // Reload để đảm bảo data đồng bộ
        await this.loadWebsites();
      } catch (error) {
        console.error("Error checking ranking:", error);
      } finally {
        const websiteIndex = this.websites.findIndex((w) => w.id === websiteId);
        if (websiteIndex !== -1) {
          this.websites[websiteIndex].checkingRanking = false;
        }
      }
    },
    async checkRedirect(websiteId) {
      const websiteIndex = this.websites.findIndex((w) => w.id === websiteId);
      if (websiteIndex === -1) return;

      try {
        this.websites[websiteIndex].checkingRedirect = true;

        // API interceptor đã trả về response.data rồi, nên result đã là { success, data } rồi
        const result = await api.checkWebsiteRedirect(websiteId);

        // API trả về: { success: true, data: { domain, statusCode, isRedirect, redirectUrl, finalRedirectUrl, ... } }
        if (result && result.success && result.data) {
          const info = result.data;

          // Nếu có redirect (301, 302, 307, 308)
          if (info.isRedirect === true) {
            this.websites[websiteIndex].redirectStatus = "301";
            this.websites[websiteIndex].redirectUrl =
              info.redirectUrl || info.finalRedirectUrl || null;
          }
          // Nếu status code 200 hoặc không có redirect
          else if (
            info.statusCode === 200 ||
            (info.statusCode >= 200 && info.statusCode < 300)
          ) {
            this.websites[websiteIndex].redirectStatus = "200";
            this.websites[websiteIndex].redirectUrl = null;
          }
          // Các trường hợp khác (lỗi)
          else {
            this.websites[websiteIndex].redirectStatus = "error";
            this.websites[websiteIndex].redirectUrl = null;
          }
        } else {
          console.error("Redirect check failed - invalid response:", result);
          this.websites[websiteIndex].redirectStatus = "error";
          this.websites[websiteIndex].redirectUrl = null;
        }
      } catch (error) {
        console.error("Error checking redirect:", error);
        this.websites[websiteIndex].redirectStatus = "error";
        this.websites[websiteIndex].redirectUrl = null;
      } finally {
        this.websites[websiteIndex].checkingRedirect = false;
      }
    },
    async checkAllRedirects() {
      // Check redirect cho tất cả websites (không hiển thị alert)
      for (const website of this.websites) {
        if (website.domain) {
          await this.checkRedirect(website.id);
          // Delay nhỏ giữa các request
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    },
    getRedirectTooltip(website) {
      if (!website) return "301 Redirect";
      if (website.redirectStatus === "301") {
        if (website.redirectUrl && website.redirectUrl.trim()) {
          return `301 Redirect to: ${website.redirectUrl}`;
        }
        return "301 Redirect";
      }
      return "301 Redirect";
    },
    async checkBlock(websiteId) {
      try {
        await api.checkWebsiteBlock(websiteId);
        this.loadWebsites();
      } catch (error) {
        console.error("Lỗi khi check chặn:", error);
      }
    },
    editWebsite(website) {
      this.editingWebsite = website;
      this.form = {
        domain: website.domain,
        team_id: website.team_id || "",
        keyword: website.keyword || "",
        checkRankingAfterCreate: false,
        note: website.note || "",
      };
    },
    async saveWebsite() {
      try {
        if (this.editingWebsite) {
          await api.updateWebsite(this.editingWebsite.id, this.form);
        } else {
          await api.createWebsite(this.form);
        }
        this.closeModal();
        this.loadWebsites();
      } catch (error) {
        console.error("Error saving website:", error);
      }
    },
    async deleteWebsite(id) {
      if (!confirm("Bạn có chắc muốn xóa website này?")) {
        return;
      }

      try {
        await api.deleteWebsite(id);
        alert("Xóa website thành công!");
        this.loadWebsites();
      } catch (error) {
        alert("Lỗi khi xóa website: " + error.message);
      }
    },
    closeModal() {
      this.showAddModal = false;
      this.editingWebsite = null;
      this.form = {
        domain: "",
        team_id: "",
        keyword: "",
        checkRankingAfterCreate: false,
        note: "",
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
        ERROR: "badge badge-danger",
      };
      return map[status] || "badge badge-secondary";
    },
    formatBlockStatus(status) {
      const map = {
        OK: "OK",
        BLOCK_DNS: "Chặn DNS",
        BLOCK_HTTP: "Chặn HTTP",
        BLOCK_HTTPS: "Chặn HTTPS",
        BLOCK_UNKNOWN: "Chặn (?)",
        ERROR: "Lỗi",
      };
      return map[status] || status;
    },
    getBlockStatusTooltip(block) {
      let tooltip = `${block.isp_name}: ${block.status}`;
      if (block.http_code) {
        tooltip += ` (HTTP ${block.http_code})`;
      }
      if (block.error_message) {
        tooltip += ` - ${block.error_message}`;
      }
      if (block.checked_at) {
        const date = new Date(block.checked_at);
        tooltip += ` - Check: ${date.toLocaleString("vi-VN")}`;
      }
      return tooltip;
    },
  },
};
</script>
<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.form-group {
  width: 100%;
}
</style>
