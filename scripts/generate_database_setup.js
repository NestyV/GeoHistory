const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'db', 'schema.sql')
const dest = path.join(__dirname, '..', 'DATABASE_SETUP.sql')

function generate() {
  try {
    const content = fs.readFileSync(src, 'utf8')
    const header = `-- GENERATED FILE - Do not edit directly.\n-- Source: db/schema.sql\n-- Generated at: ${new Date().toISOString()}\n\n`
    fs.writeFileSync(dest, header + content, 'utf8')
    console.log('DATABASE_SETUP.sql updated from db/schema.sql')
  } catch (err) {
    console.error('Failed to generate DATABASE_SETUP.sql:', err)
    process.exitCode = 1
  }
}

if (require.main === module) generate()

module.exports = { generate }
