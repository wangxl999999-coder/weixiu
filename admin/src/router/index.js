import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layout/Layout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { title: '数据看板', icon: 'DataLine' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/order/OrderList.vue'),
        meta: { title: '订单管理', icon: 'List' }
      },
      {
        path: 'orders/:id',
        name: 'OrderDetail',
        component: () => import('@/views/order/OrderDetail.vue'),
        meta: { title: '订单详情', hidden: true }
      },
      {
        path: 'workers',
        name: 'Workers',
        component: () => import('@/views/worker/WorkerList.vue'),
        meta: { title: '师傅管理', icon: 'User' }
      },
      {
        path: 'workers/:id',
        name: 'WorkerDetail',
        component: () => import('@/views/worker/WorkerDetail.vue'),
        meta: { title: '师傅详情', hidden: true }
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/finance/FinanceList.vue'),
        meta: { title: '财务管理', icon: 'Money' }
      },
      {
        path: 'withdraw',
        name: 'Withdraw',
        component: () => import('@/views/finance/WithdrawList.vue'),
        meta: { title: '提现审核', icon: 'Wallet' }
      },
      {
        path: 'services',
        name: 'Services',
        component: () => import('@/views/service/ServiceList.vue'),
        meta: { title: '服务管理', icon: 'Tools' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/service/CategoryList.vue'),
        meta: { title: '分类管理', icon: 'Menu' }
      },
      {
        path: 'coupons',
        name: 'Coupons',
        component: () => import('@/views/marketing/CouponList.vue'),
        meta: { title: '优惠券管理', icon: 'Discount' }
      },
      {
        path: 'flash-sales',
        name: 'FlashSales',
        component: () => import('@/views/marketing/FlashSaleList.vue'),
        meta: { title: '秒杀活动', icon: 'Clock' }
      },
      {
        path: 'complaints',
        name: 'Complaints',
        component: () => import('@/views/complaint/ComplaintList.vue'),
        meta: { title: '投诉管理', icon: 'Warning' }
      },
      {
        path: 'admins',
        name: 'Admins',
        component: () => import('@/views/admin/AdminList.vue'),
        meta: { title: '管理员管理', icon: 'Avatar' }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/Settings.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    document.title = to.meta.title ? `${to.meta.title} - 家政维修管理后台` : '家政维修管理后台'
    next()
  }
})

export default router
