import type {
  InspectTask,
  InspectTaskQuery,
  InspectSubmitPayload,
  InspectRecord,
  InspectRecordQuery,
  InspectRecordRow,
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
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    executor: task.executor,
  })
}
export async function getInspectRecordByTask(taskId: number) {
  await delay()
  return inspectRecords.find((t) => t.planId === taskId) ?? null
}

/** 记录行：明细里算异常数，result 跟着推出来（1=全部正常 2=存在异常） */
function toRecordRow(record: InspectRecord): InspectRecordRow {
  const abnormalCount = record.details.filter((d) => d.isAbnormal === 1).length
  return { ...record, abnormalCount, result: abnormalCount > 0 ? 2 : 1 }
}

/**
 * 解析巡检时间，兼容两种历史格式：
 * '2026-10-23 09:15'（mock 预置）和 '2026/11/2 19:35:12'（toLocaleString 提交的）。
 * 解析失败返回 0，排序时沉到最底下。
 */
function parseTime(time: string): number {
  const match = time.match(
    /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
  )
  if (!match) return 0
  const [, year, month, day, hour = '0', minute = '0', second = '0'] = match
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime()
}

/** 取日期部分 YYYY-MM-DD，日期范围筛选统一用它比较 */
function toDay(time: string): string {
  const stamp = parseTime(time)
  if (!stamp) return ''
  const date = new Date(stamp)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 巡检记录分页查询 */
export async function getInspectRecords(
  query: InspectRecordQuery,
): Promise<PageResult<InspectRecordRow>> {
  await delay()

  const keyword = (query.keyword || '').trim().toLowerCase()
  const [startDate, endDate] = query.dateRange ?? []
  const dayFrom = startDate ? toDay(startDate) : ''
  const dayTo = endDate ? toDay(endDate) : ''

  // 两种时间格式（- 和 /）不能直接字符串比较，先解析成时间戳再排
  let list = [...inspectRecords]
    .sort((a, b) => parseTime(b.inspectTime) - parseTime(a.inspectTime))
    .map(toRecordRow)

  if (keyword) {
    list = list.filter(
      (r) =>
        r.deviceCode.toLowerCase().includes(keyword) ||
        r.deviceName.toLowerCase().includes(keyword),
    )
  }
  if (query.executor) list = list.filter((r) => r.executor === query.executor)
  if (query.result) {
    const wanted = query.result
    list = list.filter((r) => r.result === wanted)
  }
  if (dayFrom) list = list.filter((r) => toDay(r.inspectTime) >= dayFrom)
  if (dayTo) list = list.filter((r) => toDay(r.inspectTime) <= dayTo)

  const total = list.length
  const start = (query.page - 1) * query.pageSize

  return { list: list.slice(start, start + query.pageSize), total }
}

/** 记录详情（含明细） */
export async function getInspectRecordById(id: number): Promise<InspectRecordRow | null> {
  await delay(300)
  const record = inspectRecords.find((r) => r.id === id)
  return record ? toRecordRow(record) : null
}

/** 记录里出现过的执行人（记录页筛选用） */
export function getRecordExecutorOptions() {
  const executors = Array.from(new Set(inspectRecords.map((r) => r.executor))).filter(
    (name) => name !== '',
  )
  return executors.map((executor) => ({ label: executor, value: executor }))
}
