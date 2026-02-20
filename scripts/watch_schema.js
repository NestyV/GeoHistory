const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql')

function runGenerator() {
  const p = spawn('node', [path.join(__dirname, 'generate_database_setup.js')], { stdio: 'inherit' })
  p.on('close', code => {
    if (code !== 0) console.error('Generator exited with code', code)
  })
}

console.log('Watching', schemaPath)
fs.watch(schemaPath, { persistent: true }, (eventType) => {
  if (eventType === 'change' || eventType === 'rename') {
    console.log('Change detected, regenerating DATABASE_SETUP.sql')
    runGenerator()
  }
})

// Run once at start
runGenerator()
