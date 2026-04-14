import api from './index'

export interface ContentItem {
  id: number
  nodeId: number
  title: string
  body: string
  attachmentName?: string
  updater?: string
  updateTime?: string
  sortOrder: number
  likes?: number
  dislikes?: number
}

export interface VoteParams {
  contentType: 'qa' | 'manual'
  contentId: number
  userId: number
  voteType: 'like' | 'dislike'
  feedback?: string
}

export const contentApi = {
  // Admin - Q&A
  getQaList(nodeId: number) {
    return api.get(`/admin/content/qa/${nodeId}`)
  },
  addQa(data: Partial<ContentItem>) {
    return api.post('/admin/content/qa', data)
  },
  updateQa(id: number, data: Partial<ContentItem>) {
    return api.put(`/admin/content/qa/${id}`, data)
  },
  deleteQa(id: number) {
    return api.delete(`/admin/content/qa/${id}`)
  },
  moveQa(contentIds: number[], targetNodeId: number) {
    return api.post('/admin/content/qa/move', { contentIds, targetNodeId })
  },
  sortQa(id: number, newIndex: number) {
    return api.put(`/admin/content/qa/${id}/sort`, null, { params: { newIndex } })
  },

  // Admin - Manual
  getManualList(nodeId: number) {
    return api.get(`/admin/content/manual/${nodeId}`)
  },
  addManual(data: Partial<ContentItem>) {
    return api.post('/admin/content/manual', data)
  },
  updateManual(id: number, data: Partial<ContentItem>) {
    return api.put(`/admin/content/manual/${id}`, data)
  },
  deleteManual(id: number) {
    return api.delete(`/admin/content/manual/${id}`)
  },
  moveManual(contentIds: number[], targetNodeId: number) {
    return api.post('/admin/content/manual/move', { contentIds, targetNodeId })
  },
  sortManual(id: number, newIndex: number) {
    return api.put(`/admin/content/manual/${id}/sort`, null, { params: { newIndex } })
  },

  // User APIs
  getUserQaList(nodeId: number) {
    return api.get(`/user/content/qa/${nodeId}`)
  },
  getUserManualList(nodeId: number) {
    return api.get(`/user/content/manual/${nodeId}`)
  },
  vote(params: VoteParams) {
    return api.post('/user/vote', null, { params })
  },
  getVoteStatus(contentType: string, contentId: number, userId: number) {
    return api.get('/user/vote/status', { params: { contentType, contentId, userId } })
  },

  // Export
  exportQa() {
    return api.get('/admin/export/qa', { responseType: 'blob' })
  },
  exportManual() {
    return api.get('/admin/export/manual', { responseType: 'blob' })
  },

  // Search
  search(keyword: string, limit: number = 20) {
    return api.get('/admin/search', { params: { keyword, limit } })
  },
  userSearch(keyword: string, limit: number = 20, userId?: number) {
    return api.get('/user/search', { params: { keyword, limit, userId } })
  }
}