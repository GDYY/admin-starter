import type { InspectDetailPayload, InspectRecord } from '@/types/inspect'
import { inspectItems } from '@/mock/inspectDb'
import { inspectTasks } from '@/mock/inspectTaskDb'
import { devices } from '@/mock/db'

/**
 * 内存假数据库 —— 巡检记录（主表 + 明细）。
 *
 * 两种来源：
 * 1. 「今天已完成」的任务各配一条，供执行页的「查看」用；
 * 2. 近两周历史记录，供记录页的日期 / 结果筛选和分页演示用（planId = 0，不对应现役任务）。
 * 纯内存，刷新页面会重置，这是正常的。
 */

/**
 * 按设备类型生成一份"看起来像人填的"明细。
 * withAbnormal = true 时，挑第一条能判定的点检项判成异常，并补上异常描述—
 * 否则记录页的「存在异常」筛选永远筛不出东西。
 */
function buildDetails(category: string, withAbnormal = false): InspectDetailPayload[] {
  const items = inspectItems
    .filter((i) => i.category === category && i.status === 1)
    .sort((a, b) => a.sort - b.sort)

  let abnormalMarked = false

  return items.map((item) => {
    let value = ''
    if (item.checkType === 1) value = '正常'
    else if (item.checkType === 2) {
      value =
        item.minValue !== null && item.maxValue !== null
          ? String(((item.minValue + item.maxValue) / 2).toFixed(1))
          : ''
    } else value = '外观正常，无破损渗漏'

    // 一份记录只做一条异常：全是红的反而不像人填的
    let isAbnormal: 0 | 1 = 0
    let remark = ''
    if (withAbnormal && !abnormalMarked && item.checkType !== 3) {
      abnormalMarked = true
      isAbnormal = 1
      if (item.checkType === 1) {
        value = '异常'
        remark = '现场检查发现异响，已上报待处理'
      } else {
        value = item.maxValue !== null ? String(Number((item.maxValue * 1.15).toFixed(2))) : '超标'
        remark =
          item.maxValue !== null ? `实测值超出标准上限（≤ ${item.maxValue}${item.unit}）` : '实测值超标'
      }
    }

    return {
      itemId: item.id,
      itemName: item.itemName,
      checkValue: value,
      isAbnormal,
      remark,
    }
  })
}

/** 预置「今天的」记录：给一开始就已完成的任务各配一份，供执行页「查看」演示 */
const seedRecords: InspectRecord[] = inspectTasks
  .filter((t) => t.finished && t.lastInspectTime)
  .map((t, i) => ({
    id: i + 1,
    planId: t.id,
    deviceId: t.deviceId,
    deviceCode: t.deviceCode,
    deviceName: t.deviceName,
    executor: t.executor,
    inspectTime: t.lastInspectTime as string,
    remark: '',
    details: buildDetails(t.category),
    createdAt: t.lastInspectTime as string,
  }))

/** 历史记录：近两周的旧巡检，日期和结果都铺开，方便记录页筛选演示 */
const historyRecords: InspectRecord[] = devices.slice(0, 16).map((device, i) => {
  const day = String(18 + (i % 13)).padStart(2, '0')
  const hour = String(8 + (i % 9)).padStart(2, '0')
  const minute = String((i * 7) % 60).padStart(2, '0')
  const inspectTime = `2026-10-${day} ${hour}:${minute}`
  const withAbnormal = i % 3 === 0

  return {
    id: 0, // 合并后统一重排
    planId: 0, // 历史记录不对应现役任务
    deviceId: device.id,
    deviceCode: device.deviceCode,
    deviceName: device.deviceName,
    executor: device.manager,
    inspectTime,
    remark: withAbnormal ? '巡检发现异常，已通知设备管理员' : '',
    details: buildDetails(device.category, withAbnormal),
    createdAt: inspectTime,
  }
})

/** 巡检记录 = 今天的 + 历史的，id 统一重排 */
export const inspectRecords: InspectRecord[] = [...seedRecords, ...historyRecords].map(
  (record, i) => ({ ...record, id: i + 1 }),
)

/** 下一个可用 id */
export let nextId = inspectRecords.length + 1
export function useNextId() {
  return nextId++
}
