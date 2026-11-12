<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getAbnormalPage } from '@/api/abnormal'
import { LEVEL_MAP, LEVEL_OPTIONS, STATUS_MAP, STATUS_OPTIONS } from '@/types/abnormal'
import type { Abnormal, AbnormalLevel, AbnormalQuery, AbnormalStatus } from '@/types/abnormal'

/* ---------------- 查询条件 ---------------- */
const query = reactive<AbnormalQuery>({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: '',
  level: '',
})

/* ---------------- 列表数据 ---------------- */
const loading = ref(false)
const list = ref<Abnormal[]>([])
const total = ref(0)

async function loadData() {
  loading.value = true
  try {
    const res = await getAbnormalPage(query)
    list.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error((e as Error).message || '查询失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.keyword = ''
  query.status = ''
  query.level = ''
  query.page = 1
  loadData()
}

/**
 * TODO(步骤 7): 换成处理弹窗。
 * 待处理 / 处理中进来是可编辑；已闭环进来是只读。
 */
function openHandle(row: Abnormal) {
  ElMessage.info(`处理弹窗待实现：${row.deviceCode} ${row.itemName}`)
}

onMounted(loadData)
</script>

<template>
  <div>
    <!-- ============ 筛选区 ============ -->
    <el-card shadow="never" class="filter-card">
      <el-form inline @submit.prevent>
        <el-form-item label="关键字">
          <el-input
            v-model="query.keyword"
            style="width: 200px"
            placeholder="设备编号 / 名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option
              v-for="s in STATUS_OPTIONS"
              :key="s.value"
              :label="s.label"
              :value="s.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="级别">
          <el-select v-model="query.level" placeholder="全部" clearable style="width: 130px">
            <el-option
              v-for="l in LEVEL_OPTIONS"
              :key="l.value"
              :label="l.label"
              :value="l.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- ============ 表格区 ============ -->
    <el-card shadow="never">
      <div class="toolbar">
        <span class="total"
          >共 <b>{{ total }}</b> 条异常</span
        >
      </div>

      <el-table v-loading="loading" :data="list" border stripe empty-text="没有符合条件的异常">
        <el-table-column
          type="index"
          label="序号"
          width="60"
          align="center"
          :index="(i: number) => (query.page - 1) * query.pageSize + i + 1"
        />
        <el-table-column prop="deviceCode" label="设备编号" min-width="130" />
        <el-table-column prop="deviceName" label="设备名称" min-width="130" />
        <el-table-column prop="itemName" label="异常项" min-width="120" />
        <el-table-column prop="createdAt" label="发现时间" min-width="160" />
        <el-table-column label="级别" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="LEVEL_MAP[row.level as AbnormalLevel]?.type">
              {{ LEVEL_MAP[row.level as AbnormalLevel]?.label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="STATUS_MAP[row.status as AbnormalStatus]?.type">
              {{ STATUS_MAP[row.status as AbnormalStatus]?.label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="处理人" width="100">
          <!-- handler 可能为空串（派生的单子还没分配人），显示破折号 -->
          <template #default="{ row }">{{ row.handler || '—' }}</template>
        </el-table-column>

        <el-table-column label="操作" width="90" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openHandle(row)">
              {{ row.status === 3 ? '查看' : '处理' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
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
  </div>
</template>

<style scoped lang="scss">
.filter-card {
  margin-bottom: 12px;
}

.toolbar {
  margin-bottom: 12px;

  .total {
    color: #606266;
    font-size: 13px;

    b {
      color: #409eff;
      font-size: 15px;
    }
  }
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
