/** 设备台账相关类型定义 */

/** 设备状态：1=正常 2=停用 3=维修中 4=报废 */
export type DeviceStatus = 1 | 2 | 3 | 4

export interface Device {
  id: number
  deviceCode: string
  deviceName: string
  category: string
  location: string
  model: string
  manufacturer: string
  purchaseDate: string
  status: DeviceStatus
  manager: string
  remark: string
  createdAt: string
}

/** 新增/编辑表单的数据（id 和 createdAt 由后端生成） */
export type DeviceForm = Omit<Device, 'id' | 'createdAt'>

/** 列表查询条件 */
export interface DeviceQuery {
  page: number
  pageSize: number
  keyword?: string
  category?: string
  status?: DeviceStatus | ''
}

/** 分页返回结构，全局通用 */
export interface PageResult<T> {
  list: T[]
  total: number
}

/** 状态映射表：一处定义，处处复用（列表、表单、筛选都用它） */
export const DEVICE_STATUS_MAP: Record<
  DeviceStatus,
  { label: string; type: 'success' | 'info' | 'warning' | 'danger' }
> = {
  1: { label: '正常', type: 'success' },
  2: { label: '停用', type: 'info' },
  3: { label: '维修中', type: 'warning' },
  4: { label: '报废', type: 'danger' },
}

export const DEVICE_STATUS_OPTIONS = (
  Object.keys(DEVICE_STATUS_MAP) as unknown as DeviceStatus[]
).map((key) => ({
  value: Number(key) as DeviceStatus,
  label: DEVICE_STATUS_MAP[Number(key) as DeviceStatus].label,
}))
