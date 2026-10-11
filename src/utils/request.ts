import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
})

/* ---------------- 请求拦截器：统一带上 token ---------------- */
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/* ---------------- 响应拦截器：统一剥壳 + 统一报错 ---------------- */
service.interceptors.response.use(
  (response) => {
    const res = response.data

    // TODO(你来实现): 按后端约定判断业务码。
    // 常见约定：{ code: 0, data: ..., message: 'ok' }
    //   if (res.code !== 0) { ElMessage.error(res.message); return Promise.reject(new Error(res.message)) }
    //   return res.data
    return res
  },
  (error) => {
    // TODO(你来实现): 401 时清掉 token 并跳回登录页
    //   if (error?.response?.status === 401) { localStorage.removeItem('token'); location.href = '/login' }
    const msg =
      error?.response?.data?.message || error?.message || '请求失败，请稍后重试'
    ElMessage.error(msg)
    return Promise.reject(error)
  },
)

/** 业务里统一用这个发请求，带上泛型就有返回值类型 */
export function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config) as unknown as Promise<T>
}

export default service
