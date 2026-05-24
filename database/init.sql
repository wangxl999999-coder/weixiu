-- 家政维修小程序数据库初始化脚本
-- 数据库: home_repair
-- 版本: 1.0

CREATE DATABASE IF NOT EXISTS `home_repair` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `home_repair`;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `openid` VARCHAR(64) NOT NULL COMMENT '微信openid',
  `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
  `nickname` VARCHAR(64) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `gender` TINYINT DEFAULT 0 COMMENT '性别:0未知1男2女',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0禁用1正常',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_openid` (`openid`),
  KEY `idx_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 师傅表
CREATE TABLE IF NOT EXISTS `workers` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `password` VARCHAR(128) DEFAULT NULL COMMENT '密码',
  `name` VARCHAR(32) DEFAULT NULL COMMENT '真实姓名',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
  `id_card` VARCHAR(18) DEFAULT NULL COMMENT '身份证号',
  `id_card_front` VARCHAR(255) DEFAULT NULL COMMENT '身份证正面照',
  `id_card_back` VARCHAR(255) DEFAULT NULL COMMENT '身份证反面照',
  `gender` TINYINT DEFAULT 0 COMMENT '性别:0未知1男2女',
  `age` INT DEFAULT NULL COMMENT '年龄',
  `work_years` INT DEFAULT 0 COMMENT '工作年限',
  `rating` DECIMAL(3,2) DEFAULT 5.00 COMMENT '评分',
  `order_count` INT DEFAULT 0 COMMENT '完成订单数',
  `service_area` JSON DEFAULT NULL COMMENT '服务区域',
  `work_time` JSON DEFAULT NULL COMMENT '可接单时间段',
  `latitude` DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
  `address` VARCHAR(255) DEFAULT NULL COMMENT '详细地址',
  `deposit` DECIMAL(10,2) DEFAULT 0.00 COMMENT '保证金',
  `audit_status` TINYINT DEFAULT 0 COMMENT '审核状态:0待审核1审核通过2审核拒绝',
  `audit_remark` VARCHAR(255) DEFAULT NULL COMMENT '审核备注',
  `audit_time` TIMESTAMP NULL COMMENT '审核时间',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0禁用1正常2休息中',
  `is_accept_order` TINYINT DEFAULT 1 COMMENT '是否接单:0否1是',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_phone` (`phone`),
  KEY `idx_id_card` (`id_card`),
  KEY `idx_audit_status` (`audit_status`),
  KEY `idx_location` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='师傅表';

-- 3. 师傅技能证书表
CREATE TABLE IF NOT EXISTS `worker_certificates` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `worker_id` BIGINT UNSIGNED NOT NULL COMMENT '师傅ID',
  `certificate_type` VARCHAR(64) NOT NULL COMMENT '证书类型',
  `certificate_name` VARCHAR(128) NOT NULL COMMENT '证书名称',
  `certificate_no` VARCHAR(64) DEFAULT NULL COMMENT '证书编号',
  `certificate_image` VARCHAR(255) NOT NULL COMMENT '证书照片',
  `issued_date` DATE DEFAULT NULL COMMENT '发证日期',
  `expiry_date` DATE DEFAULT NULL COMMENT '到期日期',
  `audit_status` TINYINT DEFAULT 0 COMMENT '审核状态:0待审核1通过2拒绝',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_worker_id` (`worker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='师傅技能证书表';

-- 4. 服务分类表
CREATE TABLE IF NOT EXISTS `service_categories` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(32) NOT NULL COMMENT '分类名称',
  `parent_id` BIGINT UNSIGNED DEFAULT 0 COMMENT '父级ID',
  `icon` VARCHAR(255) DEFAULT NULL COMMENT '图标',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0禁用1启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务分类表';

-- 5. 服务项目表
CREATE TABLE IF NOT EXISTS `services` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` BIGINT UNSIGNED NOT NULL COMMENT '分类ID',
  `name` VARCHAR(64) NOT NULL COMMENT '服务名称',
  `description` TEXT COMMENT '服务描述',
  `icon` VARCHAR(255) DEFAULT NULL COMMENT '图标',
  `banner` VARCHAR(255) DEFAULT NULL COMMENT 'Banner图',
  `base_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '基础价格',
  `unit` VARCHAR(16) DEFAULT '次' COMMENT '计价单位',
  `service_time` INT DEFAULT 60 COMMENT '服务时长(分钟)',
  `content` TEXT COMMENT '服务内容详情',
  `notice` TEXT COMMENT '服务须知',
  `images` JSON DEFAULT NULL COMMENT '服务图片',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `sales_count` INT DEFAULT 0 COMMENT '销量',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0下架1上架',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_category_id` (`category_id`),
  KEY `idx_sort` (`sort`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='服务项目表';

-- 6. 师傅服务关联表
CREATE TABLE IF NOT EXISTS `worker_services` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `worker_id` BIGINT UNSIGNED NOT NULL COMMENT '师傅ID',
  `service_id` BIGINT UNSIGNED NOT NULL COMMENT '服务ID',
  `custom_price` DECIMAL(10,2) DEFAULT NULL COMMENT '自定义价格',
  `is_enabled` TINYINT DEFAULT 1 COMMENT '是否启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_worker_service` (`worker_id`, `service_id`),
  KEY `idx_worker_id` (`worker_id`),
  KEY `idx_service_id` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='师傅服务关联表';

-- 7. 用户地址表
CREATE TABLE IF NOT EXISTS `user_addresses` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `name` VARCHAR(32) NOT NULL COMMENT '联系人姓名',
  `phone` VARCHAR(20) NOT NULL COMMENT '联系电话',
  `province` VARCHAR(32) NOT NULL COMMENT '省份',
  `city` VARCHAR(32) NOT NULL COMMENT '城市',
  `district` VARCHAR(32) NOT NULL COMMENT '区县',
  `address` VARCHAR(255) NOT NULL COMMENT '详细地址',
  `house_number` VARCHAR(64) DEFAULT NULL COMMENT '门牌号',
  `latitude` DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
  `is_default` TINYINT DEFAULT 0 COMMENT '是否默认:0否1是',
  `tag` VARCHAR(16) DEFAULT NULL COMMENT '标签:家/公司/学校',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_user_id` (`user_id`),
  KEY `idx_default` (`user_id`, `is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户地址表';

-- 8. 订单表
CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `worker_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '师傅ID',
  `service_id` BIGINT UNSIGNED NOT NULL COMMENT '服务ID',
  `service_name` VARCHAR(64) NOT NULL COMMENT '服务名称',
  `service_image` VARCHAR(255) DEFAULT NULL COMMENT '服务图片',
  `category_id` BIGINT UNSIGNED NOT NULL COMMENT '分类ID',
  `address_id` BIGINT UNSIGNED NOT NULL COMMENT '地址ID',
  `address_info` JSON NOT NULL COMMENT '地址信息快照',
  `appointment_time` DATETIME NOT NULL COMMENT '预约时间',
  `quantity` INT DEFAULT 1 COMMENT '数量',
  `base_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '基础价格',
  `extra_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '增项价格',
  `discount_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '优惠金额',
  `coupon_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '优惠券ID',
  `total_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '订单总价',
  `pay_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '实付金额',
  `worker_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '师傅收入',
  `platform_fee` DECIMAL(10,2) DEFAULT 0.00 COMMENT '平台抽成',
  `platform_fee_rate` DECIMAL(5,2) DEFAULT 10.00 COMMENT '平台抽成比例%',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '用户备注',
  `status` TINYINT DEFAULT 0 COMMENT '订单状态:0待接单1待上门2服务中3待确认4已完成5已取消6已退款',
  `pay_status` TINYINT DEFAULT 0 COMMENT '支付状态:0未支付1已支付2已退款',
  `pay_time` TIMESTAMP NULL COMMENT '支付时间',
  `accept_time` TIMESTAMP NULL COMMENT '接单时间',
  `arrive_time` TIMESTAMP NULL COMMENT '到达时间',
  `start_time` TIMESTAMP NULL COMMENT '开始服务时间',
  `finish_time` TIMESTAMP NULL COMMENT '完成时间',
  `confirm_time` TIMESTAMP NULL COMMENT '确认时间',
  `cancel_time` TIMESTAMP NULL COMMENT '取消时间',
  `cancel_reason` VARCHAR(255) DEFAULT NULL COMMENT '取消原因',
  `dispatch_type` TINYINT DEFAULT 0 COMMENT '派单类型:0抢单1派单',
  `dispatch_admin_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '派单管理员ID',
  `is_extra` TINYINT DEFAULT 0 COMMENT '是否有增项:0否1是',
  `is_evaluated` TINYINT DEFAULT 0 COMMENT '是否已评价:0否1是',
  `is_complained` TINYINT DEFAULT 0 COMMENT '是否已投诉:0否1是',
  `refund_status` TINYINT DEFAULT 0 COMMENT '退款状态:0无1申请中2已退款3已拒绝',
  `refund_reason` VARCHAR(500) DEFAULT NULL COMMENT '退款原因',
  `refund_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '退款金额',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_worker_id` (`worker_id`),
  KEY `idx_status` (`status`),
  KEY `idx_pay_status` (`pay_status`),
  KEY `idx_appointment_time` (`appointment_time`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- 9. 订单增项表
CREATE TABLE IF NOT EXISTS `order_extras` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `worker_id` BIGINT UNSIGNED NOT NULL COMMENT '师傅ID',
  `name` VARCHAR(64) NOT NULL COMMENT '增项名称',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '增项描述',
  `price` DECIMAL(10,2) NOT NULL COMMENT '增项价格',
  `quantity` INT DEFAULT 1 COMMENT '数量',
  `images` JSON DEFAULT NULL COMMENT '增项照片',
  `user_confirm` TINYINT DEFAULT 0 COMMENT '用户确认:0待确认1已确认2已拒绝',
  `confirm_time` TIMESTAMP NULL COMMENT '确认时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_order_id` (`order_id`),
  KEY `idx_worker_id` (`worker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单增项表';

-- 10. 订单凭证照片表
CREATE TABLE IF NOT EXISTS `order_photos` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `type` TINYINT NOT NULL COMMENT '照片类型:1服务前2服务中3服务后',
  `image_url` VARCHAR(255) NOT NULL COMMENT '照片地址',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '照片描述',
  `uploader_id` BIGINT UNSIGNED NOT NULL COMMENT '上传人ID',
  `uploader_type` TINYINT NOT NULL COMMENT '上传人类型:1用户2师傅',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_order_id` (`order_id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单凭证照片表';

-- 11. 支付记录表
CREATE TABLE IF NOT EXISTS `payments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `payment_no` VARCHAR(32) NOT NULL COMMENT '支付单号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '支付金额',
  `payment_type` TINYINT DEFAULT 1 COMMENT '支付方式:1微信支付',
  `payment_scene` TINYINT DEFAULT 1 COMMENT '支付场景:1下单支付2增项支付',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0待支付1支付成功2支付失败3已退款',
  `transaction_id` VARCHAR(64) DEFAULT NULL COMMENT '微信支付单号',
  `prepay_id` VARCHAR(64) DEFAULT NULL COMMENT '预支付ID',
  `paid_time` TIMESTAMP NULL COMMENT '支付完成时间',
  `refund_transaction_id` VARCHAR(64) DEFAULT NULL COMMENT '退款单号',
  `refund_time` TIMESTAMP NULL COMMENT '退款时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_payment_no` (`payment_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';

-- 12. 优惠券模板表
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL COMMENT '优惠券名称',
  `type` TINYINT DEFAULT 1 COMMENT '类型:1满减券2折扣券3立减券',
  `value` DECIMAL(10,2) NOT NULL COMMENT '面值/折扣值',
  `min_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '最低使用金额',
  `discount_limit` DECIMAL(10,2) DEFAULT NULL COMMENT '折扣券最高优惠金额',
  `total_count` INT DEFAULT 0 COMMENT '发放总量,0表示不限',
  `received_count` INT DEFAULT 0 COMMENT '已领取数量',
  `used_count` INT DEFAULT 0 COMMENT '已使用数量',
  `valid_type` TINYINT DEFAULT 1 COMMENT '有效期类型:1固定日期2领取后N天',
  `valid_start_date` DATE DEFAULT NULL COMMENT '有效期开始日期',
  `valid_end_date` DATE DEFAULT NULL COMMENT '有效期结束日期',
  `valid_days` INT DEFAULT NULL COMMENT '领取后有效天数',
  `use_scope` TINYINT DEFAULT 1 COMMENT '使用范围:1全场通用2指定分类3指定服务',
  `scope_ids` JSON DEFAULT NULL COMMENT '适用范围ID集合',
  `is_new_user` TINYINT DEFAULT 0 COMMENT '是否新用户专享:0否1是',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '使用说明',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0禁用1启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_status` (`status`),
  KEY `idx_valid_date` (`valid_start_date`, `valid_end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠券模板表';

-- 13. 用户优惠券表
CREATE TABLE IF NOT EXISTS `user_coupons` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `coupon_id` BIGINT UNSIGNED NOT NULL COMMENT '优惠券ID',
  `name` VARCHAR(64) NOT NULL COMMENT '优惠券名称快照',
  `type` TINYINT NOT NULL COMMENT '类型:1满减2折扣3立减',
  `value` DECIMAL(10,2) NOT NULL COMMENT '面值',
  `min_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '最低使用金额',
  `valid_start_date` DATE NOT NULL COMMENT '有效期开始',
  `valid_end_date` DATE NOT NULL COMMENT '有效期结束',
  `order_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '使用的订单ID',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0未使用1已使用2已过期3已作废',
  `used_time` TIMESTAMP NULL COMMENT '使用时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_user_id` (`user_id`),
  KEY `idx_coupon_id` (`coupon_id`),
  KEY `idx_status` (`status`),
  KEY `idx_valid_end` (`valid_end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户优惠券表';

-- 14. 秒杀活动表
CREATE TABLE IF NOT EXISTS `flash_sales` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL COMMENT '活动名称',
  `service_id` BIGINT UNSIGNED NOT NULL COMMENT '服务ID',
  `service_name` VARCHAR(64) NOT NULL COMMENT '服务名称',
  `service_image` VARCHAR(255) DEFAULT NULL COMMENT '服务图片',
  `original_price` DECIMAL(10,2) NOT NULL COMMENT '原价',
  `flash_price` DECIMAL(10,2) NOT NULL COMMENT '秒杀价',
  `total_count` INT NOT NULL COMMENT '秒杀总量',
  `sold_count` INT DEFAULT 0 COMMENT '已售数量',
  `limit_per_user` INT DEFAULT 1 COMMENT '每人限购数量',
  `start_time` DATETIME NOT NULL COMMENT '开始时间',
  `end_time` DATETIME NOT NULL COMMENT '结束时间',
  `sort` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0关闭1开启',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_service_id` (`service_id`),
  KEY `idx_time` (`start_time`, `end_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='秒杀活动表';

-- 15. 评价表
CREATE TABLE IF NOT EXISTS `evaluations` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `worker_id` BIGINT UNSIGNED NOT NULL COMMENT '师傅ID',
  `service_id` BIGINT UNSIGNED NOT NULL COMMENT '服务ID',
  `rating` TINYINT NOT NULL COMMENT '评分:1-5星',
  `content` VARCHAR(500) DEFAULT NULL COMMENT '评价内容',
  `images` JSON DEFAULT NULL COMMENT '评价图片',
  `tags` JSON DEFAULT NULL COMMENT '评价标签',
  `is_anonymous` TINYINT DEFAULT 0 COMMENT '是否匿名:0否1是',
  `reply_content` VARCHAR(500) DEFAULT NULL COMMENT '师傅回复',
  `reply_time` TIMESTAMP NULL COMMENT '回复时间',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0隐藏1显示',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_order_id` (`order_id`),
  KEY `idx_worker_id` (`worker_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价表';

-- 16. 投诉表
CREATE TABLE IF NOT EXISTS `complaints` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `worker_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '被投诉师傅ID',
  `type` VARCHAR(32) NOT NULL COMMENT '投诉类型',
  `content` VARCHAR(1000) NOT NULL COMMENT '投诉内容',
  `images` JSON DEFAULT NULL COMMENT '投诉图片',
  `status` TINYINT DEFAULT 0 COMMENT '处理状态:0待处理1处理中2已处理3已驳回',
  `handle_admin_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '处理人ID',
  `handle_result` VARCHAR(500) DEFAULT NULL COMMENT '处理结果',
  `handle_time` TIMESTAMP NULL COMMENT '处理时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_worker_id` (`worker_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投诉表';

-- 17. 师傅钱包表
CREATE TABLE IF NOT EXISTS `worker_wallets` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `worker_id` BIGINT UNSIGNED NOT NULL COMMENT '师傅ID',
  `balance` DECIMAL(12,2) DEFAULT 0.00 COMMENT '可提现余额',
  `frozen_amount` DECIMAL(12,2) DEFAULT 0.00 COMMENT '冻结金额',
  `total_income` DECIMAL(12,2) DEFAULT 0.00 COMMENT '累计收入',
  `total_withdraw` DECIMAL(12,2) DEFAULT 0.00 COMMENT '累计提现',
  `today_income` DECIMAL(12,2) DEFAULT 0.00 COMMENT '今日收入',
  `month_income` DECIMAL(12,2) DEFAULT 0.00 COMMENT '本月收入',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_worker_id` (`worker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='师傅钱包表';

-- 18. 提现记录表
CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `withdraw_no` VARCHAR(32) NOT NULL COMMENT '提现单号',
  `worker_id` BIGINT UNSIGNED NOT NULL COMMENT '师傅ID',
  `worker_name` VARCHAR(32) DEFAULT NULL COMMENT '师傅姓名',
  `amount` DECIMAL(12,2) NOT NULL COMMENT '提现金额',
  `fee` DECIMAL(10,2) DEFAULT 0.00 COMMENT '手续费',
  `actual_amount` DECIMAL(12,2) NOT NULL COMMENT '实际到账金额',
  `withdraw_type` TINYINT DEFAULT 1 COMMENT '提现方式:1微信零钱',
  `status` TINYINT DEFAULT 0 COMMENT '状态:0待审核1审核通过2审核拒绝3转账中4转账成功5转账失败',
  `audit_admin_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '审核人ID',
  `audit_remark` VARCHAR(255) DEFAULT NULL COMMENT '审核备注',
  `audit_time` TIMESTAMP NULL COMMENT '审核时间',
  `transfer_time` TIMESTAMP NULL COMMENT '转账时间',
  `transfer_no` VARCHAR(64) DEFAULT NULL COMMENT '转账单号',
  `fail_reason` VARCHAR(255) DEFAULT NULL COMMENT '失败原因',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_withdraw_no` (`withdraw_no`),
  KEY `idx_worker_id` (`worker_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表';

-- 19. 财务流水表
CREATE TABLE IF NOT EXISTS `financial_records` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `record_no` VARCHAR(32) NOT NULL COMMENT '流水号',
  `worker_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '师傅ID',
  `order_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '订单ID',
  `withdraw_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '提现ID',
  `type` TINYINT NOT NULL COMMENT '类型:1订单收入2订单退款3提现4提现失败退回5平台补贴6保证金扣除',
  `amount` DECIMAL(12,2) NOT NULL COMMENT '变动金额',
  `balance_after` DECIMAL(12,2) NOT NULL COMMENT '变动后余额',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_worker_id` (`worker_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='财务流水表';

-- 20. 管理员表
CREATE TABLE IF NOT EXISTS `admins` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(32) NOT NULL COMMENT '用户名',
  `password` VARCHAR(128) NOT NULL COMMENT '密码',
  `name` VARCHAR(32) NOT NULL COMMENT '姓名',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `role` TINYINT DEFAULT 1 COMMENT '角色:1超级管理员2普通管理员3客服4财务',
  `permissions` JSON DEFAULT NULL COMMENT '权限列表',
  `status` TINYINT DEFAULT 1 COMMENT '状态:0禁用1启用',
  `last_login_time` TIMESTAMP NULL COMMENT '最后登录时间',
  `last_login_ip` VARCHAR(45) DEFAULT NULL COMMENT '最后登录IP',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 21. 系统配置表
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `config_key` VARCHAR(64) NOT NULL COMMENT '配置键',
  `config_value` TEXT COMMENT '配置值',
  `config_desc` VARCHAR(255) DEFAULT NULL COMMENT '配置描述',
  `config_group` VARCHAR(32) DEFAULT 'basic' COMMENT '配置分组',
  `type` VARCHAR(16) DEFAULT 'string' COMMENT '值类型:string/number/boolean/json',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `idx_config_key` (`config_key`),
  KEY `idx_config_group` (`config_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 22. 操作日志表
CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `admin_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  `admin_name` VARCHAR(32) DEFAULT NULL COMMENT '操作人姓名',
  `module` VARCHAR(32) NOT NULL COMMENT '操作模块',
  `action` VARCHAR(32) NOT NULL COMMENT '操作动作',
  `target_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作对象ID',
  `content` VARCHAR(500) DEFAULT NULL COMMENT '操作内容',
  `ip` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(255) DEFAULT NULL COMMENT 'UA',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_module` (`module`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 23. 通知消息表
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_type` TINYINT NOT NULL COMMENT '接收方类型:1用户2师傅',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '接收方ID',
  `type` VARCHAR(32) NOT NULL COMMENT '消息类型',
  `title` VARCHAR(64) NOT NULL COMMENT '消息标题',
  `content` VARCHAR(500) NOT NULL COMMENT '消息内容',
  `extra_data` JSON DEFAULT NULL COMMENT '额外数据',
  `order_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联订单ID',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读:0否1是',
  `read_time` TIMESTAMP NULL COMMENT '阅读时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_user` (`user_type`, `user_id`),
  KEY `idx_is_read` (`user_type`, `user_id`, `is_read`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通知消息表';

-- ========================================
-- 初始化数据
-- ========================================

-- 插入服务分类
INSERT INTO `service_categories` (`name`, `parent_id`, `icon`, `sort`) VALUES
('家电维修', 0, 'http://img.icons8.com/color/96/washing-machine.png', 1),
('保洁清洗', 0, 'http://img.icons8.com/color/96/mop.png', 2),
('水电维修', 0, 'http://img.icons8.com/color/96/wrench.png', 3),
('管道疏通', 0, 'http://img.icons8.com/color/96/plunger.png', 4),
('家具维修', 0, 'http://img.icons8.com/color/96/armchair.png', 5),
('房屋翻新', 0, 'http://img.icons8.com/color/96/house.png', 6),
('开锁换锁', 0, 'http://img.icons8.com/color/96/key.png', 7),
('搬家服务', 0, 'http://img.icons8.com/color/96/moving-truck.png', 8);

-- 插入家电维修子分类
INSERT INTO `service_categories` (`name`, `parent_id`, `icon`, `sort`) VALUES
('空调维修', 1, '', 1),
('冰箱维修', 1, '', 2),
('洗衣机维修', 1, '', 3),
('电视维修', 1, '', 4),
('油烟机维修', 1, '', 5),
('热水器维修', 1, '', 6),
('燃气灶维修', 1, '', 7),
('微波炉维修', 1, '', 8);

-- 插入保洁清洗子分类
INSERT INTO `service_categories` (`name`, `parent_id`, `icon`, `sort`) VALUES
('日常保洁', 2, '', 1),
('深度保洁', 2, '', 2),
('开荒保洁', 2, '', 3),
('油烟机清洗', 2, '', 4),
('空调清洗', 2, '', 5),
('洗衣机清洗', 2, '', 6),
('冰箱清洗', 2, '', 7),
('地毯清洗', 2, '', 8);

-- 插入服务项目
INSERT INTO `services` (`category_id`, `name`, `description`, `base_price`, `unit`, `service_time`, `content`, `notice`, `sort`, `sales_count`) VALUES
(9, '空调维修', '专业师傅上门检测维修空调各类故障', 50.00, '次', 60, '1. 师傅上门检测故障原因\n2. 提供维修方案和报价\n3. 专业维修更换配件\n4. 维修完成试机验收', '1. 检测费30元，维修成功可抵扣\n2. 配件费用另计\n3. 维修后享30天质保', 1, 1256),
(9, '空调加氟', '空调加氟服务，专业设备检测', 100.00, '压', 30, '1. 检测空调氟利昂压力\n2. 查漏补漏\n3. 按压力加氟\n4. 试机检测制冷效果', '1. 价格为一个压的费用\n2. 一般空调需要3-5个压\n3. 加氟后享90天质保', 2, 2341),
(9, '空调安装', '空调拆机、移机、安装服务', 150.00, '台', 90, '1. 拆机或安装\n2. 打孔（普通墙）\n3. 连接管线\n4. 抽真空调试', '1. 不含支架、加长管线费用\n2. 高空作业费另计\n3. 安装后享30天质保', 3, 876),
(10, '冰箱维修', '冰箱不制冷、不启动等故障维修', 50.00, '次', 60, '1. 师傅上门检测故障\n2. 提供维修方案\n3. 专业维修更换配件\n4. 试机验收', '1. 检测费30元，维修成功可抵扣\n2. 配件费用另计\n3. 维修后享30天质保', 1, 567),
(17, '日常保洁', '家庭日常清洁服务', 150.00, '次', 120, '1. 客厅、卧室清洁\n2. 厨房表面清洁\n3. 卫生间清洁\n4. 垃圾清理', '1. 按小时计费，2小时起\n2. 不含玻璃外墙、油烟机清洗\n3. 如需深度清洁请选择深度保洁', 1, 5678),
(18, '深度保洁', '全屋深度清洁，全方位无死角', 300.00, '次', 240, '1. 全屋深度除尘\n2. 厨房重油污清洁\n3. 卫生间深度消毒\n4. 玻璃清洁\n5. 家电表面清洁', '1. 按面积计费，70平起\n2. 包含油烟机、空调表面清洁\n3. 如需家电拆洗请单独下单', 2, 2345),
(20, '油烟机清洗', '油烟机深度拆洗，去除重油污', 129.00, '台', 90, '1. 整机拆卸\n2. 高温蒸汽清洗\n3. 滤网、油盒深度清洁\n4. 外观抛光\n5. 装机调试', '1. 仅限中式、欧式油烟机\n2. 集成灶价格另议\n3. 清洗后60天质保', 1, 3456),
(21, '空调清洗', '空调内机深度清洗，除菌消毒', 99.00, '台', 60, '1. 滤网清洗\n2. 蒸发器深度清洁\n3. 风轮清洗\n4. 高温消毒\n5. 外观清洁', '1. 挂机价格，柜机加50元\n2. 不含外机清洗\n3. 建议半年清洗一次', 2, 4567),
(3, '水电维修', '家庭水电故障维修', 50.00, '次', 60, '1. 故障检测\n2. 维修方案报价\n3. 专业维修\n4. 测试验收', '1. 检测费30元，维修成功可抵扣\n2. 材料费用另计\n3. 维修后享30天质保', 1, 2345),
(4, '管道疏通', '马桶、地漏、下水道疏通', 80.00, '次', 45, '1. 堵塞原因检测\n2. 专业工具疏通\n3. 通水测试\n4. 清洁现场', '1. 普通疏通80元起\n2. 主管道、化粪池价格另议\n3. 疏通不畅免费返工', 1, 1234),
(7, '开锁换锁', '快速上门开锁、换锁服务', 50.00, '次', 30, '1. 身份核验\n2. 无损开锁\n3. 如需换锁提供报价\n4. 新锁安装调试', '1. 开锁50元起，根据锁型定价\n2. 必须核验身份和房产证明\n3. 新锁费用另计', 1, 876);

-- 插入系统配置
INSERT INTO `system_configs` (`config_key`, `config_value`, `config_desc`, `config_group`, `type`) VALUES
('platform_name', '家政维修', '平台名称', 'basic', 'string'),
('platform_fee_rate', '10.00', '平台抽成比例(%)', 'finance', 'number'),
('min_withdraw_amount', '100.00', '最低提现金额', 'finance', 'number'),
('withdraw_fee_rate', '0.00', '提现手续费比例(%)', 'finance', 'number'),
('worker_deposit_amount', '2000.00', '师傅保证金金额', 'finance', 'number'),
('order_auto_accept_time', '30', '订单自动取消时间(分钟)', 'order', 'number'),
('order_auto_confirm_hours', '24', '订单自动确认时间(小时)', 'order', 'number'),
('service_radius', '10', '服务半径(公里)', 'basic', 'number'),
('flash_sale_max_hours', '72', '秒杀活动最长时间(小时)', 'marketing', 'number'),
('new_user_coupon_enabled', 'true', '是否启用新用户优惠券', 'marketing', 'boolean');

-- 插入管理员
INSERT INTO `admins` (`username`, `password`, `name`, `phone`, `role`, `permissions`) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYGyJqH.y/JH5pW', '超级管理员', '13800138000', 1, '["*"]');

-- 插入优惠券模板
INSERT INTO `coupons` (`name`, `type`, `value`, `min_amount`, `total_count`, `valid_type`, `valid_start_date`, `valid_end_date`, `use_scope`, `is_new_user`, `description`, `status`) VALUES
('新用户专享券', 3, 50.00, 0.00, 10000, 2, NULL, NULL, 30, 1, '新用户注册即可领取，无门槛使用', 1),
('满199减30', 1, 30.00, 199.00, 5000, 1, '2026-01-01', '2026-12-31', 1, 0, '全场满199元可用', 1),
('满299减50', 1, 50.00, 299.00, 3000, 1, '2026-01-01', '2026-12-31', 1, 0, '全场满299元可用', 1),
('8折优惠券', 2, 80.00, 0.00, 2000, 1, '2026-01-01', '2026-12-31', 1, 0, '全场8折，最高优惠50元', 1);

-- 插入秒杀活动
INSERT INTO `flash_sales` (`name`, `service_id`, `service_name`, `original_price`, `flash_price`, `total_count`, `limit_per_user`, `start_time`, `end_time`, `sort`, `status`) VALUES
('空调清洗限时秒杀', 26, '空调清洗', 99.00, 59.00, 100, 1, '2026-05-24 00:00:00', '2026-05-31 23:59:59', 1, 1),
('油烟机清洗特惠', 25, '油烟机清洗', 129.00, 79.00, 50, 1, '2026-05-24 00:00:00', '2026-05-31 23:59:59', 2, 1),
('日常保洁超值购', 21, '日常保洁', 150.00, 99.00, 80, 1, '2026-05-24 00:00:00', '2026-05-31 23:59:59', 3, 1);

-- 插入测试师傅
INSERT INTO `workers` (`phone`, `password`, `name`, `id_card`, `gender`, `age`, `work_years`, `latitude`, `longitude`, `address`, `deposit`, `audit_status`, `status`, `is_accept_order`) VALUES
('13900139000', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYGyJqH.y/JH5pW', '张师傅', '110101199001011234', 1, 35, 10, 39.904200, 116.407400, '北京市朝阳区建国路88号', 2000.00, 1, 1, 1),
('13900139001', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYGyJqH.y/JH5pW', '李师傅', '110101198805152345', 1, 37, 12, 39.914200, 116.417400, '北京市海淀区中关村大街1号', 2000.00, 1, 1, 1),
('13900139002', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYGyJqH.y/JH5pW', '王师傅', '110101199208203456', 1, 33, 8, 39.894200, 116.397400, '北京市西城区金融街1号', 2000.00, 1, 1, 1);

-- 插入师傅服务关联
INSERT INTO `worker_services` (`worker_id`, `service_id`) VALUES
(1, 9), (1, 10), (1, 11), (1, 26),
(2, 21), (2, 22), (2, 25), (2, 26),
(3, 27), (3, 28), (3, 29);

-- 插入师傅钱包
INSERT INTO `worker_wallets` (`worker_id`, `balance`, `total_income`) VALUES
(1, 5680.50, 25680.50),
(2, 3200.00, 18200.00),
(3, 1850.00, 9850.00);

-- 插入测试用户
INSERT INTO `users` (`openid`, `nickname`, `avatar`, `phone`, `gender`) VALUES
('oT7p55AtT2mHf5YmQq8wWwXxYyZ', '张三', 'https://thirdwx.qlogo.cn/mmopen/vi_32/123456', '13800138001', 1),
('oT7p55AtT2mHf5YmQq8wWwXxYyA', '李四', 'https://thirdwx.qlogo.cn/mmopen/vi_32/789012', '13800138002', 2),
('oT7p55AtT2mHf5YmQq8wWwXxYyB', '王五', 'https://thirdwx.qlogo.cn/mmopen/vi_32/345678', '13800138003', 1);

-- 插入用户地址
INSERT INTO `user_addresses` (`user_id`, `name`, `phone`, `province`, `city`, `district`, `address`, `house_number`, `latitude`, `longitude`, `is_default`, `tag`) VALUES
(1, '张三', '13800138001', '北京市', '北京市', '朝阳区', '建国路88号SOHO现代城', 'A座1801室', 39.905500, 116.462300, 1, '家'),
(1, '张三', '13800138001', '北京市', '北京市', '朝阳区', '建国路99号', 'B座502室', 39.905200, 116.461800, 0, '公司'),
(2, '李四', '13800138002', '北京市', '北京市', '海淀区', '中关村大街1号', '3号楼1203', 39.983168, 116.316182, 1, '家');

-- 插入用户优惠券
INSERT INTO `user_coupons` (`user_id`, `coupon_id`, `name`, `type`, `value`, `min_amount`, `valid_start_date`, `valid_end_date`, `status`) VALUES
(1, 1, '新用户专享券', 3, 50.00, 0.00, '2026-05-01', '2026-06-30', 0),
(1, 2, '满199减30', 1, 30.00, 199.00, '2026-01-01', '2026-12-31', 0),
(2, 1, '新用户专享券', 3, 50.00, 0.00, '2026-05-10', '2026-07-09', 0);

-- 插入测试订单
INSERT INTO `orders` (`order_no`, `user_id`, `worker_id`, `service_id`, `service_name`, `category_id`, `address_id`, `address_info`, `appointment_time`, `base_price`, `total_price`, `pay_price`, `worker_price`, `platform_fee`, `platform_fee_rate`, `status`, `pay_status`, `pay_time`, `accept_time`, `dispatch_type`, `is_evaluated`) VALUES
('ORD2026052400001', 1, 1, 26, '空调清洗', 2, 1, '{"name":"张三","phone":"13800138001","province":"北京市","city":"北京市","district":"朝阳区","address":"建国路88号SOHO现代城","house_number":"A座1801室","latitude":39.9055,"longitude":116.4623}', '2026-05-25 09:00:00', 99.00, 99.00, 99.00, 89.10, 9.90, 10.00, 4, 1, '2026-05-24 10:30:00', '2026-05-24 10:35:00', 0, 1),
('ORD2026052400002', 1, NULL, 9, '空调维修', 1, 1, '{"name":"张三","phone":"13800138001","province":"北京市","city":"北京市","district":"朝阳区","address":"建国路88号SOHO现代城","house_number":"A座1801室","latitude":39.9055,"longitude":116.4623}', '2026-05-26 14:00:00', 50.00, 50.00, 50.00, 0.00, 0.00, 10.00, 0, 1, '2026-05-24 14:00:00', NULL, 0, 0),
('ORD2026052400003', 2, 2, 25, '油烟机清洗', 2, 3, '{"name":"李四","phone":"13800138002","province":"北京市","city":"北京市","district":"海淀区","address":"中关村大街1号","house_number":"3号楼1203","latitude":39.983168,"longitude":116.316182}', '2026-05-25 15:00:00', 129.00, 129.00, 129.00, 116.10, 12.90, 10.00, 2, 1, '2026-05-24 09:00:00', '2026-05-24 09:05:00', 1, 0);

-- 插入测试评价
INSERT INTO `evaluations` (`order_id`, `user_id`, `worker_id`, `service_id`, `rating`, `content`, `tags`, `status`) VALUES
(1, 1, 1, 26, 5, '张师傅非常专业，服务态度好，清洗得很干净，时间也很准时。', '["服务准时","技术专业","态度很好"]', 1);

-- 插入测试财务流水
INSERT INTO `financial_records` (`record_no`, `worker_id`, `order_id`, `type`, `amount`, `balance_after`, `description`) VALUES
('REC2026052400001', 1, 1, 1, 89.10, 5680.50, '订单完成收入，订单号：ORD2026052400001'),
('REC2026052400002', 2, 3, 1, 116.10, 3200.00, '订单完成收入，订单号：ORD2026052400003');
