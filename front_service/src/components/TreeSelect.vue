<template>
  <div class="tree-select">
    <template v-for="node in visibleNodes" :key="node.id">
      <div
        class="tree-node-item"
        :class="{ selected: node.id === selectedId, disabled: node.id === excludeId }"
        :style="{ paddingLeft: (node._level * 16 + 10) + 'px' }"
        @click="handleSelect(node.id)"
      >
        <span
          class="tree-expand-icon"
          :class="{ expanded: expandedIds.includes(node.id) }"
          @click.stop="toggleExpand(node.id)"
          v-if="node.children?.length"
        >▶</span>
        <span v-else class="tree-expand-placeholder"></span>
        <span class="tree-node-name">{{ node.name }}</span>
        <span v-if="node.id === currentNodeId" class="current-tag">当前</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MenuNode } from '@/api/menu'

interface FlatNode extends MenuNode {
  _level: number
}

const props = defineProps<{
  tree: MenuNode[]
  selectedId: number | null
  excludeId?: number
  searchKeyword?: string
  currentNodeId?: number
}>()

const emit = defineEmits<{
  select: [nodeId: number]
}>()

const expandedIds = ref<number[]>([])

// 打平树为有序列表，考虑展开状态，最多显示两级（_level 0 和 1）
function flattenTree(nodes: MenuNode[], level = 0): FlatNode[] {
  const result: FlatNode[] = []
  for (const node of nodes) {
    result.push({ ...node, _level: level })
    if (level < 1 && node.children?.length && expandedIds.value.includes(node.id)) {
      result.push(...flattenTree(node.children, level + 1))
    }
  }
  return result
}

// 搜索时打平，最多两级
function flattenAll(nodes: MenuNode[], level = 0): FlatNode[] {
  const result: FlatNode[] = []
  for (const node of nodes) {
    result.push({ ...node, _level: level })
    if (level < 1 && node.children?.length) {
      result.push(...flattenAll(node.children, level + 1))
    }
  }
  return result
}

const visibleNodes = computed((): FlatNode[] => {
  if (props.searchKeyword?.trim()) {
    const kw = props.searchKeyword.trim().toLowerCase()
    return flattenAll(props.tree).filter(n => n.name.toLowerCase().includes(kw))
  }
  return flattenTree(props.tree)
})

function toggleExpand(nodeId: number) {
  const index = expandedIds.value.indexOf(nodeId)
  if (index > -1) {
    expandedIds.value.splice(index, 1)
  } else {
    expandedIds.value.push(nodeId)
  }
}

function handleSelect(nodeId: number) {
  if (nodeId === props.excludeId) return
  emit('select', nodeId)
}
</script>

<style scoped>
.tree-select {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tree-node-item {
  padding: 7px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.15s;
  border-radius: 4px;
  font-size: 14px;
}

.tree-node-item:hover {
  background-color: #f5f5f5;
}

.tree-node-item.selected {
  background-color: #e6f4ff;
  color: #1890ff;
  font-weight: 500;
}

.tree-node-item.disabled {
  color: #bfbfbf;
  cursor: not-allowed;
}

.tree-expand-icon {
  width: 14px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #999;
  flex-shrink: 0;
  transition: transform 0.15s;
  cursor: pointer;
}

.tree-expand-icon.expanded {
  transform: rotate(90deg);
}

.tree-expand-placeholder {
  width: 14px;
  flex-shrink: 0;
}

.tree-node-name {
  flex: 1;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-tag {
  font-size: 11px;
  color: var(--primary-color);
  background: #e6f4ff;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
}
</style>