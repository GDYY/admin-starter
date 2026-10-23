import type { InspectTask, InspectTaskQuery } from '@/types/inspect'
import { PageResult } from '@/types/inspectPlan'
import { inspectTasks } from '@/mock/inspectTaskDb'

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
