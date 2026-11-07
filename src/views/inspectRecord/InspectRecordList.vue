<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getInspectRecords, getRecordExecutorOptions, getInspectRecordById } from '@/api/inspect'
import { RESULT_MAP, RESULT_OPTIONS } from '@/types/inspect'
import type { InspectRecordRow, InspectRecordQuery, InspectResult } from '@/types/inspect'
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
const currentRecord = ref<InspectRecordRow | null>(null)
const drawerVisible = ref(false)

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

/**
 * 查询。必须把 page 重置回 1：
 * 否则翻到第 5 页再搜一个只有 3 条结果的条件，就会停在空列表上。
 */
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
async function openDetail(row: InspectRecordRow) {
  try {
    const data = await getInspectRecordById(row.id)
    if (!data) {
      ElMessage.warning('记录不存在，请刷新列表')
      return
    }
    currentRecord.value = data
    drawerVisible.value = true
  } catch (e) {
    ElMessage.error((e as Error).message || '查询失败')
  }
}
// 刷新：条件不动，重新拉
async function handleRefresh() {
  await loadData()
  if (list.value.length === 0 && query.page > 1) {
    query.page = 1
    await loadData()
  }
}
/** 关闭动画结束后再清状态 */
function resetDrawer() {
  currentRecord.value = null
}
// 关闭抽屉时的逻辑
function onDrawerClose() {
  drawerVisible.value = false
}

/** 抽屉标题 */
const drawerTitle = computed(() => {
  const name = currentRecord.value?.deviceName ?? ''
  const code = currentRecord.value?.deviceCode ?? ''
  return `巡检记录 —— ${name}(${code})`
})
onMounted(() => {
  loadData()
})
</script>

<template>
  <div>
    <el-card shadow="never" class="filter-card">
      <el-form inline @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            style="width: 200px"
            placeholder="设备编号 / 设备名称"
            clearable
            @keyup.enter="handleSearch"
            v-model="query.keyword"
          />
        </el-form-item>
        <el-form-item label="执行人">
          <el-select
            filterable
            placeholder="全部"
            clearable
            v-model="query.executor"
            style="width: 120px"
          >
            <el-option
              v-for="d in executorOptions"
              :key="d.value"
              :label="d.label"
              :value="d.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="结果">
          <el-select v-model="query.result" placeholder="全部" clearable style="width: 120px">
            <el-option
              v-for="c in RESULT_OPTIONS"
              :key="c.value"
              :label="c.label"
              :value="c.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="巡检日期">
          <el-date-picker
            v-model="query.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div class="toolbar">
        <span>共 {{ total }} 条巡检记录</span>
        <el-button type="primary" @click="handleRefresh">刷新</el-button>
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
        <el-table-column prop="inspectTime" label="巡检时间" min-width="170" />
        <el-table-column prop="executor" label="执行人" width="100">
          <template #default="{ row }">{{ row.executor || '—' }}</template>
        </el-table-column>
        <el-table-column label="结果" width="110">
          <template #default="{ row }">
            <el-tag :type="RESULT_MAP[row.result as InspectResult]?.type">{{
              RESULT_MAP[row.result as InspectResult]?.label
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="abnormalCount" label="异常项" width="90">
          <template #default="{ row }">
            <el-text :type="row.abnormalCount > 0 ? 'danger' : 'info'">
              {{ row.abnormalCount }}
            </el-text>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[10, 20, 50]"
          @current-change="loadData"
          @size-change="handleSearch"
        />
      </div>
    </el-card>
    <el-drawer @closed="resetDrawer" :title="drawerTitle" v-model="drawerVisible" size="45%">
      <el-card shadow="never">
        <el-descriptions column="2" size="small">
          <el-descriptions-item label="设备编号">
            {{ currentRecord?.deviceCode }}
          </el-descriptions-item>
          <el-descriptions-item label="执行人">
            {{ currentRecord?.executor || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="设备名称">
            {{ currentRecord?.deviceName }}
          </el-descriptions-item>
          <el-descriptions-item label="巡检时间">
            {{ currentRecord?.inspectTime }}
          </el-descriptions-item>
          <el-descriptions-item label="结果">
            <el-tag :type="RESULT_MAP[currentRecord?.result as InspectResult]?.type">{{
              RESULT_MAP[currentRecord?.result as InspectResult]?.label
            }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ currentRecord?.createdAt }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ currentRecord?.remark || '—' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      <el-card shadow="never" style="margin-top: 12px">
        <div class="inspect-rows">
          <div
            v-for="(row, index) in currentRecord?.details"
            :key="row.itemId"
            class="inspect-row"
            :class="{ 'is-abnormal': row.isAbnormal === 1 }"
          >
            <div class="row-head">
              <span class="row-name">{{ index + 1 }}. {{ row.itemName }}</span>
              <span class="row-control">{{ row.checkValue || '—' }}</span>
            </div>

            <div class="row-foot">
              <span class="row-result" :class="row.isAbnormal === 1 ? 'is-abnormal' : 'is-normal'">
                <el-icon>
                  <CircleCloseFilled v-if="row.isAbnormal === 1" />
                  <CircleCheckFilled v-else />
                </el-icon>
                {{ row.isAbnormal === 1 ? '异常' : '正常' }}
              </span>
            </div>

            <div v-if="row.remark" class="row-remark">{{ row.remark }}</div>
          </div>
        </div>
      </el-card>

      <template #footer>
        <div class="drawer-footer">
          <span class="stats">
            共<a class="b">{{ currentRecord?.details.length }}</a
            >项·异常<a class="abnormal">{{ currentRecord?.abnormalCount }}</a
            >项
          </span>
          <div>
            <el-button @click="onDrawerClose()">关闭</el-button>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.filter-card {
  margin-bottom: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
/* ---------- 抽屉里的点检项列表 ---------- */
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

  /* 异常行浅红底 */
  &.is-abnormal {
    background: #fef0f0;
    border-radius: 4px;
    padding-left: 10px;
    padding-right: 10px;
    margin: 0 -10px;
  }
}

/* 第一行：项名称（左） + 录入值（右） */
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

/* 录入值：靠右排列 */
.row-control {
  display: flex;
  align-items: center;
  margin-left: auto;
  flex: 0 0 auto;
}

/* 第二行：判定标准（左） + 判定结果（右） */
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

/* 异常备注框 */
.row-remark {
  margin-top: 8px;
}

/* ---------- 抽屉底部：统计 + 按钮 ---------- */
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
/* ---------- 抽屉 body 滚动 ---------- */
:deep(.el-drawer__body) {
  overflow-y: auto;
}
</style>
