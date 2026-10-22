/** 点检项相关类型定义 */

/** 点检类型：1=正常/异常 2=数值录入 3=文字描述 */
export type CheckType = 1 | 2 | 3

/** 启用状态：1=启用 0=停用 */
export type EnableStatus = 0 | 1

export interface InspectItem {
  id: number
  itemName: string
  category: string
  checkType: CheckType
  unit: string
  minValue: number | null
  maxValue: number | null
  standard: string
  sort: number
  status: EnableStatus
}

/** 新增/编辑表单的数据（id 由后端生成） */
export type InspectItemForm = Omit<InspectItem, 'id'>

/** 列表查询条件 */
export interface InspectItemQuery {
  page: number
  pageSize: number
  keyword?: string
  category?: string
  checkType?: CheckType | ''
  status?: EnableStatus | ''
}

/** 分页返回结构，全局通用 */
export interface PageResult<T> {
  list: T[]
  total: number
}

/** 点检类型映射表：一处定义，处处复用（列表、表单、筛选都用它） */
export const CHECK_TYPE_MAP: Record<
  CheckType,
  { label: string; type: 'primary' | 'success' | 'info' | 'warning' | 'danger' }
> = {
  1: { label: '正常/异常', type: 'primary' },
  2: { label: '数值录入', type: 'success' },
  3: { label: '文字描述', type: 'info' },
}

export const CHECK_TYPE_OPTIONS = (Object.keys(CHECK_TYPE_MAP) as unknown as CheckType[]).map(
  (key) => ({
    value: Number(key) as CheckType,
    label: CHECK_TYPE_MAP[Number(key) as CheckType].label,
  }),
)

export const ENABLE_STATUS_MAP: Record<
  EnableStatus,
  { label: string; type: 'primary' | 'success' | 'info' | 'warning' | 'danger' }
> = {
  1: { label: '启用', type: 'success' },
  0: { label: '停用', type: 'info' },
}

export const ENABLE_STATUS_OPTIONS = (
  Object.keys(ENABLE_STATUS_MAP) as unknown as EnableStatus[]
).map((key) => ({
  value: Number(key) as EnableStatus,
  label: ENABLE_STATUS_MAP[Number(key) as EnableStatus].label,
}))
