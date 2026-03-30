const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// 瀏覽紀錄追蹤 API
router.post('/view', analyticsController.trackView);

module.exports = router;
