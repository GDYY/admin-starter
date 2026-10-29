/** 首页看板相关类型定义 */

/** 概览统计（四张数据卡片） */
export interface DashboardOverview {
  /** 设备总数 */
  deviceTotal: number
  /** 今日应巡检任务数 */
  taskTotal: number
  /** 今日已完成数 */
  finishedCount: number
  /** 今日异常项总数（所有记录明细里 isAbnormal=1 的数量） */
  abnormalCount: number
}

/** 趋势图数据点（近 N 天） */
export interface DashboardTrendPoint {
  /** 日期 YYYY-MM-DD */
  date: string
  /** 当天异常项数量 */
  count: number
}

/** 设备类型分布 */
export interface DashboardCategoryItem {
  category: string
  count: number
}
