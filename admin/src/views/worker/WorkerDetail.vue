<template>
  <div class="worker-detail">
    <el-page-header @back="goBack" :title="'师傅详情 - ' + (worker?.name || '')" />

    <el-row :gutter="20" class="detail-content" v-if="worker">
      <el-col :span="16">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <div class="status-tags">
                <el-tag
                  :type="worker.audit_status === 1 ? 'success' : worker.audit_status === 2 ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ worker.audit_status === 1 ? '审核通过' : worker.audit_status === 2 ? '审核拒绝' : '待审核' }}
                </el-tag>
                <el-tag
                  :type="worker.status === 1 ? 'success' : 'info'"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ worker.status === 1 ? '正常' : '禁用' }}
                </el-tag>
              </div>
            </div>
          </template>

          <div class="profile-header">
            <el-avatar :size="80" :src="worker.avatar">
              {{ worker.name?.charAt(0) }}
            </el-avatar>
            <div class="profile-info">
              <h2 class="worker-name">{{ worker.name }}</h2>
              <div class="worker-meta">
                <span>评分：<b class="rating">{{ worker.rating || '5.0' }}</b>分</span>
                <span>接单：<b>{{ worker.order_count || 0 }}</b>单</span>
                <span>好评率：<b>{{ worker.good_rate || '100' }}%</b></span>
              </div>
            </div>
          </div>

          <el-divider />

          <el-descriptions :column="2" border>
            <el-descriptions-item label="手机号">
              {{ worker.phone }}
            </el-descriptions-item>
            <el-descriptions-item label="身份证号">
              {{ worker.id_card }}
            </el-descriptions-item>
            <el-descriptions-item label="技能专长">
              {{ worker.skills }}
            </el-descriptions-item>
            <el-descriptions-item label="工作经验">
              {{ worker.experience || '0' }}年
            </el-descriptions-item>
            <el-descriptions-item label="服务区域">
              {{ worker.service_area || '未设置' }}
            </el-descriptions-item>
            <el-descriptions-item label="服务半径">
              {{ worker.service_radius || '5' }}公里
            </el-descriptions-item>
            <el-descriptions-item label="接单时间段">
              {{ worker.work_time || '09:00-18:00' }}
            </el-descriptions-item>
            <el-descriptions-item label="保证金">
              <span :class="{ 'deposit-paid': worker.deposit_status === 1 }">
                {{ worker.deposit_status === 1 ? `已缴纳 ¥${worker.deposit_amount}` : '未缴纳' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="钱包余额">
              <span class="balance">¥{{ (worker.wallet_balance || 0) / 100 }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ worker.created_at }}
            </el-descriptions-item>
            <el-descriptions-item label="个人简介" :span="2">
              {{ worker.bio || '暂无' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card">
          <template #header>资质证件</template>
          <div class="certificates">
            <div v-if="idCardImages.length > 0" class="cert-section">
              <h4>身份证</h4>
              <div class="image-list">
                <div v-for="(img, idx) in idCardImages" :key="idx" class="image-item">
                  <el-image
                    :src="img"
                    :preview-src-list="idCardImages"
                    fit="cover"
                  />
                  <span class="image-label">{{ idx === 0 ? '正面' : '反面' }}</span>
                </div>
              </div>
            </div>

            <div v-if="certificateImages.length > 0" class="cert-section">
              <h4>技能证书</h4>
              <div class="image-list">
                <div v-for="(img, idx) in certificateImages" :key="idx" class="image-item">
                  <el-image
                    :src="img"
                    :preview-src-list="certificateImages"
                    fit="cover"
                  />
                  <span class="image-label">证书{{ idx + 1 }}</span>
                </div>
              </div>
            </div>

            <div v-if="idCardImages.length === 0 && certificateImages.length === 0" class="no-cert">
              暂无资质证件
            </div>
          </div>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>历史订单</span>
              <el-button type="primary" link @click="goToOrders">查看全部</el-button>
            </div>
          </template>
          <el-table :data="workerOrders" border size="small" v-loading="orderLoading">
            <el-table-column prop="order_no" label="订单号" width="160" />
            <el-table-column prop="service_name" label="服务名称" />
            <el-table-column label="金额" width="100" align="right">
              <template #default="{ row }">
                <span class="price">¥{{ row.total_price }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="下单时间" width="160" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="income-card">
          <template #header>
            <span>收入统计</span>
          </template>
          <div class="income-stats">
            <div class="stat-item">
              <div class="stat-value">¥{{ incomeStats.total_income || 0 }}</div>
              <div class="stat-label">累计收入</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">¥{{ incomeStats.month_income || 0 }}</div>
              <div class="stat-label">本月收入</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ incomeStats.total_orders || 0 }}</div>
              <div class="stat-label">累计订单</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ incomeStats.month_orders || 0 }}</div>
              <div class="stat-label">本月订单</div>
            </div>
          </div>
        </el-card>

        <el-card class="action-card">
          <template #header>快捷操作</template>
          <div class="action-buttons">
            <el-button
              v-if="worker.audit_status === 0"
              type="success"
              block
              @click="auditWorker(1)"
            >
              通过审核
            </el-button>
            <el-button
              v-if="worker.audit_status === 0"
              type="danger"
              block
              @click="auditWorker(2)"
            >
              拒绝审核
            </el-button>
            <el-button
              v-if="worker.status === 1"
              type="warning"
              block
              @click="toggleStatus(0)"
            >
              禁用账号
            </el-button>
            <el-button
              v-if="worker.status === 0"
              type="success"
              block
              @click="toggleStatus(1)"
            >
              启用账号
            </el-button>
            <el-button
              type="primary"
              block
              @click="handleDeposit"
            >
              保证金管理
            </el-button>
          </div>
        </el-card>

        <el-card class="audit-log-card">
          <template #header>审核记录</template>
          <el-timeline>
            <el-timeline-item
              v-for="(log, idx) in auditLogs"
              :key="idx"
              :timestamp="log.created_at"
              :type="log.status === 1 ? 'success' : log.status === 2 ? 'danger' : 'warning'"
            >
              <div class="log-content">
                <div class="log-title">
                  {{ log.status === 1 ? '审核通过' : log.status === 2 ? '审核拒绝' : '提交审核' }}
                </div>
                <div class="log-operator">操作人：{{ log.operator_name || '系统' }}</div>
                <div v-if="log.remark" class="log-remark">备注：{{ log.remark }}</div>
              </div>
            </el-timeline-item>
            <el-timeline-item
              :timestamp="worker.created_at"
              type="primary"
            >
              <div class="log-content">
                <div class="log-title">注册申请</div>
                <div class="log-operator">操作人：{{ worker.name }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <div v-else class="loading-container">
      <el-loading-text>加载中...</el-loading-text>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/request'

const route = useRoute()
const router = useRouter()

const workerId = route.params.id
const worker = ref(null)
const workerOrders = ref([])
const orderLoading = ref(false)
const incomeStats = ref({})
const auditLogs = ref([])

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

const idCardImages = computed(() => {
  if (!worker.value?.id_card_front && !worker.value?.id_card_back) return []
  const images = []
  if (worker.value.id_card_front) images.push(worker.value.id_card_front)
  if (worker.value.id_card_back) images.push(worker.value.id_card_back)
  return images
})

const certificateImages = computed(() => {
  if (!worker.value?.certificates) return []
  return worker.value.certificates.split(',').filter(v => v)
})

const loadDetail = async () => {
  try {
    const res = await api.worker.getDetail(workerId)
    worker.value = res.data
    auditLogs.value = res.data.audit_logs || []
    incomeStats.value = res.data.income_stats || {}
    workerOrders.value = res.data.recent_orders || []
  } catch (err) {
    console.error('加载师傅详情失败:', err)
  }
}

const goBack = () => {
  router.push('/workers')
}

const goToOrders = () => {
  router.push({ path: '/orders', query: { worker_id: workerId } })
}

const auditWorker = (status) => {
  if (status === 2) {
    ElMessageBox.prompt('请输入拒绝原因', '拒绝审核', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S/,
      inputErrorMessage: '请输入拒绝原因'
    }).then(async ({ value }) => {
      try {
        await api.worker.audit(workerId, { status, remark: value })
        ElMessage.success('已拒绝')
        loadDetail()
      } catch (err) {
        console.error(err)
      }
    }).catch(() => {})
  } else {
    ElMessageBox.confirm('确定通过该师傅的审核吗？', '审核提示', {
      type: 'success'
    }).then(async () => {
      try {
        await api.worker.audit(workerId, { status, remark: '审核通过' })
        ElMessage.success('审核通过')
        loadDetail()
      } catch (err) {
        console.error(err)
      }
    }).catch(() => {})
  }
}

const toggleStatus = async (status) => {
  const action = status === 1 ? '启用' : '禁用'
  ElMessageBox.confirm(`确定要${action}该师傅账号吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.worker.updateStatus(workerId, status)
      ElMessage.success(`${action}成功`)
      loadDetail()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

const handleDeposit = () => {
  ElMessage.info('请在列表页操作保证金')
  goBack()
}

onMounted(() => {
  loadDetail()
})
</script>

<style lang="scss" scoped>
.worker-detail {
  .detail-content {
    margin-top: 20px;
  }

  .info-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .status-tags {
        display: flex;
      }
    }
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 16px;

    .worker-name {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin: 0 0 12px 0;
    }

    .worker-meta {
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: #666;

      b {
        color: #333;
        font-size: 16px;
      }

      .rating {
        color: #faad14;
      }
    }
  }

  .deposit-paid {
    color: #52c41a;
    font-weight: 600;
  }

  .balance {
    color: #ff4d4f;
    font-weight: 600;
  }

  .certificates {
    .cert-section {
      margin-bottom: 20px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 0 0 12px 0;
      }

      .image-list {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;

        .image-item {
          text-align: center;

          :deep(.el-image) {
            width: 160px;
            height: 100px;
            border-radius: 4px;
            display: block;
          }

          .image-label {
            display: inline-block;
            margin-top: 6px;
            font-size: 12px;
            color: #999;
          }
        }
      }
    }

    .no-cert {
      text-align: center;
      color: #999;
      padding: 40px 0;
    }
  }

  .price {
    color: #ff4d4f;
    font-weight: 600;
  }

  .income-card {
    margin-bottom: 20px;

    .income-stats {
      display: flex;
      flex-wrap: wrap;

      .stat-item {
        width: 50%;
        text-align: center;
        padding: 16px 0;

        .stat-value {
          font-size: 20px;
          font-weight: 600;
          color: #ff4d4f;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }

  .action-card {
    margin-bottom: 20px;

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  }

  .audit-log-card {
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

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
}
</style>
