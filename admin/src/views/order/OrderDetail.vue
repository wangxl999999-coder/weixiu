<template>
  <div class="order-detail">
    <el-page-header @back="goBack" :title="'订单详情 - ' + (order?.order_no || '')" />

    <el-row :gutter="20" class="detail-content" v-if="order">
      <el-col :span="16">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>订单信息</span>
              <el-tag :type="getStatusType(order.status)" size="large">
                {{ getStatusText(order.status) }}
              </el-tag>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">
              {{ order.order_no }}
            </el-descriptions-item>
            <el-descriptions-item label="服务名称">
              {{ order.service_name }}
            </el-descriptions-item>
            <el-descriptions-item label="订单金额">
              <span class="price">¥{{ order.total_price }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="实付金额">
              <span class="price">¥{{ order.pay_price }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="优惠金额">
              ¥{{ order.coupon_price || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="平台抽成">
              ¥{{ order.platform_fee || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="师傅收入">
              ¥{{ order.worker_income || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="预约时间">
              {{ order.appointment_time }}
            </el-descriptions-item>
            <el-descriptions-item label="用户备注">
              {{ order.remark || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ order.created_at }}
            </el-descriptions-item>
            <el-descriptions-item label="接单时间">
              {{ order.accept_time || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="完成时间">
              {{ order.finish_time || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card">
          <template #header>用户信息</template>
          <div class="user-info">
            <el-avatar :size="60" :src="order.user_info?.avatar">
              {{ order.user_info?.nickname?.charAt(0) }}
            </el-avatar>
            <div class="user-detail">
              <div class="user-name">{{ order.user_info?.nickname }}</div>
              <div class="user-phone">手机号：{{ order.user_phone }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="info-card">
          <template #header>服务地址</template>
          <div class="address-info">
            <div class="address-user">
              <span>{{ order.address_info?.name }}</span>
              <span class="address-phone">{{ order.address_info?.phone }}</span>
            </div>
            <div class="address-detail">
              {{ order.address_info?.province }}{{ order.address_info?.city }}{{ order.address_info?.district }}{{ order.address_info?.detail }}
            </div>
            <div class="address-coord">
              坐标：{{ order.address_info?.latitude }}, {{ order.address_info?.longitude }}
            </div>
          </div>
        </el-card>

        <el-card class="info-card" v-if="order.worker">
          <template #header>师傅信息</template>
          <div class="user-info">
            <el-avatar :size="60" :src="order.worker?.avatar">
              {{ order.worker?.name?.charAt(0) }}
            </el-avatar>
            <div class="user-detail">
              <div class="user-name">{{ order.worker?.name }}</div>
              <div class="user-phone">手机号：{{ order.worker?.phone }}</div>
              <div class="user-phone">评分：{{ order.worker?.rating }}分 | 接单：{{ order.worker?.order_count }}单</div>
            </div>
          </div>
        </el-card>

        <el-card class="info-card" v-if="order.extras && order.extras.length > 0">
          <template #header>服务增项</template>
          <el-table :data="order.extras" border size="small">
            <el-table-column prop="name" label="项目名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column label="单价" width="100" align="right">
              <template #default="{ row }">¥{{ row.price }}</template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" align="center" />
            <el-table-column label="小计" width="100" align="right">
              <template #default="{ row }">
                <span class="price">¥{{ row.price * row.quantity }}</span>
              </template>
            </el-table-column>
            <el-table-column label="用户确认" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.user_confirm === 0" type="warning" size="small">待确认</el-tag>
                <el-tag v-else-if="row.user_confirm === 1" type="success" size="small">已确认</el-tag>
                <el-tag v-else type="danger" size="small">已拒绝</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="info-card" v-if="order.photos && order.photos.length > 0">
          <template #header>服务照片</template>
          <div class="photo-grid">
            <div v-for="photo in order.photos" :key="photo.id" class="photo-item">
              <el-image :src="photo.image_url" :preview-src-list="order.photos.map(p => p.image_url)" fit="cover" />
              <div class="photo-type">
                <el-tag v-if="photo.type === 1" type="primary" size="small">服务前</el-tag>
                <el-tag v-else-if="photo.type === 2" type="warning" size="small">服务中</el-tag>
                <el-tag v-else type="success" size="small">服务后</el-tag>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="info-card" v-if="order.evaluation">
          <template #header>用户评价</template>
          <div class="evaluation">
            <div class="eval-rating">
              <span v-for="i in 5" :key="i" class="star" :class="{ active: i <= order.evaluation.rating }">★</span>
              <span class="rating-text">{{ order.evaluation.rating }}分</span>
            </div>
            <div class="eval-content">{{ order.evaluation.content }}</div>
            <div v-if="order.evaluation.images" class="eval-images">
              <el-image
                v-for="(img, idx) in order.evaluation.images.split(',')"
                :key="idx"
                :src="img"
                :preview-src-list="order.evaluation.images.split(',')"
                fit="cover"
              />
            </div>
            <div class="eval-time">{{ order.evaluation.created_at }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="operation-card">
          <template #header>操作记录</template>
          <el-timeline>
            <el-timeline-item
              v-for="(log, idx) in operationLogs"
              :key="idx"
              :timestamp="log.created_at"
              :type="getTimelineType(idx)"
            >
              <div class="log-content">
                <div class="log-title">{{ log.action }}</div>
                <div class="log-operator">操作人：{{ log.operator_name || '系统' }}</div>
                <div v-if="log.remark" class="log-remark">备注：{{ log.remark }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <el-card class="action-card">
          <template #header>快捷操作</template>
          <div class="action-buttons">
            <el-button
              v-if="order.status === 0"
              type="primary"
              block
              @click="dispatchOrder"
            >
              人工派单
            </el-button>
            <el-button
              v-if="order.status >= 1 && order.status <= 3"
              type="warning"
              block
              @click="reassignOrder"
            >
              改派订单
            </el-button>
            <el-button
              v-if="order.status === 6"
              type="success"
              block
              @click="handleRefund(1)"
            >
              同意退款
            </el-button>
            <el-button
              v-if="order.status === 6"
              type="danger"
              block
              @click="handleRefund(2)"
            >
              拒绝退款
            </el-button>
            <el-button
              v-if="order.status === 0"
              type="danger"
              block
              @click="cancelOrder"
            >
              取消订单
            </el-button>
            <el-button type="info" block @click="contactUser">联系用户</el-button>
            <el-button v-if="order.worker" type="info" block @click="contactWorker">联系师傅</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div v-else class="loading-container">
      <el-loading-text>加载中...</el-loading-text>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/request'

const route = useRoute()
const router = useRouter()

const orderId = route.params.id
const order = ref(null)
const operationLogs = ref([])
const availableWorkers = ref([])

const orderStatusMap = {
  0: { text: '待接单', type: 'warning' },
  1: { text: '待服务', type: 'primary' },
  2: { text: '服务中', type: 'success' },
  3: { text: '待确认', type: 'warning' },
  4: { text: '已完成', type: 'success' },
  5: { text: '已取消', type: 'info' },
  6: { text: '退款中', type: 'danger' },
  7: { text: '已退款', type: 'info' }
}

const getStatusText = (status) => orderStatusMap[status]?.text || '未知'
const getStatusType = (status) => orderStatusMap[status]?.type || 'info'

const getTimelineType = (idx) => {
  const types = ['primary', 'success', 'warning', 'info', 'danger']
  return types[idx % types.length]
}

const loadDetail = async () => {
  try {
    const res = await api.order.getDetail(orderId)
    order.value = res.data
    operationLogs.value = res.data.logs || []
  } catch (err) {
    console.error('加载订单详情失败:', err)
  }
}

const goBack = () => {
  router.push('/orders')
}

const dispatchOrder = () => {
  router.push('/orders')
}

const reassignOrder = () => {
  router.push('/orders')
}

const handleRefund = async (status) => {
  const action = status === 1 ? '同意' : '拒绝'
  ElMessageBox.confirm(`确定要${action}该订单的退款申请吗？`, '提示', {
    type: status === 1 ? 'success' : 'warning'
  }).then(async () => {
    try {
      await api.order.refund(orderId, {
        status,
        remark: `管理员${action}退款`
      })
      ElMessage.success(`${action}退款成功`)
      loadDetail()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

const cancelOrder = () => {
  ElMessageBox.confirm('确定要取消该订单吗？', '取消确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.order.cancel(orderId)
      ElMessage.success('取消成功')
      loadDetail()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

const contactUser = () => {
  if (order.value?.user_phone) {
    ElMessage.info(`用户电话：${order.value.user_phone}`)
  }
}

const contactWorker = () => {
  if (order.value?.worker?.phone) {
    ElMessage.info(`师傅电话：${order.value.worker.phone}`)
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style lang="scss" scoped>
.order-detail {
  .detail-content {
    margin-top: 20px;
  }

  .info-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .price {
      color: #ff4d4f;
      font-weight: 600;
      font-size: 16px;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-detail {
      .user-name {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
      }

      .user-phone {
        font-size: 13px;
        color: #666;
        margin-top: 2px;
      }
    }
  }

  .address-info {
    .address-user {
      margin-bottom: 8px;

      span {
        font-size: 14px;
        color: #333;
      }

      .address-phone {
        margin-left: 12px;
        color: #666;
      }
    }

    .address-detail {
      font-size: 13px;
      color: #666;
      margin-bottom: 4px;
    }

    .address-coord {
      font-size: 12px;
      color: #999;
    }
  }

  .photo-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .photo-item {
      width: 120px;
      height: 120px;
      position: relative;
      border-radius: 4px;
      overflow: hidden;

      :deep(.el-image) {
        width: 100%;
        height: 100%;
      }

      .photo-type {
        position: absolute;
        bottom: 4px;
        left: 4px;
      }
    }
  }

  .evaluation {
    .eval-rating {
      margin-bottom: 12px;

      .star {
        color: #ddd;
        font-size: 20px;
        margin-right: 4px;

        &.active {
          color: #faad14;
        }
      }

      .rating-text {
        margin-left: 8px;
        font-size: 14px;
        color: #faad14;
      }
    }

    .eval-content {
      font-size: 14px;
      color: #333;
      line-height: 1.6;
      margin-bottom: 12px;
    }

    .eval-images {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;

      :deep(.el-image) {
        width: 80px;
        height: 80px;
        border-radius: 4px;
      }
    }

    .eval-time {
      font-size: 12px;
      color: #999;
    }
  }

  .operation-card {
    margin-bottom: 20px;

    .log-content {
      .log-title {
        font-size: 14px;
        color: #333;
        margin-bottom: 4px;
      }

      .log-operator {
        font-size: 12px;
        color: #666;
      }

      .log-remark {
        font-size: 12px;
        color: #999;
        margin-top: 2px;
      }
    }
  }

  .action-card {
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
}
</style>
