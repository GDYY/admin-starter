<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getDashboardOverview } from '@/api/dashboard'
import type { DashboardOverview } from '@/types/dashboard'

const loading = ref(false)
const overview = ref<DashboardOverview | null>(null)

async function loadOverview() {
  loading.value = true
  try {
    overview.value = await getDashboardOverview()
  } catch (e) {
    ElMessage.error((e as Error).message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadOverview)
</script>

<template>
  <div v-loading="loading" class="dashboard">
    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">设备总数</div>
          <div class="stat-value">
            {{ overview?.deviceTotal ?? '—' }}<span class="stat-unit">台</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">今日应巡检</div>
          <div class="stat-value is-primary">
            {{ overview?.taskTotal ?? '—' }}<span class="stat-unit">项</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">今日已完成</div>
          <div class="stat-value is-success">
            {{ overview?.finishedCount ?? '—' }}<span class="stat-unit">项</span>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">今日异常</div>
          <div class="stat-value is-danger">
            {{ overview?.abnormalCount ?? '—' }}<span class="stat-unit">项</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 步骤 3 / 4：两个图表占位 -->
    <el-row :gutter="16">
      <el-col :xs="24" :md="16">
        <el-card shadow="never">
          <template #header>近 7 天异常趋势</template>
          <div class="chart-placeholder">步骤 3 在这里放折线图</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card shadow="never">
          <template #header>设备类型分布</template>
          <div class="chart-placeholder">步骤 4 在这里放环形图</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card {
  .stat-label {
    color: #909399;
    font-size: 13px;
    margin-bottom: 8px;
  }
  .stat-value {
    font-size: 30px;
    font-weight: 600;
    color: #303133;
    &.is-primary {
      color: #409eff;
    }
    &.is-success {
      color: #67c23a;
    }
    &.is-danger {
      color: #f56c6c;
    }
  }
  .stat-unit {
    margin-left: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #c0c4cc;
  }
}

.chart-placeholder {
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 13px;
}
</style>
