<script setup lang="ts">
// ============================================================
// 巡检计划 · 列表页骨架（2026-10-19 晚补连续提交用）
// TODO(明日/阶段 1)：按《巡检计划-开发清单.md》补全：
//   1. 写死数据补到 5~8 条，覆盖停用/三种频率/跨年/长名称/空执行人
//   2. 阶段 2：字段抽到 src/types/inspectPlan.ts
//   3. 阶段 3：数据移到 src/mock/inspectPlanDb.ts（引用 devices）
//   4. 阶段 4：抽 src/api/inspectPlan.ts，阶段 5 列表页全部接 API
// ============================================================
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import InspectPlanFormDialog from './InspectPlanFormDialog.vue'

interface PlanRow {
  id: number
  planName: string
  deviceId: number
  deviceCode: string
  deviceName: string
  frequency: 1 | 2 | 3
  executor: string
  startDate: string
  endDate: string
  status: 0 | 1
}

// 写死数据（阶段 3 移到 mock）
const rows = ref<PlanRow[]>([
  {
    id: 1,
    planName: '电机-每日点检计划',
    deviceId: 1,
    deviceCode: 'EQ-2026-001',
    deviceName: '电机-001号',
    frequency: 1,
    executor: '张伟',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    status: 1,
  },
  {
    id: 2,
    planName: '水泵-每周点检计划',
    deviceId: 2,
    deviceCode: 'EQ-2026-002',
    deviceName: '水泵-002号',
    frequency: 2,
    executor: '李强',
    startDate: '2026-10-01',
    endDate: '2026-11-30',
    status: 0,
  },
  {
    id: 3,
    planName: '配电柜-每月点检计划（跨年生效）',
    deviceId: 3,
    deviceCode: 'EQ-2026-003',
    deviceName: '配电柜-003号',
    frequency: 3,
    executor: '',
    startDate: '2026-12-01',
    endDate: '2027-03-01',
    status: 1,
  },
])

const keyword = ref('')
const deviceId = ref<number | ''>('')
const frequency = ref<number | ''>('')
const status = ref<number | ''>('')

const frequencyMap: Record<number, { label: string; type: 'primary' | 'success' | 'warning' }> = {
  1: { label: '每日', type: 'primary' },
  2: { label: '每周', type: 'success' },
  3: { label: '每月', type: 'warning' },
}

// 阶段 2 后改为从 mock/db.ts 的 devices 生成
const deviceOptions = [
  { value: 1, label: 'EQ-2026-001 电机-001号' },
  { value: 2, label: 'EQ-2026-002 水泵-002号' },
  { value: 3, label: 'EQ-2026-003 配电柜-003号' },
]

const dialogVisible = ref(false)
const editingRow = ref<PlanRow | null>(null)

function handleSearch() {
  // TODO(阶段 5)：接 getInspectPlanPage
  ElMessage.info('筛选逻辑将在阶段 5 接入 API，当前为骨架')
}

function handleReset() {
  keyword.value = ''
  deviceId.value = ''
  frequency.value = ''
  status.value = ''
}

function openCreate() {
  editingRow.value = null
  dialogVisible.value = true
}

function openEdit(row: PlanRow) {
  editingRow.value = row
  dialogVisible.value = true
}

async function handleDelete(row: PlanRow) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.planName}」吗？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  rows.value = rows.value.filter((r) => r.id !== row.id)
  ElMessage.success('已删除（骨架阶段仅删内存数据）')
}

function handleSuccess() {
  ElMessage.success('保存成功（骨架阶段暂不落库）')
}
</script>

<template>
  <div>
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="关键字">
          <el-input v-model="keyword" placeholder="计划名称 / 设备名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="设备">
          <el-select v-model="deviceId" placeholder="全部" clearable style="width: 220px">
            <el-option v-for="d in deviceOptions" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="频率">
          <el-select v-model="frequency" placeholder="全部" clearable style="width: 120px">
            <el-option label="每日" :value="1" />
            <el-option label="每周" :value="2" />
            <el-option label="每月" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
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
        <span>共 {{ rows.length }} 条巡检计划</span>
        <el-button type="primary" @click="openCreate">新增巡检计划</el-button>
      </div>

      <el-table :data="rows" border stripe>
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
            <el-tag :type="frequencyMap[row.frequency]?.type">{{ frequencyMap[row.frequency]?.label }}</el-tag>
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
            <el-switch v-model="row.status" :active-value="1" :inactive-value="0" />
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
        <!-- TODO(阶段 5)：接 getInspectPlanPage 后启用联动 -->
        <el-pagination background layout="total, prev, pager, next, sizes" :total="rows.length" :page-size="10" />
      </div>
    </el-card>

    <InspectPlanFormDialog
      v-model="dialogVisible"
      :row="editingRow"
      @success="handleSuccess"
    />
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
