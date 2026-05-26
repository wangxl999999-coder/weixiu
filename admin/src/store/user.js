import { defineStore } from 'pinia'
import { api } from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    userInfo: JSON.parse(localStorage.getItem('admin_info') || 'null')
  }),

  actions: {
    async login(data) {
      const res = await api.auth.login(data)
      this.setToken(res.data.token)
      this.setUserInfo(res.data.user)
      return res
    },

    async logout() {
      try {
        await api.auth.logout()
      } finally {
        this.clearToken()
      }
    },

    async getUserInfo() {
      const res = await api.auth.getInfo()
      this.setUserInfo(res.data)
      return res
    },

    setToken(token) {
      this.token = token
      localStorage.setItem('admin_token', token)
    },

    setUserInfo(userInfo) {
      this.userInfo = userInfo
      localStorage.setItem('admin_info', JSON.stringify(userInfo))
    },

    clearToken() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_info')
    }
  }
})
