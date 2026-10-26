import type { InspectRecord } from '@/types/inspect'

/**
 * 内存假数据库 —— 巡检记录（主表 + 明细）。
 *
 * 提交一次巡检就往里 push 一条，明细直接挂在 details 上。
 * 纯内存，刷新页面会重置，这是正常的；后端好了以后这个文件整个删掉。
 */
export const inspectRecords: InspectRecord[] = []


/** 下一个可用 id */
export let nextId =  1
export function useNextId() {
  return nextId++
}
