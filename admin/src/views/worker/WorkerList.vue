<template>
  <div class="worker-list">
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="姓名/手机号">
          <el-input
            v-model="filterForm.keyword"
            placeholder="请输入姓名或手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select
            v-model="filterForm.audit_status"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="待审核" :value="0" />
            <el-option label="已通过" :value="1" />
            <el-option label="已拒绝" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
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
        <span>师傅列表</span>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column label="师傅信息" width="200" fixed="left">
          <template #default="{ row }">
            <div class="worker-info">
              <el-avatar :size="36" :src="row.avatar">
                {{ row.name?.charAt(0) }}
              </el-avatar>
              <div>
                <div class="worker-name">{{ row.name }}</div>
                <div class="worker-phone">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.audit_status === 1 ? 'success' : row.audit_status === 2 ? 'danger' : 'warning'"
              size="small"
            >
              {{ row.audit_status === 1 ? '已通过' : row.audit_status === 2 ? '已拒绝' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账号状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="skills" label="技能" min-width="120" show-overflow-tooltip />
        <el-table-column label="评分" width="80" align="center">
          <template #default="{ row }">
            <span class="rating">{{ row.rating || '5.0' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="order_count" label="接单量" width="80" align="center" />
        <el-table-column label="保证金" width="100" align="right">
          <template #default="{ row }">
            <span :class="{ 'deposit-paid': row.deposit_status === 1 }">
              {{ row.deposit_status === 1 ? '已缴纳' : '未缴纳' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="viewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.audit_status === 0"
              type="success"
              size="small"
              link
              @click="auditWorker(row, 1)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.audit_status === 0"
              type="danger"
              size="small"
              link
              @click="auditWorker(row, 2)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              size="small"
              link
              @click="toggleStatus(row, 0)"
            >
              禁用
            </el-button>
            <el-button
              v-if="row.status === 0"
              type="success"
              size="small"
              link
              @click="toggleStatus(row, 1)"
            >
              启用
            </el-button>
            <el-button
              type="primary"
              size="small"
              link
              @click="handleDeposit(row)"
            >
              保证金
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
      title="师傅审核"
      width="500px"
    >
      <div v-if="currentWorker" class="audit-content">
        <div class="audit-info">
          <div class="info-row">
            <span class="label">姓名：</span>
            <span>{{ currentWorker.name }}</span>
          </div>
          <div class="info-row">
            <span class="label">手机号：</span>
            <span>{{ currentWorker.phone }}</span>
          </div>
          <div class="info-row">
            <span class="label">身份证：</span>
            <span>{{ currentWorker.id_card }}</span>
          </div>
          <div class="info-row">
            <span class="label">技能：</span>
            <span>{{ currentWorker.skills }}</span>
          </div>
        </div>

        <div class="audit-images" v-if="idCardImages.length > 0 || certificateImages.length > 0">
          <div v-if="idCardImages.length > 0" class="image-section">
            <div class="section-title">身份证照片</div>
            <div class="image-list">
              <el-image
                v-for="(img, idx) in idCardImages"
                :key="idx"
                :src="img"
                :preview-src-list="idCardImages"
                fit="cover"
              />
            </div>
          </div>
          <div v-if="certificateImages.length > 0" class="image-section">
            <div class="section-title">资质证书</div>
            <div class="image-list">
              <el-image
                v-for="(img, idx) in certificateImages"
                :key="idx"
                :src="img"
                :preview-src-list="certificateImages"
                fit="cover"
              />
            </div>
          </div>
        </div>

        <el-form :model="auditForm" class="audit-form">
          <el-form-item label="审核备注" label-width="80px">
            <el-input
              v-model="auditForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入审核备注"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showAuditDialog = false">取消</el-button>
        <el-button v-if="auditForm.status === 1" type="success" @click="confirmAudit">
          通过审核
        </el-button>
        <el-button v-if="auditForm.status === 2" type="danger" @click="confirmAudit">
          拒绝审核
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showDepositDialog"
      title="保证金管理"
      width="400px"
    >
      <div v-if="currentWorker" class="deposit-content">
        <div class="deposit-info">
          <div class="info-row">
            <span class="label">师傅：</span>
            <span>{{ currentWorker.name }}</span>
          </div>
          <div class="info-row">
            <span class="label">保证金状态：</span>
            <span :class="{ 'deposit-paid': currentWorker.deposit_status === 1 }">
              {{ currentWorker.deposit_status === 1 ? '已缴纳' : '未缴纳' }}
            </span>
          </div>
          <div class="info-row" v-if="currentWorker.deposit_amount">
            <span class="label">缴纳金额：</span>
            <span class="price">¥{{ currentWorker.deposit_amount }}</span>
          </div>
          <div class="info-row" v-if="currentWorker.deposit_time">
            <span class="label">缴纳时间：</span>
            <span>{{ currentWorker.deposit_time }}</span>
          </div>
        </div>

        <el-form :model="depositForm" label-width="80px" class="deposit-form">
          <el-form-item label="操作类型">
            <el-radio-group v-model="depositForm.action">
              <el-radio :value="1">缴纳</el-radio>
              <el-radio :value="2">退还</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="金额">
            <el-input-number
              v-model="depositForm.amount"
              :min="0"
              :precision="2"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="depositForm.remark" placeholder="请输入备注" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showDepositDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmDeposit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { api } from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref([])
const showAuditDialog = ref(false)
const showDepositDialog = ref(false)
const currentWorker = ref(null)

const filterForm = reactive({
  keyword: '',
  audit_status: '',
  status: ''
})

const auditForm = reactive({
  status: 1,
  remark: ''
})

const depositForm = reactive({
  action: 1,
  amount: 0,
  remark: ''
})

const idCardImages = computed(() => {
  if (!currentWorker.value?.id_card_front && !currentWorker.value?.id_card_back) return []
  const images = []
  if (currentWorker.value.id_card_front) images.push(currentWorker.value.id_card_front)
  if (currentWorker.value.id_card_back) images.push(currentWorker.value.id_card_back)
  return images
})

const certificateImages = computed(() => {
  if (!currentWorker.value?.certificates) return []
  return currentWorker.value.certificates.split(',').filter(v => v)
})

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filterForm
    }
    const res = await api.worker.getList(params)
    tableData.value = res.data.list || res.data || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载师傅列表失败:', err)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.audit_status = ''
  filterForm.status = ''
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
  router.push(`/workers/${row.id}`)
}

const auditWorker = (row, status) => {
  currentWorker.value = row
  auditForm.status = status
  auditForm.remark = ''
  showAuditDialog.value = true
}

const confirmAudit = async () => {
  if (!currentWorker.value) return

  if (auditForm.status === 2 && !auditForm.remark) {
    ElMessage.warning('拒绝审核请填写原因')
    return
  }

  try {
    await api.worker.audit(currentWorker.value.id, auditForm)
    ElMessage.success(auditForm.status === 1 ? '审核通过' : '审核拒绝')
    showAuditDialog.value = false
    loadData()
  } catch (err) {
    console.error(err)
  }
}

const toggleStatus = async (row, status) => {
  const action = status === 1 ? '启用' : '禁用'
  ElMessageBox.confirm(`确定要${action}师傅"${row.name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.worker.updateStatus(row.id, status)
      ElMessage.success(`${action}成功`)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

const handleDeposit = (row) => {
  currentWorker.value = row
  depositForm.action = row.deposit_status === 1 ? 2 : 1
  depositForm.amount = row.deposit_amount || 0
  depositForm.remark = ''
  showDepositDialog.value = true
}

const confirmDeposit = async () => {
  if (!currentWorker.value) return
  if (depositForm.amount <= 0) {
    ElMessage.warning('请输入金额')
    return
  }

  try {
    await api.worker.updateDeposit(currentWorker.value.id, depositForm)
    ElMessage.success(depositForm.action === 1 ? '保证金已缴纳' : '保证金已退还')
    showDepositDialog.value = false
    loadData()
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.worker-list {
  .filter-card {
    margin-bottom: 20px;
  }

  .table-card {
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
      font-weight: 600;
      color: #333;
    }

    .worker-phone {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }
  }

  .rating {
    color: #faad14;
    font-weight: 600;
  }

  .deposit-paid {
    color: #52c41a;
    font-weight: 600;
  }

  .audit-content {
    .audit-info {
      margin-bottom: 20px;

      .info-row {
        margin-bottom: 8px;
        font-size: 14px;

        .label {
          color: #666;
          display: inline-block;
          width: 80px;
        }
      }
    }

    .audit-images {
      margin-bottom: 20px;

      .image-section {
        margin-bottom: 16px;

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .image-list {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;

          :deep(.el-image) {
            width: 120px;
            height: 80px;
            border-radius: 4px;
          }
        }
      }
    }
  }

  .deposit-content {
    .deposit-info {
      margin-bottom: 20px;

      .info-row {
        margin-bottom: 8px;
        font-size: 14px;

        .label {
          color: #666;
          display: inline-block;
          width: 100px;
        }

        .price {
          color: #ff4d4f;
          font-weight: 600;
        }

        .deposit-paid {
          color: #52c41a;
          font-weight: 600;
        }
      }
    }
  }
}
</style>
