<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getDashboardOverview, getDashboardTrend, getDashboardCategory } from '@/api/dashboard'
import type {
  DashboardOverview,
  DashboardTrendPoint,
  DashboardCategoryItem,
} from '@/types/dashboard'
import EChart from '@/components/EChart.vue'
import type { EChartsOption } from 'echarts'

const loading = ref(false)
const overview = ref<DashboardOverview | null>(null)
const trend = ref<DashboardTrendPoint[]>([])
const category = ref<DashboardCategoryItem[]>([])

const trendOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 48, right: 24, top: 32, bottom: 32 },
  xAxis: {
    type: 'category',
    data: trend.value.map((t) => t.date.slice(5)),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      type: 'line',
      data: trend.value.map((t) => t.count),
      smooth: true,
      symbolSize: 6,
      itemStyle: { color: '#409eff' },
      areaStyle: { opacity: 0.08 },
    },
  ],
}))
const categoryOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}：{c} 台（{d}%）' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: false },
      },
      data: category.value.map((c) => ({ name: c.category, value: c.count })),
    },
  ],
}))
async function loadAll() {
  loading.value = true
  try {
    const [overviewRes, trendRes, categoryRes] = await Promise.all([
      getDashboardOverview(),
      getDashboardTrend(7),
      getDashboardCategory(),
    ])
    overview.value = overviewRes
    trend.value = trendRes
    category.value = categoryRes
  } catch (e) {
    ElMessage.error((e as Error).message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
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

    <el-row :gutter="16">
      <el-col :xs="24" :md="16">
        <el-card shadow="never">
          <template #header>近 7 天异常趋势</template>
          <EChart :option="trendOption" height="320px" />
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card shadow="never">
          <template #header>设备类型分布</template>
          <EChart :option="categoryOption" height="320px" />
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
</style>
