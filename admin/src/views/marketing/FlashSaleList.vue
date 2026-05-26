<template>
  <div class="flash-sale-list">
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="活动名称">
          <el-input
            v-model="filterForm.name"
            placeholder="请输入名称"
            clearable
            style="width: 200px"
          />
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
          <span>秒杀活动列表</span>
          <el-button type="primary" size="small" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增活动
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column label="活动封面" width="120" align="center">
          <template #default="{ row }">
            <div v-if="row.image" class="image-wrapper">
              <el-image :src="row.image" fit="cover" :preview-src-list="[row.image]" />
            </div>
            <el-tag v-else size="small">无</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="活动名称" min-width="160" />
        <el-table-column label="服务信息" min-width="160">
          <template #default="{ row }">
            <div>{{ row.service_name }}</div>
            <div class="original-price">原价：¥{{ row.original_price }}</div>
          </template>
        </el-table-column>
        <el-table-column label="秒杀价" width="100" align="right">
          <template #default="{ row }">
            <span class="sale-price">¥{{ row.sale_price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" align="center" />
        <el-table-column prop="sold_count" label="已售" width="80" align="center" />
        <el-table-column label="活动时间" width="280">
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
      :title="isEdit ? '编辑秒杀活动' : '新增秒杀活动'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动封面" prop="image">
          <el-upload
            class="image-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :on-success="handleImageUpload"
            :headers="uploadHeaders"
          >
            <img v-if="form.image" :src="form.image" class="upload-image" />
            <el-icon v-else class="image-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸：750x400px</div>
        </el-form-item>
        <el-form-item label="选择服务" prop="service_id">
          <el-select
            v-model="form.service_id"
            placeholder="请选择服务"
            filterable
            style="width: 100%"
            @change="handleServiceChange"
          >
            <el-option
              v-for="service in services"
              :key="service.id"
              :label="service.name"
              :value="service.id"
            >
              <span>{{ service.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">
                ¥{{ service.price }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="原价">
          <span class="original-price-show">¥{{ form.original_price }}</span>
        </el-form-item>
        <el-form-item label="秒杀价" prop="sale_price">
          <el-input-number
            v-model="form.sale_price"
            :min="0"
            :max="form.original_price"
            :precision="2"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="活动库存" prop="stock">
          <el-input-number
            v-model="form.stock"
            :min="1"
            :precision="0"
            style="width: 200px"
          />
          <span class="unit">份</span>
        </el-form-item>
        <el-form-item label="每人限购" prop="per_user_limit">
          <el-input-number
            v-model="form.per_user_limit"
            :min="1"
            :precision="0"
            style="width: 200px"
          />
          <span class="unit">份</span>
        </el-form-item>
        <el-form-item label="活动时间" prop="time_range">
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
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入活动描述"
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { api } from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref([])
const services = ref([])
const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()

const uploadUrl = import.meta.env.VITE_UPLOAD_URL || '/api/upload'
const uploadHeaders = {
  Authorization: 'Bearer ' + localStorage.getItem('admin_token')
}

const filterForm = reactive({
  name: '',
  status: ''
})

const form = reactive({
  id: '',
  name: '',
  image: '',
  service_id: '',
  service_name: '',
  original_price: 0,
  sale_price: 0,
  stock: 10,
  per_user_limit: 1,
  time_range: [],
  description: ''
})

const rules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  service_id: [{ required: true, message: '请选择服务', trigger: 'change' }],
  sale_price: [{ required: true, message: '请输入秒杀价', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入活动库存', trigger: 'blur' }],
  per_user_limit: [{ required: true, message: '请输入每人限购数', trigger: 'blur' }],
  time_range: [{ required: true, message: '请选择活动时间', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filterForm
    }
    const res = await api.coupon.getFlashSaleList(params)
    tableData.value = res.data.list || res.data || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载秒杀活动列表失败:', err)
  } finally {
    loading.value = false
  }
}

const loadServices = async () => {
  try {
    const res = await api.service.getServiceList({ page: 1, pageSize: 100, status: 1 })
    services.value = res.data.list || res.data || []
  } catch (err) {
    console.error('加载服务列表失败:', err)
  }
}

const resetFilter = () => {
  filterForm.name = ''
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
    image: '',
    service_id: '',
    service_name: '',
    original_price: 0,
    sale_price: 0,
    stock: 10,
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

const handleServiceChange = (serviceId) => {
  const service = services.value.find(s => s.id === serviceId)
  if (service) {
    form.service_name = service.name
    form.original_price = service.price
    form.sale_price = service.price * 0.8
  }
}

const handleImageUpload = (response) => {
  if (response.code === 0 || response.code === 200) {
    form.image = response.data.url || response.data
  } else {
    ElMessage.error(response.message || '上传失败')
  }
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
    delete submitData.service_name
    delete submitData.original_price

    if (isEdit.value) {
      await api.coupon.updateFlashSale(form.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await api.coupon.createFlashSale(submitData)
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
  ElMessageBox.confirm(`确定要结束秒杀活动"${row.name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.coupon.updateFlashSale(row.id, { status: 2 })
      ElMessage.success('已结束')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

const handleDelete = async (row) => {
  ElMessageBox.confirm(`确定要删除秒杀活动"${row.name}"吗？`, '删除提示', {
    type: 'danger'
  }).then(async () => {
    try {
      await api.coupon.deleteFlashSale(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadServices()
  loadData()
})
</script>

<style lang="scss" scoped>
.flash-sale-list {
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

    .image-wrapper {
      width: 80px;
      height: 50px;
      margin: 0 auto;
      border-radius: 4px;
      overflow: hidden;

      :deep(.el-image) {
        width: 100%;
        height: 100%;
      }
    }

    .original-price {
      color: #999;
      font-size: 12px;
      text-decoration: line-through;
    }

    .sale-price {
      color: #ff4d4f;
      font-weight: 600;
      font-size: 16px;
    }

    .time-to {
      color: #999;
      font-size: 12px;
      margin: 2px 0;
    }
  }

  .image-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      width: 200px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: #409eff;
      }
    }

    .image-uploader-icon {
      font-size: 28px;
      color: #8c939d;
    }

    .upload-image {
      width: 200px;
      height: 100px;
      object-fit: cover;
      display: block;
    }

    .upload-tip {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  }

  .original-price-show {
    color: #999;
    text-decoration: line-through;
  }

  .unit {
    color: #666;
    margin-left: 8px;
  }
}
</style>
