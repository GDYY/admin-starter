import type { Device, DeviceForm, DeviceQuery, PageResult } from '@/types/device'
import { CATEGORY_OPTIONS, devices, useNextId } from '@/mock/db'

/**
 * ============================================================
 *  API 层
 * ------------------------------------------------------------
 *  这里现在直接操作内存假数据。
 *  等后端好了，把每个函数体换成 request(...) 就行，页面代码一行都不用改：
 *
 *    return request<PageResult<Device>>({
 *      url: '/device/page', method: 'get', params: query,
 *    })
 *
 *  这就是「分层」的意义：把「数据从哪来」和「页面怎么显示」隔开。
 * ============================================================
 */

/** 模拟网络延迟，让 loading 效果能被看见 */
function delay(ms = 300) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** 分页 + 条件查询 */
export async function getDevicePage(query: DeviceQuery): Promise<PageResult<Device>> {
  await delay()

  let list = [...devices]

  // 关键字：设备编号 或 设备名称
  const keyword = (query.keyword || '').trim().toLowerCase()
  if (keyword) {
    list = list.filter(
      (d) =>
        d.deviceCode.toLowerCase().includes(keyword) ||
        d.deviceName.toLowerCase().includes(keyword),
    )
  }
  if (query.category) {
    list = list.filter((d) => d.category === query.category)
  }
  if (query.status !== '' && query.status !== undefined && query.status !== null) {
    list = list.filter((d) => d.status === query.status)
  }

  const total = list.length
  const start = (query.page - 1) * query.pageSize

  return {
    list: list.slice(start, start + query.pageSize),
    total,
  }
}

/** 按 id 查单条（编辑回填用） */
export async function getDeviceById(id: number): Promise<Device | null> {
  await delay(100)
  const target = devices.find((d) => d.id === id)
  return target ? { ...target } : null
}

/** 新增 */
export async function createDevice(data: DeviceForm): Promise<void> {
  await delay()
  const duplicated = devices.some((d) => d.deviceCode === data.deviceCode)
  if (duplicated) {
    throw new Error(`设备编号 ${data.deviceCode} 已存在`)
  }
  devices.unshift({
    ...data,
    id: useNextId(),
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
  })
}

/** 修改 */
export async function updateDevice(id: number, data: DeviceForm): Promise<void> {
  await delay()
  const index = devices.findIndex((d) => d.id === id)
  if (index === -1) throw new Error('设备不存在')
  const duplicated = devices.some((d) => d.deviceCode === data.deviceCode && d.id !== id)
  if (duplicated) {
    throw new Error(`设备编号 ${data.deviceCode} 已存在`)
  }
  devices[index] = { ...devices[index], ...data }
}

/** 删除 */
export async function deleteDevice(id: number): Promise<void> {
  await delay()
  const index = devices.findIndex((d) => d.id === id)
  if (index === -1) throw new Error('设备不存在')
  devices.splice(index, 1)
}

/** 设备类型下拉选项 */
export async function getCategoryOptions(): Promise<string[]> {
  await delay(100)
  return [...CATEGORY_OPTIONS]
}
