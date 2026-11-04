<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getInspectRecords, getRecordExecutorOptions } from '@/api/inspect'
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
function openDetail(_row: InspectRecordRow) {
  ElMessage.warning('后续完成查看页面')
}
// 刷新：条件不动，重新拉
async function handleRefresh() {
  await loadData()
  if (list.value.length === 0 && query.page > 1) {
    query.page = 1
    await loadData()
  }
}
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
</style>
