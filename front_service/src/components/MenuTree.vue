<template>
  <div class="menu-tree">
    <div v-for="root in tree" :key="root.id" class="tree-root">
      <!-- 一级菜单（根节点），去掉"根目录"文字，可折叠 -->
      <div class="tree-root-label" @click="handleRootClick(root)">
        <span class="root-expand-icon" :class="{ expanded: root.expanded }">▶</span>
        <span class="root-name">{{ displayName(root.name) }}</span>
        <span v-if="!isUserView && canAddChild(root)" class="add-root-btn" @click.stop="$emit('add', root.id)">+</span>
      </div>
      <!-- 二级菜单，仅在展开时显示 -->
      <div v-if="root.expanded" class="tree-children">
        <TreeNode
          v-for="child in root.children"
          :key="child.id"
          :node="child"
          :selected-id="selectedId"
          :is-user-view="isUserView"
          :is-admin-view="!isUserView"
          :level="1"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
          @add="$emit('add', $event)"
          @delete="$emit('delete', $event)"
          @restore="$emit('restore', $event)"
          @drop="$emit('drop', $event)"
        />
        <div v-if="!root.children?.length" class="empty-children">暂无子目录</div>
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

const emit = defineEmits<{
  select: [nodeId: number]
  toggle: [nodeId: number]
  add: [parentId: number]
  delete: [nodeId: number]
  restore: [nodeId: number]
  drop: [payload: { dragId: number; action: string; targetId: number }]
}>()

function handleRootClick(root: MenuNode) {
  emit('toggle', root.id)
}

function displayName(name: string): string {
  return name.replace('根目录', '').trim()
}

function canAddChild(root: MenuNode): boolean {
  return root.nodeType === 'custom' || root.nodeType === 'invalid'
}
</script>

<style scoped>
.tree-root {
  margin-bottom: 4px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.tree-root:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.tree-root-label {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-color);
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
  transition: background 0.15s;
}

.tree-root-label:hover {
  background: var(--bg-color);
}

.root-expand-icon {
  font-size: 10px;
  color: #999;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.root-expand-icon.expanded {
  transform: rotate(90deg);
}

.root-name {
  flex: 1;
}

.add-root-btn {
  cursor: pointer;
  color: var(--primary-color);
  font-size: 18px;
  font-weight: 600;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: all 0.2s;
}

.add-root-btn:hover {
  background: var(--primary-color);
  color: var(--white);
}

.tree-children {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}

.empty-children {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 28px;
}
</style>
