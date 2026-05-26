<template>
  <div class="finance-list">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card total-income">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(overview.total_income) }}</div>
              <div class="stat-label">总收入</div>
            </div>
            <div class="stat-icon">
              <el-icon><Money /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card platform-income">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(overview.platform_income) }}</div>
              <div class="stat-label">平台收入</div>
            </div>
            <div class="stat-icon">
              <el-icon><GoldMedal /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card total-withdraw">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(overview.total_withdraw) }}</div>
              <div class="stat-label">已提现</div>
            </div>
            <div class="stat-icon">
              <el-icon><Wallet /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card pending-withdraw">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">¥{{ formatMoney(overview.pending_withdraw) }}</div>
              <div class="stat-label">待审核提现</div>
              <div class="stat-badge">{{ overview.pending_count }}笔</div>
            </div>
            <div class="stat-icon">
              <el-icon><Clock /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>流水记录</span>
          <div class="header-actions">
            <el-radio-group v-model="recordType" size="small" @change="loadRecords">
              <el-radio-button value="all">全部</el-radio-button>
              <el-radio-button value="income">收入</el-radio-button>
              <el-radio-button value="withdraw">提现</el-radio-button>
            </el-radio-group>
            <el-button type="primary" size="small" @click="exportData">
              <el-icon><Download /></el-icon>导出
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="records" v-loading="loading" border stripe>
        <el-table-column prop="record_no" label="流水号" width="180" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1" type="success" size="small">收入</el-tag>
            <el-tag v-else type="warning" size="small">支出</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.type === 1 ? 'income' : 'expense'">
              {{ row.type === 1 ? '+' : '-' }}¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120" align="right">
          <template #default="{ row }">
            ¥{{ row.balance }}
          </template>
        </el-table-column>
        <el-table-column label="关联订单" width="160">
          <template #default="{ row }">
            <span v-if="row.order_no">{{ row.order_no }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" />
        <el-table-column prop="created_at" label="时间" width="160" />
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

    <el-card class="fee-card">
      <template #header>
        <div class="card-header">
          <span>平台抽佣配置</span>
          <el-button type="primary" size="small" @click="showFeeDialog = true">
            <el-icon><Edit /></el-icon>编辑
          </el-button>
        </div>
      </template>

      <el-descriptions :column="3" border>
        <el-descriptions-item label="平台抽佣比例">
          {{ feeConfig.platform_fee_rate || 20 }}%
        </el-descriptions-item>
        <el-descriptions-item label="提现手续费比例">
          {{ feeConfig.withdraw_fee_rate || 0 }}%
        </el-descriptions-item>
        <el-descriptions-item label="最低提现金额">
          ¥{{ feeConfig.min_withdraw_amount || 100 }}
        </el-descriptions-item>
        <el-descriptions-item label="保证金金额">
          ¥{{ feeConfig.deposit_amount || 500 }}
        </el-descriptions-item>
        <el-descriptions-item label="提现审核周期">
          {{ feeConfig.withdraw_audit_days || 1 }}个工作日
        </el-descriptions-item>
        <el-descriptions-item label="支付手续费">
          {{ feeConfig.payment_fee_rate || 0.6 }}%
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-dialog
      v-model="showFeeDialog"
      title="编辑抽佣配置"
      width="500px"
    >
      <el-form :model="feeForm" :rules="feeRules" ref="feeFormRef" label-width="140px">
        <el-form-item label="平台抽佣比例" prop="platform_fee_rate">
          <el-input-number
            v-model="feeForm.platform_fee_rate"
            :min="0"
            :max="100"
            :precision="1"
            style="width: 200px"
          />
          <span class="unit">%</span>
        </el-form-item>
        <el-form-item label="提现手续费比例" prop="withdraw_fee_rate">
          <el-input-number
            v-model="feeForm.withdraw_fee_rate"
            :min="0"
            :max="100"
            :precision="1"
            style="width: 200px"
          />
          <span class="unit">%</span>
        </el-form-item>
        <el-form-item label="最低提现金额" prop="min_withdraw_amount">
          <el-input-number
            v-model="feeForm.min_withdraw_amount"
            :min="0"
            :precision="2"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="保证金金额" prop="deposit_amount">
          <el-input-number
            v-model="feeForm.deposit_amount"
            :min="0"
            :precision="2"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="提现审核周期" prop="withdraw_audit_days">
          <el-input-number
            v-model="feeForm.withdraw_audit_days"
            :min="0"
            :precision="0"
            style="width: 200px"
          />
          <span class="unit">个工作日</span>
        </el-form-item>
        <el-form-item label="支付手续费比例" prop="payment_fee_rate">
          <el-input-number
            v-model="feeForm.payment_fee_rate"
            :min="0"
            :max="100"
            :precision="2"
            style="width: 200px"
          />
          <span class="unit">%</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFeeDialog = false">取消</el-button>
        <el-button type="primary" @click="updateFeeConfig">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Money, GoldMedal, Wallet, Clock, Download, Edit } from '@element-plus/icons-vue'
import { api } from '@/utils/request'

const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const recordType = ref('all')
const overview = ref({})
const records = ref([])
const feeConfig = ref({})
const showFeeDialog = ref(false)
const feeFormRef = ref()

const feeForm = reactive({
  platform_fee_rate: 20,
  withdraw_fee_rate: 0,
  min_withdraw_amount: 100,
  deposit_amount: 500,
  withdraw_audit_days: 1,
  payment_fee_rate: 0.6
})

const feeRules = {
  platform_fee_rate: [{ required: true, message: '请输入平台抽佣比例', trigger: 'blur' }],
  withdraw_fee_rate: [{ required: true, message: '请输入提现手续费比例', trigger: 'blur' }],
  min_withdraw_amount: [{ required: true, message: '请输入最低提现金额', trigger: 'blur' }],
  deposit_amount: [{ required: true, message: '请输入保证金金额', trigger: 'blur' }],
  withdraw_audit_days: [{ required: true, message: '请输入提现审核周期', trigger: 'blur' }],
  payment_fee_rate: [{ required: true, message: '请输入支付手续费比例', trigger: 'blur' }]
}

const formatMoney = (amount) => {
  return ((amount || 0) / 100).toFixed(2)
}

const loadOverview = async () => {
  try {
    const res = await api.finance.getOverview()
    overview.value = res.data || {}
  } catch (err) {
    console.error('加载财务总览失败:', err)
  }
}

const loadFeeConfig = async () => {
  try {
    const res = await api.finance.getFeeConfig()
    feeConfig.value = res.data || {}
    Object.assign(feeForm, res.data || {})
  } catch (err) {
    console.error('加载抽佣配置失败:', err)
  }
}

const loadRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      type: recordType.value
    }
    const res = await api.finance.getRecords(params)
    records.value = res.data.list || res.data || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载流水记录失败:', err)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  page.value = 1
  loadRecords()
}

const handleCurrentChange = (val) => {
  page.value = val
  loadRecords()
}

const updateFeeConfig = async () => {
  await feeFormRef.value.validate()
  try {
    await api.finance.updateFeeConfig(feeForm)
    ElMessage.success('配置更新成功')
    showFeeDialog.value = false
    loadFeeConfig()
  } catch (err) {
    console.error(err)
  }
}

const exportData = () => {
  ElMessage.info('导出功能开发中')
}

onMounted(() => {
  loadOverview()
  loadFeeConfig()
  loadRecords()
})
</script>

<style lang="scss" scoped>
.finance-list {
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
        margin-bottom: 4px;
      }

      .stat-badge {
        font-size: 12px;
        color: #faad14;
      }
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      .el-icon {
        font-size: 28px;
      }
    }

    &.total-income {
      .stat-icon {
        background-color: #e6f7ff;
        color: #1890ff;
      }
    }

    &.platform-income {
      .stat-icon {
        background-color: #fff7e6;
        color: #faad14;
      }
    }

    &.total-withdraw {
      .stat-icon {
        background-color: #f6ffed;
        color: #52c41a;
      }
    }

    &.pending-withdraw {
      .stat-icon {
        background-color: #fff1f0;
        color: #ff4d4f;
      }
    }
  }

  .table-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }
    }

    .pagination {
      margin-top: 20px;
      text-align: right;
    }

    .income {
      color: #52c41a;
      font-weight: 600;
    }

    .expense {
      color: #ff4d4f;
      font-weight: 600;
    }

    .text-muted {
      color: #999;
    }
  }

  .fee-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .unit {
      margin-left: 8px;
      color: #666;
    }
  }
}
</style>
