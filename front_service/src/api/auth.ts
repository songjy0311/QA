import api from './index'

export interface LoginRequest {
  username: string
  password: string
  role?: string // 可选的角色参数
}

export interface LoginResponse {
  userId: number
  username: string
  nickname: string
  role: string
  token: string
}

export const authApi = {
  login(data: LoginRequest) {
    return api.post<any, any>('/auth/login', data)
  },
  logout() {
    return api.post('/auth/logout')
  },
  getCurrentUser() {
    return api.get('/auth/current')
  }
}