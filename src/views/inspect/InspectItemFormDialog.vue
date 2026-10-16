<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import {
  createInspectItem,
  getInspectItemById,
  updateInspectItem,
} from "@/api/inspectItem";
import type {
  CheckType,
  EnableStatus,
  InspectItemForm,
} from "@/types/inspectItem";
import { CHECK_TYPE_OPTIONS } from "@/types/inspectItem";

const props = defineProps<{
  modelValue: boolean;
  itemId: number | null;
  categoryOptions: string[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "saved"): void;
}>();

/** 让父组件的 v-model 能用 */
const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const isEdit = computed(() => props.itemId !== null);
const dialogTitle = computed(() =>
  isEdit.value ? "编辑点检项" : "新增点检项",
);

const formRef = ref<FormInstance>();
const submitting = ref(false);
interface FormState {
  itemName: string;
  category: string;
  checkType: CheckType;
  unit: string;
  minValue: number | undefined;
  maxValue: number | undefined;
  standard: string;
  sort: number | undefined;
  status: number;
}
/** 空表单：新增时用它，也用来重置 */
function emptyForm(): FormState {
  return {
    itemName: "",
    category: "",
    checkType: 1,
    unit: "",
    minValue: undefined,
    maxValue: undefined,
    standard: "",
    sort: 1,
    status: 1,
  };
}
const form = reactive<FormState>(emptyForm());

/** ⭐ 只有「数值录入」才需要 单位 / 上下限 */
const isNumeric = computed(() => form.checkType === 2);

/** 下限 ≤ 上限 校验器 **/
function validateRange(
  _rule: unknown,
  _value: unknown,
  callback: (error?: Error) => void,
) {
  const { minValue, maxValue } = form;
  if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
    callback(new Error("正常下限不能大于上限"));
  } else {
    callback();
  }
}
function buildPayload(): InspectItemForm {
  return {
    itemName: form.itemName.trim(),
    category: form.category,
    checkType: form.checkType,
    unit: isNumeric.value ? form.unit.trim() : "",
    minValue: isNumeric.value ? (form.minValue ?? null) : null, // undefined → null
    maxValue: isNumeric.value ? (form.maxValue ?? null) : null,
    standard: form.standard.trim(),
    sort: form.sort ?? 1, // undefined → 1
    status: form.status as EnableStatus, // number → EnableStatus
  };
}
/** 校验规则：写在这里，el-form 会自动跑 */
const rules: FormRules = {
  itemName: [{ required: true, message: "请输入点检项名称", trigger: "blur" }],
  category: [
    { required: true, message: "请选择适用设备类型", trigger: "change" },
  ],
  checkType: [{ required: true, message: "请选择点检类型", trigger: "change" }],
  standard: [{ required: true, message: "请输入判定标准", trigger: "blur" }],
  // 下面三条只在 checkType === 2 时字段才渲染 → 没渲染就不注册 → 不会误报
  unit: [{ required: true, message: "数值型必须填单位", trigger: "blur" }],
  minValue: [
    { required: true, message: "请输入正常下限", trigger: "change" },
    { validator: validateRange, trigger: "change" },
  ],
  maxValue: [
    { required: true, message: "请输入正常上限", trigger: "change" },
    { validator: validateRange, trigger: "change" },
  ],
  sort: [{ required: true, message: "请输入排序号", trigger: "change" }],
};

/**
 * 关键点：弹窗每次「打开」时才决定是空表单还是回填数据。
 * 放在 watch 里而不是父组件传进来时立刻赋值，是为了避免还没打开就把数据写脏。
 */
watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    if (props.itemId !== null) {
      const target = await getInspectItemById(props.itemId);
      if (target) {
        Object.assign(form, {
          ...target,
          minValue: target.minValue ?? undefined,
          maxValue: target.maxValue ?? undefined,
        });
      } else {
        Object.assign(form, emptyForm());
      }
    } else {
      Object.assign(form, emptyForm());
    }
  },
);

watch(
  () => form.checkType,
  (val) => {
    if (val !== 2) {
      form.unit = "";
      form.minValue = undefined;
      form.maxValue = undefined;
    }
    formRef.value?.clearValidate(["unit", "minValue", "maxValue"]);
  },
);

async function handleSubmit() {
  if (!formRef.value) return;

  // validate() 校验不通过会 reject，用 catch 兜住转成 boolean
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    if (isEdit.value && props.itemId !== null) {
      await updateInspectItem(props.itemId, buildPayload());
      ElMessage.success("修改成功");
    } else {
      await createInspectItem(buildPayload());
      ElMessage.success("新增成功");
    }
    emit("saved");
  } catch (e) {
    ElMessage.error((e as Error).message || "保存失败");
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="660px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="点检项名称" prop="itemName">
            <el-input v-model="form.itemName" placeholder="如 电机温度" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="适用设备类型" prop="category">
            <el-select
              v-model="form.category"
              placeholder="请选择"
              style="width: 100%"
            >
              <el-option
                v-for="c in categoryOptions"
                :key="c"
                :label="c"
                :value="c"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="点检类型" prop="checkType">
            <el-select
              v-model="form.checkType"
              placeholder="请选择"
              style="width: 100%"
            >
              <el-option
                v-for="c in CHECK_TYPE_OPTIONS"
                :key="c.value"
                :label="c.label"
                :value="c.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序号" prop="sort">
            <el-input-number
              style="width: 100%"
              v-model="form.sort"
              :min="1"
              placeholder="请输入排序号"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="isNumeric">
          <el-form-item label="单位" prop="unit">
            <el-input v-model="form.unit" style="width: 100%" />
          </el-form-item>
        </el-col>
        <!-- 占位：把「下限/上限」挤到下一行，保证这两个同行 -->
        <el-col :span="12" v-if="isNumeric"> </el-col>
        <el-col :span="12" v-if="isNumeric">
          <el-form-item label="下限" prop="minValue">
            <el-input-number
              style="width: 100%"
              v-model="form.minValue"
              :precision="2"
              :controls="false"
            />
          </el-form-item>
        </el-col>

        <el-col :span="12" v-if="isNumeric">
          <el-form-item label="上限" prop="maxValue">
            <el-input-number
              style="width: 100%"
              v-model="form.maxValue"
              :precision="2"
              :controls="false"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="判定标准" prop="standard">
            <el-input type="textarea" v-model="form.standard" />
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="是否启用" prop="status">
            <el-switch
              v-model="form.status"
              :active-value="1"
              :inactive-value="0"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit"
        >保存</el-button
      >
    </template>
  </el-dialog>
</template>
