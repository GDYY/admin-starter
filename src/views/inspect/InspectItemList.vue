<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  deleteInspectItem,
  getCategoryOptions,
  getInspectItemPage,
  toggleInspectItemStatus,
} from '@/api/inspectItem'
import type { EnableStatus, InspectItem, InspectItemQuery } from '@/types/inspectItem'
import { CHECK_TYPE_MAP, CHECK_TYPE_OPTIONS, ENABLE_STATUS_OPTIONS } from '@/types/inspectItem'
import InspectItemFormDialog from './InspectItemFormDialog.vue'

/* ---------------- 查询条件 ---------------- */
const query = reactive<InspectItemQuery>({
  page: 1,
  pageSize: 10,
  keyword: '',
  category: '',
  status: '',
  checkType: '',
})

/* ---------------- 列表数据 ---------------- */
const loading = ref(false)
const list = ref<InspectItem[]>([])
const total = ref(0)
const categoryOptions = ref<string[]>([])

async function loadData() {
  loading.value = true
  try {
    const res = await getInspectItemPage(query)
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
  query.checkType = ''
  loadData()
}

/* ---------------- 新增 / 编辑 ---------------- */
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)

function handleCreate() {
  editingId.value = null
  dialogVisible.value = true
}

function handleEdit(row: InspectItem) {
  editingId.value = row.id
  dialogVisible.value = true
}

function handleSaved() {
  dialogVisible.value = false
  loadData()
}
/**
 * ⭐ 设备台账里没有的交互：el-switch 有 v-model，点下去 row.status 立刻变了（乐观更新）。
 *    接口失败必须回滚，否则界面和后端不一致。
 */
async function handleStatusChange(row: InspectItem) {
  const next = row.status
  try {
    await toggleInspectItemStatus(row.id, next)
    if (next === 1) {
      ElMessage.success(`「${row.itemName}」已启用`)
    } else {
      ElMessage.info(`「${row.itemName}」已停用`)
    }
  } catch (e) {
    row.status = (next === 1 ? 0 : 1) as EnableStatus // 回滚
    ElMessage.error((e as Error).message || '操作失败')
  }
}

/* ---------------- 删除 ---------------- */
async function handleDelete(row: InspectItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除点检项「${row.itemName}」（适用：${row.category}）吗？`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return // 用户点了取消
  }

  try {
    await deleteInspectItem(row.id)
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
  <div class="inspect-item-list">
    <!-- ============ 搜索区 ============ -->
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="query.keyword"
            placeholder="名称 / 判定标准"
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

        <el-form-item label="点检类型">
          <el-select v-model="query.checkType" placeholder="全部" clearable style="width: 150px">
            <el-option
              v-for="c in CHECK_TYPE_OPTIONS"
              :key="c.value"
              :label="c.label"
              :value="c.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option
              v-for="s in ENABLE_STATUS_OPTIONS"
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
          >共 <b>{{ total }}</b> 条点检标准</span
        >
        <el-button type="primary" :icon="Plus" @click="handleCreate">新增点检项</el-button>
      </div>

      <el-table v-loading="loading" :data="list" border stripe>
        <el-table-column type="index" label="#" width="55" align="center" />
        <el-table-column prop="itemName" label="点检项名称" width="130" />
        <el-table-column prop="category" label="适用设备" min-width="100" align="center" />
        <el-table-column label="点检类型" width="110" align="center"
          ><template #default="{ row }">
            <el-tag :type="CHECK_TYPE_MAP[row.checkType as 1].type" size="small">
              {{ CHECK_TYPE_MAP[row.checkType as 1].label }}
            </el-tag>
          </template></el-table-column
        >
        <el-table-column label="正常范围" min-width="140">
          <template #default="{ row }">
            <span v-if="row.checkType === 2" class="range">
              {{ row.minValue }} ~ {{ row.maxValue }} {{ row.unit }}
            </span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="standard" label="判定标准" width="180" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="70" align="center" />

        <el-table-column label="启用" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row as InspectItem)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row as InspectItem)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row as InspectItem)">删除</el-button>
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
    <InspectItemFormDialog
      v-model="dialogVisible"
      :item-id="editingId"
      :category-options="categoryOptions"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped lang="scss">
.inspect-item-list {
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
.range {
  font-family: Consolas, Monaco, monospace;
  color: #409eff;
}
.muted {
  color: #c0c4cc;
}
</style>
