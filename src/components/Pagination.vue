<template>
  <div class="pagination" v-if="totalPages > 1">
    <div class="pagination-info">
      Hiển thị {{ startItem }}-{{ endItem }} trong tổng số {{ total }} mục
    </div>
    <div class="pagination-controls">
      <button
        class="btn btn-secondary btn-sm"
        @click="goToPage(1)"
        :disabled="currentPage === 1"
      >
        « Đầu
      </button>
      <button
        class="btn btn-secondary btn-sm"
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
      >
        ‹ Trước
      </button>

      <div class="pagination-pages">
        <button
          v-for="page in visiblePages"
          :key="page"
          class="btn btn-sm"
          :class="page === currentPage ? 'btn-primary' : 'btn-secondary'"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </div>

      <button
        class="btn btn-secondary btn-sm"
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
      >
        Sau ›
      </button>
      <button
        class="btn btn-secondary btn-sm"
        @click="goToPage(totalPages)"
        :disabled="currentPage === totalPages"
      >
        Cuối »
      </button>
    </div>
    <div class="pagination-limit">
      <label>Hiển thị:</label>
      <select v-model="localLimit" @change="onLimitChange">
        <option :value="10">10</option>
        <option :value="20">20</option>
        <option :value="50">50</option>
        <option :value="100">100</option>
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: "Pagination",
  props: {
    currentPage: {
      type: Number,
      required: true,
      default: 1,
    },
    totalPages: {
      type: Number,
      required: true,
      default: 1,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    limit: {
      type: Number,
      required: true,
      default: 10,
    },
  },
  data() {
    return {
      localLimit: this.limit,
    };
  },
  computed: {
    startItem() {
      return (this.currentPage - 1) * this.limit + 1;
    },
    endItem() {
      const end = this.currentPage * this.limit;
      return end > this.total ? this.total : end;
    },
    visiblePages() {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(this.totalPages, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      return pages;
    },
  },
  watch: {
    limit(newVal) {
      this.localLimit = newVal;
    },
  },
  methods: {
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.$emit("page-change", page);
      }
    },
    onLimitChange() {
      this.$emit("limit-change", this.localLimit);
    },
  },
};
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: var(--radius);
  margin-top: 24px;
  box-shadow: var(--shadow-sm);
}

.pagination-info {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-pages {
  display: flex;
  gap: 4px;
}

.pagination-limit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-limit label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
  margin: 0;
}

.pagination-limit select {
  padding: 6px 12px;
  border: 2px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-limit select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

@media (max-width: 768px) {
  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .pagination-limit {
    justify-content: center;
  }
}
</style>
