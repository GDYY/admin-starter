<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const stack = [
  { name: 'Vue 3', desc: 'Composition API + <script setup>' },
  { name: 'TypeScript', desc: '类型标注与接口定义' },
  { name: 'Vite', desc: '开发服务器与打包' },
  { name: 'Vue Router', desc: '路由与登录守卫' },
  { name: 'Pinia', desc: '状态管理' },
  { name: 'Element Plus', desc: 'UI 组件库（中文语言包已装）' },
  { name: 'Axios', desc: '请求封装与拦截器' },
  { name: 'Sass', desc: '样式预处理' },
]

const todos = [
  '把 LoginView 里的假登录换成真实的登录接口',
  '在 router/index.ts 里加你的第一个业务路由',
  '在 BasicLayout 里加对应的菜单项',
  '写一个列表页：表格 + 分页 + 搜索 + 新增/编辑弹窗',
  '在 utils/request.ts 里补上业务码判断和 401 处理',
]
</script>

<template>
  <div class="home">
    <el-card shadow="never" class="welcome">
      <h2>欢迎回来，{{ userStore.userInfo?.name || '开发者' }} 👋</h2>
      <p>这是你的后台骨架，所有基础设施都已经接好了。接下来往里面填业务就行。</p>
    </el-card>

    <el-card shadow="never" class="block">
      <template #header><b>技术栈</b></template>
      <el-row :gutter="12">
        <el-col v-for="item in stack" :key="item.name" :xs="24" :sm="12" :md="8" :lg="6">
          <div class="tech">
            <div class="tech-name">{{ item.name }}</div>
            <div class="tech-desc">{{ item.desc }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never" class="block">
      <template #header><b>接下来练什么（按顺序做）</b></template>
      <el-timeline>
        <el-timeline-item v-for="(t, i) in todos" :key="i" :timestamp="`第 ${i + 1} 步`" placement="top">
          {{ t }}
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.home {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome h2 {
  margin: 0 0 8px;
}
.welcome p {
  margin: 0;
  color: #606266;
}

.tech {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafcff;
}
.tech-name {
  font-weight: 600;
  margin-bottom: 4px;
}
.tech-desc {
  font-size: 12px;
  color: #909399;
}
</style>
