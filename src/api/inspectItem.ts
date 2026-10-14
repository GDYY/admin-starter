import type {
  InspectItemForm,
  InspectItem,
  InspectItemQuery,
  PageResult,
} from "@/types/inspectItem";
import { CATEGORY_OPTIONS, inspectItems, useNextId } from "@/mock/inspectDb";

/**
 * ============================================================
 *  API 层
 * ------------------------------------------------------------
 *  这里现在直接操作内存假数据。
 *  等后端好了，把每个函数体换成 request(...) 就行，页面代码一行都不用改：
 *
 *    return request<PageResult<InspectItem>>({
 *      url: '/inspect-item/page', method: 'get', params: query,
 *    })
 *
 *  这就是「分层」的意义：把「数据从哪来」和「页面怎么显示」隔开。
 * ============================================================
 */

/** 模拟网络延迟，让 loading 效果能被看见 */
function delay(ms = 300) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
/** 同一设备类型下，点检项名称不能重复 */
function assertNoDuplicate(data: InspectItemForm, excludeId?: number) {
  const dup = inspectItems.some(
    (i) =>
      i.category === data.category &&
      i.itemName === data.itemName &&
      i.id !== excludeId,
  );
  if (dup)
    throw new Error(`「${data.category}」下已经有「${data.itemName}」了`);
}

/** 分页 + 条件查询 */
export async function getInspectItemPage(
  query: InspectItemQuery,
): Promise<PageResult<InspectItem>> {
  await delay();

  let list = [...inspectItems];

  // 关键字：点检项名称 或 判定标准
  const keyword = (query.keyword || "").trim().toLowerCase();
  if (keyword) {
    list = list.filter(
      (i) =>
        i.itemName.toLowerCase().includes(keyword) ||
        i.standard.toLowerCase().includes(keyword),
    );
  }
  if (query.category) {
    list = list.filter((i) => i.category === query.category);
  }
  if (
    query.status !== "" &&
    query.status !== undefined &&
    query.status !== null
  ) {
    list = list.filter((i) => i.status === query.status);
  }
  if (
    query.checkType !== "" &&
    query.checkType !== undefined &&
    query.checkType !== null
  ) {
    list = list.filter((i) => i.checkType === query.checkType);
  }
  const total = list.length;
  const start = (query.page - 1) * query.pageSize;

  return {
    list: list.slice(start, start + query.pageSize),
    total,
  };
}

/** 按 id 查单条（编辑回填用） */
export async function getInspectItemById(
  id: number,
): Promise<InspectItem | null> {
  await delay(100);
  const target = inspectItems.find((i) => i.id === id);
  return target ? { ...target } : null;
}

/** 新增 */
export async function createInspectItem(data: InspectItemForm): Promise<void> {
  await delay();
  assertNoDuplicate(data);
  inspectItems.unshift({
    ...data,
    id: useNextId(),
  });
  // 排序：先按设备类型的固定顺序，同类型内再按 sort
  inspectItems.sort((a, b) => {
    const diff =
      CATEGORY_OPTIONS.indexOf(a.category) -
      CATEGORY_OPTIONS.indexOf(b.category);
    return diff !== 0 ? diff : a.sort - b.sort;
  });
}

/** 修改 */
export async function updateInspectItem(
  id: number,
  data: InspectItemForm,
): Promise<void> {
  await delay();
  const index = inspectItems.findIndex((i) => i.id === id);
  if (index === -1) throw new Error("点检项不存在");
  assertNoDuplicate(data, id);
  inspectItems[index] = { ...inspectItems[index], ...data };
}

/** 删除 */
export async function deleteInspectItem(id: number): Promise<void> {
  await delay();
  const index = inspectItems.findIndex((i) => i.id === id);
  if (index === -1) throw new Error("点检项不存在");
  inspectItems.splice(index, 1);
}

/** 设备类型下拉选项 */
export async function getCategoryOptions(): Promise<string[]> {
  await delay(100);
  return [...CATEGORY_OPTIONS];
}
