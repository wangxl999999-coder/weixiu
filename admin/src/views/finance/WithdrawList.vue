<template>
  <div class="withdraw-list">
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="师傅姓名">
          <el-input
            v-model="filterForm.worker_name"
            placeholder="请输入师傅姓名"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
            <el-option label="已打款" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
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
          <span>提现申请列表</span>
          <div class="header-actions">
            <el-button
              type="success"
              size="small"
              :disabled="selectedIds.length === 0"
              @click="batchAudit(1)"
            >
              <el-icon><Check /></el-icon>批量通过
            </el-button>
            <el-button
              type="danger"
              size="small"
              :disabled="selectedIds.length === 0"
              @click="batchAudit(2)"
            >
              <el-icon><Close /></el-icon>批量拒绝
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="withdraw_no" label="提现单号" width="180" fixed="left" />
        <el-table-column label="师傅信息" width="180">
          <template #default="{ row }">
            <div class="worker-info">
              <el-avatar :size="28" :src="row.worker_avatar">
                {{ row.worker_name?.charAt(0) }}
              </el-avatar>
              <div>
                <div class="worker-name">{{ row.worker_name }}</div>
                <div class="worker-phone">{{ row.worker_phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提现金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="手续费" width="100" align="right">
          <template #default="{ row }">
            <span class="fee">¥{{ row.fee || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="实付金额" width="120" align="right">
          <template #default="{ row }">
            <span class="real-amount">¥{{ (row.amount || 0) - (row.fee || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="提现方式" width="100">
          <template #default="{ row }">
            <el-tag type="success" size="small">微信零钱</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160" />
        <el-table-column prop="audit_time" label="审核时间" width="160">
          <template #default="{ row }">
            {{ row.audit_time || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="success"
              size="small"
              link
              @click="auditWithdraw(row, 1)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 0"
              type="danger"
              size="small"
              link
              @click="auditWithdraw(row, 2)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="row.status === 1"
              type="primary"
              size="small"
              link
              @click="confirmPay(row)"
            >
              确认打款
            </el-button>
            <el-button type="primary" size="small" link @click="viewDetail(row)">
              详情
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
      v-model="showAuditDialog"
      title="提现审核"
      width="500px"
    >
      <div v-if="currentWithdraw" class="audit-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="提现单号">
            {{ currentWithdraw.withdraw_no }}
          </el-descriptions-item>
          <el-descriptions-item label="师傅">
            {{ currentWithdraw.worker_name }}
          </el-descriptions-item>
          <el-descriptions-item label="提现金额">
            <span class="amount">¥{{ currentWithdraw.amount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="手续费">
            ¥{{ currentWithdraw.fee || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="实付金额" :span="2">
            <span class="real-amount">¥{{ (currentWithdraw.amount || 0) - (currentWithdraw.fee || 0) }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-form :model="auditForm" class="audit-form" style="margin-top: 20px">
          <el-form-item label="审核备注" label-width="80px">
            <el-input
              v-model="auditForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入审核备注(拒绝时必填)"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showAuditDialog = false">取消</el-button>
        <el-button v-if="auditForm.status === 1" type="success" @click="confirmAudit">
          通过申请
        </el-button>
        <el-button v-if="auditForm.status === 2" type="danger" @click="confirmAudit">
          拒绝申请
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Check, Close } from '@element-plus/icons-vue'
import { api } from '@/utils/request'

const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref([])
const selectedIds = ref([])
const showAuditDialog = ref(false)
const currentWithdraw = ref(null)

const filterForm = reactive({
  worker_name: '',
  status: '',
  date_range: []
})

const auditForm = reactive({
  status: 1,
  remark: ''
})

const statusMap = {
  0: { text: '待审核', type: 'warning' },
  1: { text: '已通过', type: 'primary' },
  2: { text: '已拒绝', type: 'danger' },
  3: { text: '已打款', type: 'success' }
}

const getStatusText = (status) => statusMap[status]?.text || '未知'
const getStatusType = (status) => statusMap[status]?.type || 'info'

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

    const res = await api.finance.getWithdrawList(params)
    tableData.value = res.data.list || res.data || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载提现列表失败:', err)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.worker_name = ''
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

const handleSelectionChange = (selection) => {
  selectedIds.value = selection.filter(item => item.status === 0).map(item => item.id)
}

const auditWithdraw = (row, status) => {
  currentWithdraw.value = row
  auditForm.status = status
  auditForm.remark = ''
  showAuditDialog.value = true
}

const confirmAudit = async () => {
  if (!currentWithdraw.value) return

  if (auditForm.status === 2 && !auditForm.remark) {
    ElMessage.warning('拒绝申请请填写原因')
    return
  }

  try {
    await api.finance.auditWithdraw(currentWithdraw.value.id, auditForm)
    ElMessage.success(auditForm.status === 1 ? '审核通过' : '审核拒绝')
    showAuditDialog.value = false
    loadData()
  } catch (err) {
    console.error(err)
  }
}

const batchAudit = async (status) => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要审核的记录')
    return
  }

  const action = status === 1 ? '通过' : '拒绝'

  if (status === 2) {
    ElMessageBox.prompt(`请输入拒绝原因（共${selectedIds.value.length}条记录）`, '批量拒绝', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S/,
      inputErrorMessage: '请输入拒绝原因'
    }).then(async ({ value }) => {
      try {
        for (const id of selectedIds.value) {
          await api.finance.auditWithdraw(id, { status, remark: value })
        }
        ElMessage.success('批量拒绝成功')
        loadData()
      } catch (err) {
        console.error(err)
      }
    }).catch(() => {})
  } else {
    ElMessageBox.confirm(`确定批量${action}选中的${selectedIds.value.length}条记录吗？`, '提示', {
      type: status === 1 ? 'success' : 'warning'
    }).then(async () => {
      try {
        for (const id of selectedIds.value) {
          await api.finance.auditWithdraw(id, { status, remark: `批量${action}` })
        }
        ElMessage.success(`批量${action}成功`)
        loadData()
      } catch (err) {
        console.error(err)
      }
    }).catch(() => {})
  }
}

const confirmPay = async (row) => {
  ElMessageBox.confirm(`确定已向"${row.worker_name}"打款¥${(row.amount || 0) - (row.fee || 0)}吗？`, '确认打款', {
    type: 'success',
    confirmButtonText: '已打款',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await api.finance.auditWithdraw(row.id, { status: 3, remark: '已打款到微信零钱' })
      ElMessage.success('打款确认成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

const viewDetail = (row) => {
  ElMessage.info('详情功能开发中')
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.withdraw-list {
  .filter-card {
    margin-bottom: 20px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }

    .pagination {
      margin-top: 20px;
      text-align: right;
    }
  }

  .worker-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .worker-name {
      font-size: 14px;
      color: #333;
    }

    .worker-phone {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }
  }

  .amount {
    color: #ff4d4f;
    font-weight: 600;
  }

  .fee {
    color: #faad14;
  }

  .real-amount {
    color: #52c41a;
    font-weight: 600;
  }

  .audit-content {
    .amount {
      font-size: 16px;
    }

    .real-amount {
      font-size: 16px;
    }
  }
}
</style>
