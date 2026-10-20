import { devices } from "@/mock/db";
import type { InspectPlan } from "@/types/inspectPlan";
import { FREQUENCY_MAP } from "@/types/inspectPlan";

/**
 * 内存假数据库 —— 巡检计划。
 *
 * 纯内存的，刷新页面数据会重置，这是正常的。
 * 后端好了以后，这个文件整个删掉。
 */
export const inspectPlans: InspectPlan[] = devices.slice(0, 24).map((d, i) => {
  const frequency = ((i % 3) + 1) as 1 | 2 | 3;
  return {
    id: i + 1,
    planName: `${d.deviceName}-${FREQUENCY_MAP[frequency].label}点检计划`,
    deviceId: d.id, // ← 直接取，不是手写数字
    deviceCode: d.deviceCode, // ← 直接取，不是手写 'EQ-2026-001'
    deviceName: d.deviceName, // ← 直接取
    frequency,
    executor: d.manager, // ← 执行人默认用设备负责人
    startDate: "2026-10-01",
    endDate: frequency === 3 ? "2027-03-31" : "2026-12-31",
    status: i % 5 === 0 ? 0 : 1,
  };
});
export const DEVICE_OPTIONS = devices.map((d) => ({
  value: d.id,
  label: `${d.deviceCode} ${d.deviceName}`,
  deviceCode: d.deviceCode, // 表单里选中后要补冗余字段，顺手带上
  deviceName: d.deviceName,
}));
/** 下一个可用 id */
export let nextId = inspectPlans.length + 1;
export function useNextId() {
  return nextId++;
}
