import api from './index'

export interface MenuNode {
  id: number
  name: string
  nodeType: string
  parentId: number
  levelDepth: number
  sortOrder: number
  visible: number
  guestVisible: number
  url: string
  expanded: boolean
  originalParentId?: number
  children: MenuNode[]
  hasDirectContent?: boolean
  hasChildContent?: boolean
}

export const menuApi = {
  // Admin APIs
  getAdminTree() {
    return api.get<any, any>('/admin/menu/tree')
  },
  addNode(data: Partial<MenuNode>) {
    return api.post('/admin/menu/node', data)
  },
  updateNode(id: number, data: Partial<MenuNode>) {
    return api.put(`/admin/menu/node/${id}`, data)
  },
  deleteNode(id: number) {
    return api.delete(`/admin/menu/node/${id}`)
  },
  updateSort(id: number, action: string, targetId: number) {
    return api.put(`/admin/menu/node/${id}/sort`, null, { params: { action, targetId } })
  },
  uploadMenuFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/menu/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  updateNodeConfig(id: number, params: any) {
    return api.put(`/admin/menu/node/${id}/config`, null, { params })
  },
  cleanupDeepNodes() {
    return api.delete('/admin/menu/cleanup-deep')
  },
  restoreNode(id: number) {
    return api.post(`/admin/menu/node/${id}/restore`)
  },

  // User APIs
  getUserTree(isGuest: boolean = false) {
    return api.get('/user/menu/tree', { params: { isGuest } })
  }
}