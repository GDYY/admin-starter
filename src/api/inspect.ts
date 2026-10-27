import type { InspectTask, InspectTaskQuery, InspectSubmitPayload } from '@/types/inspect'
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
  })
}
export async function getInspectRecordByTask(taskId: number) {
  await delay()
  return inspectRecords.find((t) => t.planId === taskId) ?? null
}
