/** 异常级别：1=一般 2=严重 3=紧急 */
export type AbnormalLevel = 1 | 2 | 3
/** 处理状态：1=待处理 2=处理中 3=已闭环 */
export type AbnormalStatus = 1 | 2 | 3

export interface Abnormal {
  id: number
  /** 来源：哪条巡检记录 */
  recordId: number
  deviceId: number
  /** 冗余：列表要显示，别去 join 记录表 */
  deviceCode: string
  deviceName: string
  /** 冗余：哪一项异常（明细里带过来的） */
  itemName: string
  /** 异常描述：checkValue + 明细 remark 拼一句话 */
  description: string
  level: AbnormalLevel
  handler: string
  status: AbnormalStatus
  handleResult: string
  createdAt: string
}
/** 级别映射表：一处定义，处处复用 */
export const LEVEL_MAP: Record<
  AbnormalLevel,
  { label: string; type: 'info' | 'warning' | 'danger' }
> = {
  1: { label: '一般', type: 'info' },
  2: { label: '严重', type: 'warning' },
  3: { label: '紧急', type: 'danger' },
}
export const LEVEL_OPTIONS = (Object.keys(LEVEL_MAP) as unknown as AbnormalLevel[]).map((key) => ({
  value: Number(key) as AbnormalLevel,
  label: LEVEL_MAP[Number(key) as AbnormalLevel].label,
}))

export const STATUS_MAP: Record<
  AbnormalStatus,
  { label: string; type: 'danger' | 'warning' | 'success' }
> = {
  1: { label: '待处理', type: 'danger' },
  2: { label: '处理中', type: 'warning' },
  3: { label: '已闭环', type: 'success' },
}
export const STATUS_OPTIONS = (Object.keys(STATUS_MAP) as unknown as AbnormalStatus[]).map(
  (key) => ({
    value: Number(key) as AbnormalStatus,
    label: STATUS_MAP[Number(key) as AbnormalStatus].label,
  }),
)
