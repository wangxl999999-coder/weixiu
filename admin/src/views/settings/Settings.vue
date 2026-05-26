<template>
  <div class="settings">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="基本设置" name="basic">
        <el-card class="setting-card">
          <el-form :model="basicForm" label-width="140px">
            <el-form-item label="平台名称">
              <el-input v-model="basicForm.platform_name" placeholder="请输入平台名称" style="width: 300px" />
            </el-form-item>
            <el-form-item label="平台Logo">
              <el-upload
                class="logo-uploader"
                :action="uploadUrl"
                :show-file-list="false"
                :on-success="handleLogoUpload"
                :headers="uploadHeaders"
              >
                <img v-if="basicForm.logo" :src="basicForm.logo" class="logo-image" />
                <el-icon v-else class="uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="客服电话">
              <el-input v-model="basicForm.service_phone" placeholder="请输入客服电话" style="width: 300px" />
            </el-form-item>
            <el-form-item label="客服工作时间">
              <el-input v-model="basicForm.service_hours" placeholder="如：09:00-18:00" style="width: 300px" />
            </el-form-item>
            <el-form-item label="服务协议">
              <el-input
                v-model="basicForm.service_agreement"
                type="textarea"
                :rows="6"
                placeholder="请输入服务协议内容"
                style="width: 600px"
              />
            </el-form-item>
            <el-form-item label="隐私政策">
              <el-input
                v-model="basicForm.privacy_policy"
                type="textarea"
                :rows="6"
                placeholder="请输入隐私政策内容"
                style="width: 600px"
              />
            </el-form-item>
            <el-form-item label="关于我们">
              <el-input
                v-model="basicForm.about_us"
                type="textarea"
                :rows="4"
                placeholder="请输入关于我们内容"
                style="width: 600px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasic" :loading="saving">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="运营设置" name="operation">
        <el-card class="setting-card">
          <el-form :model="operationForm" label-width="140px">
            <el-form-item label="新用户注册送券">
              <el-switch v-model="operationForm.new_user_coupon" />
            </el-form-item>
            <el-form-item v-if="operationForm.new_user_coupon" label="赠送优惠券">
              <el-select
                v-model="operationForm.new_user_coupon_id"
                placeholder="请选择优惠券"
                filterable
                style="width: 300px"
              >
                <el-option
                  v-for="coupon in coupons"
                  :key="coupon.id"
                  :label="coupon.name"
                  :value="coupon.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="分享送券">
              <el-switch v-model="operationForm.share_coupon" />
            </el-form-item>
            <el-form-item v-if="operationForm.share_coupon" label="分享赠送优惠券">
              <el-select
                v-model="operationForm.share_coupon_id"
                placeholder="请选择优惠券"
                filterable
                style="width: 300px"
              >
                <el-option
                  v-for="coupon in coupons"
                  :key="coupon.id"
                  :label="coupon.name"
                  :value="coupon.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="首次下单立减">
              <el-switch v-model="operationForm.first_order_discount" />
            </el-form-item>
            <el-form-item v-if="operationForm.first_order_discount" label="立减金额">
              <el-input-number
                v-model="operationForm.first_order_discount_amount"
                :min="0"
                :precision="2"
                style="width: 200px"
              />
              <span class="unit">元</span>
            </el-form-item>
            <el-form-item label="邀请好友奖励">
              <el-switch v-model="operationForm.invite_reward" />
            </el-form-item>
            <el-form-item v-if="operationForm.invite_reward" label="邀请人奖励金额">
              <el-input-number
                v-model="operationForm.inviter_reward_amount"
                :min="0"
                :precision="2"
                style="width: 200px"
              />
              <span class="unit">元</span>
            </el-form-item>
            <el-form-item v-if="operationForm.invite_reward" label="被邀请人奖励金额">
              <el-input-number
                v-model="operationForm.invitee_reward_amount"
                :min="0"
                :precision="2"
                style="width: 200px"
              />
              <span class="unit">元</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveOperation" :loading="saving">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="通知设置" name="notification">
        <el-card class="setting-card">
          <el-form :model="notificationForm" label-width="180px">
            <el-form-item label="新订单通知">
              <el-switch v-model="notificationForm.new_order_notify" />
            </el-form-item>
            <el-form-item label="订单状态变更通知">
              <el-switch v-model="notificationForm.order_status_notify" />
            </el-form-item>
            <el-form-item label="支付成功通知">
              <el-switch v-model="notificationForm.payment_success_notify" />
            </el-form-item>
            <el-form-item label="退款通知">
              <el-switch v-model="notificationForm.refund_notify" />
            </el-form-item>
            <el-form-item label="投诉处理通知">
              <el-switch v-model="notificationForm.complaint_notify" />
            </el-form-item>
            <el-form-item label="优惠券到期提醒">
              <el-switch v-model="notificationForm.coupon_expire_notify" />
            </el-form-item>
            <el-form-item label="微信消息模板">
              <el-input
                v-model="notificationForm.wechat_template_id"
                placeholder="请输入微信消息模板ID"
                style="width: 400px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveNotification" :loading="saving">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { api } from '@/utils/request'

const activeTab = ref('basic')
const saving = ref(false)
const coupons = ref([])

const uploadUrl = import.meta.env.VITE_UPLOAD_URL || '/api/upload'
const uploadHeaders = {
  Authorization: 'Bearer ' + localStorage.getItem('admin_token')
}

const basicForm = reactive({
  platform_name: '家政维修服务平台',
  logo: '',
  service_phone: '400-123-4567',
  service_hours: '09:00-18:00',
  service_agreement: '',
  privacy_policy: '',
  about_us: ''
})

const operationForm = reactive({
  new_user_coupon: true,
  new_user_coupon_id: '',
  share_coupon: false,
  share_coupon_id: '',
  first_order_discount: true,
  first_order_discount_amount: 10,
  invite_reward: false,
  inviter_reward_amount: 20,
  invitee_reward_amount: 10
})

const notificationForm = reactive({
  new_order_notify: true,
  order_status_notify: true,
  payment_success_notify: true,
  refund_notify: true,
  complaint_notify: true,
  coupon_expire_notify: true,
  wechat_template_id: ''
})

const loadConfig = async () => {
  try {
    const res = await api.settings.getConfig()
    const config = res.data || {}
    Object.assign(basicForm, config.basic || {})
    Object.assign(operationForm, config.operation || {})
    Object.assign(notificationForm, config.notification || {})
  } catch (err) {
    console.error('加载配置失败:', err)
  }
}

const loadCoupons = async () => {
  try {
    const res = await api.coupon.getList({ page: 1, pageSize: 100, status: 1 })
    coupons.value = res.data.list || res.data || []
  } catch (err) {
    console.error('加载优惠券列表失败:', err)
  }
}

const handleLogoUpload = (response) => {
  if (response.code === 0 || response.code === 200) {
    basicForm.logo = response.data.url || response.data
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const saveBasic = async () => {
  saving.value = true
  try {
    await api.settings.updateConfig({ type: 'basic', ...basicForm })
    ElMessage.success('保存成功')
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

const saveOperation = async () => {
  saving.value = true
  try {
    await api.settings.updateConfig({ type: 'operation', ...operationForm })
    ElMessage.success('保存成功')
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

const saveNotification = async () => {
  saving.value = true
  try {
    await api.settings.updateConfig({ type: 'notification', ...notificationForm })
    ElMessage.success('保存成功')
  } catch (err) {
    console.error(err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
  loadCoupons()
})
</script>

<style lang="scss" scoped>
.settings {
  .setting-card {
    margin-top: 20px;
  }

  .logo-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: #409eff;
      }
    }

    .uploader-icon {
      font-size: 28px;
      color: #8c939d;
    }

    .logo-image {
      width: 120px;
      height: 120px;
      object-fit: contain;
      display: block;
    }
  }

  .unit {
    color: #666;
    margin-left: 8px;
  }
}
</style>
