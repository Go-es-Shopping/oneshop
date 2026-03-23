const express = require('express')
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController')

const router = express.Router()

// 使用 Controller 處理邏輯，保持 Route 檔案簡潔並符合 PascalCase 規範
router.get('/', listProducts)
router.get('/:ProductID', getProduct)
router.post('/', createProduct)
router.put('/:ProductID', updateProduct)
router.delete('/:ProductID', deleteProduct)

module.exports = router
