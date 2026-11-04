/** 巡检执行相关类型定义 */

import type { InspectFrequency } from './inspectPlan'
import type { InspectItem } from './inspectItem'

/** 巡检结果：1=全部正常 2=存在异常 */
export type InspectResult = 1 | 2

/**
 * 今日待巡检任务
 * = 巡检计划 + 设备信息 + 今日状态（执行页列表用）
 */
export interface InspectTask {
  id: number
  planName: string
  deviceId: number
  deviceCode: string
  deviceName: string
  /** 设备类型（执行时按它拉取对应的点检项） */
  category: string
  /** 设备位置（列表展示用） */
  location: string
  executor: string
  frequency: InspectFrequency
  /** 今天最近一次巡检时间，null = 今天还没巡检 */
  lastInspectTime: string | null
  /** 今天是否已完成 */
  finished: boolean
}

/** 巡检任务查询条件 */
export interface InspectTaskQuery {
  page: number
  pageSize: number
  executor?: string
  finished?: boolean
}

/** 提交给接口的结构：主表 + 明细（从表） */
export interface InspectSubmitPayload {
  planId: number
  deviceId: number
  inspectTime: string
  remark: string
  details: InspectDetailPayload[]
}

/** 明细行：一条点检项的巡检结果 */
export interface InspectDetailPayload {
  itemId: number
  /** 冗余存名称：以后标准改名，历史记录仍显示当时的名字 */
  itemName: string
  checkValue: string
  isAbnormal: 0 | 1
  remark: string
}

/** 巡检记录（主表 + 明细）：提交成功后落进 mock，供后续「查看」用 */
export interface InspectRecord extends InspectSubmitPayload {
  id: number
  /** 冗余设备信息：记录页不用再关联任务表 */
  deviceCode: string
  deviceName: string
  /** 提交时刻；inspectTime 是巡检时间，补录时两者不同 */
  createdAt: string
  executor: string
}

/** 表单行 = 点检标准 + 用户填的值 */
export interface FormRow {
  item: InspectItem // 标准，只读
  value: string // 用户填的值，可写
  remark: string // 异常描述
}
/** 查询条件：跟巡检计划那套保持一致 */
export interface InspectRecordQuery {
  page: number
  pageSize: number
  keyword?: string // 设备编号 / 名称
  executor?: string
  result?: InspectResult | '' // 结果筛选
  dateRange?: string[] // ['2026-10-18', '2026-10-24']，两个日期
}

/** 记录列表行 */
export interface InspectRecordRow extends InspectRecord {
  abnormalCount: number
  result: InspectResult
}
export const RESULT_MAP: Record<InspectResult, { label: string; type: 'success' | 'danger' }> = {
  1: { label: '全部正常', type: 'success' },
  2: { label: '存在异常', type: 'danger' },
}
export const RESULT_OPTIONS = (Object.keys(RESULT_MAP) as unknown as InspectResult[]).map(
  (key) => ({
    value: Number(key) as InspectResult,
    label: RESULT_MAP[Number(key) as InspectResult].label,
  }),
)
