<template>
  <div class="content-display">
    <div class="content-display-header">
      <h3>{{ nodeName }}</h3>
    </div>

    <el-tabs v-model="activeTab" v-if="hasQa || hasManual">
      <el-tab-pane v-if="hasQa" label="常见Q&A" name="qa">
        <div class="accordion-list">
          <div
            v-for="item in qaList"
            :key="item.id"
            class="accordion-item"
            :class="{ expanded: expandedId === item.id }"
            @click="toggleExpand(item.id)"
          >
            <div class="accordion-header">
              <span class="accordion-title">{{ item.title }}</span>
              <span class="accordion-icon">▼</span>
            </div>
            <div class="accordion-content" v-html="item.body"></div>
          </div>
        </div>
        <div v-if="qaList.length === 0" class="no-content-hint">暂无内容</div>
      </el-tab-pane>

      <el-tab-pane v-if="hasManual" label="操作手册" name="manual">
        <div class="accordion-list">
          <div
            v-for="item in manualList"
            :key="item.id"
            class="accordion-item"
            :class="{ expanded: expandedId === item.id }"
            @click="toggleExpand(item.id)"
          >
            <div class="accordion-header">
              <span class="accordion-title">{{ item.title }}</span>
              <span class="accordion-icon">▼</span>
            </div>
            <div class="accordion-content" v-html="item.body"></div>
          </div>
        </div>
        <div v-if="manualList.length === 0" class="no-content-hint">暂无内容</div>
      </el-tab-pane>
    </el-tabs>

    <div v-else class="no-content-hint">该节点下暂无内容</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { contentApi } from '@/api/content'
import { useMenuStore } from '@/stores/menu'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
  nodeId: number
}>()

const menuStore = useMenuStore()
const authStore = useAuthStore()

const activeTab = ref('qa')
const qaList = ref<any[]>([])
const manualList = ref<any[]>([])
const expandedId = ref<number | null>(null)

const nodeName = computed(() => {
  const node = menuStore.findNode(props.nodeId)
  return node?.name || ''
})

const hasQa = computed(() => qaList.value.length > 0)
const hasManual = computed(() => manualList.value.length > 0)

watch(() => props.nodeId, () => {
  loadContent()
}, { immediate: true })

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
}

function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<style scoped>
.content-display {
  padding: 24px;
}

.content-display-header {
  margin-bottom: 16px;
}

.content-display-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
}

.accordion-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.accordion-item {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
}

.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 4px;
}

.accordion-header:hover {
  background: #e8e8e8;
}

.accordion-title {
  font-weight: 500;
}

.accordion-icon {
  transition: transform 0.2s;
  font-size: 12px;
}

.accordion-item.expanded .accordion-icon {
  transform: rotate(180deg);
}

.accordion-content {
  display: none;
  padding: 16px;
  border-top: 1px solid #e8e8e8;
}

.accordion-item.expanded .accordion-content {
  display: block;
}

.no-content-hint {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}
</style>