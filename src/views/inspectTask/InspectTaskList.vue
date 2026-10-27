<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, CircleCloseFilled, Refresh, Search } from '@element-plus/icons-vue'
import {
  getTodayTasks,
  getExecutorOptions,
  getInspectItems,
  submitInspectRecord,
  getInspectRecordByTask,
} from '@/api/inspect'
import type {
  InspectTaskQuery,
  InspectTask,
  FormRow,
  InspectSubmitPayload,
  InspectRecord,
} from '@/types/inspect'
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
const itemsLoading = ref(false)
const list = ref<InspectTask[]>([])
const executorOptions = getExecutorOptions()
const total = ref(0)
const drawerVisible = ref(false)
const rows = ref<FormRow[]>([])
const currentTask = ref<InspectTask | null>(null)
const submitting = ref(false)
const formRemark = ref<string>('')
const record = ref<InspectRecord | null>(null)
const detailReadonly = ref(false)
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
}

/** 关闭动画结束后再清状态 */
function resetDrawer() {
  currentTask.value = null
  rows.value = []
  formRemark.value = ''
  detailReadonly.value = false
  record.value = null
}
// 获取当前日期
function getCurrentDate() {
  if (detailReadonly.value === true) {
    return record.value?.inspectTime
  }
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
// 打开抽屉，传入 category
async function openExecute(category: string, taskId: number) {
  itemsLoading.value = true
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
  } finally {
    itemsLoading.value = false
    drawerVisible.value = true
  }
}
async function openDetail(category: string, taskId: number) {
  itemsLoading.value = true
  try {
    const data = await getInspectRecordByTask(taskId)
    if (!data) {
      ElMessage.warning('该任务还没有巡检记录')
      return
    }
    record.value = data
    detailReadonly.value = true
    currentTask.value = list.value.find((task) => task.id === taskId) ?? null
    formRemark.value = record.value.remark
    drawerVisible.value = true
  } catch (e) {
    ElMessage.error((e as Error).message || '查询失败')
  } finally {
    itemsLoading.value = false
  }
}
/* ---------------- 动态控件 + 异常判定 ---------------- */

/** 行里是否已录入。*/
function isFilled(row: FormRow): boolean {
  return row.value.trim() !== ''
}

/** 异常判定*/
function isAbnormal(row: FormRow): boolean {
  const { checkType, minValue, maxValue } = row.item

  // 类型 1：正常/异常
  if (checkType === 1) return row.value === '异常'

  // 类型 3：文字描述
  if (checkType !== 2) return false

  // 类型 2：数值超范围才算异常。
  if (!isFilled(row)) return false
  const n = Number(row.value)
  if (!Number.isFinite(n)) return false
  if (minValue !== null && n < minValue) return true
  if (maxValue !== null && n > maxValue) return true
  return false
}

/** 已填项数：底部统计，输入时实时变 */
const filledCount = computed(() =>
  detailReadonly.value ? (record.value?.details.length ?? 0) : rows.value.filter(isFilled).length,
)
/** 异常项数 */
const abnormalCount = computed(() =>
  detailReadonly.value
    ? record.value?.details.filter((detail) => detail.isAbnormal === 1).length
    : rows.value.filter((row) => isAbnormal(row)).length,
)
/** 抽屉标题 */
const drawerTitle = computed(() => {
  const name = currentTask.value?.deviceName ?? ''
  const code = currentTask.value?.deviceCode ?? ''
  return `${detailReadonly.value ? '查看巡检' : '执行巡检'} —— ${name}(${code})`
})
function frequencyLabel(freq?: number | null): string {
  return freq == null ? '—' : (FREQUENCY_LABELS[freq as InspectFrequency] ?? '—')
}
/** 提交前校验 */
function validate(): string | null {
  if (rows.value.length === 0) return '没有可巡检的点检项'
  for (const row of rows.value) {
    if (row.value === '') {
      return `「${row.item.itemName}」还没有填写`
    }
    if (isAbnormal(row) && !row.remark.trim()) {
      return `「${row.item.itemName}」判定为异常，请填写异常描述`
    }
  }
  return null
}
async function handleSubmit() {
  const err = validate()
  if (err) {
    ElMessage.warning(err)
    return
  }
  const task = currentTask.value
  if (!task) {
    ElMessage.warning('任务数据已失效，请重新打开')
    return
  }
  const payload: InspectSubmitPayload = {
    planId: task.id,
    deviceId: task.deviceId,
    inspectTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    remark: formRemark.value,
    details: rows.value.map((row) => ({
      itemId: row.item.id,
      itemName: row.item.itemName, // 冗余存名字：以后标准改名，历史记录仍显示当时的名字
      checkValue: String(row.value),
      isAbnormal: isAbnormal(row) ? 1 : 0,
      remark: row.remark,
    })),
  }

  submitting.value = true
  try {
    await submitInspectRecord(payload)
    ElMessage.success('巡检结果已提交')
    onDrawerClose()
    await loadData()
  } catch (e) {
    ElMessage.error((e as Error).message || '提交失败')
  } finally {
    submitting.value = false
  }
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
              @click="openDetail(row.category, row.id)"
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
    <el-drawer @closed="resetDrawer" :title="drawerTitle" v-model="drawerVisible" size="45%">
      <el-card shadow="never">
        <el-descriptions column="2" size="small">
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
      <el-card shadow="never" v-loading="itemsLoading">
        <div class="inspect-rows" v-if="!detailReadonly">
          <div
            v-for="(row, index) in rows"
            :key="row.item.id"
            class="inspect-row"
            :class="{ 'is-abnormal': isAbnormal(row) }"
          >
            <div class="row-head">
              <span class="row-name">{{ index + 1 }}. {{ row.item.itemName }}</span>

              <div class="row-control">
                <el-radio-group v-if="row.item.checkType === 1" v-model="row.value">
                  <el-radio value="正常">正常</el-radio>
                  <el-radio value="异常">异常</el-radio>
                </el-radio-group>
                <el-input
                  type="number"
                  v-else-if="row.item.checkType === 2"
                  v-model="row.value"
                  placeholder="请输入数值"
                  style="width: 180px"
                >
                  <template #append>{{ row.item.unit }}</template>
                </el-input>

                <el-input
                  v-else
                  v-model="row.value"
                  placeholder="请描述检查结果"
                  style="width: 320px"
                />
              </div>
            </div>

            <div class="row-foot">
              <span class="row-standard">标准：{{ row.item.standard }}</span>
              <span
                v-if="isFilled(row)"
                class="row-result"
                :class="isAbnormal(row) ? 'is-abnormal' : 'is-normal'"
              >
                <el-icon>
                  <CircleCloseFilled v-if="isAbnormal(row)" />
                  <CircleCheckFilled v-else />
                </el-icon>
                {{ isAbnormal(row) ? '异常' : '正常' }}
              </span>
            </div>

            <el-input
              v-if="isAbnormal(row)"
              v-model="row.remark"
              type="textarea"
              :rows="2"
              resize="none"
              placeholder="请描述异常情况（必填）"
              class="row-remark"
            />
          </div>
          <el-input
            v-model="formRemark"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="本次巡检备注(选填)"
            class="row-remark"
          />
        </div>

        <div class="inspect-rows" v-else>
          <div
            v-for="(row, index) in record?.details"
            :key="row.itemId"
            class="inspect-row"
            :class="{ 'is-abnormal': row.isAbnormal === 1 }"
          >
            <div class="row-head">
              <span class="row-name">{{ index + 1 }}. {{ row.itemName }}</span>
              <span class="row-control">{{ row.checkValue }}</span>
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
          <el-input
            :readonly="detailReadonly"
            v-model="formRemark"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="本次巡检备注(选填)"
            class="row-remark"
          />
        </div>
      </el-card>

      <template #footer>
        <div class="drawer-footer">
          <span class="stats">
            共<a class="b">{{ record?.details.length }}</a
            >项·已填<a class="b">{{ filledCount }}</a
            >项·异常<a class="abnormal">{{ abnormalCount }}</a
            >项
          </span>
          <div>
            <el-button :disabled="submitting" @click="onDrawerClose()">取消</el-button>
            <el-button
              v-if="!detailReadonly"
              type="primary"
              :loading="submitting"
              @click="handleSubmit()"
              >提交巡检</el-button
            >
          </div>
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

/* 第一行：项名称（左） + 录入控件（右） */
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

/* 控件区：靠右排列 */
.row-control {
  display: flex;
  align-items: center;
  margin-left: auto;
  flex: 0 0 auto;
}

/* 第二行：判定标准（左） + 自动判定结果（右） */
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

/* 标准描述：灰色小字 */
.row-standard {
  flex: 1;
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
