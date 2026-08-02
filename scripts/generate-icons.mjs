import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const src = path.join(root, 'public', 'favicon.svg')
const outDir = path.join(root, 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

async function main() {
  for (const size of [192, 512]) {
    await sharp(src).resize(size, size).png().toFile(path.join(outDir, `icon-${size}.png`))
    console.log(`Generated icon-${size}.png`)
  }
  await sharp(src).resize(192, 192).png().toFile(path.join(outDir, 'icon-maskable-192.png'))
  await sharp(src).resize(512, 512).png().toFile(path.join(outDir, 'icon-maskable-512.png'))
  console.log('Generated maskable icons')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
