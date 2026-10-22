import type { InspectItem } from '@/types/inspectItem'

/**
 * 内存假数据库 —— 点检项。
 *
 * 纯内存的，刷新页面数据会重置，这是正常的。
 * 后端好了以后，这个文件整个删掉。
 */

/** 设备类型（和设备的分类保持一致，点检项是按设备类型配的） */
const CATEGORIES = ['电机', '水泵', '风机', '配电柜', '空压机', '输送带']

/** 模板：id 和 category 不用手写，下面 map 的时候自动补上 */
type ItemTemplate = Omit<InspectItem, 'id' | 'category'>

/**
 * 按设备类型定义点检项模板。
 * ⚠️ 三种 checkType 都要覆盖到，否则测不出动态表单的 bug：
 *    1 = 正常/异常（布尔判定）
 *    2 = 数值录入（有单位、有正常范围）
 *    3 = 文字描述
 */
const TEMPLATES: Record<string, ItemTemplate[]> = {
  电机: [
    {
      itemName: '油位检查',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '油位在上下标线之间',
      sort: 1,
      status: 1,
    },
    {
      itemName: '运行温度',
      checkType: 2,
      unit: '℃',
      minValue: 0,
      maxValue: 70,
      standard: '≤ 70 ℃',
      sort: 2,
      status: 1,
    },
    {
      itemName: '运行电流',
      checkType: 2,
      unit: 'A',
      minValue: 0,
      maxValue: 15,
      standard: '≤ 15 A',
      sort: 3,
      status: 1,
    },
    {
      itemName: '轴承异响',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '运行中无异响',
      sort: 4,
      status: 1,
    },
    {
      itemName: '外观检查',
      checkType: 3,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '无明显破损、渗漏',
      sort: 5,
      status: 1,
    },
  ],
  水泵: [
    {
      itemName: '出口压力',
      checkType: 2,
      unit: 'MPa',
      minValue: 0.2,
      maxValue: 0.6,
      standard: '运行压力在 0.2 ~ 0.6 MPa',
      sort: 1,
      status: 1,
    },
    {
      itemName: '机械密封渗漏',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '无滴漏',
      sort: 2,
      status: 1,
    },
    {
      itemName: '电机温度',
      checkType: 2,
      unit: '℃',
      minValue: 0,
      maxValue: 75,
      standard: '≤ 75 ℃',
      sort: 3,
      status: 1,
    },
    {
      itemName: '管路振动',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '无明显异常振动',
      sort: 4,
      status: 1,
    },
    {
      itemName: '外观检查',
      checkType: 3,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '泵体无锈蚀、铭牌清晰',
      sort: 5,
      status: 1,
    },
  ],
  风机: [
    {
      itemName: '皮带松紧度',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '按压下沉 10~15mm 为正常',
      sort: 1,
      status: 1,
    },
    {
      itemName: '轴承温度',
      checkType: 2,
      unit: '℃',
      minValue: 0,
      maxValue: 65,
      standard: '≤ 65 ℃',
      sort: 2,
      status: 1,
    },
    {
      itemName: '风量',
      checkType: 2,
      unit: 'm³/h',
      minValue: 2000,
      maxValue: 5000,
      standard: '2000 ~ 5000 m³/h',
      sort: 3,
      status: 1,
    },
    {
      itemName: '异常噪音',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '无摩擦、撞击声',
      sort: 4,
      status: 1,
    },
    {
      itemName: '外观检查',
      checkType: 3,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '叶轮无积灰、防护网完好',
      sort: 5,
      status: 1,
    },
  ],
  配电柜: [
    {
      itemName: '柜内温度',
      checkType: 2,
      unit: '℃',
      minValue: 0,
      maxValue: 45,
      standard: '≤ 45 ℃',
      sort: 1,
      status: 1,
    },
    {
      itemName: '接线端子温度',
      checkType: 2,
      unit: '℃',
      minValue: 0,
      maxValue: 60,
      standard: '≤ 60 ℃（红外测温）',
      sort: 2,
      status: 1,
    },
    {
      itemName: '指示灯状态',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '指示灯与实际状态一致',
      sort: 3,
      status: 1,
    },
    {
      itemName: '柜体异味',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '无焦糊味',
      sort: 4,
      status: 1,
    },
    {
      itemName: '柜内清洁度',
      checkType: 3,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '无积尘、无杂物、无小动物痕迹',
      sort: 5,
      status: 1,
    },
  ],
  空压机: [
    {
      itemName: '排气压力',
      checkType: 2,
      unit: 'MPa',
      minValue: 0.6,
      maxValue: 0.8,
      standard: '0.6 ~ 0.8 MPa',
      sort: 1,
      status: 1,
    },
    {
      itemName: '排气温度',
      checkType: 2,
      unit: '℃',
      minValue: 0,
      maxValue: 95,
      standard: '≤ 95 ℃',
      sort: 2,
      status: 1,
    },
    {
      itemName: '油位',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '油位在刻度线之间',
      sort: 3,
      status: 1,
    },
    {
      itemName: '冷凝水排放',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '已排放、排水阀无堵塞',
      sort: 4,
      status: 1,
    },
    {
      itemName: '运行记录登记',
      checkType: 3,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '当班运行参数已登记',
      sort: 5,
      status: 0,
    },
  ],
  输送带: [
    {
      itemName: '皮带跑偏',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '皮带居中，跑偏量 < 20mm',
      sort: 1,
      status: 1,
    },
    {
      itemName: '托辊温度',
      checkType: 2,
      unit: '℃',
      minValue: 0,
      maxValue: 60,
      standard: '≤ 60 ℃',
      sort: 2,
      status: 1,
    },
    {
      itemName: '张紧度',
      checkType: 1,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '无打滑、无堆料',
      sort: 3,
      status: 1,
    },
    {
      itemName: '运行速度',
      checkType: 2,
      unit: 'm/s',
      minValue: 0.5,
      maxValue: 2.5,
      standard: '0.5 ~ 2.5 m/s',
      sort: 4,
      status: 1,
    },
    {
      itemName: '外观检查',
      checkType: 3,
      unit: '',
      minValue: null,
      maxValue: null,
      standard: '皮带无撕裂、接头无开裂',
      sort: 5,
      status: 0,
    },
  ],
}

/** 把模板展开成扁平数组，顺便补上自增 id 和 category */
let seq = 1
export const inspectItems: InspectItem[] = Object.entries(TEMPLATES).flatMap(([category, list]) =>
  list.map((t) => ({ ...t, id: seq++, category })),
)

/** 下一个可用 id */
export let nextId = seq
export function useNextId() {
  return nextId++
}

/** 设备类型下拉选项 */
export const CATEGORY_OPTIONS = CATEGORIES
