<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createInspectPlan, getInspectPlanById, updateInspectPlan } from '@/api/inspectPlan'
import type { EnableStatus, InspectFrequency } from '@/types/inspectPlan'

const props = defineProps<{
  modelValue: boolean
  planId: number | null
  deviceOptions: { label: string; value: number }[]
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

/** 让父组件的 v-model 能用 */
const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const isEdit = computed(() => props.planId !== null)
const dialogTitle = computed(() => (isEdit.value ? '编辑巡检计划' : '新增巡检计划'))

const formRef = ref<FormInstance>()
const submitting = ref(false)
const loadingForm = ref(false)

interface FormState {
  planName: string
  deviceId: number | undefined
  frequency: InspectFrequency
  executor: string
  dateRange: string[]
  status: EnableStatus
}

/** 空表单：新增时用它，也用来重置 */
function emptyForm(): FormState {
  return {
    planName: '',
    deviceId: undefined,
    frequency: 1,
    executor: '',
    dateRange: [],
    status: 1,
  }
}

const form = reactive<FormState>(emptyForm())

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
  Object.assign(form, emptyForm())
  formRef.value?.clearValidate()
}

/** 编辑回填：表单需要把日期合成 dateRange */
async function fillForm(id: number) {
  loadingForm.value = true
  try {
    const target = await getInspectPlanById(id)
    if (!target) {
      ElMessage.error('巡检计划不存在')
      return
    }
    Object.assign(form, {
      planName: target.planName,
      deviceId: target.deviceId,
      frequency: target.frequency,
      executor: target.executor,
      dateRange: target.startDate && target.endDate ? [target.startDate, target.endDate] : [],
      status: target.status,
    })
  } catch (e) {
    ElMessage.error((e as Error).message || '加载失败')
  } finally {
    loadingForm.value = false
  }
}

/**
 * 关键点：弹窗每次「打开」时才决定是空表单还是回填数据。
 * 放在 watch 里而不是父组件传进来时立刻赋值，是为了避免还没打开就把数据写脏。
 */
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    resetForm()
    if (props.planId !== null) await fillForm(props.planId)
  },
)

function buildPayload() {
  return {
    planName: form.planName.trim(),
    deviceId: form.deviceId as number,
    frequency: form.frequency,
    executor: form.executor.trim(),
    startDate: form.dateRange?.[0] ?? '',
    endDate: form.dateRange?.[1] ?? '',
    status: form.status,
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  // validate() 校验不通过会 reject，用 catch 兜住转成 boolean
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && props.planId !== null) {
      await updateInspectPlan(props.planId, buildPayload())
      ElMessage.success('修改成功')
    } else {
      await createInspectPlan(buildPayload())
      ElMessage.success('新增成功')
    }
    visible.value = false
    emit('success')
  } catch (e) {
    ElMessage.error((e as Error).message || '保存失败')
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  visible.value = false
}
</script>

<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="560px" :close-on-click-modal="false">
    <el-form ref="formRef" v-loading="loadingForm" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="计划名称" prop="planName">
        <el-input
          v-model="form.planName"
          placeholder="例如：电机-每日点检计划"
          maxlength="50"
          show-word-limit
        />
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
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
