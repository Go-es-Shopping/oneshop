const express = require('express')
const cors = require('cors')
require('dotenv').config()
const sequelize = require('./config/database')

const app = express()
app.use(cors())
app.use(express.json())

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
