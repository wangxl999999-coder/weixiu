<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card total-orders">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalOrders || 0 }}</div>
              <div class="stat-label">总订单数</div>
              <div class="stat-trend" v-if="stats.orderGrowth">
                <el-icon><CaretTop /></el-icon>
                {{ stats.orderGrowth }}%
              </div>
            </div>
            <div class="stat-icon">
              <el-icon><List /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card total-income">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(stats.totalIncome) }}</div>
              <div class="stat-label">总收入</div>
              <div class="stat-trend" v-if="stats.incomeGrowth">
                <el-icon><CaretTop /></el-icon>
                {{ stats.incomeGrowth }}%
              </div>
            </div>
            <div class="stat-icon">
              <el-icon><Money /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card total-workers">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalWorkers || 0 }}</div>
              <div class="stat-label">师傅总数</div>
              <div class="stat-trend" v-if="stats.workerGrowth">
                <el-icon><CaretTop /></el-icon>
                {{ stats.workerGrowth }}%
              </div>
            </div>
            <div class="stat-icon">
              <el-icon><User /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card pending-audit">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingAudit || 0 }}</div>
              <div class="stat-label">待审核</div>
              <div class="stat-trend warning">
                <el-icon><Warning /></el-icon>
                待处理
              </div>
            </div>
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>订单趋势</span>
              <el-radio-group v-model="trendType" size="small" @change="loadTrendData">
                <el-radio-button value="week">近7天</el-radio-button>
                <el-radio-button value="month">近30天</el-radio-button>
                <el-radio-button value="year">近12月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>服务类型分布</span>
          </template>
          <div ref="serviceChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="list-row">
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>最新订单</span>
              <el-button type="primary" link @click="goToOrders">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" v-loading="loading" size="small">
            <el-table-column prop="order_no" label="订单号" width="160" />
            <el-table-column prop="service_name" label="服务名称" />
            <el-table-column prop="user_name" label="用户" width="100" />
            <el-table-column label="金额" width="100">
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
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>待审核师傅</span>
              <el-button type="primary" link @click="goToWorkers">查看全部</el-button>
            </div>
          </template>
          <el-table :data="pendingWorkers" v-loading="loading" size="small">
            <el-table-column label="姓名" width="100">
              <template #default="{ row }">
                <div class="worker-info">
                  <el-avatar :size="32" :src="row.avatar">{{ row.name.charAt(0) }}</el-avatar>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="手机号" width="120" />
            <el-table-column prop="skills" label="技能" show-overflow-tooltip />
            <el-table-column prop="created_at" label="申请时间" width="160" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="auditWorker(row)">审核</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const stats = ref({})
const recentOrders = ref([])
const pendingWorkers = ref([])
const trendType = ref('week')
const trendChartRef = ref()
const serviceChartRef = ref()
let trendChart = null
let serviceChart = null

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

const formatMoney = (amount) => {
  return ((amount || 0) / 100).toFixed(2)
}

const getStatusText = (status) => orderStatusMap[status]?.text || '未知'
const getStatusType = (status) => orderStatusMap[status]?.type || 'info'

const loadDashboardData = async () => {
  loading.value = true
  try {
    const res = await api.statistics.getDashboard()
    stats.value = res.data || {}
    recentOrders.value = res.data?.recentOrders || []
    pendingWorkers.value = res.data?.pendingWorkers || []
  } catch (err) {
    console.error('加载看板数据失败:', err)
  } finally {
    loading.value = false
  }
}

const loadTrendData = async () => {
  try {
    const res = await api.statistics.getOrderTrend({ type: trendType.value })
    if (res.data && trendChart) {
      const data = res.data
      trendChart.setOption({
        xAxis: {
          data: data.dates || []
        },
        series: [{
          name: '订单数',
          data: data.orderCounts || []
        }, {
          name: '收入',
          data: (data.incomes || []).map(v => v / 100)
        }]
      })
    }
  } catch (err) {
    console.error('加载趋势数据失败:', err)
  }
}

const loadServiceStats = async () => {
  try {
    const res = await api.statistics.getServiceStats()
    if (res.data && serviceChart) {
      const data = res.data || []
      serviceChart.setOption({
        series: [{
          data: data.map(item => ({
            name: item.name,
            value: item.count
          }))
        }]
      })
    }
  } catch (err) {
    console.error('加载服务统计失败:', err)
  }
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['订单数', '收入']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: []
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left'
      },
      {
        type: 'value',
        name: '收入(元)',
        position: 'right',
        axisLabel: {
          formatter: '¥{value}'
        }
      }
    ],
    series: [
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        data: [],
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
          ])
        }
      },
      {
        name: '收入',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: [],
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
            { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
          ])
        }
      }
    ]
  })
}

const initServiceChart = () => {
  if (!serviceChartRef.value) return
  serviceChart = echarts.init(serviceChartRef.value)
  serviceChart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: []
      }
    ]
  })
}

const goToOrders = () => {
  router.push('/orders')
}

const goToWorkers = () => {
  router.push('/workers')
}

const auditWorker = (row) => {
  ElMessageBox.confirm(`确定通过师傅"${row.name}"的审核吗？`, '审核提示', {
    confirmButtonText: '通过',
    cancelButtonText: '拒绝',
    type: 'warning'
  }).then(async () => {
    try {
      await api.worker.audit(row.id, { status: 1, remark: '审核通过' })
      ElMessage.success('审核通过')
      loadDashboardData()
    } catch (err) {
      console.error(err)
    }
  }).catch(async (action) => {
    if (action === 'cancel') {
      ElMessageBox.prompt('请输入拒绝原因', '拒绝审核', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S/,
        inputErrorMessage: '请输入拒绝原因'
      }).then(async ({ value }) => {
        try {
          await api.worker.audit(row.id, { status: 2, remark: value })
          ElMessage.success('已拒绝')
          loadDashboardData()
        } catch (err) {
          console.error(err)
        }
      }).catch(() => {})
    }
  })
}

const handleResize = () => {
  trendChart?.resize()
  serviceChart?.resize()
}

onMounted(async () => {
  await loadDashboardData()
  await nextTick()
  initTrendChart()
  initServiceChart()
  await loadTrendData()
  await loadServiceStats()
  window.addEventListener('resize', handleResize)
})

watch(() => trendType.value, () => {
  loadTrendData()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    border: none;
    border-radius: 8px;

    :deep(.el-card__body) {
      padding: 20px;
    }

    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .stat-info {
      .stat-value {
        font-size: 28px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: #999;
        margin-bottom: 8px;
      }

      .stat-trend {
        font-size: 12px;
        color: #52c41a;
        display: flex;
        align-items: center;
        gap: 2px;

        &.warning {
          color: #faad14;
        }
      }
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;

      .el-icon {
        font-size: 28px;
      }
    }

    &.total-orders {
      .stat-icon {
        background-color: #e6f7ff;
        color: #1890ff;
      }
    }

    &.total-income {
      .stat-icon {
        background-color: #f6ffed;
        color: #52c41a;
      }
    }

    &.total-workers {
      .stat-icon {
        background-color: #fff7e6;
        color: #faad14;
      }
    }

    &.pending-audit {
      .stat-icon {
        background-color: #fff1f0;
        color: #ff4d4f;
      }
    }
  }

  .chart-row {
    margin-bottom: 20px;
  }

  .chart-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-container {
      height: 300px;
    }
  }

  .list-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .price {
      color: #ff4d4f;
      font-weight: 600;
    }

    .worker-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}
</style>
