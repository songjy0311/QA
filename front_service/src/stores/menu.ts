import { defineStore } from 'pinia'
import { ref } from 'vue'
import { menuApi, MenuNode } from '@/api/menu'

export const useMenuStore = defineStore('menu', () => {
  const tree = ref<MenuNode[]>([])
  const selectedNodeId = ref<number | null>(null)
  const loading = ref(false)

  async function loadAdminTree() {
    loading.value = true
    try {
      const res = await menuApi.getAdminTree()
      if (res.code === 200) {
        tree.value = res.data
        // 根节点默认展开
        tree.value.forEach(root => { root.expanded = true })
      }
    } finally {
      loading.value = false
    }
  }

  async function loadUserTree(isGuest: boolean = false) {
    loading.value = true
    try {
      const res = await menuApi.getUserTree(isGuest)
      if (res.code === 200) {
        tree.value = res.data
      }
    } finally {
      loading.value = false
    }
  }

  function selectNode(nodeId: number | null) {
    selectedNodeId.value = nodeId
  }

  function toggleNode(nodeId: number) {
    const findAndToggle = (nodes: MenuNode[]): boolean => {
      for (const node of nodes) {
        if (node.id === nodeId) {
          node.expanded = !node.expanded
          return true
        }
        if (node.children && findAndToggle(node.children)) {
          return true
        }
      }
      return false
    }
    findAndToggle(tree.value)
  }

  function findNode(nodeId: number): MenuNode | null {
    const find = (nodes: MenuNode[]): MenuNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node
        if (node.children) {
          const found = find(node.children)
          if (found) return found
        }
      }
      return null
    }
    return find(tree.value)
  }

  return {
    tree,
    selectedNodeId,
    loading,
    loadAdminTree,
    loadUserTree,
    selectNode,
    toggleNode,
    findNode
  }
})