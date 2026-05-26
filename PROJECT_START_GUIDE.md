# 家政维修小程序 - 项目启动指南

## 项目概述

这是一个三端分离的家政维修微信小程序系统，包含：
- **用户端小程序**：用于客户下单、支付、评价等
- **师傅端小程序**：用于师傅接单、服务、提现等
- **管理后台**：用于平台管理、数据统计等
- **后端服务**：Node.js + Express + MySQL 提供API服务

## 目录结构

```
weixiu/
├── client-user/          # 用户端小程序
├── client-worker/        # 师傅端小程序
├── admin/                # 管理后台（Vue3 + Element Plus）
├── server/               # 后端服务（Node.js + Express）
├── database/             # 数据库脚本
└── PROJECT_START_GUIDE.md
```

## 环境要求

- Node.js >= 14.x
- MySQL >= 5.7
- 微信开发者工具
- 微信小程序账号

## 快速启动

### 1. 数据库初始化

1. 创建数据库：
```sql
CREATE DATABASE home_repair DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 执行初始化脚本：
```bash
mysql -u root -p home_repair < database/init.sql
```

### 2. 后端服务启动

1. 进入后端目录：
```bash
cd server
```

2. 安装依赖：
```bash
npm install
```

3. 配置环境变量：
复制 `.env.example` 为 `.env` 并修改配置：
```env
# 服务器配置
SERVER_PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=home_repair
DB_USER=root
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 微信配置
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
WECHAT_MCH_ID=your_mch_id
WECHAT_API_KEY=your_api_key
```

4. 启动服务：
```bash
npm run dev
```

服务启动后访问：http://localhost:3000

### 3. 管理后台启动

1. 进入后台目录：
```bash
cd admin
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务：
```bash
npm run dev
```

4. 访问后台：
打开浏览器访问 http://localhost:5173

默认管理员账号：
- 用户名：admin
- 密码：admin123

### 4. 小程序端启动

#### 用户端小程序

1. 打开微信开发者工具
2. 导入项目：选择 `client-user` 目录
3. 配置 AppID
4. 修改 `utils/config.js` 中的 API 地址

#### 师傅端小程序

1. 打开微信开发者工具
2. 导入项目：选择 `client-worker` 目录
3. 配置 AppID
4. 修改 `utils/config.js` 中的 API 地址

## 功能模块

### 用户端功能
- ✅ 首页服务展示
- ✅ 服务分类浏览
- ✅ 关键词搜索
- ✅ 限时秒杀
- ✅ 优惠券中心
- ✅ LBS定位推荐附近师傅
- ✅ 预约下单
- ✅ 微信支付
- ✅ 订单状态跟踪
- ✅ 服务存证照片
- ✅ 地址管理
- ✅ 服务评价
- ✅ 投诉功能

### 师傅端功能
- ✅ 手机号注册登录
- ✅ 身份证和技能证书上传
- ✅ 服务区域设置
- ✅ 接单时间段设置
- ✅ 任务大厅抢单
- ✅ 订单状态管理
- ✅ 导航到用户地址
- ✅ 增项报价
- ✅ 服务凭证拍照
- ✅ 钱包管理
- ✅ 提现到微信零钱
- ✅ 收入统计

### 管理后台功能
- ✅ 数据看板
- ✅ 订单管理（派单、改派、退款）
- ✅ 师傅审核
- ✅ 师傅保证金管理
- ✅ 提现审核
- ✅ 服务分类管理
- ✅ 服务项目管理
- ✅ 优惠券管理
- ✅ 秒杀活动管理
- ✅ 投诉处理
- ✅ 管理员管理
- ✅ 系统配置

## 数据库表说明

| 表名 | 说明 |
|------|------|
| users | 用户表 |
| workers | 师傅表 |
| worker_certificates | 师傅证书表 |
| service_categories | 服务分类表 |
| services | 服务项目表 |
| worker_services | 师傅服务关联表 |
| user_addresses | 用户地址表 |
| orders | 订单表 |
| order_extras | 订单增项表 |
| order_photos | 订单照片表 |
| payments | 支付记录表 |
| coupons | 优惠券模板表 |
| user_coupons | 用户优惠券表 |
| flash_sales | 秒杀活动表 |
| evaluations | 评价表 |
| complaints | 投诉表 |
| worker_wallets | 师傅钱包表 |
| withdrawals | 提现记录表 |
| financial_records | 财务流水表 |
| admins | 管理员表 |
| system_configs | 系统配置表 |
| operation_logs | 操作日志表 |
| notifications | 通知消息表 |

## API接口说明

后端API统一前缀：`/api`

### 用户端接口
- `POST /api/user/wechat-login` - 微信登录
- `GET /api/user/profile` - 获取用户信息
- `GET /api/home/services` - 首页服务列表
- `GET /api/home/flash-sales` - 秒杀活动
- `POST /api/order/create` - 创建订单
- `POST /api/payment/pay` - 发起支付
- 等等...

### 师傅端接口
- `POST /api/worker/login` - 师傅登录
- `POST /api/worker/register` - 师傅注册
- `GET /api/worker/order-hall` - 订单大厅
- `POST /api/worker/accept-order` - 接单
- `POST /api/worker/upload-photo` - 上传服务照片
- 等等...

### 管理后台接口
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/orders` - 订单列表
- `POST /api/admin/audit-worker` - 审核师傅
- `POST /api/admin/audit-withdraw` - 审核提现
- 等等...

## 开发注意事项

1. **小程序开发**：需要配置微信小程序的合法域名
2. **微信支付**：需要配置商户号和支付证书
3. **地理位置**：需要在小程序后台申请位置权限
4. **文件上传**：确保服务器有上传目录的写入权限
5. **JWT Token**：前后端统一使用 Bearer Token 认证

## 常见问题

### 1. 数据库连接失败
- 检查MySQL服务是否启动
- 检查.env中的数据库配置是否正确
- 确认数据库用户有足够权限

### 2. 小程序请求失败
- 检查后端服务是否启动
- 确认API地址配置正确
- 开发环境下可勾选"不校验合法域名"

### 3. 管理后台登录失败
- 检查admins表中是否有管理员数据
- 默认密码是通过bcrypt加密的admin123

## 技术栈

**后端**：
- Node.js
- Express
- Sequelize (ORM)
- MySQL
- JWT (认证)
- Multer (文件上传)

**小程序**：
- 微信原生小程序
- WXML/WXSS/JavaScript

**管理后台**：
- Vue 3
- Vite
- Element Plus
- Pinia
- Vue Router

## 联系方式

如有问题，请联系开发团队。
