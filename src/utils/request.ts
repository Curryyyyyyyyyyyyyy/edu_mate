import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
})

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
