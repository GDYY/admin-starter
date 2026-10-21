import type {
  InspectPlanForm,
  InspectPlan,
  InspectPlanQuery,
  PageResult,
  EnableStatus,
} from '@/types/inspectPlan'
import { devices } from '@/mock/db'
import { inspectPlans, useNextId } from '@/mock/inspectPlanDb'

/**
 * ============================================================
 *  API 层 · 巡检计划
 * ------------------------------------------------------------
 *  这里现在直接操作内存假数据。
 *  等后端好了，把每个函数体换成 request(...) 就行，页面代码一行都不用改：
 *
 *    return request<PageResult<InspectPlan>>({
 *      url: '/inspect-plan/page', method: 'get', params: query,
 *    })
 *
 *  这就是「分层」的意义：把「数据从哪来」和「页面怎么显示」隔开。
 * ============================================================
 */

/** 模拟网络延迟，让 loading 效果能被看见 */
function delay(ms = 300) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** 切换启用状态（列表页行内开关用） */
export async function toggleInspectPlanStatus(id: number, status: EnableStatus): Promise<void> {
  await delay(200)
  const target = inspectPlans.find((i) => i.id === id)
  if (!target) throw new Error('巡检计划不存在')
  target.status = status
}

type InspectPlanInput = Omit<InspectPlanForm, 'deviceCode' | 'deviceName'>

/** 空值判断 */
function isBlank(value: unknown) {
  return value === '' || value === undefined || value === null
}

/** 按 deviceId 查询设备 */
function findDevice(deviceId: number) {
  const device = devices.find((d) => d.id === deviceId)
  if (!device) throw new Error('设备不存在，请重新选择')
  return device
}

/** 关键字匹配：计划名称 / 设备名称  */
function matchKeyword(row: InspectPlan, keyword: string) {
  return (
    row.planName.toLowerCase().includes(keyword) || row.deviceName.toLowerCase().includes(keyword)
  )
}

/** 分页 + 条件查询 */
export async function getInspectPlanPage(
  query: InspectPlanQuery,
): Promise<PageResult<InspectPlan>> {
  await delay()

  let list = [...inspectPlans]

  const keyword = (query.keyword || '').trim().toLowerCase()
  if (keyword) list = list.filter((i) => matchKeyword(i, keyword))
  if (!isBlank(query.deviceId)) list = list.filter((i) => i.deviceId === query.deviceId)
  if (!isBlank(query.frequency)) list = list.filter((i) => i.frequency === query.frequency)
  if (!isBlank(query.status)) list = list.filter((i) => i.status === query.status)

  const total = list.length
  const start = (query.page - 1) * query.pageSize

  return {
    list: list.slice(start, start + query.pageSize).map((i) => ({ ...i })),
    total,
  }
}

/** 按 id 查单条（编辑回填用） */
export async function getInspectPlanById(id: number): Promise<InspectPlan | null> {
  await delay(100)
  const target = inspectPlans.find((i) => i.id === id)
  return target ? { ...target } : null
}

/** 增加 */
export async function createInspectPlan(data: InspectPlanInput): Promise<void> {
  await delay()
  const device = findDevice(data.deviceId)
  inspectPlans.unshift({
    ...data,
    deviceCode: device.deviceCode,
    deviceName: device.deviceName,
    id: useNextId(),
  })
}

/** 修改 */
export async function updateInspectPlan(id: number, data: InspectPlanInput): Promise<void> {
  await delay()
  const index = inspectPlans.findIndex((i) => i.id === id)
  if (index === -1) throw new Error('巡检计划不存在')
  const device = findDevice(data.deviceId)
  inspectPlans[index] = {
    ...inspectPlans[index],
    ...data,
    deviceCode: device.deviceCode,
    deviceName: device.deviceName,
  }
}

/** 删除 */
export async function deleteInspectPlan(id: number): Promise<void> {
  await delay()
  const index = inspectPlans.findIndex((i) => i.id === id)
  if (index === -1) throw new Error('巡检计划不存在')
  inspectPlans.splice(index, 1)
}
