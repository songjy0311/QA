<template>
  <div class="tree-node">
    <div
      class="tree-node-content"
      :class="{ selected: node.id === selectedId }"
      :style="{ paddingLeft: (12 + level * 12) + 'px' }"
      :draggable="canDrag"
      @click="handleClick"
      @dragstart="handleDragStart"
      @dragover.prevent="handleDragOver"
      @drop="handleDrop"
    >
      <!-- 内容指示器 - 仅用户端显示 -->
      <span v-if="isUserView && node.hasDirectContent" class="content-indicator direct" title="本节点有挂载内容"></span>
      <span v-if="isUserView && node.hasChildContent" class="content-indicator child" title="子节点有挂载内容"></span>

      <!-- 节点名称 -->
      <span class="tree-label">{{ node.name }}</span>

      <!-- 操作按钮 -->
      <div class="tree-actions" v-if="!isUserView">
        <button v-if="canRestore" class="tree-action-btn restore" title="恢复到原目录" @click.stop="$emit('restore', node.id)">↩</button>
        <button v-if="canDelete" class="tree-action-btn danger" title="删除" @click.stop="$emit('delete', node.id)">×</button>
      </div>
    </div>

    <!-- 子节点（仅一级TreeNode可展开，即 level < 1） -->
    <div v-if="node.expanded && hasChildren && level < 1" class="tree-children">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        :is-user-view="isUserView"
        :level="level + 1"
        @select="$emit('select', $event)"
        @toggle="$emit('toggle', $event)"
        @add="$emit('add', $event)"
        @delete="$emit('delete', $event)"
        @drop="$emit('drop', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MenuNode } from '@/api/menu'

const props = defineProps<{
  node: MenuNode
  selectedId: number | null
  isUserView?: boolean
  isAdminView?: boolean
  level: number
}>()

const emit = defineEmits<{
  select: [nodeId: number]
  toggle: [nodeId: number]
  add: [parentId: number]
  delete: [nodeId: number]
  restore: [nodeId: number]
  drop: [payload: { dragId: number; action: string; targetId: number }]
}>()

const hasChildren = computed(() => props.node.children && props.node.children.length > 0)

const canDrag = computed(() => {
  if (props.isUserView) return false
  // 功能菜单节点不能拖拽
  return props.node.nodeType !== 'func_root' && props.node.nodeType !== 'func'
})

const canAddChild = computed(() => false)

// 已移入失效菜单的节点（有 originalParentId）不显示删除，改为显示恢复
const canRestore = computed(() => !props.isUserView && !!props.node.originalParentId)

const canDelete = computed(() => {
  if (props.isUserView) return false
  if (props.node.originalParentId) return false  // 已在失效菜单，只能恢复
  return props.node.parentId !== 0
})

function handleClick() {
  emit('select', props.node.id)
  if (hasChildren.value && props.level < 1) {
    emit('toggle', props.node.id)
  }
}

let dragStartY = 0

function handleDragStart(e: DragEvent) {
  e.dataTransfer?.setData('text/plain', props.node.id.toString())
  dragStartY = e.clientY
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  // 这里可以添加视觉反馈
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const dragId = parseInt(e.dataTransfer?.getData('text/plain') || '0')
  if (!dragId) return

  const rect = (e.target as HTMLElement).getBoundingClientRect()
  const y = e.clientY - rect.top
  const height = rect.height

  let action = 'child'
  if (y < height * 0.33) {
    action = 'before'
  } else if (y > height * 0.67) {
    action = 'after'
  }

  emit('drop', { dragId, action, targetId: props.node.id })
}
</script>

<style scoped>
.tree-node {
  margin-bottom: 4px;
}

.tree-node-content {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 8px;
}

.tree-node-content:hover {
  background: var(--bg-color);
}

.tree-node-content.selected {
  background: #e6f7ff;
  border: 1px solid var(--primary-color);
}

.content-indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: 4px;
  flex-shrink: 0;
}

.content-indicator.direct {
  background: var(--success-color);
}

.content-indicator.child {
  background: var(--primary-color);
}

.tree-label {
  flex: 1;
  font-size: 13px;
  color: var(--text-color);
}

.tree-actions {
  display: none;
  gap: 4px;
}

.tree-node-content:hover .tree-actions {
  display: flex;
}

.tree-action-btn {
  padding: 2px 6px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
  border-radius: 2px;
}

.tree-action-btn:hover {
  background: var(--border-color);
  color: var(--text-color);
}

.tree-action-btn.danger:hover {
  background: #fff1f0;
  color: var(--danger-color);
}

.tree-action-btn.restore {
  font-size: 14px;
}

.tree-action-btn.restore:hover {
  background: #f6ffed;
  color: var(--success-color);
}

.tree-children {
  margin-left: 0;
}
</style>