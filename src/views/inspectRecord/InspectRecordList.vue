<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, CircleCloseFilled, Refresh, Search } from '@element-plus/icons-vue'
import {
  getInspectRecords,
  getInspectRecordById,
  getRecordExecutorOptions,
} from '@/api/inspect'
import type { InspectRecordQuery, InspectRecordRow, InspectResult } from '@/types/inspect'
import { RESULT_MAP, RESULT_OPTIONS } from '@/types/inspect'

/* ---------------- 查询条件 ---------------- */
const query = reactive<InspectRecordQuery>({
  page: 1,
  pageSize: 10,
  keyword: '',
  executor: '',
  result: '',
  dateRange: [],
})

/* ---------------- 列表数据 ---------------- */
const loading = ref(false)
const list = ref<InspectRecordRow[]>([])
const total = ref(0)
const executorOptions = getRecordExecutorOptions()

/* ---------------- 详情抽屉 ---------------- */
const drawerVisible = ref(false)
const detailLoading = ref(false)
const currentRecord = ref<InspectRecordRow | null>(null)

const drawerTitle = computed(() => {
  const record = currentRecord.value
  return record ? `巡检记录 —— ${record.deviceName}(${record.deviceCode})` : '巡检记录'
})

onMounted(() => {
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const res = await getInspectRecords(query)
    list.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error((e as Error).message || '查询失败')
  } finally {
    loading.value = false
  }
}

/** 查询：条件一变必须把 page 重置回 1，否则会停在空页上 */
function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.executor = ''
  query.result = ''
  query.dateRange = []
  query.page = 1
  loadData()
}

/** 刷新：条件不动，重新拉 */
async function handleRefresh() {
  await loadData()
  if (list.value.length === 0 && query.page > 1) {
    query.page = 1
    await loadData()
  }
}

async function openDetail(row: InspectRecordRow) {
  detailLoading.value = true
  try {
    const record = await getInspectRecordById(row.id)
    if (!record) {
      ElMessage.warning('该记录已不存在，请刷新列表')
      return
    }
    currentRecord.value = record
    drawerVisible.value = true
  } catch (e) {
    ElMessage.error((e as Error).message || '查询失败')
  } finally {
    detailLoading.value = false
  }
}

function onDrawerClose() {
  drawerVisible.value = false
}

/** 关闭动画结束后再清数据，避免关到一半内容先空了 */
function resetDrawer() {
  currentRecord.value = null
}
</script>

<template>
  <div class="inspect-record-list">
    <!-- ============ 搜索区 ============ -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="query.keyword"
            placeholder="设备编号 / 设备名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="执行人">
          <el-select v-model="query.executor" clearable placeholder="全部" style="width: 140px">
            <el-option
              v-for="e in executorOptions"
              :key="e.value"
              :label="e.label"
              :value="e.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="结果">
          <el-select v-model="query.result" clearable placeholder="全部" style="width: 140px">
            <el-option
              v-for="r in RESULT_OPTIONS"
              :key="r.value"
              :label="r.label"
              :value="r.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="巡检日期">
          <el-date-picker
            v-model="query.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            unlink-panels
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ============ 列表区 ============ -->
    <el-card shadow="never">
      <div class="toolbar">
        <span class="total">共 <b>{{ total }}</b> 条巡检记录</span>
        <el-button @click="handleRefresh">刷新</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column
          type="index"
          label="序号"
          width="55"
          :index="(i: number) => (query.page - 1) * query.pageSize + i + 1"
        />
        <el-table-column prop="deviceCode" label="设备编号" min-width="130" />
        <el-table-column prop="deviceName" label="设备名称" min-width="130" />
        <el-table-column prop="inspectTime" label="巡检时间" width="170" />
        <el-table-column label="执行人" width="100">
          <template #default="{ row }">{{ row.executor || '—' }}</template>
        </el-table-column>
        <el-table-column label="结果" width="110">
          <template #default="{ row }">
            <el-tag :type="RESULT_MAP[row.result as InspectResult].type">{{
              RESULT_MAP[row.result as InspectResult].label
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="异常项" width="90" align="center">
          <template #default="{ row }">
            <span class="abnormal-count" :class="{ 'is-abnormal': row.abnormalCount > 0 }">{{
              row.abnormalCount
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @current-change="loadData"
          @size-change="handleSearch"
        />
      </div>
    </el-card>

    <!-- ============ 详情抽屉：只读 ============ -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="45%" @closed="resetDrawer">
      <div v-loading="detailLoading" class="drawer-body">
        <el-card v-if="currentRecord" shadow="never">
          <el-descriptions column="2" size="small">
            <el-descriptions-item label="设备编号">
              {{ currentRecord.deviceCode }}
            </el-descriptions-item>
            <el-descriptions-item label="设备名称">
              {{ currentRecord.deviceName }}
            </el-descriptions-item>
            <el-descriptions-item label="执行人">
              {{ currentRecord.executor || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="巡检时间">
              {{ currentRecord.inspectTime }}
            </el-descriptions-item>
            <el-descriptions-item label="提交时间">
              {{ currentRecord.createdAt }}
            </el-descriptions-item>
            <el-descriptions-item label="结果">
              <el-tag :type="RESULT_MAP[currentRecord.result].type">{{
                RESULT_MAP[currentRecord.result].label
              }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">
              {{ currentRecord.remark || '—' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card v-if="currentRecord" shadow="never" class="detail-card">
          <div class="inspect-rows">
            <div
              v-for="(detail, index) in currentRecord.details"
              :key="detail.itemId"
              class="inspect-row"
              :class="{ 'is-abnormal': detail.isAbnormal === 1 }"
            >
              <div class="row-head">
                <span class="row-name">{{ index + 1 }}. {{ detail.itemName }}</span>
                <span class="row-control">{{ detail.checkValue || '—' }}</span>
              </div>

              <div class="row-foot">
                <span
                  class="row-result"
                  :class="detail.isAbnormal === 1 ? 'is-abnormal' : 'is-normal'"
                >
                  <el-icon>
                    <CircleCloseFilled v-if="detail.isAbnormal === 1" />
                    <CircleCheckFilled v-else />
                  </el-icon>
                  {{ detail.isAbnormal === 1 ? '异常' : '正常' }}
                </span>
              </div>

              <div v-if="detail.remark" class="row-remark">{{ detail.remark }}</div>
            </div>

            <el-empty
              v-if="currentRecord.details.length === 0"
              description="这条记录没有明细"
              :image-size="60"
            />
          </div>
        </el-card>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <span class="stats">
            共<a class="b">{{ currentRecord?.details.length ?? 0 }}</a
            >项 · 异常<a class="abnormal">{{ currentRecord?.abnormalCount ?? 0 }}</a
            >项
          </span>
          <el-button @click="onDrawerClose">关闭</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.inspect-record-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;

  .total {
    color: #606266;
    font-size: 13px;

    b {
      color: #409eff;
      font-size: 15px;
    }
  }
}

.abnormal-count {
  color: #606266;

  &.is-abnormal {
    color: #f56c6c;
    font-weight: 600;
  }
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* ---------- 抽屉里的明细 ---------- */
.detail-card {
  margin-top: 12px;
}

.inspect-rows {
  display: flex;
  flex-direction: column;
}

.inspect-row {
  padding: 14px 0;
  border-bottom: 1px solid #ebeef5;

  &:last-child {
    border-bottom: none;
  }

  &.is-abnormal {
    background: #fef0f0;
    border-radius: 4px;
    padding-left: 10px;
    padding-right: 10px;
    margin: 0 -10px;
  }
}

.row-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 6px;
}

.row-name {
  flex: none;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.row-control {
  margin-left: auto;
  flex: 0 0 auto;
  color: #303133;
  font-size: 14px;
}

.row-foot {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 20px;
}

.row-result {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  font-size: 13px;

  &.is-normal {
    color: #67c23a;
  }

  &.is-abnormal {
    color: #f56c6c;
    font-weight: 600;
  }
}

.row-remark {
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

/* ---------- 抽屉底部 ---------- */
.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 0;
  border-top: 1px solid #ebeef5;
  margin-top: 12px;

  .stats {
    font-size: 13px;
    color: #606266;

    .b {
      color: #409eff;
      font-weight: 600;
    }

    .abnormal {
      color: #f56c6c;
    }
  }
}

/* ---------- 抽屉 body 滚动（长明细别把按钮顶出去） ---------- */
:deep(.el-drawer__body) {
  overflow-y: auto;
}
</style>
