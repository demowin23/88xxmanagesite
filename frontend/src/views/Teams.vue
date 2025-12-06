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
    <div
      v-if="showAddModal || editingTeam"
      class="modal"
      @click.self="closeModal"
    >
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
            <label>Mô tả</label>
            <textarea
              v-model="form.description"
              placeholder="Mô tả về team..."
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

export default {
  name: "Teams",
  data() {
    return {
      loading: true,
      teams: [],
      showAddModal: false,
      editingTeam: null,
      form: {
        name: "",
        description: "",
      },
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
        description: team.description || "",
      };
    },
    async saveTeam() {
      try {
        if (this.editingTeam) {
          await api.updateTeam(this.editingTeam.id, this.form);
          alert("Cập nhật team thành công!");
        } else {
          await api.createTeam(this.form);
          alert("Thêm team thành công!");
        }
        this.closeModal();
        this.loadTeams();
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
    closeModal() {
      this.showAddModal = false;
      this.editingTeam = null;
      this.form = {
        name: "",
        description: "",
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
