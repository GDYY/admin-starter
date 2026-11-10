import type { Abnormal, AbnormalHandleForm, AbnormalQuery } from '@/types/abnormal'
import type { InspectRecord } from '@/types/inspect'
import type { PageResult } from '@/types/inspectPlan'
import { abnormalList, useNextId } from '@/mock/abnormalDb'

/** 模拟网络延迟，让 loading 效果能被看见 */
function delay(ms = 300) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/** 分页 + 条件查询 */
export async function getAbnormalPage(query: AbnormalQuery): Promise<PageResult<Abnormal>> {
  await delay()

  const keyword = (query.keyword || '').trim().toLowerCase()
  let list = [...abnormalList]

  if (keyword) {
    list = list.filter(
      (a) =>
        a.deviceCode.toLowerCase().includes(keyword) ||
        a.deviceName.toLowerCase().includes(keyword),
    )
  }
  // 状态和级别是两个独立条件，不能写成 if...else if，否则只能命中一个
  if (query.status !== '' && query.status !== undefined) {
    list = list.filter((a) => a.status === query.status)
  }
  if (query.level !== '' && query.level !== undefined) {
    list = list.filter((a) => a.level === query.level)
  }

  const total = list.length
  const start = (query.page - 1) * query.pageSize

  return {
    list: list.slice(start, start + query.pageSize).map((a) => ({ ...a })),
    total,
  }
}

/** 按 id 查单条（处理弹窗回填用） */
export async function getAbnormalById(id: number): Promise<Abnormal | null> {
  await delay(200)
  const target = abnormalList.find((a) => a.id === id)
  return target ? { ...target } : null
}

/** 处理异常 */
export async function handleAbnormal(id: number, data: AbnormalHandleForm): Promise<void> {
  await delay()
  if (!data.handleResult.trim()) throw new Error('请填写处理结果')
  if (!data.handler.trim()) throw new Error('请选择处理人')
  if (data.status !== 2 && data.status !== 3) {
    throw new Error('目标状态不合法')
  }

  const target = abnormalList.find((a) => a.id === id)
  if (!target) throw new Error('异常单不存在')
  if (target.status === 3) throw new Error('该异常已闭环，不能再处理')
  if (target.status === 1 && data.status === 3) {
    throw new Error('待处理的异常需要先转为处理中')
  }
  target.level = data.level
  target.handler = data.handler
  target.handleResult = data.handleResult
  target.status = data.status
}

/** 处理人下拉选项：从已有异常单里取，过滤空串 */
export function getHandlerOptions() {
  const handlers = Array.from(new Set(abnormalList.map((a) => a.handler))).filter(
    (name) => name !== '',
  )
  return handlers.map((handler) => ({ label: handler, value: handler }))
}

/**
 * 给 submitInspectRecord 用：按一条刚落库的记录生成异常单，返回生成条数。
 *
 * 只扫这一条记录的明细，不遍历全量 inspectRecords —— 否则每次提交都会
 * 把历史异常重造一遍（文档坑 4）。
 */
export async function createAbnormalFromRecord(record: InspectRecord): Promise<number> {
  const abnormalDetails = record.details.filter((d) => d.isAbnormal === 1)

  for (const detail of abnormalDetails) {
    abnormalList.unshift({
      id: useNextId(),
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
    })
  }

  return abnormalDetails.length
}
