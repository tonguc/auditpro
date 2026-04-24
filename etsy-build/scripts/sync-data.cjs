const fs = require('fs')
const path = require('path')

const srcDir  = path.join(__dirname, '../../lib')
const destDir = path.join(__dirname, '../src/data')

fs.mkdirSync(destDir, { recursive: true })

const files = ['audit-data.ts', 'scoring.ts', 'pdf-generator.ts']

files.forEach(file => {
  try {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file))
    console.log(`Copied: ${file}`)
  } catch (e) {
    console.error(`Failed to copy ${file}:`, e.message)
    process.exit(1)
  }
})

console.log('Sync complete.')
