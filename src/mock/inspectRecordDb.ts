import type { InspectRecord, InspectDetailPayload } from '@/types/inspect'
import { inspectItems } from '@/mock/inspectDb'
import { inspectTasks } from '@/mock/inspectTaskDb'
import { devices } from '@/mock/db'

/** 两位补零 */
const pad = (n: number) => String(n).padStart(2, '0')

/** 假数据 */
function buildDetails(category: string, abnormal = false): InspectDetailPayload[] {
  const items = inspectItems
    .filter((i) => i.category === category && i.status === 1)
    .sort((a, b) => a.sort - b.sort)

  // 优先挑数值项（能造出超上限值），没有就退到「正常/异常」项，再没有就第一条
  const abnormalItem = abnormal
    ? (items.find((i) => i.checkType === 2 && i.maxValue !== null) ??
      items.find((i) => i.checkType === 1) ??
      items[0])
    : undefined
  const abnormalItemId = abnormalItem?.id ?? null

  return items.map((item) => {
    const isBad = item.id === abnormalItemId
    let value = ''

    if (isBad) {
      // ?? 0 只用于收窄类型：上面挑异常项时已保证 maxValue !== null，运行时走不到；
      // 真走到就说明挑选逻辑坏了，会造出「判了异常、值却没超范围」的矛盾数据
      if (item.checkType === 2) value = ((item.maxValue ?? 0) * 1.2).toFixed(1)
      else if (item.checkType === 1) value = '异常'
      else value = '发现渗漏，已停机处理'
    } else if (item.checkType === 1) {
      value = '正常'
    } else if (item.checkType === 2) {
      value =
        item.minValue !== null && item.maxValue !== null
          ? ((item.minValue + item.maxValue) / 2).toFixed(1)
          : ''
    } else {
      value = '外观正常，无破损渗漏'
    }

    return {
      itemId: item.id,
      itemName: item.itemName,
      checkValue: value,
      isAbnormal: isBad ? 1 : 0,
      remark: isBad ? `${item.itemName}超出标准，已通知班组处理` : '',
    }
  })
}

/** 历史记录的日期：从 2026-10-10 起每天一条，跨月自动进位 */
const HISTORY_DATES = Array.from({ length: 13 }, (_, i) => {
  const date = new Date(2026, 9, 10 + i)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
})
/** 巡检时间轮换，避免 13 条记录时间点全一样 */
const HISTORY_TIMES = ['08:40', '09:25', '10:10', '13:35', '14:20', '15:05', '16:40']
const HISTORY_EXECUTORS = [...new Set(inspectTasks.map((t) => t.executor))].filter(Boolean)

/** 历史记录：planId 用 0 表示不属于今天的任务；每 3 条一条异常 */
function buildHistoryRecords(): InspectRecord[] {
  return HISTORY_DATES.map((date, index) => {
    // 步长 5 与设备数 63 互质，13 条记录不会重复用到同一台设备
    const device = devices[(index * 5 + 2) % devices.length]
    const abnormal = (index + 1) % 3 === 0
    const inspectTime = `${date} ${HISTORY_TIMES[index % HISTORY_TIMES.length]}`
    const executor = HISTORY_EXECUTORS[index % HISTORY_EXECUTORS.length] ?? '张伟'

    return {
      id: 0, // 排序后统一编号
      planId: 0,
      deviceId: device.id,
      deviceCode: device.deviceCode,
      deviceName: device.deviceName,
      inspectTime,
      remark: abnormal ? '已通知班组停机处理' : '',
      details: buildDetails(device.category, abnormal),
      createdAt: inspectTime,
      executor,
    }
  })
}

/** 把 'YYYY-MM-DD HH:mm' 往后推几分钟，跨天也能算对 */
function addMinutes(time: string, minutes: number): string {
  const [date, clock] = time.split(' ')
  const stamp = new Date(`${date}T${clock}:00`)
  stamp.setMinutes(stamp.getMinutes() + minutes)
  return `${stamp.getFullYear()}-${pad(stamp.getMonth() + 1)}-${pad(stamp.getDate())} ${pad(
    stamp.getHours(),
  )}:${pad(stamp.getMinutes())}`
}

/** 今日预置：给「一开始就已完成」的任务配一份记录，供「查看」演示 */
function buildTodayRecords(): InspectRecord[] {
  return inspectTasks
    .filter((t) => t.finished && t.lastInspectTime)
    .map((t, index) => {
      // 任务表里这几条记录的 lastInspectTime 是同一个时间戳，
      // 按顺序错开 8 分钟，列表里才不会像复制粘贴出来的
      const inspectTime = addMinutes(t.lastInspectTime as string, index * 8)
      return {
        id: 0,
        planId: t.id,
        deviceId: t.deviceId,
        deviceCode: t.deviceCode,
        deviceName: t.deviceName,
        inspectTime,
        remark: '',
        details: buildDetails(t.category),
        createdAt: inspectTime,
        executor: t.executor,
      }
    })
}

/** 预置记录：历史 + 今日已完成，按巡检时间倒序，统一编号 */
const seedRecords: InspectRecord[] = [...buildHistoryRecords(), ...buildTodayRecords()]
  .sort((a, b) => b.inspectTime.localeCompare(a.inspectTime))
  .map((record, index) => ({ ...record, id: index + 1 }))

/** 巡检记录：预置的 + 用户提交的 */
export const inspectRecords: InspectRecord[] = [...seedRecords]

/** 下一个可用 id */
export let nextId = seedRecords.length + 1
export function useNextId() {
  return nextId++
}
