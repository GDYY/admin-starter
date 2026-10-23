<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getTodayTasks, getExecutorOptions } from '@/api/inspect'
import type { InspectTaskQuery, InspectTask } from '@/types/inspect'
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

onMounted(async () => {
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
</script>

<template>
  <div class="inspect-item-list">
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
        <el-table-column type="index" label="序号" width="55" />
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
            {{ row.finished ? '已完成' : '未巡检' }}
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
            <el-button v-else link type="primary" @click="ElMessage.info('执行功能下一步实现')"
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
  </div>
</template>

<style scoped lang="scss">
.inspect-item-list {
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
</style>
