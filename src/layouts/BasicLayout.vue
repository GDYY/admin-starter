<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  DataLine,
  Document,
  Expand,
  Fold,
  HomeFilled,
  Monitor,
  SwitchButton,
  Tickets,
} from '@element-plus/icons-vue'
import type { Component } from 'vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

/**
 * 菜单配置化：以后加页面只改这个数组，不用动模板。
 * 想加一个菜单？照着抄一行就行。
 */
const menus: { path: string; title: string; icon: Component }[] = [
  { path: '/home', title: '首页', icon: HomeFilled },
  { path: '/device', title: '设备台账', icon: Monitor },
  // TODO(你的练习): 把下面两行的注释去掉，再写好对应页面
  { path: '/inspect-item', title: '点检项', icon: Document },
  { path: '/inspect-plan', title: '巡检计划', icon: DataLine },
  { path: '/inspect-task', title: '巡检执行', icon: Tickets },
]

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
  } catch {
    return // 用户点了取消
  }
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <el-container class="layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '210px'" class="aside">
      <div class="logo">{{ isCollapse ? 'AS' : 'Admin Starter' }}</div>
      <el-menu
        :default-active="route.path"
        router
        :collapse="isCollapse"
        :collapse-transition="false"
      >
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <template #title>{{ m.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶栏 -->
      <el-header class="header">
        <el-icon class="toggle" @click="isCollapse = !isCollapse">
          <Fold v-if="!isCollapse" />
          <Expand v-else />
        </el-icon>
        <span class="page-title">{{ route.meta.title }}</span>
        <div class="spacer" />
        <el-button link :icon="SwitchButton" @click="handleLogout">退出登录</el-button>
      </el-header>

      <!-- 内容区：子路由渲染在这里 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout {
  height: 100%;
}

.aside {
  background: #001529;
  overflow: hidden;
  transition: width 0.2s;

  :deep(.el-menu) {
    border-right: none;
    background: #001529;
  }
  :deep(.el-menu-item) {
    color: #c0c4cc;
  }
  :deep(.el-menu-item:hover) {
    background: #0b2545;
    color: #fff;
  }
  :deep(.el-menu-item.is-active) {
    background: #409eff;
    color: #fff;
  }
}

.logo {
  height: 56px;
  line-height: 56px;
  text-align: center;
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.toggle {
  cursor: pointer;
  font-size: 18px;
}

.page-title {
  font-weight: 600;
}

.spacer {
  flex: 1;
}

.main {
  background: #f5f7fa;
  overflow-y: auto;
}
</style>
