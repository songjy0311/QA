<template>
  <div class="menu-tree">
    <div v-for="root in tree" :key="root.id" class="tree-root">
      <div class="tree-root-label">
        {{ root.name }}
        <span v-if="canAddChild(root)" class="add-root-btn" @click="$emit('add', root.id)">+</span>
      </div>
      <div class="tree-children">
        <TreeNode
          v-for="child in root.children"
          :key="child.id"
          :node="child"
          :selected-id="selectedId"
          :is-user-view="isUserView"
          :level="1"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
          @add="$emit('add', $event)"
          @delete="$emit('delete', $event)"
          @drop="$emit('drop', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MenuNode } from '@/api/menu'
import TreeNode from './TreeNode.vue'

defineProps<{
  tree: MenuNode[]
  selectedId: number | null
  isUserView?: boolean
}>()

defineEmits<{
  select: [nodeId: number]
  toggle: [nodeId: number]
  add: [parentId: number]
  delete: [nodeId: number]
  drop: [payload: { dragId: number; action: string; targetId: number }]
}>()

function canAddChild(root: MenuNode): boolean {
  return root.nodeType === 'custom' || root.nodeType === 'invalid'
}
</script>

<style scoped>
.tree-root {
  margin-bottom: 16px;
}

.tree-root-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-root-btn {
  cursor: pointer;
  color: #1890ff;
  font-size: 14px;
  font-weight: normal;
}

.add-root-btn:hover {
  color: #40a9ff;
}
</style>