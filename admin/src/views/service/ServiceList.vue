<template>
  <div class="service-list">
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="服务名称">
          <el-input
            v-model="filterForm.keyword"
            placeholder="请输入服务名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="所属分类">
          <el-select
            v-model="filterForm.category_id"
            placeholder="全部"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="启用" :value="1" />
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
        <div class="card-header">
          <span>服务列表</span>
          <el-button type="primary" size="small" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增服务
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column label="服务图片" width="100" align="center">
          <template #default="{ row }">
            <div v-if="row.image" class="image-wrapper">
              <el-image :src="row.image" fit="cover" :preview-src-list="[row.image]" />
            </div>
            <el-tag v-else size="small">无</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="服务名称" min-width="140" />
        <el-table-column prop="category_name" label="所属分类" width="120" />
        <el-table-column label="价格" width="120" align="right">
          <template #default="{ row }">
            <div v-if="row.price_type === 1">
              <span class="price">¥{{ row.price }}</span>
              <span class="unit">/{{ row.unit || '次' }}</span>
            </div>
            <div v-else>
              <span class="price">¥{{ row.min_price }}-{{ row.max_price }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时长" width="100" align="center">
          <template #default="{ row }">
            {{ row.duration || '-' }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="sales_count" label="销量" width="80" align="center" />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleEdit(row)">编辑</el-button>
            <el-button
              :type="row.status === 1 ? 'warning' : 'success'"
              size="small"
              link
              @click="toggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
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
      :title="isEdit ? '编辑服务' : '新增服务'"
      width="700px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="服务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入服务名称" />
        </el-form-item>
        <el-form-item label="所属分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="服务图片" prop="image">
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
          <div class="upload-tip">建议尺寸：800x600px</div>
        </el-form-item>
        <el-form-item label="价格类型" prop="price_type">
          <el-radio-group v-model="form.price_type">
            <el-radio :value="1">固定价格</el-radio>
            <el-radio :value="2">区间价格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.price_type === 1" label="价格" prop="price">
          <el-input-number
            v-model="form.price"
            :min="0"
            :precision="2"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item v-if="form.price_type === 2" label="最低价格" prop="min_price">
          <el-input-number
            v-model="form.min_price"
            :min="0"
            :precision="2"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item v-if="form.price_type === 2" label="最高价格" prop="max_price">
          <el-input-number
            v-model="form.max_price"
            :min="0"
            :precision="2"
            style="width: 200px"
          />
          <span class="unit">元</span>
        </el-form-item>
        <el-form-item label="计价单位" prop="unit">
          <el-input v-model="form.unit" placeholder="如：次、小时、平方米" style="width: 200px" />
        </el-form-item>
        <el-form-item label="服务时长" prop="duration">
          <el-input-number
            v-model="form.duration"
            :min="0"
            style="width: 200px"
          />
          <span class="unit">分钟</span>
        </el-form-item>
        <el-form-item label="服务描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入服务描述"
          />
        </el-form-item>
        <el-form-item label="服务内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="4"
            placeholder="请输入详细服务内容"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="form.sort"
            :min="0"
            :max="999"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
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
const categories = ref([])
const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()

const uploadUrl = import.meta.env.VITE_UPLOAD_URL || '/api/upload'
const uploadHeaders = {
  Authorization: 'Bearer ' + localStorage.getItem('admin_token')
}

const filterForm = reactive({
  keyword: '',
  category_id: '',
  status: ''
})

const form = reactive({
  id: '',
  name: '',
  category_id: '',
  image: '',
  price_type: 1,
  price: 0,
  min_price: 0,
  max_price: 0,
  unit: '次',
  duration: 60,
  description: '',
  content: '',
  sort: 0,
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入服务名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price_type: [{ required: true, message: '请选择价格类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
  min_price: [{ required: true, message: '请输入最低价格', trigger: 'blur' }],
  max_price: [{ required: true, message: '请输入最高价格', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filterForm
    }
    const res = await api.service.getServiceList(params)
    tableData.value = res.data.list || res.data || []
    total.value = res.data.total || 0
  } catch (err) {
    console.error('加载服务列表失败:', err)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await api.service.getCategoryList({ page: 1, pageSize: 100, status: 1 })
    categories.value = res.data.list || res.data || []
  } catch (err) {
    console.error('加载分类列表失败:', err)
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.category_id = ''
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
    category_id: '',
    image: '',
    price_type: 1,
    price: 0,
    min_price: 0,
    max_price: 0,
    unit: '次',
    duration: 60,
    description: '',
    content: '',
    sort: 0,
    status: 1
  })
  showDialog.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  showDialog.value = true
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
    if (isEdit.value) {
      await api.service.updateService(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await api.service.createService(form)
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

const toggleStatus = async (row) => {
  const status = row.status === 1 ? 0 : 1
  const action = status === 1 ? '启用' : '禁用'
  ElMessageBox.confirm(`确定要${action}服务"${row.name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.service.updateService(row.id, { status })
      ElMessage.success(`${action}成功`)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

const handleDelete = async (row) => {
  ElMessageBox.confirm(`确定要删除服务"${row.name}"吗？`, '删除提示', {
    type: 'danger'
  }).then(async () => {
    try {
      await api.service.deleteService(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadCategories()
  loadData()
})
</script>

<style lang="scss" scoped>
.service-list {
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
      width: 60px;
      height: 60px;
      margin: 0 auto;
      border-radius: 4px;
      overflow: hidden;

      :deep(.el-image) {
        width: 100%;
        height: 100%;
      }
    }

    .price {
      color: #ff4d4f;
      font-weight: 600;
    }

    .unit {
      color: #999;
      font-size: 12px;
      margin-left: 4px;
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
      height: 150px;
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
      height: 150px;
      object-fit: cover;
      display: block;
    }

    .upload-tip {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  }

  .unit {
    color: #666;
    margin-left: 8px;
  }
}
</style>
