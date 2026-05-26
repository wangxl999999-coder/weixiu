const express = require('express');
const router = express.Router();
const { requireUser: authUser, requireWorker: authWorker, requireAdmin: authAdmin, generateToken } = require('../middleware/auth');
const { upload, getFileUrl } = require('../middleware/upload');

const UserAuthController = require('../controllers/UserAuthController');
const HomeController = require('../controllers/HomeController');
const OrderController = require('../controllers/OrderController');
const PaymentController = require('../controllers/PaymentController');
const CouponController = require('../controllers/CouponController');
const AddressController = require('../controllers/AddressController');
const EvaluationController = require('../controllers/EvaluationController');
const ComplaintController = require('../controllers/ComplaintController');
const WorkerAuthController = require('../controllers/WorkerAuthController');
const WorkerOrderController = require('../controllers/WorkerOrderController');
const WalletController = require('../controllers/WalletController');
const AdminAuthController = require('../controllers/AdminAuthController');
const AdminWorkerController = require('../controllers/AdminWorkerController');
const AdminOrderController = require('../controllers/AdminOrderController');
const AdminFinanceController = require('../controllers/AdminFinanceController');
const AdminServiceController = require('../controllers/AdminServiceController');
const AdminCouponController = require('../controllers/AdminCouponController');
const StatisticsController = require('../controllers/StatisticsController');

router.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '家政维修小程序 API 服务运行正常',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

router.post('/api/user/auth/wx-login', UserAuthController.wxLogin);
router.post('/api/user/auth/login-by-phone', UserAuthController.loginByPhone);
router.get('/api/user/info', authUser, UserAuthController.getUserInfo);
router.put('/api/user/info', authUser, UserAuthController.updateUserInfo);
router.put('/api/user/phone', authUser, UserAuthController.updatePhone);

router.get('/api/home/data', HomeController.getHomeData);
router.get('/api/categories', HomeController.getCategories);
router.get('/api/services', HomeController.getServices);
router.get('/api/services/search', HomeController.searchServices);
router.get('/api/services/:id', HomeController.getServiceDetail);
router.get('/api/flash-sales', HomeController.getFlashSales);
router.get('/api/nearby-workers', HomeController.getNearbyWorkers);
router.get('/api/coupon-banners', HomeController.getCouponBanners);

router.post('/api/orders', authUser, OrderController.createOrder);
router.get('/api/orders', authUser, OrderController.getMyOrders);
router.get('/api/orders/:id', authUser, OrderController.getOrderDetail);
router.post('/api/orders/:id/cancel', authUser, OrderController.cancelOrder);
router.post('/api/orders/:id/confirm', authUser, OrderController.confirmOrder);
router.post('/api/orders/:id/refund', authUser, AdminOrderController.applyRefund);
router.get('/api/orders/:id/available-workers', authUser, OrderController.getAvailableWorkers);
router.get('/api/order-extras', authUser, WorkerOrderController.getOrderExtras);
router.post('/api/order-extras/confirm', authUser, WorkerOrderController.confirmExtra);
router.get('/api/order-photos', authUser, WorkerOrderController.getOrderPhotos);

router.post('/api/payment/create', authUser, PaymentController.createPayment);
router.post('/api/payment/notify', PaymentController.paymentNotify);
router.post('/api/payment/extra', authUser, PaymentController.createExtraPayment);

router.get('/api/coupons', CouponController.getCouponList);
router.post('/api/coupons/:id/receive', authUser, CouponController.receiveCoupon);
router.get('/api/user-coupons', authUser, CouponController.getUserCoupons);
router.get('/api/order-available-coupons', authUser, CouponController.getAvailableCoupons);

router.get('/api/addresses', authUser, AddressController.getAddressList);
router.post('/api/addresses', authUser, AddressController.createAddress);
router.put('/api/addresses/:id', authUser, AddressController.updateAddress);
router.delete('/api/addresses/:id', authUser, AddressController.deleteAddress);
router.post('/api/addresses/:id/default', authUser, AddressController.setDefault);

router.post('/api/evaluations', authUser, EvaluationController.createEvaluation);
router.get('/api/evaluations', EvaluationController.getEvaluationList);
router.get('/api/my-evaluations', authUser, EvaluationController.getMyEvaluations);
router.post('/api/evaluations/:id/reply', authWorker, EvaluationController.replyEvaluation);

router.get('/api/complaint-types', ComplaintController.getComplaintTypes);
router.post('/api/complaints', authUser, ComplaintController.createComplaint);
router.get('/api/my-complaints', authUser, ComplaintController.getMyComplaints);
router.get('/api/complaints/:id', authUser, ComplaintController.getComplaintDetail);

router.post('/api/worker/auth/login', WorkerAuthController.loginByPhone);
router.post('/api/worker/auth/register', WorkerAuthController.register);
router.get('/api/worker/info', authWorker, WorkerAuthController.getWorkerInfo);
router.put('/api/worker/info', authWorker, upload.single('avatar_file'), WorkerAuthController.updateWorkerInfo);
router.put('/api/worker/service-settings', authWorker, WorkerAuthController.updateServiceSettings);
router.put('/api/worker/accept-status', authWorker, WorkerAuthController.updateAcceptStatus);
router.get('/api/worker/certificates', authWorker, WorkerAuthController.getCertificates);

router.get('/api/worker/order-hall', authWorker, WorkerOrderController.getOrderHall);
router.post('/api/worker/orders/:id/accept', authWorker, WorkerOrderController.acceptOrder);
router.get('/api/worker/orders', authWorker, WorkerOrderController.getMyOrders);
router.get('/api/worker/orders/:id', authWorker, WorkerOrderController.getWorkerOrderDetail);
router.post('/api/worker/orders/:id/status', authWorker, WorkerOrderController.updateOrderStatus);
router.post('/api/worker/order-extras', authWorker, WorkerOrderController.addOrderExtra);
router.post('/api/worker/order-photos', authWorker, upload.single('image'), WorkerOrderController.uploadOrderPhoto);

router.get('/api/wallet', authWorker, WalletController.getWalletInfo);
router.get('/api/wallet/records', authWorker, WalletController.getFinancialRecords);
router.post('/api/wallet/withdraw', authWorker, WalletController.applyWithdraw);
router.get('/api/wallet/withdraws', authWorker, WalletController.getWithdrawList);
router.get('/api/wallet/withdraws/:id', authWorker, WalletController.getWithdrawDetail);
router.get('/api/wallet/statistics', authWorker, WalletController.getIncomeStatistics);

router.post('/api/admin/auth/login', AdminAuthController.login);
router.get('/api/admin/info', authAdmin, AdminAuthController.getAdminInfo);
router.put('/api/admin/password', authAdmin, AdminAuthController.updatePassword);
router.get('/api/admin/list', authAdmin, AdminAuthController.getAdminList);
router.post('/api/admin', authAdmin, AdminAuthController.createAdmin);
router.put('/api/admin/:id', authAdmin, AdminAuthController.updateAdmin);

router.get('/api/admin/workers', authAdmin, AdminWorkerController.getWorkerList);
router.get('/api/admin/workers/:id', authAdmin, AdminWorkerController.getWorkerDetail);
router.post('/api/admin/workers/:id/audit', authAdmin, AdminWorkerController.auditWorker);
router.put('/api/admin/workers/:id/status', authAdmin, AdminWorkerController.updateWorkerStatus);
router.get('/api/admin/deposits', authAdmin, AdminWorkerController.getWorkerDepositList);
router.post('/api/admin/deposits/:id', authAdmin, AdminWorkerController.updateDeposit);

router.get('/api/admin/orders', authAdmin, AdminOrderController.getOrderList);
router.get('/api/admin/orders/:id', authAdmin, AdminOrderController.getAdminOrderDetail);
router.post('/api/admin/orders/:id/dispatch', authAdmin, AdminOrderController.dispatchOrder);
router.post('/api/admin/orders/:id/reassign', authAdmin, AdminOrderController.reassignOrder);
router.get('/api/admin/refunds', authAdmin, AdminOrderController.getRefundList);
router.post('/api/admin/refunds/:id/handle', authAdmin, AdminOrderController.handleRefund);
router.get('/api/admin/complaints', authAdmin, AdminOrderController.getComplaintList);
router.post('/api/admin/complaints/:id/handle', authAdmin, AdminOrderController.handleComplaint);

router.get('/api/admin/withdraws', authAdmin, AdminFinanceController.getWithdrawList);
router.post('/api/admin/withdraws/:id/audit', authAdmin, AdminFinanceController.auditWithdraw);
router.get('/api/admin/finance/fee-config', authAdmin, AdminFinanceController.getPlatformFeeConfig);
router.put('/api/admin/finance/fee-config', authAdmin, AdminFinanceController.updatePlatformFeeConfig);
router.get('/api/admin/finance/overview', authAdmin, AdminFinanceController.getFinancialOverview);
router.get('/api/admin/finance/records', authAdmin, AdminFinanceController.getFinanceRecords);

router.get('/api/admin/categories', authAdmin, AdminServiceController.getCategoryList);
router.get('/api/admin/all-categories', authAdmin, AdminServiceController.getAllCategories);
router.post('/api/admin/categories', authAdmin, AdminServiceController.createCategory);
router.put('/api/admin/categories/:id', authAdmin, AdminServiceController.updateCategory);
router.delete('/api/admin/categories/:id', authAdmin, AdminServiceController.deleteCategory);
router.get('/api/admin/services', authAdmin, AdminServiceController.getServiceList);
router.get('/api/admin/services/:id', authAdmin, AdminServiceController.getServiceDetail);
router.post('/api/admin/services', authAdmin, AdminServiceController.createService);
router.put('/api/admin/services/:id', authAdmin, AdminServiceController.updateService);
router.put('/api/admin/services/:id/status', authAdmin, AdminServiceController.updateServiceStatus);
router.delete('/api/admin/services/:id', authAdmin, AdminServiceController.deleteService);

router.get('/api/admin/coupons', authAdmin, AdminCouponController.getCouponList);
router.post('/api/admin/coupons', authAdmin, AdminCouponController.createCoupon);
router.put('/api/admin/coupons/:id', authAdmin, AdminCouponController.updateCoupon);
router.delete('/api/admin/coupons/:id', authAdmin, AdminCouponController.deleteCoupon);
router.get('/api/admin/flash-sales', authAdmin, AdminCouponController.getFlashSaleList);
router.post('/api/admin/flash-sales', authAdmin, AdminCouponController.createFlashSale);
router.put('/api/admin/flash-sales/:id', authAdmin, AdminCouponController.updateFlashSale);
router.delete('/api/admin/flash-sales/:id', authAdmin, AdminCouponController.deleteFlashSale);
router.get('/api/admin/user-coupons', authAdmin, AdminCouponController.getUserCouponList);

router.get('/api/statistics/dashboard', authAdmin, StatisticsController.getDashboardStats);
router.get('/api/statistics/order-trend', authAdmin, StatisticsController.getOrderTrend);
router.get('/api/statistics/service-stats', authAdmin, StatisticsController.getServiceStats);
router.get('/api/statistics/worker-ranking', authAdmin, StatisticsController.getWorkerRanking);
router.get('/api/statistics/region-stats', authAdmin, StatisticsController.getRegionStats);
router.get('/api/statistics/user-growth', authAdmin, StatisticsController.getUserGrowth);
router.get('/api/statistics/financial', authAdmin, StatisticsController.getFinancialStats);
router.get('/api/statistics/order-status', authAdmin, StatisticsController.getOrderStatusStats);

module.exports = router;
