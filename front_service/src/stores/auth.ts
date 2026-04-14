import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, LoginResponse } from '@/api/auth'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<LoginResponse | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username: string, password: string, role?: string) {
    console.log('Auth Store 登录请求:', { username, role })
    const res = await authApi.login({ username, password, role })
    console.log('Auth Store 登录响应:', res)
    if (res.code === 200) {
      token.value = res.data.token
      user.value = res.data
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data))
      return true
    }
    throw new Error(res.message || '登录失败')
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  function getUserId() {
    return user.value?.userId || 0
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    login,
    logout,
    getUserId
  }
})