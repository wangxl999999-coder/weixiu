<template>
  <div class="category-list">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>服务分类列表</span>
          <el-button type="primary" size="small" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增分类
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="图标" width="100" align="center">
          <template #default="{ row }">
            <div v-if="row.icon" class="icon-wrapper">
              <el-image :src="row.icon" fit="contain" />
            </div>
            <el-tag v-else size="small">无</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="分类名称" min-width="140" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="service_count" label="服务数量" width="100" align="center" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
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
    </el-card>

    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="500px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类图标" prop="icon">
          <el-upload
            class="icon-uploader"
            :action="uploadUrl"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :headers="uploadHeaders"
          >
            <img v-if="form.icon" :src="form.icon" class="icon-image" />
            <el-icon v-else class="icon-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸：64x64px</div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="form.sort"
            :min="0"
            :max="999"
            style="width: 100%"
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
import { Plus } from '@element-plus/icons-vue'
import { api } from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const showDialog = ref(false)
const isEdit = ref(false)
const formRef = ref()

const uploadUrl = import.meta.env.VITE_UPLOAD_URL || '/api/upload'
const uploadHeaders = {
  Authorization: 'Bearer ' + localStorage.getItem('admin_token')
}

const form = reactive({
  id: '',
  name: '',
  icon: '',
  description: '',
  sort: 0,
  status: 1
})

const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  sort: [{ required: true, message: '请输入排序', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.service.getCategoryList({ page: 1, pageSize: 100 })
    tableData.value = res.data.list || res.data || []
  } catch (err) {
    console.error('加载分类列表失败:', err)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: '',
    name: '',
    icon: '',
    description: '',
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

const handleUploadSuccess = (response) => {
  if (response.code === 0 || response.code === 200) {
    form.icon = response.data.url || response.data
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleSubmit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (isEdit.value) {
      await api.service.updateCategory(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await api.service.createCategory(form)
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
  ElMessageBox.confirm(`确定要${action}分类"${row.name}"吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await api.service.updateCategory(row.id, { status })
      ElMessage.success(`${action}成功`)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

const handleDelete = async (row) => {
  ElMessageBox.confirm(`确定要删除分类"${row.name}"吗？删除后该分类下的服务将无法正常显示。`, '删除提示', {
    type: 'danger',
    confirmButtonText: '确定删除',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      await api.service.deleteCategory(row.id)
      ElMessage.success('删除成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.category-list {
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .icon-wrapper {
      width: 40px;
      height: 40px;
      margin: 0 auto;

      :deep(.el-image) {
        width: 100%;
        height: 100%;
      }
    }
  }

  .icon-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: #409eff;
      }
    }

    .icon-uploader-icon {
      font-size: 28px;
      color: #8c939d;
    }

    .icon-image {
      width: 80px;
      height: 80px;
      object-fit: contain;
      display: block;
    }

    .upload-tip {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }
  }
}
</style>
