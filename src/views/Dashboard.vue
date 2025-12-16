<template>
  <div class="container">
    <div class="page-header">
      <h1>📊 Dashboard Tổng quan</h1>
    </div>

    <div v-if="loading" class="loading">Đang tải dữ liệu...</div>
    <div v-else>
      <!-- Thống kê tổng quan -->
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Tổng số Website</h3>
          <div class="value">{{ overview.totalWebsites || 0 }}</div>
        </div>
        <div class="stat-card">
          <h3>Website bị chặn (24h)</h3>
          <div class="value">{{ overview.blockedWebsites || 0 }}</div>
        </div>
        <div class="stat-card">
          <h3>Tổng số Từ khóa</h3>
          <div class="value">{{ overview.totalKeywords || 0 }}</div>
        </div>
        <div class="stat-card">
          <h3>Từ khóa có Ranking</h3>
          <div class="value">{{ overview.keywordsWithRanking || 0 }}</div>
        </div>
      </div>

      <!-- Biểu đồ thống kê chặn theo ISP -->
      <div class="card">
        <h2>📡 Thống kê chặn theo Nhà mạng</h2>
        <div v-if="blockStatsChartData">
          <Bar :data="blockStatsChartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Website bị chặn -->
      <div class="card">
        <h2>🚫 Website bị chặn gần đây</h2>
        <div
          v-if="blockedPagination"
          class="mb-2"
          style="color: var(--text-secondary); font-size: 14px"
        >
          Tổng: {{ blockedPagination.total }} website
        </div>
        <table class="table" v-if="blockedWebsites.length > 0">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Team</th>
              <th>Nhà mạng</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in blockedWebsites"
              :key="`${item.id}-${item.isp_name}`"
            >
              <td>{{ item.domain }}</td>
              <td>{{ item.team_name || "-" }}</td>
              <td>{{ item.isp_name }}</td>
              <td>
                <span :class="getStatusBadgeClass(item.block_status)">
                  {{ item.block_status }}
                </span>
              </td>
              <td>{{ formatDate(item.checked_at) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>Không có website nào bị chặn</p>

        <!-- Pagination -->
        <Pagination
          v-if="blockedPagination && blockedPagination.totalPages > 1"
          :current-page="blockedPagination.page"
          :total-pages="blockedPagination.totalPages"
          :total="blockedPagination.total"
          :limit="blockedPagination.limit"
          @page-change="handleBlockedPageChange"
          @limit-change="handleBlockedLimitChange"
        />
      </div>

      <!-- Thay đổi Ranking -->
      <div class="card">
        <h2>Thay đổi Ranking gần đây</h2>
        <table class="table" v-if="rankingChanges.length > 0">
          <thead>
            <tr>
              <th>Từ khóa</th>
              <th>Domain</th>
              <th>Vị trí hiện tại</th>
              <th>Vị trí trước</th>
              <th>Thay đổi</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in rankingChanges" :key="item.id">
              <td>{{ item.keyword }}</td>
              <td>{{ item.domain }}</td>
              <td>{{ item.current_position || "N/A" }}</td>
              <td>{{ item.previous_position || "N/A" }}</td>
              <td>
                <span v-if="item.change" :class="getChangeClass(item.change)">
                  {{ item.change > 0 ? "+" : "" }}{{ item.change }}
                </span>
                <span v-else>-</span>
              </td>
              <td>{{ formatDate(item.checked_at) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>Chưa có dữ liệu thay đổi ranking</p>
      </div>
    </div>
  </div>
</template>

<script>
import { Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import api from "../services/api";
import Pagination from "../components/Pagination.vue";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default {
  name: "Dashboard",
  components: {
    Bar,
    Pagination,
  },
  data() {
    return {
      loading: true,
      overview: {},
      blockedWebsites: [],
      blockedPagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
      },
      rankingChanges: [],
      blockStatsChartData: null,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "Thống kê chặn theo Nhà mạng (24h gần nhất)",
          },
        },
      },
    };
  },
  mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      try {
        this.loading = true;
        const params = new URLSearchParams({
          page: this.blockedPagination.page,
          limit: this.blockedPagination.limit,
        });
        const [overviewRes, blockedRes, rankingRes] = await Promise.all([
          api.getDashboardOverview(),
          api.getBlockedWebsites(`?${params}`),
          api.getRankingChanges(),
        ]);

        this.overview = overviewRes.data;
        this.blockedWebsites = blockedRes.data || [];
        this.blockedPagination =
          blockedRes.pagination || this.blockedPagination;
        this.rankingChanges = rankingRes.data || [];

        // Xử lý dữ liệu cho biểu đồ
        if (overviewRes.data.blockStatsByISP) {
          this.processBlockStats(overviewRes.data.blockStatsByISP);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        this.loading = false;
      }
    },
    handleBlockedPageChange(page) {
      this.blockedPagination.page = page;
      this.loadData();
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    handleBlockedLimitChange(limit) {
      this.blockedPagination.limit = limit;
      this.blockedPagination.page = 1;
      this.loadData();
    },
    processBlockStats(stats) {
      const ispMap = {};
      const statusTypes = [
        "OK",
        "BLOCK_DNS",
        "BLOCK_HTTP",
        "BLOCK_HTTPS",
        "BLOCK_UNKNOWN",
      ];

      stats.forEach((stat) => {
        if (!ispMap[stat.isp_name]) {
          ispMap[stat.isp_name] = {};
        }
        ispMap[stat.isp_name][stat.status] = stat.count;
      });

      const isps = Object.keys(ispMap);
      const datasets = statusTypes.map((status, index) => {
        const colors = ["#28a745", "#dc3545", "#ffc107", "#17a2b8", "#6c757d"];
        return {
          label: status,
          data: isps.map((isp) => ispMap[isp][status] || 0),
          backgroundColor: colors[index],
        };
      });

      this.blockStatsChartData = {
        labels: isps,
        datasets,
      };
    },
    getStatusBadgeClass(status) {
      const map = {
        OK: "badge badge-success",
        BLOCK_DNS: "badge badge-danger",
        BLOCK_HTTP: "badge badge-danger",
        BLOCK_HTTPS: "badge badge-danger",
        BLOCK_UNKNOWN: "badge badge-warning",
      };
      return map[status] || "badge";
    },
    getChangeClass(change) {
      if (change > 0) return "badge badge-danger";
      if (change < 0) return "badge badge-success";
      return "badge";
    },
    formatDate(dateString) {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN");
    },
  },
};
</script>

<style scoped>
.card {
  margin-bottom: 30px;
}

.card h2 {
  margin-bottom: 20px;
  color: #333;
}
</style>
