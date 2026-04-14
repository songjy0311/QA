<template>
  <div class="node-config">
    <div class="config-form">
      <div class="form-group">
        <div class="label-row">
          <label>节点名称</label>
          <span class="char-count">{{ config.name.length }}/20</span>
        </div>
        <input
          v-model="config.name"
          type="text"
          :disabled="isFuncRoot"
          placeholder="请输入节点名称"
          maxlength="20"
        />
      </div>

      <div class="form-group">
        <label class="form-checkbox">
          <input v-model="config.visible" type="checkbox" />
          <span>用户可见</span>
        </label>
      </div>

      <div class="form-group">
        <label class="form-checkbox">
          <input v-model="config.guestVisible" type="checkbox" :disabled="!config.visible" />
          <span>游客可见</span>
        </label>
      </div>

      <div class="form-group">
        <label>节点关联URL</label>
        <input
          v-model="config.url"
          type="text"
          placeholder="输入来源URL，用于用户端自动定位"
        />
      </div>

      <div class="form-actions">
        <el-button type="primary" @click="handleSave">保存配置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { menuApi, MenuNode } from '@/api/menu'
import { useMenuStore } from '@/stores/menu'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  nodeId: number
}>()

const emit = defineEmits<{
  update: []
}>()

const menuStore = useMenuStore()

const config = ref({
  name: '',
  visible: true,
  guestVisible: false,
  url: ''
})

const node = computed(() => menuStore.findNode(props.nodeId))

const isFuncRoot = computed(() => {
  return node.value?.nodeType === 'func' && node.value?.parentId === 0
})

onMounted(() => {
  loadConfig()
})

watch(() => props.nodeId, () => {
  loadConfig()
})

function loadConfig() {
  if (node.value) {
    config.value = {
      name: node.value.name,
      visible: node.value.visible === 1,
      guestVisible: node.value.guestVisible === 1,
      url: node.value.url || ''
    }
  }
}

async function handleSave() {
  try {
    await menuApi.updateNodeConfig(props.nodeId, {
      name: config.value.name,
      visible: config.value.visible ? 1 : 0,
      guestVisible: config.value.guestVisible ? 1 : 0,
      url: config.value.url
    })
    ElMessage.success('保存成功')
    emit('update')
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  }
}
</script>

<style scoped>
.node-config {
  padding: 16px;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
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

.form-group input[type="text"] {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input[type="text"]:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-group input:disabled {
  background: var(--bg-color);
  cursor: not-allowed;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-color);
}

.form-checkbox input {
  width: 16px;
  height: 16px;
}

.form-actions {
  margin-top: 20px;
}

.form-actions :deep(.el-button) {
  padding: 8px 16px;
}
</style>