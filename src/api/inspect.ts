import type {
  InspectRecord,
  InspectRecordQuery,
  InspectRecordRow,
  InspectTask,
  InspectTaskQuery,
  InspectSubmitPayload,
} from '@/types/inspect'
import type { PageResult } from '@/types/inspectPlan'
import { inspectTasks, markTaskFinished } from '@/mock/inspectTaskDb'
import { inspectItems } from '@/mock/inspectDb'
import { inspectRecords, useNextId } from '@/mock/inspectRecordDb'

/** 模拟网络延迟，让 loading 效果能被看见 */
function delay(ms = 300) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}
/** 分页 + 条件查询 */
export async function getTodayTasks(query: InspectTaskQuery): Promise<PageResult<InspectTask>> {
  await delay() // 照抄巡检计划的 delay 写法
  let list = [...inspectTasks]

  if (query.executor) list = list.filter((i) => i.executor === query.executor)
  if (query.finished !== undefined) list = list.filter((i) => i.finished === query.finished)

  const total = list.length
  const start = (query.page - 1) * query.pageSize

  return {
    list: list.slice(start, start + query.pageSize).map((i) => ({ ...i })), // 浅拷贝，避免外部修改内存假数据库
    total,
  }
}

export function getExecutorOptions() {
  const executors = Array.from(new Set(inspectTasks.map((i) => i.executor))).filter(
    (name) => name !== '',
  )
  return executors.map((executor) => ({ label: executor, value: executor }))
}

/** 拉点检项 */
export async function getInspectItems(category: string) {
  await delay()
  return inspectItems
    .filter((i) => i.category === category && i.status === 1)
    .sort((a, b) => a.sort - b.sort)
    .map((i) => ({ ...i })) // 浅拷贝，避免外部修改内存假数据库
}

/** 提交巡检 */
export async function submitInspectRecord(payload: InspectSubmitPayload): Promise<void> {
  await delay()

  const task = inspectTasks.find((t) => t.id === payload.planId)
  if (!task) throw new Error('巡检任务不存在，请刷新列表')

  markTaskFinished(task.id, payload.inspectTime)

  inspectRecords.unshift({
    ...payload,
    id: useNextId(),
    deviceCode: task.deviceCode,
    deviceName: task.deviceName,
    executor: task.executor,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
  })
}
export async function getInspectRecordByTask(taskId: number) {
  await delay()
  return inspectRecords.find((t) => t.planId === taskId) ?? null
}

/* ---------------- 巡检记录（记录页用） ---------------- */

/** 记录 → 列表行：统计字段由接口层算好，页面不再自己遍历明细 */
function toRow(record: InspectRecord): InspectRecordRow {
  const abnormalCount = record.details.filter((d) => d.isAbnormal === 1).length
  return {
    ...record,
    details: record.details.map((d) => ({ ...d })),
    abnormalCount,
    result: abnormalCount > 0 ? 2 : 1,
  }
}

/** 兼容 '2026-10-23 09:15' 与 '2026/11/1 18:48:21' 两种时间格式 */
function parseInspectTime(value: string): Date | null {
  const matched = value.match(
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/,
  )
  if (!matched) return null
  const [, year, month, day, hour, minute, second] = matched
  return new Date(+year, +month - 1, +day, +hour, +minute, second ? +second : 0)
}

/** 取本地日期 YYYY-MM-DD：日期范围按天比，不比时间 */
function toDay(value: string): string {
  const date = parseInspectTime(value)
  if (!date) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function timestampOf(value: string): number {
  return parseInspectTime(value)?.getTime() ?? 0
}

/** 巡检记录分页查询：关键字 / 执行人 / 结果 / 日期范围 */
export async function getInspectRecords(
  query: InspectRecordQuery,
): Promise<PageResult<InspectRecordRow>> {
  await delay()
  let list = inspectRecords.map(toRow)

  const keyword = query.keyword?.trim().toLowerCase()
  if (keyword) {
    list = list.filter((r) => `${r.deviceCode} ${r.deviceName}`.toLowerCase().includes(keyword))
  }
  if (query.executor) list = list.filter((r) => r.executor === query.executor)
  if (query.result !== undefined && query.result !== '') {
    list = list.filter((r) => r.result === query.result)
  }
  if (query.dateRange && query.dateRange.length === 2) {
    const [from, to] = query.dateRange
    list = list.filter((r) => {
      const day = toDay(r.inspectTime)
      return day !== '' && day >= from && day <= to
    })
  }

  // 最近的排最前：新提交的会 unshift 到数组头，历史记录同样按时间走
  list.sort((a, b) => timestampOf(b.inspectTime) - timestampOf(a.inspectTime))

  const total = list.length
  const start = (query.page - 1) * query.pageSize
  return { list: list.slice(start, start + query.pageSize), total }
}

/** 记录详情（含明细）。列表已经带了明细，这里留接口函数：换真后端时页面不用改 */
export async function getInspectRecordById(id: number): Promise<InspectRecordRow | null> {
  await delay()
  const target = inspectRecords.find((r) => r.id === id)
  return target ? toRow(target) : null
}

/** 执行人下拉：从已有记录里取，不写死 */
export function getRecordExecutorOptions() {
  const executors = Array.from(new Set(inspectRecords.map((r) => r.executor))).filter(
    (name) => name !== '',
  )
  return executors.map((executor) => ({ label: executor, value: executor }))
}
