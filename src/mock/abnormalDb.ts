import type { Abnormal, AbnormalLevel, AbnormalStatus } from '@/types/abnormal'
import { inspectRecords } from '@/mock/inspectRecordDb'
import { devices } from '@/mock/db'

/**
 * 内存假数据库 —— 异常单。
 *
 * 两条来源：
 * 1. 派生：历史巡检记录里明细 isAbnormal === 1 的，各生成一条「待处理」异常单
 * 2. 手工种子：补齐「处理中 / 已闭环」状态和「严重 / 紧急」级别
 *
 * 数组按 createdAt 倒序排列：派生的取记录时间（10-12 ~ 10-21），
 * 手工种子的日期刻意更早，所以直接拼接就是有序的。
 * 以后如果要重新排序，先解析时间再比 —— createdAt 有 '2026-10-23 09:15'
 * 和 '2026/11/2 19:35:12' 两种格式，字符串比较会错。
 */

/** 派生：每条记录里有几条异常明细，就生成几条异常单 */
const derivedAbnormals: Abnormal[] = inspectRecords.flatMap((record) =>
  record.details
    .filter((detail) => detail.isAbnormal === 1)
    .map((detail) => ({
      id: 0, // 合并后统一编号
      recordId: record.id,
      deviceId: record.deviceId,
      deviceCode: record.deviceCode,
      deviceName: record.deviceName,
      itemName: detail.itemName,
      description: detail.remark || `${detail.itemName}巡检判定为异常（${detail.checkValue}）`,
      level: 1,
      handler: '',
      status: 1,
      handleResult: '',
      createdAt: record.createdAt,
    })),
)

/**
 * 取设备的冗余字段，避免手写 deviceCode / deviceName 对不上。
 * 找不到返回 null —— 这里是模块加载期执行的代码，直接抛错会让整个应用白屏，
 * 所以交给调用方跳过这一条种子。
 */
function findDevice(id: number) {
  return devices.find((d) => d.id === id) ?? null
}

type ManualSeed = {
  deviceId: number
  itemName: string
  description: string
  level: AbnormalLevel
  handler: string
  status: AbnormalStatus
  handleResult: string
  createdAt: string
}

/**
 * 手工种子：没有来源记录，recordId 记 0。
 * 两个状态都有、三个级别都有，处理人和处理结果都填上。
 */
const manualSeeds: ManualSeed[] = [
  {
    deviceId: 5,
    itemName: '排气压力',
    description: '实测排气压力 0.92 MPa，超出标准 0.6 ~ 0.8 MPa',
    level: 3,
    handler: '张伟',
    status: 2,
    handleResult: '已停机检查，安全阀待更换',
    createdAt: '2026-10-09 15:20',
  },
  {
    deviceId: 12,
    itemName: '托辊温度',
    description: '托辊温度实测 78℃，超出标准 ≤ 60℃',
    level: 2,
    handler: '李强',
    status: 3,
    handleResult: '更换托辊轴承，复测 48℃ 正常',
    createdAt: '2026-10-06 09:40',
  },
  {
    deviceId: 20,
    itemName: '机械密封渗漏',
    description: '机械密封处持续滴漏，地面有积水',
    level: 2,
    handler: '王芳',
    status: 2,
    handleResult: '已停机，等待密封件到货',
    createdAt: '2026-10-03 14:05',
  },
  {
    deviceId: 33,
    itemName: '轴承温度',
    description: '轴承温度实测 82℃（标准 ≤ 65℃），伴异响',
    level: 3,
    handler: '刘洋',
    status: 3,
    handleResult: '更换润滑脂并调整皮带，温度恢复 52℃',
    createdAt: '2026-09-30 10:10',
  },
  {
    deviceId: 47,
    itemName: '油位',
    description: '油位低于下刻度线，需补油',
    level: 1,
    handler: '陈静',
    status: 3,
    handleResult: '补充润滑油至刻度线，复查正常',
    createdAt: '2026-09-27 08:30',
  },
]

const manualAbnormals: Abnormal[] = []
for (const seed of manualSeeds) {
  const device = findDevice(seed.deviceId)
  if (!device) {
    // 种子里的 deviceId 对不上设备表时跳过，别让模块加载直接崩掉
    console.warn(`[abnormalDb] 设备 ${seed.deviceId} 不存在，跳过这条手工种子`)
    continue
  }
  manualAbnormals.push({
    ...seed,
    id: 0,
    recordId: 0,
    deviceCode: device.deviceCode,
    deviceName: device.deviceName,
  })
}

/** 预置异常单：派生 + 手工，统一编号（派生在前，整体保持 createdAt 倒序） */
const seedAbnormals: Abnormal[] = [...derivedAbnormals, ...manualAbnormals].map((item, index) => ({
  ...item,
  id: index + 1,
}))

/** 异常单：预置 + 巡检提交时生成的 */
export const abnormalList: Abnormal[] = [...seedAbnormals]

/** 下一个可用 id */
export let nextId = seedAbnormals.length + 1
export function useNextId() {
  return nextId++
}
