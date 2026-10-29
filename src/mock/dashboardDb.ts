import type {
  DashboardCategoryItem,
  DashboardOverview,
  DashboardTrendPoint,
} from '@/types/dashboard'
import { devices } from '@/mock/db'
import { inspectTasks } from '@/mock/inspectTaskDb'
import { inspectRecords } from '@/mock/inspectRecordDb'

/**
 * 首页看板 · 内存假数据
 *
 * 概览和分类都用「计算函数」而不是常量：提交巡检后 inspectTasks / inspectRecords 会变，
 * 每次调接口重新算才能和「巡检执行」页对得上。
 */

/** 概览：设备总数 / 今日应巡检 / 已完成 / 异常项总数 */
export function computeOverview(): DashboardOverview {
  const abnormalCount = inspectRecords.reduce(
    (sum, record) => sum + record.details.filter((d) => d.isAbnormal === 1).length,
    0,
  )
  return {
    deviceTotal: devices.length,
    taskTotal: inspectTasks.length,
    finishedCount: inspectTasks.filter((t) => t.finished).length,
    abnormalCount,
  }
}

/**
 * 近 7 天异常趋势（mock 阶段手工造数据；真实后端按日期聚合 inspect_record）
 * 日期写死到 2026-10-22 ~ 2026-10-28，避免刷新后图表跳变
 */
export const trendSeed: DashboardTrendPoint[] = [
  { date: '2026-10-22', count: 1 },
  { date: '2026-10-23', count: 3 },
  { date: '2026-10-24', count: 0 },
  { date: '2026-10-25', count: 2 },
  { date: '2026-10-26', count: 4 },
  { date: '2026-10-27', count: 1 },
  { date: '2026-10-28', count: 2 },
]

/** 设备类型分布：从设备台账按 category 聚合 */
export function computeCategory(): DashboardCategoryItem[] {
  const map = new Map<string, number>()
  for (const device of devices) {
    map.set(device.category, (map.get(device.category) ?? 0) + 1)
  }
  return [...map.entries()].map(([category, count]) => ({ category, count }))
}
