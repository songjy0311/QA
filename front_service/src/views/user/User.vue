<template>
  <div class="user-container">
    <header class="header">
      <div class="header-left">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke-width="2"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke-width="2"/>
          <path d="M9 6h6M9 10h6M9 14h3" stroke-width="2"/>
        </svg>
        <h1>用户指引</h1>
      </div>
      <div class="header-center">
        <div class="search-wrapper-header">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" stroke-width="2"/>
            <path d="M21 21l-4.35-4.35" stroke-width="2"/>
          </svg>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索当前文档..."
            class="search-input-header"
            clearable
            @input="handleSearch"
          />
        </div>
      </div>
      <div class="header-right">
        <span class="user-display-name">{{ displayName }}</span>
        <el-button v-if="!authStore.isLoggedIn" type="primary" size="small" @click="showLogin = true">登录</el-button>
        <el-button v-else size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </header>

    <!-- 登录弹窗 -->
    <div v-if="showLogin" class="login-modal-overlay" @click.self="showLogin = false">
      <div class="login-modal">
        <div class="login-header">
          <h2>用户登录</h2>
        </div>
        <div class="login-form">
          <div class="form-group">
            <label>账号</label>
            <input v-model="loginForm.username" type="text" placeholder="请输入账号" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <div class="password-input-wrapper">
              <input
                v-model="loginForm.password"
                :type="showLoginPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                @keyup.enter="handleLogin"
              />
              <button
                type="button"
                class="password-toggle"
                @mouseenter="showLoginPassword = true"
                @mouseleave="showLoginPassword = false"
                tabindex="-1"
              >
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke-width="2"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-if="loginError" class="error">{{ loginError }}</div>
          <button class="login-btn" @click="handleLogin">登录</button>
          <button class="login-cancel-btn" @click="showLogin = false">取消</button>
        </div>
      </div>
    </div>

    <div class="main-container">
      <!-- 左侧：目录树 -->
      <aside class="sidebar-left">
        <div class="sidebar-header">
          <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2z" stroke-width="2"/>
          </svg>
          <span class="sidebar-title">首页</span>
        </div>
        <div class="sidebar-section">
          <div class="section-header">
            <span class="section-title">知识库目录</span>
          </div>
          <div class="sidebar-content">
            <MenuTree
              :tree="menuStore.tree"
              :selected-id="menuStore.selectedNodeId"
              :is-user-view="true"
              @select="handleSelectNode"
              @toggle="handleToggleNode"
            />
          </div>
        </div>
      </aside>

      <!-- 右侧：内容展示 -->
      <aside class="sidebar-right">
        <div class="sidebar-content">
          <ContentDisplay
            v-if="menuStore.selectedNodeId"
            :node-id="menuStore.selectedNodeId"
            :search-keyword="searchKeyword"
            :search-results="searchResults"
            @search-click="handleSearchClick"
          />
          <div v-else class="empty-hint">
            <svg class="empty-icon" viewBox="0 0 64 64" fill="none">
              <path d="M32 4C16.5 4 4 16.5 4 32s12.5 28 28 28 28-12.5 28-28S47.5 4 32 4z" fill="#e8f4fd"/>
              <path d="M20 24h24M20 32h24M20 40h16" stroke="#1890ff" stroke-width="2"/>
              <circle cx="32" cy="32" r="28" stroke="#d0e8f7" stroke-width="2"/>
            </svg>
            <p>请从左侧选择节点查看内容</p>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { contentApi } from '@/api'
import { ElMessage } from 'element-plus'
import MenuTree from '@/components/MenuTree.vue'
import ContentDisplay from '@/components/ContentDisplay.vue'

const router = useRouter()
const authStore = useAuthStore()
const menuStore = useMenuStore()

const showLogin = ref(false)
const loginForm = ref({ username: '', password: '' })
const loginError = ref('')
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const showLoginPassword = ref(false)

const displayName = computed(() => {
  if (authStore.isLoggedIn) {
    return '你好，' + (authStore.user?.nickname || authStore.user?.username)
  }
  return '游客'
})

onMounted(async () => {
  await menuStore.loadUserTree(!authStore.isLoggedIn)

  // URL自动定位
  const urlParams = new URLSearchParams(window.location.search)
  const fromUrl = urlParams.get('from') || document.referrer
  if (fromUrl) {
    autoLocateNode(fromUrl)
  }
})

function handleSelectNode(nodeId: number) {
  menuStore.selectNode(nodeId)
  searchKeyword.value = ''
  searchResults.value = []
}

function handleToggleNode(nodeId: number) {
  menuStore.toggleNode(nodeId)
}

async function handleLogin() {
  loginError.value = ''
  if (!loginForm.value.username || !loginForm.value.password) {
    loginError.value = '请输入账号和密码'
    return
  }

  try {
    await authStore.login(loginForm.value.username, loginForm.value.password)
    showLogin.value = false
    loginForm.value = { username: '', password: '' }
    await menuStore.loadUserTree(false)
    ElMessage.success('登录成功')
  } catch (e: any) {
    loginError.value = e.message || '登录失败'
  }
}

function handleLogout() {
  authStore.logout()
}

async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }

  try {
    const res = await contentApi.userSearch(searchKeyword.value, 20, authStore.getUserId())
    if (res.code === 200) {
      searchResults.value = res.data || []
    }
  } catch (e: any) {
    console.error('搜索失败:', e)
  }
}

function handleSearchClick(result: any) {
  // 左边目录树联动
  menuStore.selectNode(result.nodeId)
  // 展开父节点
  expandToNode(result.nodeId)
  searchKeyword.value = ''
  searchResults.value = []
}

function expandToNode(nodeId: number) {
  const findPath = (nodes: any[], targetId: number, path: number[] = []): number[] | null => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return [...path, node.id]
      }
      if (node.children) {
        const result = findPath(node.children, targetId, [...path, node.id])
        if (result) return result
      }
    }
    return null
  }

  const path = findPath(menuStore.tree, nodeId)
  if (path) {
    path.forEach(id => {
      const node = menuStore.findNode(id)
      if (node && !node.expanded) {
        menuStore.toggleNode(id)
      }
    })
  }
}

function autoLocateNode(url: string) {
  const findNode = (nodes: any[]): any => {
    for (const node of nodes) {
      if (node.url && url.includes(node.url)) {
        return node
      }
      if (node.children) {
        const found = findNode(node.children)
        if (found) return found
      }
    }
    return null
  }

  const node = findNode(menuStore.tree)
  if (node) {
    menuStore.selectNode(node.id)
    expandToNode(node.id)
  }
}
</script>

<style scoped>
.user-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-color);
}

/* Header 样式 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--white);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #1890ff;
}

.header-left h1 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 600px;
}

.search-wrapper-header {
  position: relative;
  width: 100%;
  max-width: 420px;
}

.search-wrapper-header .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #bfbfbf;
  z-index: 1;
  pointer-events: none;
}

.search-input-header {
  width: 100%;
}

.search-input-header :deep(.el-input__wrapper) {
  padding-left: 38px;
  border-radius: 20px;
  background: #f5f5f5;
  border: 1px solid transparent;
  box-shadow: none;
  transition: all 0.3s;
}

.search-input-header :deep(.el-input__wrapper):hover {
  background: #fff;
  border-color: #d9d9d9;
}

.search-input-header :deep(.el-input__wrapper.is-focus) {
  background: #fff;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.1);
}

.search-input-header :deep(.el-input__inner) {
  font-size: 14px;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 280px;
  justify-content: flex-end;
}

.user-display-name {
  color: #595959;
  font-size: 14px;
  font-weight: 500;
}

/* 主内容区域 */
.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
  margin: 16px;
  gap: 16px;
}

/* 左侧边栏 */
.sidebar-left {
  width: 280px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.folder-icon {
  width: 20px;
  height: 20px;
  color: #1890ff;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.sidebar-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* 右侧内容区 */
.sidebar-right {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  overflow: hidden;
}

.sidebar-right .sidebar-content {
  flex: 1;
  overflow-y: auto;
  background: #fafafa;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #bfbfbf;
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  opacity: 0.8;
}

.empty-hint p {
  font-size: 15px;
  margin: 0;
  color: #8c8c8c;
}

/* 登录弹窗样式 */
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

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.1);
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  padding-right: 45px;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8c8c8c;
  transition: color 0.3s;
  user-select: none;
}

.password-toggle:hover {
  color: var(--primary-color);
}

.password-toggle .icon {
  width: 20px;
  height: 20px;
  pointer-events: none;
}

.error {
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

.login-cancel-btn {
  width: 100%;
  padding: 12px;
  background: var(--bg-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 10px;
}

.login-cancel-btn:hover {
  background: #e8e8e8;
}

/* 滚动条样式 */
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}
</style>