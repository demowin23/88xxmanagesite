<template>
  <div class="container">
    <div class="page-header">
      <h1>👥 Quản lý Teams</h1>
      <button class="btn btn-primary" @click="showAddModal = true">
        ➕ Thêm Team
      </button>
    </div>

    <div v-if="loading" class="loading">Đang tải...</div>
    <div v-else>
      <div class="card">
        <div
          v-if="pagination"
          class="mb-2"
          style="color: var(--text-secondary); font-size: 14px"
        >
          Tổng: {{ pagination.total }} teams
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Team</th>
              <th>Mô tả</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="team in teams" :key="team.id">
              <td>{{ team.id }}</td>
              <td>{{ team.name }}</td>
              <td>{{ team.description || "-" }}</td>
              <td>{{ formatDate(team.created_at) }}</td>
              <td>
                <button
                  class="btn btn-primary btn-sm"
                  @click="editTeam(team)"
                  style="margin-right: 5px"
                >
                  ✏️ Sửa
                </button>
                <button
                  class="btn btn-danger btn-sm"
                  @click="deleteTeam(team.id)"
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

    <!-- Modal thêm/sửa team -->
    <div v-if="showAddModal || editingTeam" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ editingTeam ? "✏️ Sửa Team" : "➕ Thêm Team mới" }}</h2>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="saveTeam">
          <div class="form-group">
            <label>Tên Team *</label>
            <input
              type="text"
              v-model="form.name"
              placeholder="SEO, Ads, Dev..."
              required
            />
          </div>
          <div class="form-group">
            <label
              >Tên đăng nhập (Username)
              {{ editingTeam ? "(để trống nếu không đổi)" : "*" }}</label
            >
            <input
              type="text"
              v-model="form.username"
              :placeholder="
                editingTeam
                  ? 'Để trống nếu không đổi username'
                  : 'Nhập tên đăng nhập cho team'
              "
              :required="!editingTeam"
            />
            <small
              style="
                color: var(--text-secondary);
                font-size: 12px;
                display: block;
                margin-top: 5px;
              "
            >
              <span v-if="!editingTeam">
                Nếu để trống, username sẽ tự động = tên team
              </span>
              <span v-else>
                Nhập username mới để đổi tên đăng nhập. Để trống nếu không muốn
                đổi.
              </span>
            </small>
          </div>
          <div class="form-group">
            <label
              >Mật khẩu cho tài khoản Team
              {{ editingTeam ? "(để trống nếu không đổi)" : "*" }}</label
            >
            <div style="position: relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                :placeholder="
                  editingTeam
                    ? 'Nhập mật khẩu mới (để trống nếu không đổi)'
                    : 'Nhập mật khẩu (để trống sẽ tự động tạo)'
                "
                :required="!editingTeam"
                style="padding-right: 40px"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                style="
                  position: absolute;
                  right: 10px;
                  top: 50%;
                  transform: translateY(-50%);
                  background: none;
                  border: none;
                  cursor: pointer;
                  padding: 5px;
                  color: var(--text-secondary);
                "
                :title="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
              >
                <span v-if="showPassword">👁️</span>
                <span v-else>👁️‍🗨️</span>
              </button>
            </div>
            <small
              style="
                color: var(--text-secondary);
                font-size: 12px;
                display: block;
                margin-top: 5px;
              "
            >
              <span v-if="!editingTeam">
                Tài khoản sẽ có username = tên team. Nếu để trống, mật khẩu mặc
                định sẽ là: tên-team-lowercase123
              </span>
              <span v-else>
                Nhập mật khẩu mới để đổi mật khẩu cho tài khoản team này. Để
                trống nếu không muốn đổi.
              </span>
            </small>
          </div>
          <!-- Hiển thị thông tin tài khoản sau khi tạo/sửa -->
          <div
            v-if="createdUserInfo"
            class="user-info-box"
            style="
              background: #e8f5e9;
              border: 2px solid #4caf50;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
            "
          >
            <h3 style="margin: 0 0 10px 0; color: #2e7d32">
              ✅
              {{
                editingTeam
                  ? "Mật khẩu đã được cập nhật!"
                  : "Tài khoản Team đã được tạo!"
              }}
            </h3>
            <div
              style="
                background: white;
                padding: 10px;
                border-radius: 4px;
                font-family: monospace;
              "
            >
              <div style="margin-bottom: 8px">
                <strong>Tên đăng nhập:</strong>
                <span style="color: #1976d2; font-weight: bold">{{
                  createdUserInfo.username
                }}</span>
              </div>
              <div>
                <strong>Mật khẩu:</strong>
                <span style="color: #d32f2f; font-weight: bold">{{
                  createdUserInfo.password
                }}</span>
              </div>
            </div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 12px">
              ⚠️ Vui lòng lưu lại thông tin này. Bạn sẽ không thể xem lại mật
              khẩu sau khi đóng cửa sổ này.
            </p>
          </div>
          <div class="form-group">
            <label>Mô tả</label>
            <textarea
              v-model="form.description"
              placeholder="Mô tả về team..."
            ></textarea>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px">
            <button
              v-if="createdUserInfo"
              type="button"
              class="btn btn-success"
              @click="handleCloseAfterCreate"
            >
              Đã lưu, đóng cửa sổ
            </button>
            <button
              v-if="!createdUserInfo"
              type="button"
              class="btn btn-secondary"
              @click="closeModal"
            >
              Hủy
            </button>
            <button
              v-if="!createdUserInfo"
              type="submit"
              class="btn btn-primary"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import api from "../services/api";
import Pagination from "../components/Pagination.vue";

export default {
  name: "Teams",
  components: {
    Pagination,
  },
  data() {
    return {
      loading: false,
      teams: [],
      showAddModal: false,
      editingTeam: null,
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
      },
      form: {
        name: "",
        username: "",
        description: "",
        password: "",
      },
      createdUserInfo: null,
    };
  },
  mounted() {
    this.loadTeams();
  },
  methods: {
    async loadTeams() {
      try {
        this.loading = true;
        const params = new URLSearchParams({
          page: this.pagination.page,
          limit: this.pagination.limit,
        });
        const response = await api.getTeams(`?${params}`);
        this.teams = response.data || [];
        this.pagination = response.pagination || this.pagination;
      } catch (error) {
        console.error("Error loading teams:", error);
      } finally {
        this.loading = false;
      }
    },
    handlePageChange(page) {
      this.pagination.page = page;
      this.loadTeams();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    handleLimitChange(limit) {
      this.pagination.limit = limit;
      this.pagination.page = 1;
      this.loadTeams();
    },
    editTeam(team) {
      this.editingTeam = team;
      this.form = {
        name: team.name,
        username: "", // Không hiển thị username cũ, để trống
        description: team.description || "",
        password: "",
      };
    },
    async saveTeam() {
      try {
        if (this.editingTeam) {
          const response = await api.updateTeam(this.editingTeam.id, this.form);
          // Nếu có đổi mật khẩu, hiển thị thông tin
          if (this.form.password && response.data && response.data.user) {
            this.createdUserInfo = {
              username: response.data.user.username,
              password: response.data.user.password,
            };
          } else {
            alert("Cập nhật team thành công!");
            this.closeModal();
            this.loadTeams();
          }
        } else {
          const response = await api.createTeam(this.form);
          // Hiển thị thông tin tài khoản được tạo
          if (response.data && response.data.user) {
            this.createdUserInfo = {
              username: response.data.user.username,
              password: response.data.user.password,
            };
            // Không đóng modal ngay, để hiển thị thông tin user
          } else {
            alert("Thêm team thành công!");
            this.closeModal();
            this.loadTeams();
          }
        }
      } catch (error) {
        alert("Lỗi: " + error.message);
      }
    },
    async deleteTeam(id) {
      if (!confirm("Bạn có chắc muốn xóa team này?")) {
        return;
      }

      try {
        await api.deleteTeam(id);
        alert("Xóa team thành công!");
        this.loadTeams();
      } catch (error) {
        alert("Lỗi khi xóa team: " + error.message);
      }
    },
    handleCloseAfterCreate() {
      this.createdUserInfo = null;
      this.closeModal();
      this.loadTeams();
    },
    closeModal() {
      this.showAddModal = false;
      this.editingTeam = null;
      this.createdUserInfo = null;
      this.form = {
        name: "",
        username: "",
        description: "",
        password: "",
      };
    },
    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    },
  },
};
</script>
