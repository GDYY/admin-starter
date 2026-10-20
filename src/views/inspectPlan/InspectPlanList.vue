<script setup lang="ts">
// ============================================================
// 巡检计划 · 列表页骨架（2026-10-19 晚补连续提交用）
// TODO(明日/阶段 1)：按《巡检计划-开发清单.md》补全：
//   1. 写死数据补到 5~8 条，覆盖停用/三种频率/跨年/长名称/空执行人
//   2. 阶段 2：字段抽到 src/types/inspectPlan.ts
//   3. 阶段 3：数据移到 src/mock/inspectPlanDb.ts（引用 devices）
//   4. 阶段 4：抽 src/api/inspectPlan.ts，阶段 5 列表页全部接 API
// ============================================================
import { reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import InspectPlanFormDialog from "./InspectPlanFormDialog.vue";
import type { InspectFrequency, InspectPlan, InspectPlanQuery } from "@/types/inspectPlan";
import {
  FREQUENCY_MAP,
  FREQUENCY_OPTIONS,
  ENABLE_STATUS_OPTIONS,
} from "@/types/inspectPlan";
import { inspectPlans, DEVICE_OPTIONS } from "@/mock/inspectPlanDb"; // 阶段 5 后改为 "@/api/inspectPlan"

/* ---------------- 查询条件 ---------------- */
const query = reactive<InspectPlanQuery>({
  page: 1,
  pageSize: 10,
  keyword: "",
  deviceId: "",
  frequency: "",
  status: "",
});
/* ---------------- 列表数据 ---------------- */
const list = ref<InspectPlan[]>([...inspectPlans]);

const dialogVisible = ref(false);
const editingRow = ref<InspectPlan | null>(null);

function handleSearch() {
  // TODO(阶段 5)：接 getInspectPlanPage
  ElMessage.info("筛选逻辑将在阶段 5 接入 API，当前为骨架");
}

function handleReset() {
  query.keyword = "";
  query.deviceId = "";
  query.frequency = "";
  query.status = "";
}

function openCreate() {
  editingRow.value = null;
  dialogVisible.value = true;
}

function openEdit(row: InspectPlan) {
  editingRow.value = row;
  dialogVisible.value = true;
}

async function handleDelete(row: InspectPlan) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.planName}」吗？`, "提示", {
      type: "warning",
    });
  } catch {
    return;
  }
  list.value = list.value.filter((r) => r.id !== row.id);
  ElMessage.success("已删除（骨架阶段仅删内存数据）");
}

function handleSuccess() {
  ElMessage.success("保存成功（骨架阶段暂不落库）");
}
</script>

<template>
  <div>
    <el-card shadow="never" class="filter-card">
      <el-form inline>
        <el-form-item label="关键字">
          <el-input
            v-model="query.keyword"
            placeholder="计划名称 / 设备名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="设备">
          <el-select
            filterable
            v-model="query.deviceId"
            placeholder="全部"
            clearable
            style="width: 220px"
          >
            <el-option
              v-for="d in DEVICE_OPTIONS"
              :key="d.value"
              :label="d.label"
              :value="d.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="频率">
          <el-select
            v-model="query.frequency"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="c in FREQUENCY_OPTIONS"
              :key="c.value"
              :label="c.label"
              :value="c.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
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
        <span>共 {{ list.length }} 条巡检计划</span>
        <el-button type="primary" @click="openCreate">新增巡检计划</el-button>
      </div>

      <el-table :data="list" border stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column
          prop="planName"
          label="计划名称"
          min-width="200"
          show-overflow-tooltip
        />
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
          <template #default="{ row }">{{ row.executor || "—" }}</template>
        </el-table-column>
        <el-table-column label="生效期间" width="210">
          <template #default="{ row }"
            >{{ row.startDate }} ~ {{ row.endDate }}</template
          >
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)"
              >编辑</el-button
            >
            <el-button link type="danger" @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <!-- TODO(阶段 5)：接 getInspectPlanPage 后启用联动 -->
        <el-pagination
          background
          layout="total, prev, pager, next, sizes"
          :total="list.length"
          :page-size="10"
        />
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
