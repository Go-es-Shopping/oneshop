const path = require('path')
const fs = require('fs')

function readMock(filename) {
  const filePath = path.join(__dirname, filename)
  const raw = fs.readFileSync(filePath, 'utf8')
  return JSON.parse(raw)
}

module.exports = { readMock }
