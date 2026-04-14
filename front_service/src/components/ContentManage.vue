<template>
  <div class="content-manage">
    <div v-if="searchResults && searchResults.length > 0" class="search-results">
      <div class="search-results-header">
        <span>搜索结果 ({{ searchResults.length }})</span>
        <el-button text size="small" @click="$emit('clearSearch')">清除</el-button>
      </div>
      <div class="search-results-list">
        <div
          v-for="result in searchResults"
          :key="result.id"
          class="search-result-item"
          @click="$emit('searchClick', result)"
        >
          <div class="result-title" v-html="highlightKeyword(result.title)"></div>
          <div class="result-meta">
            <span class="result-path">{{ result.path }}</span>
            <span class="result-type" :class="result.type">{{ result.type === 'qa' ? 'Q&A' : '手册' }}</span>
          </div>
        </div>
      </div>
    </div>

    <template v-else>
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="常见Q&A" name="qa">
          <div class="content-header">
            <template v-if="!isSelectMode">
              <el-button type="primary" @click="handleAdd">+ 新增</el-button>
              <el-button @click="enterSelectMode">更换节点</el-button>
            </template>
            <template v-else>
              <el-button
                type="primary"
                :disabled="selectedIds.length === 0"
                @click="showMoveDialog = true"
              >确认选择{{ selectedIds.length > 0 ? ` (${selectedIds.length})` : '' }}</el-button>
              <el-button @click="exitSelectMode">取消</el-button>
              <span v-if="selectedIds.length > 0" class="select-hint">已选择 {{ selectedIds.length }} 项</span>
            </template>
          </div>
          <div class="content-list">
            <div
              v-for="item in qaList"
              :key="item.id"
              class="content-item"
              :class="{ selected: selectedIds.includes(item.id), highlight: highlightId === item.id }"
              @click="handleItemClick(item)"
            >
              <div class="drag-handle" @click.stop>⋮⋮</div>
              <div class="content-item-main">
                <div class="content-item-header">
                  <span class="content-item-title">{{ item.title }}</span>
                  <div class="content-item-actions">
                    <el-button size="small" text @click.stop="handleEdit(item)">编辑</el-button>
                    <el-button size="small" text type="danger" @click.stop="handleDelete(item.id)">删除</el-button>
                  </div>
                </div>
                <div class="content-item-meta">
                  <span>{{ item.updater || '未知' }}</span>
                  <span>{{ item.updateTime }}</span>
                </div>
              </div>
              <el-checkbox
                v-if="isSelectMode"
                :model-value="selectedIds.includes(item.id)"
                @change="toggleSelect(item.id)"
                @click.stop
              />
            </div>
            <div v-if="qaList.length === 0" class="empty-hint">暂无内容</div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="操作手册" name="manual">
          <div class="content-header">
            <template v-if="!isSelectMode">
              <el-button type="primary" @click="handleAdd">+ 新增</el-button>
              <el-button @click="enterSelectMode">更换节点</el-button>
            </template>
            <template v-else>
              <el-button
                type="primary"
                :disabled="selectedIds.length === 0"
                @click="showMoveDialog = true"
              >确认选择{{ selectedIds.length > 0 ? ` (${selectedIds.length})` : '' }}</el-button>
              <el-button @click="exitSelectMode">取消</el-button>
              <span v-if="selectedIds.length > 0" class="select-hint">已选择 {{ selectedIds.length }} 项</span>
            </template>
          </div>
          <div class="content-list">
            <div
              v-for="item in manualList"
              :key="item.id"
              class="content-item"
              :class="{ selected: selectedIds.includes(item.id), highlight: highlightId === item.id }"
              @click="handleItemClick(item)"
            >
              <div class="drag-handle" @click.stop>⋮⋮</div>
              <div class="content-item-main">
                <div class="content-item-header">
                  <span class="content-item-title">{{ item.title }}</span>
                  <div class="content-item-actions">
                    <el-button size="small" text @click.stop="handleEdit(item)">编辑</el-button>
                    <el-button size="small" text type="danger" @click.stop="handleDelete(item.id)">删除</el-button>
                  </div>
                </div>
                <div class="content-item-meta">
                  <span>{{ item.updater || '未知' }}</span>
                  <span>{{ item.updateTime }}</span>
                </div>
              </div>
              <el-checkbox
                v-if="isSelectMode"
                :model-value="selectedIds.includes(item.id)"
                @change="toggleSelect(item.id)"
                @click.stop
              />
            </div>
            <div v-if="manualList.length === 0" class="empty-hint">暂无内容</div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </template>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="showEditor"
      :title="isEdit ? '编辑内容' : '新增内容'"
      width="800px"
      @close="handleEditorClose"
    >
      <div class="editor-form">
        <div class="form-group">
          <div class="label-row">
            <label>标题</label>
            <span class="char-count">{{ editorForm.title.length }}/120</span>
          </div>
          <el-input v-model="editorForm.title" placeholder="请输入内容标题" maxlength="120" />
        </div>
        <div class="form-group">
          <label>内容</label>
          <div class="rich-editor">
            <QuillEditor
              :key="editorKey"
              v-model:content="editorForm.body"
              content-type="html"
              theme="snow"
              toolbar="full"
            />
          </div>
          <div class="editor-tools">
            <el-button size="small" @click="handleImportWord">导入Word文档</el-button>
            <input ref="wordInput" type="file" accept=".doc,.docx" style="display:none" @change="onWordFileChange" />
            <span class="editor-hint">建议单条内容不超过5000字</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showEditor = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 移动节点弹窗 -->
    <el-dialog v-model="showMoveDialog" title="选择目标节点" width="560px" @close="moveSearchKeyword = ''">
      <el-input
        v-model="moveSearchKeyword"
        placeholder="输入节点名称搜索..."
        clearable
        style="margin-bottom: 12px;"
      />
      <div class="node-select-tree">
        <TreeSelect
          :tree="menuStore.tree"
          :selected-id="targetNodeId"
          :search-keyword="moveSearchKeyword"
          :current-node-id="nodeId"
          @select="targetNodeId = $event"
        />
      </div>
      <template #footer>
        <el-button @click="showMoveDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!targetNodeId" @click="handleMove">确认移动</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { contentApi, ContentItem } from '@/api/content'
import { useMenuStore } from '@/stores/menu'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { QuillEditor } from '@vueup/vue-quill'
import TreeSelect from './TreeSelect.vue'

const props = defineProps<{
  nodeId: number
  searchKeyword?: string
  searchResults?: any[]
}>()

const emit = defineEmits<{
  searchClick: [result: any]
  clearSearch: []
}>()

const menuStore = useMenuStore()
const authStore = useAuthStore()

const activeTab = ref('qa')
const qaList = ref<ContentItem[]>([])
const manualList = ref<ContentItem[]>([])
const highlightId = ref<number | null>(null)

const showEditor = ref(false)
const isEdit = ref(false)
const currentItemId = ref<number | null>(null)
const editorForm = ref({
  title: '',
  body: ''
})
const editorKey = ref(0) // 用于强制重新渲染编辑器

const showMoveDialog = ref(false)
const selectedIds = ref<number[]>([])
const targetNodeId = ref<number | null>(null)
const isSelectMode = ref(false)
const moveSearchKeyword = ref('')
const wordInput = ref<HTMLInputElement>()

function enterSelectMode() {
  isSelectMode.value = true
  selectedIds.value = []
}

function exitSelectMode() {
  isSelectMode.value = false
  selectedIds.value = []
}

// 监听搜索结果，2秒后取消高亮
watch(() => props.searchResults, (newResults) => {
  if (newResults && newResults.length > 0) {
    // 设置第一个结果高亮
    if (newResults[0]) {
      highlightId.value = newResults[0].id
      setTimeout(() => {
        highlightId.value = null
      }, 2000)
    }
  }
})

watch(() => props.nodeId, () => {
  loadContent()
}, { immediate: true })

function handleTabChange() {
  exitSelectMode()
}

async function loadContent() {
  if (activeTab.value === 'qa') {
    const res = await contentApi.getQaList(props.nodeId)
    if (res.code === 200) {
      qaList.value = res.data
    }
  } else {
    const res = await contentApi.getManualList(props.nodeId)
    if (res.code === 200) {
      manualList.value = res.data
    }
  }
}

function handleItemClick(item: ContentItem) {
  if (isSelectMode.value) {
    toggleSelect(item.id)
  } else {
    handleEdit(item)
  }
}

function toggleSelect(id: number) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function handleAdd() {
  isEdit.value = false
  currentItemId.value = null
  editorForm.value = { title: '', body: '' }
  editorKey.value++ // 强制重新渲染编辑器,确保内容清空
  showEditor.value = true
}

function handleEdit(item: ContentItem) {
  isEdit.value = true
  currentItemId.value = item.id
  editorForm.value = {
    title: item.title,
    body: item.body || ''
  }
  editorKey.value++ // 强制重新渲染编辑器
  showEditor.value = true
}

async function handleSave() {
  if (!editorForm.value.title) {
    ElMessage.warning('请输入内容标题')
    return
  }

  const data = {
    nodeId: props.nodeId,
    title: editorForm.value.title,
    body: editorForm.value.body,
    updater: authStore.user?.nickname || authStore.user?.username
  }

  try {
    if (isEdit.value) {
      await contentApi.updateQa(currentItemId.value!, data)
    } else {
      await contentApi.addQa(data)
    }
    showEditor.value = false
    // 清空表单
    editorForm.value = { title: '', body: '' }
    currentItemId.value = null
    await loadContent()
    ElMessage.success('保存成功')
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  }
}

function handleEditorClose() {
  // 弹窗关闭时清空表单,确保下次打开是空白的
  editorForm.value = { title: '', body: '' }
  currentItemId.value = null
}

async function handleDelete(id: number) {
  if (!confirm('确定要删除该内容吗？')) return

  try {
    await contentApi.deleteQa(id)
    await loadContent()
    ElMessage.success('删除成功')
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}

async function handleMove() {
  if (!targetNodeId.value) {
    ElMessage.warning('请选择目标节点')
    return
  }

  try {
    if (activeTab.value === 'qa') {
      await contentApi.moveQa(selectedIds.value, targetNodeId.value)
    } else {
      await contentApi.moveManual(selectedIds.value, targetNodeId.value)
    }
    showMoveDialog.value = false
    exitSelectMode()
    targetNodeId.value = null
    ElMessage.success('移动成功')
  } catch (e: any) {
    ElMessage.error(e.message || '移动失败')
  }
}

function handleImportWord() {
  wordInput.value?.click()
}

async function onWordFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 简单演示：读取文件名作为内容
  // 实际需要使用 mammoth.js 解析 Word 文档
  ElMessage.info('Word导入功能演示：文件 ' + file.name + ' 已选择')
  // 这里可以集成 mammoth.js 来解析 Word 文档内容
}

function highlightKeyword(text: string): string {
  if (!props.searchKeyword) return text
  const regex = new RegExp(`(${props.searchKeyword})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}
</script>

<style scoped>
.content-manage {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--white);
}

.search-results {
  flex: 1;
  overflow-y: auto;
}

.search-results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  font-weight: 500;
  font-size: 14px;
}

.search-results-list {
  padding: 16px;
}

.search-result-item {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: var(--bg-color);
}

.result-title {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
  color: var(--text-color);
}

.result-title :deep(.highlight) {
  background: #fff3cd;
  color: var(--warning-color);
}

.result-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.result-type {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 11px;
}

.result-type.qa {
  background: #e3f2fd;
  color: var(--primary-color);
}

.result-type.manual {
  background: #f6ffed;
  color: var(--success-color);
}

.content-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
  align-items: center;
}

.content-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.content-item {
  background: var(--bg-color);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  padding-left: 36px;
}

.content-item:hover {
  box-shadow: var(--shadow);
}

.content-item.selected {
  background-color: #e3f2fd;
  border-color: var(--primary-color);
}

.content-item.highlight {
  background-color: #fff3cd;
  border-color: var(--warning-color);
  transition: background-color 2s ease-out;
}

.drag-handle {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: grab;
  color: #999;
  font-size: 14px;
  padding: 4px;
  user-select: none;
}

.drag-handle:hover {
  color: #666;
}

.content-item-main {
  flex: 1;
  min-width: 0;
}

.content-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.content-item-title {
  font-weight: 500;
  color: var(--text-color);
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-item-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.empty-hint {
  color: var(--text-secondary);
  text-align: center;
  padding: 40px 20px;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.char-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.rich-editor {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.rich-editor :deep(.ql-toolbar) {
  border: none;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-color);
}

.rich-editor :deep(.ql-container) {
  border: none;
  font-size: 14px;
  min-height: 200px;
}

.rich-editor :deep(.ql-editor) {
  min-height: 200px;
  line-height: 1.6;
  font-family: inherit;
}

.editor-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.editor-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.node-select-tree {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.select-hint {
  font-size: 13px;
  color: var(--primary-color);
  margin-left: 4px;
}

/* Tabs 样式 */
:deep(.el-tabs__header) {
  margin: 0;
}

:deep(.el-tabs__nav) {
  width: 100%;
  display: flex;
}

:deep(.el-tabs__item) {
  font-size: 14px;
  height: 40px;
  line-height: 40px;
  flex: 1;
  text-align: center;
}

:deep(.el-tabs__content) {
  padding: 0;
}
</style>