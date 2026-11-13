<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getAbnormalById, getHandlerOptions, handleAbnormal } from '@/api/abnormal'
import { LEVEL_OPTIONS, STATUS_MAP } from '@/types/abnormal'
import type { Abnormal, AbnormalHandleForm, AbnormalStatus } from '@/types/abnormal'

const props = defineProps<{
  modelValue: boolean
  abnormalId: number | null
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

const loading = ref(false)
const submitting = ref(false)
const detail = ref<Abnormal | null>(null)

/** 已闭环的单子只能看，不能改 */
const readonly = computed(() => detail.value?.status === 3)

const handlerOptions = getHandlerOptions()

const form = reactive<AbnormalHandleForm>({
  level: 1,
  handler: '',
  handleResult: '',
  status: 2,
})

/**
 * 状态下拉：待处理只能转处理中（接口也会拦 1→3），
 * 处理中才给「处理中 / 已闭环」两个选项。
 */
const statusOptions = computed(() => {
  const options: { value: AbnormalStatus; label: string }[] = [
    { value: 2, label: STATUS_MAP[2].label },
  ]
  if (detail.value && detail.value.status !== 1) {
    options.push({ value: 3, label: STATUS_MAP[3].label })
  }
  return options
})

const dialogTitle = computed(() => {
  const prefix = readonly.value ? '查看异常' : '处理异常'
  const name = detail.value?.deviceName ?? ''
  const code = detail.value?.deviceCode ?? ''
  return code ? `${prefix} —— ${name}（${code}）` : prefix
})

async function loadDetail(id: number) {
  loading.value = true
  detail.value = null
  try {
    const data = await getAbnormalById(id)
    if (!data) {
      ElMessage.warning('异常单不存在，请刷新列表')
      visible.value = false
      return
    }
    detail.value = data
    form.level = data.level
    form.handler = data.handler
    form.handleResult = data.handleResult
    // 待处理默认落到「处理中」，不能直接一步闭环
    form.status = data.status === 1 ? 2 : data.status
  } catch (e) {
    ElMessage.error((e as Error).message || '加载失败')
    visible.value = false
  } finally {
    loading.value = false
  }
}

/** 弹窗每次打开才拉数据，避免父组件提前赋值把表单写脏 */
watch(
  () => props.modelValue,
  async (open) => {
    if (!open || props.abnormalId === null) return
    await loadDetail(props.abnormalId)
  },
)

async function handleSubmit() {
  if (!detail.value) return
  if (!form.handler.trim()) {
    ElMessage.warning('请选择处理人')
    return
  }
  if (!form.handleResult.trim()) {
    ElMessage.warning('请填写处理结果')
    return
  }

  submitting.value = true
  try {
    await handleAbnormal(detail.value.id, {
      level: form.level,
      handler: form.handler.trim(),
      handleResult: form.handleResult.trim(),
      status: form.status,
    })
    ElMessage.success('处理成功')
    emit('saved')
  } catch (e) {
    ElMessage.error((e as Error).message || '处理失败')
  } finally {
    submitting.value = false
  }
}

/** 关闭动画结束后清空，避免下次打开先闪一眼旧数据 */
function onClosed() {
  detail.value = null
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="520px"
    :close-on-click-modal="false"
    @closed="onClosed"
  >
    <div v-loading="loading" class="dialog-body">
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="异常项">
          {{ detail?.itemName || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="发现时间">
          {{ detail?.createdAt || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="异常描述" :span="2">
          <span class="abnormal-desc">{{ detail?.description || '—' }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-form label-width="80px" class="handle-form" :disabled="readonly">
        <el-form-item label="级别">
          <el-select v-model="form.level" style="width: 160px">
            <el-option
              v-for="l in LEVEL_OPTIONS"
              :key="l.value"
              :label="l.label"
              :value="l.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="处理人">
          <el-select
            v-model="form.handler"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入处理人"
            style="width: 160px"
          >
            <el-option
              v-for="h in handlerOptions"
              :key="h.value"
              :label="h.label"
              :value="h.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="处理结果">
          <el-input
            v-model="form.handleResult"
            type="textarea"
            :rows="3"
            placeholder="填写处理经过和结果"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-if="!readonly" v-model="form.status">
            <el-radio v-for="s in statusOptions" :key="s.value" :value="s.value">
              {{ s.label }}
            </el-radio>
          </el-radio-group>
          <el-tag v-else-if="detail" :type="STATUS_MAP[detail.status].type">{{
            STATUS_MAP[detail.status].label
          }}</el-tag>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">
        {{ readonly ? '关闭' : '取消' }}
      </el-button>
      <el-button
        v-if="!readonly"
        type="primary"
        :loading="submitting"
        :disabled="loading"
        @click="handleSubmit"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.dialog-body {
  min-height: 180px;
}

.handle-form {
  margin-top: 16px;
}

.abnormal-desc {
  color: #f56c6c;
}
</style>
