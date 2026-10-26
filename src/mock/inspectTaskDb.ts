import type { InspectTask } from '@/types/inspect'
import { devices } from '@/mock/db'
import { inspectPlans } from '@/mock/inspectPlanDb'

/**
 * 内存假数据库 —— 巡检执行（今日任务）。
 *
 * 任务从「巡检计划」派生：只取启用的计划，再从设备台账补 category / location。
 * 纯内存，刷新页面会重置，这是正常的。
 */
export const inspectTasks: InspectTask[] = inspectPlans
  .filter((plan) => plan.status === 1)
  .map((plan, index) => {
    const device = devices.find((d) => d.id === plan.deviceId)
    // 每 4 条模拟 1 条「今天已经巡检过」，用来演示已完成状态
    const finished = index % 4 === 0
    return {
      id: plan.id,
      planName: plan.planName,
      deviceId: plan.deviceId,
      deviceCode: plan.deviceCode,
      deviceName: plan.deviceName,
      category: device?.category ?? '',
      location: device?.location ?? '',
      executor: plan.executor,
      frequency: plan.frequency,
      lastInspectTime: finished ? '2026-10-23 09:15' : null,
      finished,
    }
  })

/** 把源任务标记为已完成 */
export function markTaskFinished(taskId: number, time: string) {
  const task = inspectTasks.find((t) => t.id === taskId)
  if (!task) throw new Error('巡检任务不存在，请刷新列表')
  task.finished = true
  task.lastInspectTime = time
}
