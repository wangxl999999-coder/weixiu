<template>
  <div class="coupon-list">
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="优惠券名称">
          <el-input
            v-model="filterForm.name"
            placeholder="请输入名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="优惠券类型">
          <el-select
            v-model="filterForm.type"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option label="满减券" :value="1" />
            <el-option label="折扣券" :value="2" />
            <el-option label="代金券" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="未开始" :value="0" />
            <el-option label="进行中" :value="1" />
            <el-option label="已结束" :value="2" />
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
        <div class="card-header">
          <span>优惠券列表</span>
          <el-button type="primary" size="small" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增优惠券
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="name" label="优惠券名称" min-width="180" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 1" type="primary" size="small">满减券</el-tag>
            <el-tag v-else-if="row.type === 2" type="success" size="small">折扣券</el-tag>
            <el-tag v-else type="warning" size="small">代金券</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="面值" width="120">
          <template #default="{ row }">
            <template v-if="row.type === 1">
              满¥{{ row.min_amount }}减¥{{ row.value }}
            </template>
            <template v-else-if="row.type === 2">
              {{ row.value }}折
            </template>
            <template v-else>
              ¥{{ row.value }}
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="total_count" label="总量" width="80" align="center" />
        <el-table-column prop="used_count" label="已领取" width="80" align="center" />
        <el-table-column label="有效期" width="280">
          <template #default="{ row }">
            <div>{{ row.start_time }}</div>
            <div class="time-to">至</div>
            <div>{{ row.end_time }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'info' : 'warning'" size="small">
              {{ row.status === 1 ? '进行中' : row.status === 2 ? '已结束' : '未开始' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 1"
              type="danger"
              size="small"
              link
              @click="handleStop(row)"
            >
              结束
            </el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
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
      v-model="showDialog"
      :title="isEdit ? '编辑优惠券' : '新增优惠券'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="优惠券名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="优惠券类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :value="1">满减券</el-radio>
            <el-radio :value="2">折扣券</el-radio>
            <el-radio :value="3">代金券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.type !== 2" label="券面值" prop="value">
          <el-input-number
            v-model="form.value"
            :min="0"
            :precision="2"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item v-if="form.type === 2" label="折扣" prop="value">
          <el-input-number
            v-model="form.value"
            :min="0"
            :max="10"
            :precision="1"
            style="width: 200px"
          />
          <span class="unit">折</span>
        </el-form-item>
        <el-form-item v-if="form.type === 1" label="最低消费" prop="min_amount">
          <el-input-number
            v-model="form.min_amount"
            :min="0"
            :precision="2"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="发放总量" prop="total_count">
          <el-input-number
            v-model="form.total_count"
            :min="1"
            :precision="0"
            style="width: 200px"
          />
          <span class="unit">张</span>
        </el-form-item>
        <el-form-item label="每人限领" prop="per_user_limit">
          <el-input-number
            v-model="form.per_user_limit"
            :min="1"
            :precision="0"
            style="width: 200px"
          />
          <span class="unit">张</span>
        </el-form-item>
        <el-form-item label="有效期" prop="time_range">
          <el-date-picker
            v-model="form.time_range"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="使用说明" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入使用说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { api } from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref([])
const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()

const filterForm = reactive({
  name: '',
  type: '',
  status: ''
})

const form = reactive({
  id: '',
  name: '',
  type: 1,
  value: 0,
  min_amount: 0,
  total_count: 100,
  per_user_limit: 1,
  time_range: [],
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
  value: [{ required: true, message: '请输入面值', trigger: 'blur' }],
  total_count: [{ required: true, message: '请输入发放总量', trigger: 'blur' }],
  per_user_limit: [{ required: true, message: '请输入每人限领数', trigger: 'blur' }],
  time_range: [{ required: true, message: '请选择有效期', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filterForm
    }
    const res = await api.coupon.getList(params)
    tableData.value = res.data.list || res.data || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载优惠券列表失败:', err)
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.name = ''
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

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: '',
    name: '',
    type: 1,
    value: 0,
    min_amount: 0,
    total_count: 100,
    per_user_limit: 1,
    time_range: [],
    description: ''
  })
  showDialog.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  form.time_range = [row.start_time, row.end_time]
  showDialog.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    const submitData = {
      ...form,
      start_time: form.time_range[0],
      end_time: form.time_range[1]
    }
    delete submitData.time_range

    if (isEdit.value) {
      await api.coupon.update(form.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await api.coupon.create(submitData)
      ElMessage.success('新增成功')
    }
    showDialog.value = false
    loadData()
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
  }
}

const handleStop = async (row) => {
  ElMessageBox.confirm(`确定要结束优惠券"${row.name}"吗？结束后用户将无法领取。`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.coupon.update(row.id, { status: 2 })
      ElMessage.success('已结束')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

const handleDelete = async (row) => {
  ElMessageBox.confirm(`确定要删除优惠券"${row.name}"吗？`, '删除提示', {
    type: 'danger'
  }).then(async () => {
    try {
      await api.coupon.delete(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

watch(() => form.type, (newType) => {
  if (newType === 2) {
    form.value = 9
  } else if (newType === 3) {
    form.min_amount = 0
  }
})

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.coupon-list {
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

    .time-to {
      color: #999;
      font-size: 12px;
      margin: 2px 0;
    }
  }

  .unit {
    color: #666;
    margin-left: 8px;
  }
}
</style>
