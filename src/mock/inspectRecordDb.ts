import type { InspectRecord, InspectDetailPayload } from '@/types/inspect'
import { inspectItems } from '@/mock/inspectDb'
import { inspectTasks } from '@/mock/inspectTaskDb'

/** 按设备类型生成一份"看起来像人填的"明细：数值取范围中点，都判正常 */
function buildDetails(category: string): InspectDetailPayload[] {
  return inspectItems
    .filter((i) => i.category === category && i.status === 1)
    .sort((a, b) => a.sort - b.sort)
    .map((item) => {
      let value = ''
      if (item.checkType === 1) value = '正常'
      else if (item.checkType === 2) {
        value =
          item.minValue !== null && item.maxValue !== null
            ? String(((item.minValue + item.maxValue) / 2).toFixed(1))
            : ''
      } else value = '外观正常，无破损渗漏'

      return {
        itemId: item.id,
        itemName: item.itemName,
        checkValue: value,
        isAbnormal: 0 as const,
        remark: '',
      }
    })
}

/** 预置记录：给「一开始就已完成」的任务配一份巡检记录，供「查看」演示 */
const seedRecords: InspectRecord[] = inspectTasks
  .filter((t) => t.finished && t.lastInspectTime)
  .map((t, i) => ({
    id: i + 1,
    planId: t.id,
    deviceId: t.deviceId,
    deviceCode: t.deviceCode,
    deviceName: t.deviceName,
    inspectTime: t.lastInspectTime as string,
    remark: '',
    details: buildDetails(t.category),
    createdAt: t.lastInspectTime as string,
  }))

/** 巡检记录：预置的 + 用户提交的 */
export const inspectRecords: InspectRecord[] = [...seedRecords]

/** 下一个可用 id */
export let nextId = seedRecords.length + 1
export function useNextId() {
  return nextId++
}
