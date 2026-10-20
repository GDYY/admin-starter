/** 巡查计划相关类型定义 */

/** 巡查频率：1=每日 2=每周 3=每月 */
export type InspectFrequency = 1 | 2 | 3;

/** 启用状态：1=启用 0=停用 */
export type EnableStatus = 0 | 1;

export interface InspectPlan {
  id: number;
  planName: string;
  deviceId: number;
  deviceCode: string;
  deviceName: string;
  frequency: InspectFrequency;
  executor: string;
  startDate: string;
  endDate: string;
  status: EnableStatus;
}

/** 新增/编辑表单的数据（id 由后端生成） */
export type InspectPlanForm = Omit<InspectPlan, "id">;

/** 列表查询条件 */
export interface InspectPlanQuery {
  page: number;
  pageSize: number;
  keyword?: string;
  deviceId?: number | "";
  frequency?: InspectFrequency | "";
  status?: EnableStatus | "";
}

/** 分页返回结构，全局通用 */
export interface PageResult<T> {
  list: T[];
  total: number;
}

/** 巡查频率映射表：一处定义，处处复用（列表、表单、筛选都用它） */
export const FREQUENCY_MAP: Record<
  InspectFrequency,
  { label: string; type: "primary" | "success" | "warning" }
> = {
  1: { label: "每日", type: "primary" },
  2: { label: "每周", type: "success" },
  3: { label: "每月", type: "warning" },
};

export const FREQUENCY_OPTIONS = (
  Object.keys(FREQUENCY_MAP) as unknown as InspectFrequency[]
).map((key) => ({
  value: Number(key) as InspectFrequency,
  label: FREQUENCY_MAP[Number(key) as InspectFrequency].label,
}));

export const ENABLE_STATUS_MAP: Record<
  EnableStatus,
  { label: string; type: "primary" | "success" | "info" | "warning" | "danger" }
> = {
  1: { label: "启用", type: "success" },
  0: { label: "停用", type: "info" },
};

export const ENABLE_STATUS_OPTIONS = (
  Object.keys(ENABLE_STATUS_MAP) as unknown as EnableStatus[]
).map((key) => ({
  value: Number(key) as EnableStatus,
  label: ENABLE_STATUS_MAP[Number(key) as EnableStatus].label,
}));
