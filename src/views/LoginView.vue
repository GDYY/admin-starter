<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: 'admin',
  password: '123456',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    // ============================================================
    // TODO(第 3 周任务): 把下面这段假登录换成真实接口
    //
    //   import { request } from '@/utils/request'
    //   const res = await request<{ token: string; user: UserInfo }>({
    //     url: '/auth/login',
    //     method: 'post',
    //     data: form,
    //   })
    //   userStore.setToken(res.token)
    //   userStore.setUserInfo(res.user)
    // ============================================================
    await new Promise((resolve) => setTimeout(resolve, 500))
    userStore.setToken('fake-token-' + Date.now())
    userStore.setUserInfo({ name: form.username, role: 'admin' })

    ElMessage.success('登录成功')

    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <el-card class="box" shadow="always">
      <h2 class="title">Admin Starter</h2>
      <p class="subtitle">前端复出练手项目</p>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @keyup.enter="handleSubmit">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="submit" :loading="loading" @click="handleSubmit">
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <p class="tip">默认随便填都能进（假登录），改成真接口后才会校验。</p>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.login {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.box {
  width: 380px;
  padding: 8px 12px;
}

.title {
  margin: 0;
  text-align: center;
}

.subtitle {
  margin: 4px 0 24px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.submit {
  width: 100%;
}

.tip {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
}
</style>
