const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const authenticate = require('../middlewares/auth');

// Yêu cầu xác thực tài khoản
router.use(authenticate);

// 1. Gợi ý danh mục cho ghi chú
router.post('/classify-note', aiController.classifyNote);

// 2. Đánh giá mức độ ưu tiên của nhiệm vụ
router.post('/assess-task', aiController.assessTask);

module.exports = router;
