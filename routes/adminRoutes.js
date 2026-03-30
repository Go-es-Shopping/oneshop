const express = require('express')
const router = express.Router()
const adminController = require('../controllers/adminController')
const analyticsController = require('../controllers/analyticsController')

router.post('/login', adminController.login)
router.get('/analytics', analyticsController.getAnalytics)

module.exports = router
