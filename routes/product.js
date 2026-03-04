const express = require('express')
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController')

const router = express.Router()

router.get('/', listProducts)
router.get('/:ProductID', getProduct)
router.post('/', createProduct)
router.put('/:ProductID', updateProduct)
router.delete('/:ProductID', deleteProduct)

module.exports = router
