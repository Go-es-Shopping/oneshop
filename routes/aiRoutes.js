// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// 設定 POST 路由，對應到剛剛寫好的控制器
router.post('/generate-copy', aiController.generateCopywriting);
router.post('/edit-image', aiController.editImage);

module.exports = router;