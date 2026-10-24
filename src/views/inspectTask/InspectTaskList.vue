<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getTodayTasks, getExecutorOptions, getInspectItems } from '@/api/inspect'
import type { InspectTaskQuery, InspectTask, FormRow } from '@/types/inspect'
import { FREQUENCY_MAP } from '@/types/inspectPlan'
import type { InspectFrequency } from '@/types/inspectPlan'

/* ---------------- 查询条件 ---------------- */
const query = reactive<InspectTaskQuery>({
  page: 1,
  pageSize: 10,
  executor: '',
  finished: undefined,
})
/* ---------------- 列表数据 ---------------- */
const loading = ref(false)
const list = ref<InspectTask[]>([])
const executorOptions = getExecutorOptions()
const total = ref(0)
const drawerVisible = ref(false)
const currentTaskId = ref<number | null>(null)
const rows = ref<FormRow[]>([])
const currentTask = ref<InspectTask | null>(null)
const FREQUENCY_LABELS = {
  1: '每日点检',
  2: '每周点检',
  3: '每月点检',
}

onMounted(() => {
  loadData()
})
async function loadData() {
  loading.value = true
  try {
    const res = await getTodayTasks(query)
    list.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error((e as Error).message || '查询失败')
  } finally {
    loading.value = false
  }
}
// 查询
function handleSearch() {
  query.page = 1
  loadData()
}
// 重置
function handleReset() {
  query.executor = ''
  query.finished = undefined
  query.page = 1
  loadData()
}
// 刷新：条件不动，重新拉
async function handleRefresh() {
  await loadData()
  if (list.value.length === 0 && query.page > 1) {
    query.page = 1
    await loadData()
  }
}
// 关闭抽屉时的逻辑
function onDrawerClose() {
  drawerVisible.value = false
  currentTaskId.value = null
  rows.value = []
}
// 获取当前日期
function getCurrentDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
// 打开抽屉，传入 category
async function openExecute(category: string, taskId: number) {
  drawerVisible.value = true
  currentTaskId.value = taskId
  currentTask.value = list.value.find((task) => task.id === taskId) ?? null
  // 这里可以根据 category 去拉取不同的巡检项
  try {
    rows.value = (await getInspectItems(category)).map((item) => ({
      item,
      value: '',
      remark: '',
    }))
  } catch (e) {
    ElMessage.error((e as Error).message || '查询失败')
  }
}

function frequencyLabel(freq?: number | null): string {
  return freq == null ? '—' : (FREQUENCY_LABELS[freq as InspectFrequency] ?? '—')
}
</script>

<template>
  <div class="inspect-task-list">
    <!-- ============ 搜索区 ============ -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="执行人" style="width: 200px">
          <el-select v-model="query.executor" clearable placeholder="全部">
            <el-option
              v-for="c in executorOptions"
              :key="c.value"
              :label="c.label"
              :value="c.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="query.finished" clearable placeholder="全部" style="width: 130px">
            <el-option label="已完成" :value="true" />
            <el-option label="未巡检" :value="false" />
          </el-select>
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
        <span class="total"
          >共 <b>{{ total }}</b> 条巡查执行</span
        >
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
        <el-table-column prop="location" label="位置" min-width="150"></el-table-column>
        <el-table-column label="频率" width="100">
          <template #default="{ row }">
            <el-tag :type="FREQUENCY_MAP[row.frequency as InspectFrequency]?.type">{{
              FREQUENCY_MAP[row.frequency as InspectFrequency]?.label
            }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="180">
          <template #default="{ row }">
            <el-tag :type="row.finished ? 'success' : 'warning'">
              {{ row.finished ? '已完成' : '未巡检' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.finished"
              link
              type="primary"
              @click="ElMessage.info('查看功能下一步实现')"
              >查看</el-button
            >
            <el-button v-else link type="primary" @click="openExecute(row.category, row.id)"
              >执行</el-button
            >
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
    <el-drawer
      @close="onDrawerClose"
      :title="'执行巡检 —— ' + currentTask?.deviceName + '(' + currentTask?.deviceCode + ')'"
      v-model="drawerVisible"
      size="45%"
    >
      <el-card shadow="never">
        <el-descriptions v-if="currentTaskId" border="1" column="2" size="small">
          <el-descriptions-item label="位置">
            {{ currentTask?.location }}
          </el-descriptions-item>
          <el-descriptions-item label="执行人">
            {{ currentTask?.executor }}
          </el-descriptions-item>
          <el-descriptions-item label="计划:">
            {{ frequencyLabel(currentTask?.frequency) }}
          </el-descriptions-item>
          <el-descriptions-item label="时间:">
            {{ getCurrentDate() }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
      <el-card shadow="never">
        <div v-for="(row, index) in rows" :key="row.item.id" class="inspect-row">
          <div class="row-head">
            <span class="row-name">{{ index + 1 }}.{{ row.item.itemName }}</span>
          </div>
          <div class="row-standard">标准:{{ row.item.standard }}</div>
        </div> </el-card
      ><template #footer>
        <div class="drawer-footer">
          <span class="stats">
            共<a class="b">{{ rows.length }}</a
            >项·已填<a class="b">{{ 0 }}</a
            >项·异常<a class="abnormal">{{ 0 }}</a
            >项
          </span>
        </div>
        <div class="drawer-footer-button">
          <el-button @click="onDrawerClose()">取消</el-button>
          <el-button type="primary">保存</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.inspect-task-list {
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

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.range {
  font-family: Consolas, Monaco, monospace;
  color: #409eff;
}
.muted {
  color: #c0c4cc;
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

  /* 步骤 4：判定为异常时整行浅红底 */
  &.is-abnormal {
    background: #fef0f0;
    border-radius: 4px;
    padding-left: 10px;
    padding-right: 10px;
    margin: 0 -10px;
  }
}

/* 第一行：序号 + 项名称 + 判定结果 */
.row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.row-name {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.row-result {
  font-size: 13px;

  &.is-normal {
    color: #67c23a;
  }

  &.is-abnormal {
    color: #f56c6c;
    font-weight: 600;
  }
}

/* 控件区（步骤 3） */
.row-control {
  margin-bottom: 6px;
}

/* 标准描述：灰色小字 */
.row-standard {
  color: #909399;
  font-size: 12px;
  line-height: 1.6;
}

/* 异常备注框（步骤 4，条件出现） */
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
/* ---------- 抽屉 body 滚动（指南坑 #7） ---------- */
:deep(.el-drawer__body) {
  overflow-y: auto;
}
</style>
