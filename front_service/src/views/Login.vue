<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>系统问答与操作手册</h2>
      </div>
      <div class="login-form">
        <div class="form-group">
          <label>账号</label>
          <input
            v-model="form.username"
            type="text"
            placeholder="请输入账号"
            @keyup.enter="handleLogin"
          />
        </div>
        <div class="form-group">
          <label>密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            @keyup.enter="handleLogin"
          />
        </div>
        <div class="form-group role-select">
          <label>角色</label>
          <el-radio-group v-model="form.role">
            <el-radio label="admin">管理员</el-radio>
            <el-radio label="user">普通用户</el-radio>
          </el-radio-group>
        </div>
        <div v-if="error" class="error">{{ error }}</div>
        <button class="login-btn" @click="handleLogin">登录</button>
      </div>
      <div class="login-hint">
        <p>管理员账号: admin / admin123</p>
        <p>用户账号: user / user123</p>
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

async function handleLogin() {
  error.value = ''
  if (!form.value.username || !form.value.password) {
    error.value = '请输入账号和密码'
    return
  }

  try {
    await authStore.login(form.value.username, form.value.password)
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
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%);
}

.login-box {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(24, 144, 255, 0.2);
  width: 400px;
  padding: 30px;
  border: 1px solid #e3f2fd;
}

.login-header {
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 2px solid #1890ff;
  margin-bottom: 20px;
}

.login-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1890ff;
  margin: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.role-select {
  display: flex;
  align-items: center;
  gap: 20px;
}

.role-select label {
  margin-bottom: 0;
}

.error {
  color: #ff4d4f;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #1890ff;
  color: #fff;
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

.login-hint {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e8e8e8;
  text-align: center;
}

.login-hint p {
  margin: 5px 0;
  font-size: 12px;
  color: #666;
}
</style>