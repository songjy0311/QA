<template>
  <div class="login-modal-overlay">
    <div class="login-modal">
      <div class="login-header">
        <h2>管理员登录</h2>
      </div>
      <div class="login-form">
        <div class="login-form-group">
          <label>账号</label>
          <input
            v-model="form.username"
            type="text"
            class="login-input"
            placeholder="请输入账号"
            autocomplete="off"
            @keyup.enter="handleLogin"
          />
        </div>
        <div class="login-form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="login-input"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </div>
        <div class="login-form-group role-select">
          <label>角色</label>
          <el-radio-group v-model="form.role">
            <el-radio :label="'admin'">管理员</el-radio>
            <el-radio :label="'user'">普通用户</el-radio>
          </el-radio-group>
        </div>
        <div v-if="error" class="login-error">{{ error }}</div>
        <button class="login-btn" @click="handleLogin">登录</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  password: '',
  role: 'admin'
})

const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''
  if (!form.value.username || !form.value.password) {
    error.value = '请输入账号和密码'
    return
  }

  console.log('=== 登录表单数据 ===')
  console.log('用户名:', form.value.username)
  console.log('密码: ***')
  console.log('角色:', form.value.role)
  console.log('角色类型:', typeof form.value.role)
  console.log('角色是否为空:', !form.value.role)

  if (!form.value.role) {
    error.value = '请选择登录角色'
    return
  }

  try {
    await authStore.login(form.value.username, form.value.password, form.value.role)
    ElMessage.success('登录成功')

    if (authStore.isAdmin) {
      router.push('/admin')
    } else {
      router.push('/user')
    }
  } catch (e: any) {
    error.value = e.message || '登录失败'
  }
}
</script>

<style scoped>
.login-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.login-modal {
    background: var(--white);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(24, 144, 255, 0.2);
    width: 400px;
    max-width: 90vw;
    animation: loginSlideIn 0.3s ease-out;
    border: 1px solid #e3f2fd;
}

@keyframes loginSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.login-header {
    padding: 30px 30px 20px;
    text-align: center;
    border-bottom: 2px solid var(--primary-color);
    background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%);
}

.login-header h2 {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-color);
    margin: 0;
}

.login-form {
    padding: 30px;
}

.login-form-group {
    margin-bottom: 20px;
}

.login-form-group label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
}

.login-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s;
}

.login-input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.login-error {
    color: var(--danger-color);
    font-size: 13px;
    margin-bottom: 16px;
    min-height: 20px;
    text-align: center;
}

.login-btn {
    width: 100%;
    padding: 12px;
    background: var(--primary-color);
    color: var(--white);
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.login-btn:hover {
    background: #40a9ff;
}

.login-btn:active {
    background: #096dd9;
}

.role-select {
    display: flex;
    align-items: center;
    gap: 20px;
}

.role-select label {
    margin-bottom: 0;
}
</style>