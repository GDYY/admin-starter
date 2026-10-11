<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="nf">
    <el-result icon="warning" title="404" sub-title="这个页面不存在，或者被删掉了">
      <template #extra>
        <el-button type="primary" @click="router.replace('/')">回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.nf {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
