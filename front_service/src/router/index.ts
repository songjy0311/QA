import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue')
    },
    {
      path: '/admin',
      name: 'Admin',
      component: () => import('@/views/admin/Admin.vue'),
      children: [
        {
          path: '',
          name: 'AdminHome',
          component: () => import('@/views/admin/Home.vue')
        }
      ]
    },
    {
      path: '/user',
      name: 'User',
      component: () => import('@/views/user/User.vue'),
      children: [
        {
          path: '',
          name: 'UserHome',
          component: () => import('@/views/user/Home.vue')
        }
      ]
    },
    {
      path: '/',
      redirect: '/login'
    }
  ]
})

export default router