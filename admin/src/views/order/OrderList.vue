<template>
  <div class="order-list">
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="订单号">
          <el-input
            v-model="filterForm.order_no"
            placeholder="请输入订单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <div>
            <el-button type="primary" size="small" @click="exportData">
              <el-icon><Download /></el-icon>导出
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="order_no" label="订单号" width="160" fixed="left" />
        <el-table-column prop="service_name" label="服务名称" min-width="140" />
        <el-table-column label="用户信息" width="160">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="28" :src="row.user_avatar">
                {{ row.user_name?.charAt(0) }}
              </el-avatar>
              <div>
                <div class="username">{{ row.user_name }}</div>
                <div class="userphone">{{ row.user_phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="师傅信息" width="160">
          <template #default="{ row }">
            <div v-if="row.worker_name" class="user-info">
              <el-avatar :size="28" :src="row.worker_avatar">
                {{ row.worker_name?.charAt(0) }}
              </el-avatar>
              <div>
                <div class="username">{{ row.worker_name }}</div>
                <div class="userphone">{{ row.worker_phone }}</div>
              </div>
            </div>
            <span v-else class="text-muted">未分配</span>
          </template>
        </el-table-column>
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
        <el-table-column prop="appointment_time" label="预约时间" width="160" />
        <el-table-column prop="created_at" label="下单时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              link
              @click="dispatchOrder(row)"
            >
              派单
            </el-button>
            <el-button
              v-if="row.status >= 1 && row.status <= 3"
              type="warning"
              size="small"
              link
              @click="reassignOrder(row)"
            >
              改派
            </el-button>
            <el-button
              v-if="row.status === 6"
              type="danger"
              size="small"
              link
              @click="handleRefund(row)"
            >
              退款处理
            </el-button>
            <el-button
              v-if="row.status === 0"
              type="danger"
              size="small"
              link
              @click="cancelOrder(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="pagination"
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog
      v-model="showDispatchDialog"
      title="派单"
      width="600px"
    >
      <el-form :model="dispatchForm" label-width="80px">
        <el-form-item label="订单号">
          <span>{{ dispatchForm.order_no }}</span>
        </el-form-item>
        <el-form-item label="服务">
          <span>{{ dispatchForm.service_name }}</span>
        </el-form-item>
        <el-form-item label="选择师傅">
          <el-select
            v-model="dispatchForm.worker_id"
            placeholder="请选择师傅"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="worker in availableWorkers"
              :key="worker.id"
              :label="`${worker.name} - ${worker.phone}`"
              :value="worker.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="dispatchForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注(选填)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDispatchDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmDispatch">确定派单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import { api } from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref([])
const availableWorkers = ref([])
const showDispatchDialog = ref(false)

const filterForm = reactive({
  order_no: '',
  status: '',
  date_range: []
})

const dispatchForm = reactive({
  id: '',
  order_no: '',
  service_name: '',
  worker_id: '',
  remark: ''
})

const statusOptions = [
  { value: 0, label: '待接单' },
  { value: 1, label: '待服务' },
  { value: 2, label: '服务中' },
  { value: 3, label: '待确认' },
  { value: 4, label: '已完成' },
  { value: 5, label: '已取消' },
  { value: 6, label: '退款中' },
  { value: 7, label: '已退款' }
]

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

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filterForm
    }
    if (filterForm.date_range?.length === 2) {
      params.start_date = filterForm.date_range[0]
      params.end_date = filterForm.date_range[1]
    }
    delete params.date_range

    const res = await api.order.getList(params)
    tableData.value = res.data.list || res.data || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载订单列表失败:', err)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.order_no = ''
  filterForm.status = ''
  filterForm.date_range = []
  page.value = 1
  loadData()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  page.value = 1
  loadData()
}

const handleCurrentChange = (val) => {
  page.value = val
  loadData()
}

const viewDetail = (row) => {
  router.push(`/orders/${row.id}`)
}

const loadAvailableWorkers = async (serviceCategoryId = 0) => {
  try {
    const res = await api.worker.getList({ status: 1, page: 1, pageSize: 100 })
    availableWorkers.value = res.data.list || res.data || []
  } catch (err) {
    console.error('加载师傅列表失败:', err)
  }
}

const dispatchOrder = async (row) => {
  dispatchForm.id = row.id
  dispatchForm.order_no = row.order_no
  dispatchForm.service_name = row.service_name
  dispatchForm.worker_id = ''
  dispatchForm.remark = ''
  await loadAvailableWorkers()
  showDispatchDialog.value = true
}

const reassignOrder = async (row) => {
  ElMessageBox.confirm(`确定要改派订单"${row.order_no}"吗？`, '改派确认', {
    type: 'warning',
    confirmButtonText: '确定改派',
    cancelButtonText: '取消'
  }).then(async () => {
    dispatchForm.id = row.id
    dispatchForm.order_no = row.order_no
    dispatchForm.service_name = row.service_name
    dispatchForm.worker_id = ''
    dispatchForm.remark = ''
    await loadAvailableWorkers()
    showDispatchDialog.value = true
  }).catch(() => {})
}

const confirmDispatch = async () => {
  if (!dispatchForm.worker_id) {
    ElMessage.warning('请选择师傅')
    return
  }
  submitting.value = true
  try {
    await api.order.dispatch(dispatchForm.id, {
      worker_id: dispatchForm.worker_id,
      remark: dispatchForm.remark
    })
    ElMessage.success('派单成功')
    showDispatchDialog.value = false
    loadData()
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}

const cancelOrder = async (row) => {
  ElMessageBox.confirm(`确定要取消订单"${row.order_no}"吗？`, '取消确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.order.cancel(row.id)
      ElMessage.success('取消成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

const handleRefund = async (row) => {
  ElMessageBox.confirm(`确定要为订单"${row.order_no}"处理退款吗？`, '退款处理', {
    confirmButtonText: '同意退款',
    cancelButtonText: '拒绝退款',
    type: 'warning'
  }).then(async () => {
    try {
      await api.order.refund(row.id, { status: 1, remark: '管理员同意退款' })
      ElMessage.success('退款成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(async (action) => {
    if (action === 'cancel') {
      ElMessageBox.prompt('请输入拒绝原因', '拒绝退款', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /\S/,
        inputErrorMessage: '请输入拒绝原因'
      }).then(async ({ value }) => {
        try {
          await api.order.refund(row.id, { status: 2, remark: value })
          ElMessage.success('已拒绝退款')
          loadData()
        } catch (err) {
          console.error(err)
        }
      }).catch(() => {})
    }
  })
}

const exportData = () => {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.order-list {
  .filter-card {
    margin-bottom: 20px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pagination {
      margin-top: 20px;
      text-align: right;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .username {
      font-size: 13px;
      color: #333;
    }

    .userphone {
      font-size: 12px;
      color: #999;
    }
  }

  .price {
    color: #ff4d4f;
    font-weight: 600;
  }

  .text-muted {
    color: #999;
  }
}
</style>
