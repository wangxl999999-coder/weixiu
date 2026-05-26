import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'

const service = axios.create({
  baseURL: '/api',
  timeout: 30000
})

service.interceptors.request.use(
  config => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code === 0 || res.code === 200) {
      return res
    } else if (res.code === 401) {
      ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
        confirmButtonText: '重新登录',
        showCancelButton: false,
        type: 'warning'
      }).then(() => {
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_info')
        router.push('/login')
      })
      return Promise.reject(new Error(res.message || '未授权'))
    } else {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  error => {
    ElMessage.error(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export const api = {
  auth: {
    login(data) {
      return service.post('/admin/auth/login', data)
    },
    logout() {
      return service.post('/admin/auth/logout')
    },
    getInfo() {
      return service.get('/admin/auth/info')
    },
    updatePassword(data) {
      return service.put('/admin/auth/password', data)
    },
    getList(params) {
      return service.get('/admin/auth/list', { params })
    },
    create(data) {
      return service.post('/admin/auth', data)
    },
    update(id, data) {
      return service.put('/admin/auth/' + id, data)
    },
    delete(id) {
      return service.delete('/admin/auth/' + id)
    }
  },

  worker: {
    getList(params) {
      return service.get('/admin/worker/list', { params })
    },
    getDetail(id) {
      return service.get('/admin/worker/' + id)
    },
    audit(id, data) {
      return service.post('/admin/worker/audit/' + id, data)
    },
    updateStatus(id, status) {
      return service.put('/admin/worker/status/' + id, { status })
    },
    updateDeposit(id, data) {
      return service.put('/admin/worker/deposit/' + id, data)
    }
  },

  order: {
    getList(params) {
      return service.get('/admin/order/list', { params })
    },
    getDetail(id) {
      return service.get('/admin/order/' + id)
    },
    dispatch(id, data) {
      return service.post('/admin/order/dispatch/' + id, data)
    },
    reassign(id, data) {
      return service.post('/admin/order/reassign/' + id, data)
    },
    refund(id, data) {
      return service.post('/admin/order/refund/' + id, data)
    },
    cancel(id) {
      return service.post('/admin/order/cancel/' + id)
    }
  },

  finance: {
    getOverview() {
      return service.get('/admin/finance/overview')
    },
    getWithdrawList(params) {
      return service.get('/admin/finance/withdraw-list', { params })
    },
    auditWithdraw(id, data) {
      return service.post('/admin/finance/withdraw-audit/' + id, data)
    },
    getRecords(params) {
      return service.get('/admin/finance/records', { params })
    },
    getFeeConfig() {
      return service.get('/admin/finance/fee-config')
    },
    updateFeeConfig(data) {
      return service.put('/admin/finance/fee-config', data)
    }
  },

  service: {
    getCategoryList(params) {
      return service.get('/admin/service/categories', { params })
    },
    createCategory(data) {
      return service.post('/admin/service/category', data)
    },
    updateCategory(id, data) {
      return service.put('/admin/service/category/' + id, data)
    },
    deleteCategory(id) {
      return service.delete('/admin/service/category/' + id)
    },
    getServiceList(params) {
      return service.get('/admin/service/items', { params })
    },
    createService(data) {
      return service.post('/admin/service/item', data)
    },
    updateService(id, data) {
      return service.put('/admin/service/item/' + id, data)
    },
    deleteService(id) {
      return service.delete('/admin/service/item/' + id)
    }
  },

  coupon: {
    getList(params) {
      return service.get('/admin/coupon/list', { params })
    },
    create(data) {
      return service.post('/admin/coupon', data)
    },
    update(id, data) {
      return service.put('/admin/coupon/' + id, data)
    },
    delete(id) {
      return service.delete('/admin/coupon/' + id)
    },
    getFlashSaleList(params) {
      return service.get('/admin/flash-sale/list', { params })
    },
    createFlashSale(data) {
      return service.post('/admin/flash-sale', data)
    },
    updateFlashSale(id, data) {
      return service.put('/admin/flash-sale/' + id, data)
    },
    deleteFlashSale(id) {
      return service.delete('/admin/flash-sale/' + id)
    }
  },

  complaint: {
    getList(params) {
      return service.get('/admin/complaint/list', { params })
    },
    getDetail(id) {
      return service.get('/admin/complaint/' + id)
    },
    handle(id, data) {
      return service.post('/admin/complaint/handle/' + id, data)
    }
  },

  statistics: {
    getDashboard() {
      return service.get('/statistics/dashboard')
    },
    getOrderTrend(params) {
      return service.get('/statistics/order-trend', { params })
    },
    getServiceStats(params) {
      return service.get('/statistics/service-stats', { params })
    },
    getFinanceStats(params) {
      return service.get('/statistics/finance-stats', { params })
    }
  },

  settings: {
    getConfig() {
      return service.get('/admin/settings/config')
    },
    updateConfig(data) {
      return service.put('/admin/settings/config', data)
    }
  }
}

export default service
