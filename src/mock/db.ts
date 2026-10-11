import type { Device, DeviceStatus } from '@/types/device'

/**
 * 内存假数据库。
 * 现在用它撑着，等后端好了这个文件就可以删掉。
 * 刷新页面数据会重置 —— 这是正常的，因为它是纯内存的。
 */

const CATEGORIES = ['电机', '水泵', '风机', '配电柜', '空压机', '输送带']
const LOCATIONS = ['一号车间', '二号车间', '动力站', '配电房', '成品仓库']
const MANAGERS = ['张伟', '李强', '王芳', '刘洋', '陈静']
const MANUFACTURERS = ['西门子', 'ABB', '施耐德', '汇川技术']

function pad(n: number, len = 3) {
  return String(n).padStart(len, '0')
}

/** 状态按 7 条一轮循环，保证每种状态都有数据 */
const STATUS_CYCLE: DeviceStatus[] = [1, 1, 1, 1, 2, 3, 4]

export const devices: Device[] = Array.from({ length: 63 }, (_, i) => {
  const n = i + 1
  const category = CATEGORIES[i % CATEGORIES.length]
  const month = pad((i % 12) + 1, 2)
  const day = pad((i % 27) + 1, 2)
  return {
    id: n,
    deviceCode: `EQ-2026-${pad(n)}`,
    deviceName: `${category}-${pad(n)}号`,
    category,
    location: `${LOCATIONS[i % LOCATIONS.length]}-${(i % 12) + 1}号位`,
    model: `M-${1000 + n}`,
    manufacturer: MANUFACTURERS[i % MANUFACTURERS.length],
    purchaseDate: `202${(i % 5) + 1}-${month}-${day}`,
    status: STATUS_CYCLE[i % STATUS_CYCLE.length],
    manager: MANAGERS[i % MANAGERS.length],
    remark: '',
    createdAt: '2026-01-01 09:00:00',
  }
})

/** 下一个可用 id */
export let nextId = devices.length + 1
export function useNextId() {
  return nextId++
}

export const CATEGORY_OPTIONS = CATEGORIES
