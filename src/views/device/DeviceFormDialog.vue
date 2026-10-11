<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { createDevice, getDeviceById, updateDevice } from '@/api/device'
import type { DeviceForm } from '@/types/device'
import { DEVICE_STATUS_OPTIONS } from '@/types/device'

const props = defineProps<{
  modelValue: boolean
  deviceId: number | null
  categoryOptions: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'saved'): void
}>()

/** 让父组件的 v-model 能用 */
const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const isEdit = computed(() => props.deviceId !== null)
const dialogTitle = computed(() => (isEdit.value ? '编辑设备' : '新增设备'))

const formRef = ref<FormInstance>()
const submitting = ref(false)

/** 空表单：新增时用它，也用来重置 */
function emptyForm(): DeviceForm {
  return {
    deviceCode: '',
    deviceName: '',
    category: '',
    location: '',
    model: '',
    manufacturer: '',
    purchaseDate: '',
    status: 1,
    manager: '',
    remark: '',
  }
}

const form = reactive<DeviceForm>(emptyForm())

/** 校验规则：写在这里，el-form 会自动跑 */
const rules: FormRules = {
  deviceCode: [
    { required: true, message: '请输入设备编号', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9-]{4,50}$/,
      message: '只能包含字母、数字和短横线，至少 4 位',
      trigger: 'blur',
    },
  ],
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  location: [{ required: true, message: '请输入安装位置', trigger: 'blur' }],
  manager: [{ required: true, message: '请输入责任人', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

/**
 * 关键点：弹窗每次「打开」时才决定是空表单还是回填数据。
 * 放在 watch 里而不是父组件传进来时立刻赋值，是为了避免还没打开就把数据写脏。
 */
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    if (props.deviceId !== null) {
      const target = await getDeviceById(props.deviceId)
      Object.assign(form, target ?? emptyForm())
    } else {
      Object.assign(form, emptyForm())
    }
  },
)

async function handleSubmit() {
  if (!formRef.value) return

  // validate() 校验不通过会 reject，用 catch 兜住转成 boolean
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && props.deviceId !== null) {
      await updateDevice(props.deviceId, { ...form })
      ElMessage.success('修改成功')
    } else {
      await createDevice({ ...form })
      ElMessage.success('新增成功')
    }
    emit('saved')
  } catch (e) {
    ElMessage.error((e as Error).message || '保存失败')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="640px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="设备编号" prop="deviceCode">
            <el-input v-model="form.deviceCode" placeholder="如 EQ-2026-001" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备名称" prop="deviceName">
            <el-input v-model="form.deviceName" placeholder="如 一号电机" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="设备类型" prop="category">
            <el-select v-model="form.category" placeholder="请选择" style="width: 100%">
              <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="form.status" style="width: 100%">
              <el-option
                v-for="s in DEVICE_STATUS_OPTIONS"
                :key="s.value"
                :label="s.label"
                :value="s.value"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="规格型号" prop="model">
            <el-input v-model="form.model" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="生产厂商" prop="manufacturer">
            <el-input v-model="form.manufacturer" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="安装位置" prop="location">
            <el-input v-model="form.location" placeholder="如 一号车间-3号位" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="责任人" prop="manager">
            <el-input v-model="form.manager" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="采购日期" prop="purchaseDate">
            <el-date-picker
              v-model="form.purchaseDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="2"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>
