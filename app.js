const express = require('express')
const cors = require('cors')
require('dotenv').config()
const sequelize = require('./config/database')

const app = express()
app.use(cors())
app.use(express.json())

const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/product')
const storeRoutes = require('./routes/store')
const orderRoutes = require('./routes/order')

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/store', storeRoutes)
app.use('/api/orders', orderRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

;(async () => {
  try {
    await sequelize.authenticate()
    console.log('Database connection established')
  } catch (err) {
    console.error('Database connection failed', err.message)
  }
})()

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
