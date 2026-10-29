import type {
  DashboardCategoryItem,
  DashboardOverview,
  DashboardTrendPoint,
} from '@/types/dashboard'
import { computeCategory, computeOverview, trendSeed } from '@/mock/dashboardDb'

/**
 * ============================================================
 *  API 层 · 首页看板
 * ------------------------------------------------------------
 *  现在直接操作内存假数据；后端好了以后把函数体换成 request(...) 即可。
 * ============================================================
 */

/** 模拟网络延迟，让 loading 效果能被看见 */
function delay(ms = 300) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** 概览：设备总数 / 今日应巡检 / 已完成 / 异常数 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  await delay()
  return computeOverview()
}

/** 近 N 天异常趋势 */
export async function getDashboardTrend(days = 7): Promise<DashboardTrendPoint[]> {
  await delay()
  return trendSeed.slice(-days)
}

/** 设备类型分布 */
export async function getDashboardCategory(): Promise<DashboardCategoryItem[]> {
  await delay()
  return computeCategory()
}
