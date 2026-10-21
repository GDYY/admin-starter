<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteInspectPlan, getInspectPlanPage, toggleInspectPlanStatus } from '@/api/inspectPlan'
import type {
  EnableStatus,
  InspectFrequency,
  InspectPlan,
  InspectPlanQuery,
} from '@/types/inspectPlan'
import { FREQUENCY_MAP, FREQUENCY_OPTIONS, ENABLE_STATUS_OPTIONS } from '@/types/inspectPlan'
import { DEVICE_OPTIONS } from '@/mock/inspectPlanDb'
import InspectPlanFormDialog from './InspectPlanFormDialog.vue'

/* ---------------- 查询条件 ---------------- */
const query = reactive<InspectPlanQuery>({
  page: 1,
  pageSize: 10,
  keyword: '',
  deviceId: '',
  frequency: '',
  status: '',
})

/* ---------------- 列表数据 ---------------- */
const loading = ref(false)
const list = ref<InspectPlan[]>([])
const total = ref(0)

async function loadData() {
  loading.value = true
  try {
    const res = await getInspectPlanPage(query)
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
  query.deviceId = ''
  query.frequency = ''
  query.status = ''
  query.page = 1
  loadData()
}

/* ---------------- 新增 / 编辑 ---------------- */
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)

function openCreate() {
  editingId.value = null
  dialogVisible.value = true
}

function openEdit(row: InspectPlan) {
  editingId.value = row.id
  dialogVisible.value = true
}

function handleSuccess() {
  dialogVisible.value = false
  loadData()
}

/**
 * 行内开关：el-switch 有 v-model，点下去 row.status 立刻变了（乐观更新）。
 * 接口失败必须回滚，否则界面和后端不一致。
 */
async function handleStatusChange(row: InspectPlan) {
  const next = row.status
  try {
    await toggleInspectPlanStatus(row.id, next)
    if (next === 1) {
      ElMessage.success(`「${row.planName}」已启用`)
    } else {
      ElMessage.info(`「${row.planName}」已停用`)
    }
  } catch (e) {
    row.status = (next === 1 ? 0 : 1) as EnableStatus
    ElMessage.error((e as Error).message || '操作失败')
  }
}

/* ---------------- 删除 ---------------- */
async function handleDelete(row: InspectPlan) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.planName}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return // 用户点了取消
  }

  try {
    await deleteInspectPlan(row.id)
    ElMessage.success('删除成功')
    // 删的是当前页最后一条时往前翻一页，避免停在空页
    if (list.value.length === 1 && query.page > 1) {
      query.page -= 1
    }
    loadData()
  } catch (e) {
    ElMessage.error((e as Error).message || '删除失败')
  }
}

onMounted(loadData)
</script>

<template>
  <div>
    <el-card shadow="never" class="filter-card">
      <el-form inline @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="query.keyword"
            placeholder="计划名称 / 设备名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="设备">
          <el-select filterable v-model="query.deviceId" placeholder="全部" clearable>
            <el-option
              v-for="d in DEVICE_OPTIONS"
              :key="d.value"
              :label="d.label"
              :value="d.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="频率">
          <el-select v-model="query.frequency" placeholder="全部" clearable style="width: 120px">
            <el-option
              v-for="c in FREQUENCY_OPTIONS"
              :key="c.value"
              :label="c.label"
              :value="c.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option
              v-for="s in ENABLE_STATUS_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <div class="toolbar">
        <span>共 {{ total }} 条巡检计划</span>
        <el-button type="primary" @click="openCreate">新增巡检计划</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="planName" label="计划名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="设备" min-width="180">
          <template #default="{ row }">
            <div>{{ row.deviceCode }}</div>
            <div class="sub">{{ row.deviceName }}</div>
          </template>
        </el-table-column>
        <el-table-column label="频率" width="100">
          <template #default="{ row }">
            <el-tag :type="FREQUENCY_MAP[row.frequency as InspectFrequency]?.type">{{
              FREQUENCY_MAP[row.frequency as InspectFrequency]?.label
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="executor" label="执行人" width="100">
          <template #default="{ row }">{{ row.executor || '—' }}</template>
        </el-table-column>
        <el-table-column label="生效期间" width="210">
          <template #default="{ row }">{{ row.startDate }} ~ {{ row.endDate }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <InspectPlanFormDialog v-model="dialogVisible" :plan-id="editingId" @success="handleSuccess" />
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

.sub {
  color: #909399;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
