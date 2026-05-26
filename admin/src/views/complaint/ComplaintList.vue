<template>
  <div class="complaint-list">
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="投诉类型">
          <el-select
            v-model="filterForm.type"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="师傅问题" :value="1" />
            <el-option label="服务质量" :value="2" />
            <el-option label="价格问题" :value="3" />
            <el-option label="其他" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="待处理" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="已完成" :value="2" />
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
        <span>投诉列表</span>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="投诉ID" width="100" />
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
        <el-table-column prop="order_no" label="关联订单" width="160" />
        <el-table-column label="投诉类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1" type="primary" size="small">师傅问题</el-tag>
            <el-tag v-else-if="row.type === 2" type="warning" size="small">服务质量</el-tag>
            <el-tag v-else-if="row.type === 3" type="danger" size="small">价格问题</el-tag>
            <el-tag v-else type="info" size="small">其他</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="投诉内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 2 ? 'success' : row.status === 1 ? 'primary' : 'warning'" size="small">
              {{ row.status === 2 ? '已完成' : row.status === 1 ? '处理中' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="紧急程度" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.priority === 2" type="danger" size="small">紧急</el-tag>
            <el-tag v-else-if="row.priority === 1" type="warning" size="small">一般</el-tag>
            <el-tag v-else type="info" size="small">低</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="投诉时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleView(row)">查看</el-button>
            <el-button
              v-if="row.status !== 2"
              type="success"
              size="small"
              link
              @click="handleProcess(row)"
            >
              处理
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
      v-model="showDetailDialog"
      title="投诉详情"
      width="600px"
    >
      <div v-if="currentComplaint" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="投诉ID">
            {{ currentComplaint.id }}
          </el-descriptions-item>
          <el-descriptions-item label="投诉时间">
            {{ currentComplaint.created_at }}
          </el-descriptions-item>
          <el-descriptions-item label="投诉用户">
            {{ currentComplaint.user_name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系方式">
            {{ currentComplaint.user_phone }}
          </el-descriptions-item>
          <el-descriptions-item label="关联订单">
            {{ currentComplaint.order_no }}
          </el-descriptions-item>
          <el-descriptions-item label="投诉类型">
            <el-tag v-if="currentComplaint.type === 1" type="primary" size="small">师傅问题</el-tag>
            <el-tag v-else-if="currentComplaint.type === 2" type="warning" size="small">服务质量</el-tag>
            <el-tag v-else-if="currentComplaint.type === 3" type="danger" size="small">价格问题</el-tag>
            <el-tag v-else type="info" size="small">其他</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="紧急程度">
            <el-tag v-if="currentComplaint.priority === 2" type="danger" size="small">紧急</el-tag>
            <el-tag v-else-if="currentComplaint.priority === 1" type="warning" size="small">一般</el-tag>
            <el-tag v-else type="info" size="small">低</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentComplaint.status === 2 ? 'success' : currentComplaint.status === 1 ? 'primary' : 'warning'" size="small">
              {{ currentComplaint.status === 2 ? '已完成' : currentComplaint.status === 1 ? '处理中' : '待处理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="投诉内容" :span="2">
            {{ currentComplaint.content }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentComplaint.images" class="evidence-section">
          <h4>证据图片</h4>
          <div class="image-list">
            <el-image
              v-for="(img, idx) in currentComplaint.images.split(',')"
              :key="idx"
              :src="img"
              :preview-src-list="currentComplaint.images.split(',')"
              fit="cover"
            />
          </div>
        </div>

        <div v-if="currentComplaint.handler" class="handle-section">
          <h4>处理记录</h4>
          <div class="handle-info">
            <div>处理人：{{ currentComplaint.handler }}</div>
            <div>处理时间：{{ currentComplaint.handle_time }}</div>
            <div>处理结果：{{ currentComplaint.handle_result }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button
          v-if="currentComplaint && currentComplaint.status !== 2"
          type="primary"
          @click="handleProcess(currentComplaint)"
        >
          立即处理
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showProcessDialog"
      title="处理投诉"
      width="500px"
    >
      <el-form :model="processForm" :rules="processRules" ref="processFormRef" label-width="80px">
        <el-form-item label="处理状态" prop="status">
          <el-radio-group v-model="processForm.status">
            <el-radio :value="1">处理中</el-radio>
            <el-radio :value="2">已完成</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理方式" prop="handle_type">
          <el-select v-model="processForm.handle_type" placeholder="请选择处理方式" style="width: 100%">
            <el-option label="电话沟通" :value="1" />
            <el-option label="退款补偿" :value="2" />
            <el-option label="重新服务" :value="3" />
            <el-option label="其他" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="退款金额" prop="refund_amount" v-if="processForm.handle_type === 2">
          <el-input-number
            v-model="processForm.refund_amount"
            :min="0"
            :precision="2"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="处理结果" prop="handle_result">
          <el-input
            v-model="processForm.handle_result"
            type="textarea"
            :rows="4"
            placeholder="请输入处理结果说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProcessDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmProcess">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { api } from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref([])
const currentComplaint = ref(null)
const showDetailDialog = ref(false)
const showProcessDialog = ref(false)
const processFormRef = ref()

const filterForm = reactive({
  type: '',
  status: ''
})

const processForm = reactive({
  id: '',
  status: 2,
  handle_type: 1,
  refund_amount: 0,
  handle_result: ''
})

const processRules = {
  status: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  handle_type: [{ required: true, message: '请选择处理方式', trigger: 'change' }],
  handle_result: [{ required: true, message: '请输入处理结果', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filterForm
    }
    const res = await api.complaint.getList(params)
    tableData.value = res.data.list || res.data || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载投诉列表失败:', err)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.type = ''
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

const handleView = async (row) => {
  try {
    const res = await api.complaint.getDetail(row.id)
    currentComplaint.value = res.data
    showDetailDialog.value = true
  } catch (err) {
    console.error(err)
  }
}

const handleProcess = (row) => {
  showDetailDialog.value = false
  processForm.id = row.id
  processForm.status = 2
  processForm.handle_type = 1
  processForm.refund_amount = 0
  processForm.handle_result = ''
  showProcessDialog.value = true
}

const confirmProcess = async () => {
  await processFormRef.value.validate()
  submitting.value = true
  try {
    await api.complaint.handle(processForm.id, processForm)
    ElMessage.success('处理成功')
    showProcessDialog.value = false
    loadData()
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.complaint-list {
  .filter-card {
    margin-bottom: 20px;
  }

  .table-card {
    .pagination {
      margin-top: 20px;
      text-align: right;
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
        margin-top: 2px;
      }
    }
  }

  .detail-content {
    .evidence-section {
      margin-top: 20px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 0 0 12px 0;
      }

      .image-list {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;

        :deep(.el-image) {
          width: 100px;
          height: 100px;
          border-radius: 4px;
        }
      }
    }

    .handle-section {
      margin-top: 20px;

      h4 {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin: 0 0 12px 0;
      }

      .handle-info {
        background-color: #f5f7fa;
        padding: 16px;
        border-radius: 4px;
        font-size: 14px;
        line-height: 2;
      }
    }
  }

  .unit {
    color: #666;
    margin-left: 8px;
  }
}
</style>
