<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { getDeviceById } from '@/api/device'
import { getInspectRecords } from '@/api/inspect'
import { DEVICE_STATUS_MAP } from '@/types/device'
import type { Device } from '@/types/device'
import { RESULT_MAP } from '@/types/inspect'
import type { InspectRecordQuery, InspectRecordRow, InspectResult } from '@/types/inspect'

const route = useRoute()
const router = useRouter()
const loadError = ref(false)
/** 路由参数是字符串：先转数字，再挡掉 NaN（坑 1） */
const deviceId = computed<number | null>(() => {
  const id = Number(route.params.id)
  return Number.isNaN(id) ? null : id
})

/* ---------------- 设备信息 ---------------- */
const device = ref<Device | null>(null)
const deviceLoading = ref(true)
const statusMeta = computed(() => (device.value ? DEVICE_STATUS_MAP[device.value.status] : null))

/* ---------------- 巡检历史 ---------------- */
const query = reactive<InspectRecordQuery>({ page: 1, pageSize: 10 })
const records = ref<InspectRecordRow[]>([])
const total = ref(0)
const recordsLoading = ref(false)

async function loadDevice() {
  loadError.value = false
  const id = deviceId.value
  if (id === null) {
    deviceLoading.value = false
    return
  }
  deviceLoading.value = true
  try {
    device.value = await getDeviceById(id)
  } catch {
    loadError.value = true
    device.value = null
  } finally {
    deviceLoading.value = false
  }
}

async function loadRecords() {
  const id = deviceId.value
  if (id === null) return
  recordsLoading.value = true
  try {
    // 同一个记录接口，只是多带一个 deviceId；不在页面里碰 mock
    const res = await getInspectRecords({ ...query, deviceId: id })
    records.value = res.list
    total.value = res.total
  } catch {
    ElMessage.error('巡检记录加载失败')
  } finally {
    recordsLoading.value = false
  }
}
const resultState = computed(() => {
  if (deviceId.value === null) {
    return {
      icon: 'warning' as const,
      title: '设备编号不合法',
      subTitle: '地址里的编号不对，请从台账进入',
      canRetry: false,
    }
  }
  if (loadError.value) {
    return {
      icon: 'error' as const,
      title: '设备信息加载失败',
      subTitle: '可能是网络波动，稍后重试即可',
      canRetry: true,
    }
  }
  return {
    icon: 'warning' as const,
    title: '设备不存在',
    subTitle: '该设备可能已被删除，或编号有误',
    canRetry: false,
  }
})
function handleSizeChange() {
  query.page = 1
  loadRecords()
}

function goBack() {
  router.push('/device')
}

onMounted(() => {
  loadDevice()
  loadRecords()
})
</script>

<template>
  <div class="device-detail">
    <!-- 顶部：返回 + 标题 + 状态 -->
    <div class="detail-header">
      <el-button link :icon="ArrowLeft" @click="goBack">返回设备台账</el-button>
      <span class="detail-title">设备详情</span>
      <div class="spacer" />
      <el-tag v-if="statusMeta" :type="statusMeta.type">{{ statusMeta.label }}</el-tag>
    </div>

    <!-- 非法 id -->
    <el-result
      v-if="!deviceLoading && !device"
      :icon="resultState.icon"
      :title="resultState.title"
      :sub-title="resultState.subTitle"
    >
      <template #extra>
        <el-button v-if="resultState.canRetry" type="primary" @click="loadDevice">重试</el-button>
        <el-button type="primary" @click="goBack">返回设备台账</el-button>
      </template>
    </el-result>

    <template v-if="device">
      <!-- ============ 基本信息 ============ -->
      <el-card v-loading="deviceLoading" shadow="never">
        <template #header>基本信息</template>

        <el-descriptions :column="3">
          <el-descriptions-item label="设备编号">{{
            device?.deviceCode || '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{
            device?.deviceName || '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{
            device?.category || '—'
          }}</el-descriptions-item>

          <el-descriptions-item label="安装位置">{{
            device?.location || '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ device?.model || '—' }}</el-descriptions-item>
          <el-descriptions-item label="生产厂商">{{
            device?.manufacturer || '—'
          }}</el-descriptions-item>

          <el-descriptions-item label="采购日期">{{
            device?.purchaseDate || '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="责任人">{{ device?.manager || '—' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="statusMeta" :type="statusMeta.type" size="small">
              {{ statusMeta.label }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="创建时间">{{
            device?.createdAt || '—'
          }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ device?.remark || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- ============ 巡检历史 ============ -->
      <el-card v-loading="recordsLoading" shadow="never">
        <template #header>
          <div class="history-header">
            <span class="history-title">巡检历史</span>
            <span class="history-total">共 {{ total }} 条</span>
            <div class="spacer" />
            <el-button size="small" :icon="Refresh" @click="loadRecords">刷新</el-button>
          </div>
        </template>

        <el-table :data="records" border stripe empty-text="该设备暂无巡检记录">
          <el-table-column
            type="index"
            label="序号"
            width="60"
            align="center"
            :index="(i: number) => (query.page - 1) * query.pageSize + i + 1"
          />
          <el-table-column prop="inspectTime" label="巡检时间" min-width="170" />
          <el-table-column label="执行人" width="100">
            <template #default="{ row }">{{ row.executor || '—' }}</template>
          </el-table-column>
          <el-table-column label="结果" width="110">
            <template #default="{ row }">
              <el-tag :type="RESULT_MAP[row.result as InspectResult]?.type">{{
                RESULT_MAP[row.result as InspectResult]?.label
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="abnormalCount" label="异常项" width="90" align="center">
            <template #default="{ row }">
              <el-text :type="row.abnormalCount > 0 ? 'danger' : 'info'">
                {{ row.abnormalCount }}
              </el-text>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <el-pagination
            v-model:current-page="query.page"
            v-model:page-size="query.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            background
            @current-change="loadRecords"
            @size-change="handleSizeChange"
          />
        </div>
      </el-card>
    </template>
  </div>
</template>

<style scoped lang="scss">
.device-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.spacer {
  flex: 1;
}

.history-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.history-total {
  font-size: 12px;
  color: #909399;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
