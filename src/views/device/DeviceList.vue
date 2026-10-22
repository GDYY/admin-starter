<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { deleteDevice, getCategoryOptions, getDevicePage } from '@/api/device'
import type { Device, DeviceQuery } from '@/types/device'
import { DEVICE_STATUS_MAP, DEVICE_STATUS_OPTIONS } from '@/types/device'
import DeviceFormDialog from './DeviceFormDialog.vue'

/* ---------------- 查询条件 ---------------- */
const query = reactive<DeviceQuery>({
  page: 1,
  pageSize: 10,
  keyword: '',
  category: '',
  status: '',
})

/* ---------------- 列表数据 ---------------- */
const loading = ref(false)
const list = ref<Device[]>([])
const total = ref(0)
const categoryOptions = ref<string[]>([])

async function loadData() {
  loading.value = true
  try {
    const res = await getDevicePage(query)
    list.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error((e as Error).message || '查询失败')
  } finally {
    loading.value = false
  }
}

/**
 * 查询。
 * ⚠️ 必须把 page 重置回 1：否则你翻到第 5 页再搜一个只有 3 条结果的条件，
 *    就会看到「空列表」，以为数据丢了。这是新手最容易踩的坑。
 */
function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.category = ''
  query.status = ''
  query.page = 1
  loadData()
}

/* ---------------- 新增 / 编辑 ---------------- */
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)

function handleCreate() {
  editingId.value = null
  dialogVisible.value = true
}

function handleEdit(row: Device) {
  editingId.value = row.id
  dialogVisible.value = true
}

function handleSaved() {
  dialogVisible.value = false
  loadData()
}

/* ---------------- 删除 ---------------- */
async function handleDelete(row: Device) {
  try {
    await ElMessageBox.confirm(
      `确定删除设备「${row.deviceName}」（${row.deviceCode}）吗？`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return // 用户点了取消
  }

  try {
    await deleteDevice(row.id)
    ElMessage.success('删除成功')
    // 如果删的是当前页最后一条，往前翻一页，避免停在空页
    if (list.value.length === 1 && query.page > 1) {
      query.page -= 1
    }
    loadData()
  } catch (e) {
    ElMessage.error((e as Error).message || '删除失败')
  }
}

onMounted(async () => {
  categoryOptions.value = await getCategoryOptions()
  loadData()
})
</script>

<template>
  <div class="device-list">
    <!-- ============ 搜索区 ============ -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="query.keyword"
            placeholder="设备编号 / 名称"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="设备类型">
          <el-select v-model="query.category" placeholder="全部" clearable style="width: 150px">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option
              v-for="s in DEVICE_STATUS_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
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
          >共 <b>{{ total }}</b> 台设备</span
        >
        <el-button type="primary" :icon="Plus" @click="handleCreate">新增设备</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column type="index" label="#" width="55" align="center" />
        <el-table-column prop="deviceCode" label="设备编号" width="140" />
        <el-table-column prop="deviceName" label="设备名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="category" label="类型" width="90" align="center" />
        <el-table-column prop="location" label="安装位置" min-width="150" show-overflow-tooltip />
        <el-table-column prop="model" label="型号" width="100" />
        <el-table-column prop="manager" label="责任人" width="90" align="center" />

        <!-- 状态用 el-tag 上色，比纯文字清楚得多 -->
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="DEVICE_STATUS_MAP[row.status as 1].type" size="small">
              {{ DEVICE_STATUS_MAP[row.status as 1].label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row as Device)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row as Device)">删除</el-button>
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

    <!-- ============ 新增/编辑弹窗 ============ -->
    <DeviceFormDialog
      v-model="dialogVisible"
      :device-id="editingId"
      :category-options="categoryOptions"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped lang="scss">
.device-list {
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
</style>
