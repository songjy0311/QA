<template>
  <div class="content-display" ref="displayContainer">
    <!-- 节点标题栏 -->
    <div class="content-header">
      <div class="breadcrumb">
        <svg class="breadcrumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-7l-2-2H5a2 2 0 0 0-2 2z" stroke-width="2"/>
        </svg>
        <h2>{{ nodeName }}</h2>
      </div>
    </div>

    <!-- Tabs 切换 -->
    <div v-if="hasQa || hasManual" class="content-tabs">
      <div class="tab-buttons">
        <button
          v-if="hasQa"
          class="tab-button"
          :class="{ active: activeTab === 'qa' }"
          @click="activeTab = 'qa'"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" stroke-width="2"/>
          </svg>
          常见Q&A
          <span class="tab-count">{{ qaList.length }}</span>
        </button>
        <button
          v-if="hasManual"
          class="tab-button"
          :class="{ active: activeTab === 'manual' }"
          @click="activeTab = 'manual'"
        >
          <svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke-width="2"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke-width="2"/>
          </svg>
          操作手册
          <span class="tab-count">{{ manualList.length }}</span>
        </button>
      </div>
    </div>

    <!-- 内容列表 -->
    <div class="content-body">
      <div v-if="hasQa && activeTab === 'qa'" class="content-list">
        <div class="list-header">
          <div class="list-column col-title">名称</div>
          <div class="list-column col-votes">评价</div>
          <div class="list-column col-actions">操作</div>
        </div>
        <div
          v-for="item in qaList"
          :key="item.id"
          class="list-item"
          :class="{ expanded: expandedId === item.id }"
        >
          <div class="item-row" @click="toggleExpand(item)">
            <div class="list-column col-title">
              <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12h6M9 16h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke-width="2"/>
              </svg>
              <span class="item-title">{{ item.title }}</span>
              <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 9l6 6 6-6" stroke-width="2"/>
              </svg>
            </div>
            <div class="list-column col-votes">
              <span class="vote-stat like-stat">👍 {{ item.likes || 0 }}</span>
              <span class="vote-stat dislike-stat">👎 {{ item.dislikes || 0 }}</span>
            </div>
            <div class="list-column col-actions">
              <button class="action-btn" @click.stop="toggleExpand(item)">
                {{ expandedId === item.id ? '收起' : '查看' }}
              </button>
            </div>
          </div>
          <div v-if="expandedId === item.id" class="item-content">
            <div class="content-body-text" v-html="item.body"></div>
            <div class="vote-panel">
              <div class="vote-label">这个内容对你有帮助吗?</div>
              <div class="vote-buttons">
                <button
                  class="vote-btn like"
                  :class="{ active: userVote[item.id] === 'like' }"
                  @click.stop="handleVote(item.id, 'like')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke-width="2"/>
                  </svg>
                  有帮助
                </button>
                <button
                  class="vote-btn dislike"
                  :class="{ active: userVote[item.id] === 'dislike' }"
                  @click.stop="handleDislike(item.id)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" stroke-width="2"/>
                  </svg>
                  没帮助
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="hasManual && activeTab === 'manual'" class="content-list">
        <div class="list-header">
          <div class="list-column col-title">名称</div>
          <div class="list-column col-votes">评价</div>
          <div class="list-column col-actions">操作</div>
        </div>
        <div
          v-for="item in manualList"
          :key="item.id"
          class="list-item"
          :class="{ expanded: expandedId === item.id }"
        >
          <div class="item-row" @click="toggleExpand(item)">
            <div class="list-column col-title">
              <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12h6M9 16h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke-width="2"/>
              </svg>
              <span class="item-title">{{ item.title }}</span>
              <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 9l6 6 6-6" stroke-width="2"/>
              </svg>
            </div>
            <div class="list-column col-votes">
              <span class="vote-stat like-stat">👍 {{ item.likes || 0 }}</span>
              <span class="vote-stat dislike-stat">👎 {{ item.dislikes || 0 }}</span>
            </div>
            <div class="list-column col-actions">
              <button class="action-btn" @click.stop="toggleExpand(item)">
                {{ expandedId === item.id ? '收起' : '查看' }}
              </button>
            </div>
          </div>
          <div v-if="expandedId === item.id" class="item-content">
            <div class="content-body-text" v-html="item.body"></div>
            <div class="vote-panel">
              <div class="vote-label">这个内容对你有帮助吗?</div>
              <div class="vote-buttons">
                <button
                  class="vote-btn like"
                  :class="{ active: userVote[item.id] === 'like' }"
                  @click.stop="handleVote(item.id, 'like')"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke-width="2"/>
                  </svg>
                  有帮助
                </button>
                <button
                  class="vote-btn dislike"
                  :class="{ active: userVote[item.id] === 'dislike' }"
                  @click.stop="handleDislike(item.id)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" stroke-width="2"/>
                  </svg>
                  没帮助
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!hasQa && !hasManual" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" fill="#f5f5f5"/>
          <path d="M20 28h24M20 36h16" stroke="#d9d9d9" stroke-width="2"/>
          <circle cx="32" cy="32" r="30" stroke="#e8e8e8" stroke-width="1"/>
        </svg>
        <p>该节点下暂无内容</p>
      </div>
    </div>

    <!-- 反馈弹窗 -->
    <div v-if="showFeedbackModal" class="feedback-modal-overlay" @click.self="showFeedbackModal = false">
      <div class="feedback-modal">
        <div class="feedback-header">
          <h3>提交反馈意见</h3>
          <button class="close-btn" @click="showFeedbackModal = false">×</button>
        </div>
        <div class="feedback-body">
          <textarea
            v-model="feedbackText"
            placeholder="请输入您对这条内容的意见或建议..."
            rows="5"
          ></textarea>
        </div>
        <div class="feedback-footer">
          <button class="btn-secondary" @click="showFeedbackModal = false">取消</button>
          <button class="btn-primary" @click="submitFeedback">提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { contentApi } from '@/api/content'
import { useMenuStore } from '@/stores/menu'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

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

const displayContainer = ref<HTMLElement>()
const itemRefs = ref<Record<number, HTMLElement>>({})
const isSticky = ref(false)

const activeTab = ref('qa')
const qaList = ref<any[]>([])
const manualList = ref<any[]>([])
const expandedId = ref<number | null>(null)
const animatingId = ref<number | null>(null)

// 投票功能
const userVote = ref<Record<number, string>>({})
const showFeedbackModal = ref(false)
const feedbackText = ref('')
const currentDislikeContentId = ref<number | null>(null)
const currentDislikeContentType = ref<'qa' | 'manual'>('qa')

const nodeName = computed(() => {
  const node = menuStore.findNode(props.nodeId)
  return node?.name || ''
})

const hasQa = computed(() => qaList.value.length > 0)
const hasManual = computed(() => manualList.value.length > 0)

// 搜索结果处理
watch(() => props.searchResults, (newResults) => {
  if (newResults && newResults.length > 0) {
    // 点击第一个结果
    const firstResult = newResults[0]
    const contentType = firstResult.type === 'qa' ? 'qa' : 'manual'

    // 切换到对应Tab
    activeTab.value = contentType

    // 查找并展开内容
    nextTick(() => {
      const list = contentType === 'qa' ? qaList.value : manualList.value
      const item = list.find(i => i.id === firstResult.id)
      if (item) {
        expandedId.value = item.id
        // 滚动到可见位置
        scrollToItem(item.id)
      }
    })
  }
}, { immediate: true })

watch(() => props.nodeId, () => {
  loadContent()
}, { immediate: true })

function setItemRef(el: any, id: number) {
  if (el) {
    itemRefs.value[id] = el.$el || el
  }
}

function scrollToItem(itemId: number) {
  const el = itemRefs.value[itemId]
  if (el && displayContainer.value) {
    const container = displayContainer.value
    const headerHeight = 48 // tabs header height
    const top = el.offsetTop - container.offsetTop - headerHeight - 5
    container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }
}

// 滚动监听实现 sticky header
onMounted(() => {
  if (displayContainer.value) {
    displayContainer.value.addEventListener('scroll', handleScroll)
  }
  loadUserVotes()
})

function handleScroll() {
  if (displayContainer.value) {
    isSticky.value = displayContainer.value.scrollTop > 50
  }
}

async function loadUserVotes() {
  if (!authStore.isLoggedIn) return

  const userId = authStore.getUserId()
  if (!userId) return

  // 加载所有内容的投票状态
  for (const item of [...qaList.value, ...manualList.value]) {
    try {
      const res = await contentApi.getVoteStatus('qa', item.id, userId)
      if (res.code === 200 && res.data) {
        userVote.value[item.id] = res.data.voteType || ''
      }
    } catch (e) {
      // ignore
    }
  }
}

async function loadContent() {
  expandedId.value = null

  const qaRes = await contentApi.getUserQaList(props.nodeId)
  if (qaRes.code === 200) {
    qaList.value = qaRes.data
  }

  const manualRes = await contentApi.getUserManualList(props.nodeId)
  if (manualRes.code === 200) {
    manualList.value = manualRes.data
  }

  // 自动切换到有内容的标签
  if (!hasQa.value && hasManual.value) {
    activeTab.value = 'manual'
  }

  // 加载投票状态
  await loadUserVotes()
}

function toggleExpand(item: any) {
  const wasExpanded = expandedId.value === item.id

  // 动画
  animatingId.value = item.id
  setTimeout(() => {
    animatingId.value = null
  }, 300)

  if (wasExpanded) {
    expandedId.value = null
  } else {
    expandedId.value = item.id
    // 自动滚动
    nextTick(() => {
      scrollToItem(item.id)
    })
  }
}

async function handleVote(contentId: number, voteType: string) {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('请先登录后再投票')
    return
  }

  const userId = authStore.getUserId()
  const contentType = activeTab.value === 'qa' ? 'qa' : 'manual'

  try {
    const currentVote = userVote.value[contentId]

    if (currentVote === voteType) {
      // 取消投票
      await contentApi.vote({
        contentType,
        contentId,
        userId,
        voteType: 'like' // 暂时用like作为取消
      })
      userVote.value[contentId] = ''
    } else {
      // 投票
      await contentApi.vote({
        contentType,
        contentId,
        userId,
        voteType
      })
      userVote.value[contentId] = voteType
    }

    // 刷新内容更新票数
    await loadContent()
    ElMessage.success('投票成功')
  } catch (e: any) {
    ElMessage.error(e.message || '投票失败')
  }
}

function handleDislike(contentId: number) {
  if (!authStore.isLoggedIn) {
    ElMessage.warning('请先登录后再反馈')
    return
  }

  currentDislikeContentId.value = contentId
  currentDislikeContentType.value = activeTab.value === 'qa' ? 'qa' : 'manual'
  feedbackText.value = ''
  showFeedbackModal.value = true
}

async function submitFeedback() {
  if (!feedbackText.value.trim()) {
    ElMessage.warning('请填写反馈意见')
    return
  }

  const contentId = currentDislikeContentId.value
  const contentType = currentDislikeContentType.value
  const userId = authStore.getUserId()

  if (!contentId || !userId) return

  try {
    await contentApi.vote({
      contentType,
      contentId,
      userId,
      voteType: 'dislike',
      feedback: feedbackText.value
    })

    userVote.value[contentId] = 'dislike'
    showFeedbackModal.value = false

    // 刷新内容更新票数
    await loadContent()
    ElMessage.success('反馈已提交')
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败')
  }
}
</script>

<style scoped>
.content-display {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

/* 内容头部 */
.content-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 12px;
}

.breadcrumb-icon {
  width: 22px;
  height: 22px;
  color: #1890ff;
}

.breadcrumb h2 {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  margin: 0;
}

/* Tabs 样式 */
.content-tabs {
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.tab-buttons {
  display: flex;
  gap: 4px;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #595959;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  border-radius: 4px 4px 0 0;
}

.tab-button:hover {
  color: #1890ff;
  background: rgba(24,144,255,0.04);
}

.tab-button.active {
  color: #1890ff;
  background: #fff;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #1890ff;
}

.tab-icon {
  width: 16px;
  height: 16px;
}

.tab-count {
  padding: 2px 8px;
  background: #f0f0f0;
  color: #8c8c8c;
  font-size: 12px;
  border-radius: 10px;
  font-weight: 600;
}

.tab-button.active .tab-count {
  background: #e6f7ff;
  color: #1890ff;
}

/* 内容主体 */
.content-body {
  flex: 1;
  overflow-y: auto;
  background: #fafafa;
}

/* 列表样式 */
.content-list {
  padding: 16px 24px;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px 4px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.list-column {
  display: flex;
  align-items: center;
}

.col-title {
  flex: 1;
}

.col-votes {
  width: 120px;
  gap: 12px;
}

.col-actions {
  width: 100px;
  justify-content: flex-end;
}

.list-item {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-top: none;
  transition: all 0.3s;
}

.list-item:last-child {
  border-radius: 0 0 4px 4px;
}

.list-item:hover {
  background: #fafafa;
}

.list-item.expanded {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.item-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.item-row .col-title {
  gap: 12px;
}

.file-icon {
  width: 18px;
  height: 18px;
  color: #1890ff;
  flex-shrink: 0;
}

.item-title {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
  flex: 1;
}

.expand-icon {
  width: 16px;
  height: 16px;
  color: #8c8c8c;
  transition: transform 0.3s;
  flex-shrink: 0;
}

.list-item.expanded .expand-icon {
  transform: rotate(180deg);
  color: #1890ff;
}

.vote-stat {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: #f5f5f5;
  color: #8c8c8c;
  font-weight: 500;
}

.like-stat {
  background: #f6ffed;
  color: #52c41a;
}

.dislike-stat {
  background: #fff2f0;
  color: #ff4d4f;
}

.action-btn {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: #595959;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.action-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 内容展开区域 */
.item-content {
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 2000px;
  }
}

.content-body-text {
  padding: 24px;
  line-height: 1.8;
  color: #595959;
  font-size: 14px;
  background: #fff;
  margin: 16px;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.content-body-text :deep(p) {
  margin-bottom: 12px;
}

.content-body-text :deep(p:last-child) {
  margin-bottom: 0;
}

.content-body-text :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}

.content-body-text :deep(h1),
.content-body-text :deep(h2),
.content-body-text :deep(h3),
.content-body-text :deep(h4) {
  color: #262626;
  margin: 16px 0 8px;
  font-weight: 600;
}

.content-body-text :deep(ul),
.content-body-text :deep(ol) {
  padding-left: 24px;
  margin-bottom: 12px;
}

.content-body-text :deep(li) {
  margin-bottom: 6px;
}

.content-body-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.content-body-text :deep(td),
.content-body-text :deep(th) {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
}

.content-body-text :deep(th) {
  background: #fafafa;
  font-weight: 600;
}

.content-body-text :deep(blockquote) {
  border-left: 3px solid #1890ff;
  background: #f9f9f9;
  padding: 12px 16px;
  margin: 12px 0;
}

.content-body-text :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.content-body-text :deep(pre) {
  background: #f5f5f5;
  padding: 12px 16px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 12px 0;
}

.content-body-text :deep(.ql-align-center) {
  text-align: center;
}

.content-body-text :deep(.ql-align-right) {
  text-align: right;
}

/* 投票面板 */
.vote-panel {
  padding: 20px 24px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  margin: 0 16px 16px;
  border-radius: 0 0 4px 4px;
}

.vote-label {
  font-size: 13px;
  color: #8c8c8c;
  margin-bottom: 12px;
  font-weight: 500;
}

.vote-buttons {
  display: flex;
  gap: 12px;
}

.vote-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  color: #595959;
  font-weight: 500;
}

.vote-btn svg {
  width: 18px;
  height: 18px;
}

.vote-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.vote-btn.like:hover {
  border-color: #52c41a;
  color: #52c41a;
}

.vote-btn.dislike:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.vote-btn.active.like {
  border-color: #52c41a;
  color: #52c41a;
  background: #f6ffed;
  box-shadow: 0 2px 4px rgba(82,196,26,0.2);
}

.vote-btn.active.dislike {
  border-color: #ff4d4f;
  color: #ff4d4f;
  background: #fff2f0;
  box-shadow: 0 2px 4px rgba(255,77,79,0.2);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #bfbfbf;
}

.empty-icon {
  width: 100px;
  height: 100px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state p {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0;
}

/* 反馈弹窗 */
.feedback-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.feedback-modal {
  background: #fff;
  border-radius: 8px;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 12px 32px rgba(0,0,0,0.2);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.feedback-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #8c8c8c;
  padding: 0;
  line-height: 1;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #262626;
}

.feedback-body {
  padding: 24px;
}

.feedback-body textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s;
  line-height: 1.6;
}

.feedback-body textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24,144,255,0.1);
}

.feedback-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 0 0 8px 8px;
}

.btn-secondary {
  padding: 8px 20px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  color: #595959;
  font-weight: 500;
}

.btn-secondary:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.btn-primary {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: #1890ff;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-primary:hover {
  background: #40a9ff;
  box-shadow: 0 2px 4px rgba(24,144,255,0.3);
}

/* 滚动条 */
.content-body::-webkit-scrollbar {
  width: 6px;
}

.content-body::-webkit-scrollbar-track {
  background: transparent;
}

.content-body::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.content-body::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}
</style>