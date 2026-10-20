import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/",
    component: () => import("@/layouts/BasicLayout.vue"),
    redirect: "/home",
    children: [
      {
        path: "home",
        name: "home",
        component: () => import("@/views/HomeView.vue"),
        meta: { title: "首页" },
      },
      {
        path: "device",
        name: "device",
        component: () => import("@/views/device/DeviceList.vue"),
        meta: { title: "设备台账" },
      },
      // TODO(你的练习): 照着上面抄两个 —— 点检项 / 巡检计划
      {
        path: "inspect-item",
        name: "inspect-item",
        component: () => import("@/views/inspect/InspectItemList.vue"),
        meta: { title: "点检项" },
      },
      {
        path: "inspect-plan",
        name: "inspect-plan",
        component: () => import("@/views/inspectPlan/InspectPlanList.vue"),
        meta: { title: "巡检计划" },
      },
    ],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/views/NotFoundView.vue"),
    meta: { title: "404" },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 全局前置守卫：设置标题 + 登录校验
router.beforeEach((to) => {
  const title = to.meta?.title as string | undefined;
  if (title) {
    document.title = `${title} - ${import.meta.env.VITE_APP_TITLE}`;
  }

  const token = localStorage.getItem("token");

  // 没登录，访问任何非登录页 -> 赶去登录页，并记住原本想去的地方
  if (to.path !== "/login" && !token) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  // 已登录还想去登录页 -> 直接送回首页
  if (to.path === "/login" && token) {
    return { path: "/" };
  }
  return true;
});

export default router;
