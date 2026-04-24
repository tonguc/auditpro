const archiver = require('archiver')
const fs = require('fs')
const path = require('path')

const distHtml = path.join(__dirname, '../dist/index.html')
const readmePath = path.join(__dirname, '../README.md')
const outputPath = path.join(__dirname, '../auditpro-etsy.zip')

if (!fs.existsSync(distHtml)) {
  console.error('dist/index.html not found. Run npm run build first.')
  process.exit(1)
}

const output  = fs.createWriteStream(outputPath)
const archive = archiver('zip', { zlib: { level: 9 } })

output.on('close', () => {
  const kb = (archive.pointer() / 1024).toFixed(1)
  console.log(`Packaged: auditpro-etsy.zip (${kb} KB)`)
})

archive.on('error', err => { throw err })
archive.pipe(output)

archive.file(distHtml, { name: 'index.html' })
if (fs.existsSync(readmePath)) {
  archive.file(readmePath, { name: 'README.md' })
}

archive.finalize()
