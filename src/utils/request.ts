import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
})

// ── Mock 拦截器 ──────────────────────────────────────────────
if (USE_MOCK) {
  let mockReady = false

  // 预加载 mock 模块
  import('../mock/data').then(() => { mockReady = true })

  request.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // 等待 mock 模块加载完成
      if (!mockReady) {
        await import('../mock/data')
        mockReady = true
      }

      const { mockHandle } = await import('../mock/data')
      const method = config.method?.toUpperCase() || 'GET'
      const fullUrl = `${config.baseURL || ''}${config.url || ''}`

      try {
        const mockResult = await mockHandle(method, fullUrl, config.data)
        if (mockResult !== null) {
          // 设置自定义 adapter 返回 mock 数据，跳过真实网络请求
          config.adapter = async () => {
            const response: AxiosResponse = {
              data: mockResult,
              status: 200,
              statusText: 'OK',
              headers: {} as Record<string, string>,
              config,
            }
            return response
          }
        }
      } catch (err) {
        // mock 抛出的错误（401/404 等），构造为类 AxiosError 便于拦截器处理
        const mockErr = err as { response?: { status?: number; data?: { detail?: string; message?: string } } }
        const axiosError = new AxiosError(
          mockErr?.response?.data?.detail || mockErr?.response?.data?.message || 'Request failed',
          'ERR_BAD_REQUEST',
          config,
          null,
          {
            status: mockErr?.response?.status || 500,
            statusText: '',
            headers: {} as Record<string, string>,
            config,
            data: mockErr?.response?.data || {},
          } as AxiosResponse,
        )
        config.adapter = async () => {
          return Promise.reject(axiosError)
        }
      }
      return config
    },
    (error) => Promise.reject(error),
  )
}

// ── Token 注入 ────────────────────────────────────────────────
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// ── 响应解包 ──────────────────────────────────────────────────
request.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
    }

    return Promise.reject(error)
  },
)

export default request
