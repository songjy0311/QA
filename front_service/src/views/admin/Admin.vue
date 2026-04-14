<template>
  <div class="admin-container">
    <header class="header">
      <div class="header-left"></div>
      <div class="header-title">
        <h1>用户指引配置页</h1>
      </div>
      <div class="header-right">
        <span class="admin-user-info">欢迎，{{ authStore.user?.nickname || authStore.user?.username }}</span>
        <el-button size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </header>

    <div class="main-container">
      <!-- 左侧：目录树 -->
      <aside class="sidebar-left">
        <div class="sidebar-header">
          <span class="sidebar-title">目录树</span>
          <el-button type="primary" size="small" @click="handleUploadMenu">上传功能菜单</el-button>
          <input ref="fileInput" type="file" accept=".txt" style="display:none" @change="onFileChange" />
        </div>
        <MenuTree
          :tree="menuStore.tree"
          :selected-id="menuStore.selectedNodeId"
          @select="handleSelectNode"
          @toggle="handleToggleNode"
          @add="handleAddNode"
          @delete="handleDeleteNode"
          @restore="handleRestoreNode"
          @drop="handleDropNode"
        />
      </aside>

      <!-- 中间：节点配置 -->
      <section class="panel-center">
        <div class="sidebar-header">
          <span class="sidebar-title">节点配置</span>
        </div>
        <div class="panel-content">
          <NodeConfig
            v-if="menuStore.selectedNodeId"
            :node-id="menuStore.selectedNodeId"
            @update="handleUpdateNode"
          />
          <div v-else class="empty-hint">请从左侧目录树选择一个节点</div>
        </div>
      </section>

      <!-- 右侧：内容管理 -->
      <aside class="sidebar-right">
        <div class="sidebar-header">
          <span class="sidebar-title">内容配置</span>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索内容标题..."
            class="search-input"
            size="small"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" stroke-width="2"/>
                <path d="M21 21l-4.35-4.35" stroke-width="2"/>
              </svg>
            </template>
          </el-input>
          <el-dropdown trigger="click" @command="handleExport">
            <el-button type="primary" size="small">
              批量下载<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="qa">所有Q&A</el-dropdown-item>
                <el-dropdown-item command="manual">所有手册</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="panel-content">
          <ContentManage
            v-if="menuStore.selectedNodeId"
            :node-id="menuStore.selectedNodeId"
            :search-keyword="searchKeyword"
            :search-results="searchResults"
            @search-click="handleSearchClick"
          />
          <div v-else class="empty-hint">请从左侧目录树选择一个节点</div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { menuApi, contentApi } from '@/api'
import { ElMessage } from 'element-plus'
import MenuTree from '@/components/MenuTree.vue'
import NodeConfig from '@/components/NodeConfig.vue'
import ContentManage from '@/components/ContentManage.vue'

const router = useRouter()
const authStore = useAuthStore()
const menuStore = useMenuStore()

const fileInput = ref<HTMLInputElement>()
const searchKeyword = ref('')
const searchResults = ref<any[]>([])

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  await menuStore.loadAdminTree()
})

function handleSelectNode(nodeId: number) {
  menuStore.selectNode(nodeId)
  searchKeyword.value = ''
  searchResults.value = []
}

function handleToggleNode(nodeId: number) {
  menuStore.toggleNode(nodeId)
}

async function handleAddNode(parentId: number) {
  const name = prompt('请输入节点名称：')
  if (!name) return

  try {
    await menuApi.addNode({ parentId, name })
    await menuStore.loadAdminTree()
    ElMessage.success('添加成功')
  } catch (e: any) {
    ElMessage.error(e.message || '添加失败')
  }
}

async function handleDeleteNode(nodeId: number) {
  if (!confirm('确定要删除该节点吗？删除后可在"失效菜单"中恢复。')) return

  try {
    await menuApi.deleteNode(nodeId)
    await menuStore.loadAdminTree()
    ElMessage.success('已移入失效菜单')
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}

async function handleRestoreNode(nodeId: number) {
  try {
    await menuApi.restoreNode(nodeId)
    await menuStore.loadAdminTree()
    ElMessage.success('恢复成功')
  } catch (e: any) {
    ElMessage.error(e.message || '恢复失败')
  }
}

async function handleDropNode(dragId: number, action: string, targetId: number) {
  try {
    await menuApi.updateSort(dragId, action, targetId)
    await menuStore.loadAdminTree()
  } catch (e: any) {
    ElMessage.error(e.message || '排序失败')
  }
}

async function handleUpdateNode() {
  await menuStore.loadAdminTree()
}

function handleUploadMenu() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    await menuApi.uploadMenuFile(file)
    await menuStore.loadAdminTree()
    ElMessage.success('上传成功')
  } catch (e: any) {
    ElMessage.error(e.message || '上传失败')
  }

  fileInput.value!.value = ''
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
    const res = await contentApi.search(searchKeyword.value, 20)
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
  // 找到节点的所有父节点并展开
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
    // 展开路径上的所有节点
    path.forEach(id => {
      const node = menuStore.findNode(id)
      if (node && !node.expanded) {
        menuStore.toggleNode(id)
      }
    })
  }
}

function handleExport(command: string) {
  if (command === 'qa') {
    handleExportQA()
  } else if (command === 'manual') {
    handleExportManual()
  }
}

async function handleExportQA() {
  try {
    const res = await contentApi.exportQa()
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.download = `系统Q&A导出_${new Date().getTime()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

async function handleExportManual() {
  try {
    const res = await contentApi.exportManual()
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.href = url
    link.download = `操作手册导出_${new Date().getTime()}.zip`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
  }
}
</script>

<style scoped>
.admin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-color);
}

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
  flex: 1;
}

.header-title {
  flex: none;
  text-align: center;
}

.header-title h1 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.admin-user-info {
  color: var(--text-secondary);
  font-size: 14px;
  margin-right: 12px;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-left {
  width: 340px;
  background: var(--white);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.panel-center {
  flex: 1;
  min-width: 300px;
  background: var(--white);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.sidebar-right {
  width: 520px;
  background: var(--white);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 8px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 48px;
  box-sizing: border-box;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-hint {
  color: var(--text-secondary);
  text-align: center;
  padding: 40px 20px;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 4px;
  box-shadow: 0 0 0 1px var(--border-color) inset;
}

.search-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--border-color) inset;
}

.search-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}

.search-input :deep(.el-input__inner) {
  padding-left: 30px;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--text-secondary);
}
</style>