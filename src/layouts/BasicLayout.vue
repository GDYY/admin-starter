<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Expand, Fold, HomeFilled, SwitchButton } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

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
        <el-menu-item index="/home">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <!-- TODO(你来实现): 每加一个页面，就在这里加一个 el-menu-item -->
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
