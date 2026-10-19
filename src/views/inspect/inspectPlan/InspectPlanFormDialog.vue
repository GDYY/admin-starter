<script setup lang="ts">
// ============================================================
// 巡检计划 · 表单弹窗骨架（2026-10-19 晚补连续提交用）
// TODO(明日/阶段 6)：按清单接 API：
//   1. 编辑回填改为 getInspectPlanById(row.id)
//   2. 提交改为 createInspectPlan / updateInspectPlan
//   3. 成功后 emit('success')，列表页刷新
//   4. dateRange 数组 → startDate/endDate 用 ?? 转换（本文件已演示）
// ============================================================
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

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

const props = defineProps<{ modelValue: boolean; row: PlanRow | null }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const formRef = ref<FormInstance>()

const form = reactive({
  planName: '',
  deviceId: undefined as number | undefined,
  frequency: 1 as 1 | 2 | 3,
  executor: '',
  dateRange: [] as string[],
  status: 1 as 0 | 1,
})

// 阶段 2 后改为从 mock/db.ts 的 devices 生成
const deviceOptions = [
  { value: 1, label: 'EQ-2026-001 电机-001号' },
  { value: 2, label: 'EQ-2026-002 水泵-002号' },
  { value: 3, label: 'EQ-2026-003 配电柜-003号' },
]

const rules: FormRules = {
  planName: [
    { required: true, message: '请输入计划名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  deviceId: [{ required: true, message: '请选择设备', trigger: 'change' }],
  frequency: [{ required: true, message: '请选择频率', trigger: 'change' }],
  dateRange: [{ required: true, type: 'array', message: '请选择生效期间', trigger: 'change' }],
}

function resetForm() {
  form.planName = ''
  form.deviceId = undefined
  form.frequency = 1
  form.executor = ''
  form.dateRange = []
  form.status = 1
  formRef.value?.clearValidate()
}

function fillForm(row: PlanRow) {
  form.planName = row.planName
  form.deviceId = row.deviceId
  form.frequency = row.frequency
  form.executor = row.executor
  form.dateRange = row.startDate && row.endDate ? [row.startDate, row.endDate] : []
  form.status = row.status
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    resetForm()
    if (props.row) fillForm(props.row)
  },
)

// 表单状态 → 接口结构：dateRange 数组拆成两个字段（用 ?? 不用 ||）
function buildPayload() {
  return {
    planName: form.planName,
    deviceId: form.deviceId as number,
    frequency: form.frequency,
    executor: form.executor,
    startDate: form.dateRange[0] ?? '',
    endDate: form.dateRange[1] ?? '',
    status: form.status,
  }
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  // TODO(阶段 6)：换成 createInspectPlan / updateInspectPlan
  console.log('[巡检计划] 提交 payload：', buildPayload())
  ElMessage.success('骨架阶段：payload 已打印到控制台')
  emit('update:modelValue', false)
  emit('success')
}

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="row ? '编辑巡检计划' : '新增巡检计划'"
    width="560px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="计划名称" prop="planName">
        <el-input v-model="form.planName" placeholder="例如：电机-每日点检计划" maxlength="50" show-word-limit />
      </el-form-item>

      <el-form-item label="适用设备" prop="deviceId">
        <el-select v-model="form.deviceId" filterable placeholder="请选择设备" style="width: 100%">
          <el-option v-for="d in deviceOptions" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="巡检频率" prop="frequency">
        <el-radio-group v-model="form.frequency">
          <el-radio :value="1">每日</el-radio>
          <el-radio :value="2">每周</el-radio>
          <el-radio :value="3">每月</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="执行人" prop="executor">
        <el-input v-model="form.executor" placeholder="例如：张伟" maxlength="20" />
      </el-form-item>

      <el-form-item label="生效期间" prop="dateRange">
        <el-date-picker
          v-model="form.dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
