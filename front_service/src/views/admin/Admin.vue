<template>
  <div class="admin-container">
    <header class="header">
      <div class="header-left">
        <el-button type="primary" @click="handleUploadMenu">
          <span class="btn-icon">📤</span>
          上传功能菜单文件
        </el-button>
        <input
          ref="fileInput"
          type="file"
          accept=".txt"
          style="display:none"
          @change="onFileChange"
        />
        <span class="upload-hint">仅支持解析指定格式的txt文件</span>
      </div>
      <div class="header-right">
        <span class="admin-user-info">欢迎，{{ authStore.user?.nickname || authStore.user?.username }}</span>
        <el-button @click="handleLogout">退出登录</el-button>
        <el-button @click="handleExportQA">下载Q&A</el-button>
        <el-button @click="handleExportManual">下载操作手册</el-button>
      </div>
    </header>

    <div class="main-container">
      <!-- 左侧：目录树 -->
      <aside class="sidebar-left">
        <div class="sidebar-title">目录树</div>
        <MenuTree
          :tree="menuStore.tree"
          :selected-id="menuStore.selectedNodeId"
          @select="handleSelectNode"
          @toggle="handleToggleNode"
          @add="handleAddNode"
          @delete="handleDeleteNode"
          @drop="handleDropNode"
        />
      </aside>

      <!-- 中间：节点配置 -->
      <section class="panel-center">
        <div class="panel-header">
          <h3>节点配置</h3>
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
        <ContentManage
          v-if="menuStore.selectedNodeId"
          :node-id="menuStore.selectedNodeId"
        />
        <div v-else class="empty-hint">请选择节点以管理内容</div>
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

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  await menuStore.loadAdminTree()
})

function handleSelectNode(nodeId: number) {
  menuStore.selectNode(nodeId)
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
  if (!confirm('确定要删除该节点吗？')) return

  try {
    await menuApi.deleteNode(nodeId)
    await menuStore.loadAdminTree()
    ElMessage.success('删除成功')
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
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

async function handleExportQA() {
  try {
    const res = await contentApi.exportQa()
    if (res.code !== 200) {
      ElMessage.error(res.message || '导出失败')
      return
    }

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
    if (res.code !== 200) {
      ElMessage.error(res.message || '导出失败')
      return
    }

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
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-hint {
  font-size: 12px;
  color: #666;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-user-info {
  margin-right: 12px;
  color: #666;
  font-size: 14px;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-left {
  width: 320px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  overflow-y: auto;
  padding: 16px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.panel-center {
  flex: 1;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  min-width: 320px;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.panel-content {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.sidebar-right {
  width: 480px;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.empty-hint {
  color: #666;
  text-align: center;
  padding: 40px 0;
}

.btn-icon {
  margin-right: 6px;
}
</style>