import fs from 'node:fs'
import path from 'node:path'

const jsonl =
  'C:/Users/chris/.cursor/projects/c-Users-chris-Desktop-SANDRA-v0-Fotohabito/agent-transcripts/615b27db-37f3-4f44-9d73-fa4447190b1c/615b27db-37f3-4f44-9d73-fa4447190b1c.jsonl'
const projectRoot = 'C:/Users/chris/Desktop/SANDRA/v0-Fotohabito'
const outDir = path.join(projectRoot, '.recovery-from-transcript')
const histRoot = path.join(process.env.APPDATA || '', 'Cursor/User/History')

const latest = new Map()
const lines = fs.readFileSync(jsonl, 'utf8').split(/\n/)
let writeOps = 0

for (const line of lines) {
  if (!line.trim()) continue
  let obj
  try {
    obj = JSON.parse(line)
  } catch {
    continue
  }
  const content = obj?.message?.content
  if (!Array.isArray(content)) continue
  for (const part of content) {
    if (part?.type !== 'tool_use' || part.name !== 'Write') continue
    const input = part.input || {}
    if (!input.path || typeof input.contents !== 'string') continue
    const normalized = String(input.path).replace(/\\/g, '/').toLowerCase()
    if (!normalized.includes('/v0-fotohabito/')) continue
    // skip recovery scripts / env secrets
    if (normalized.includes('/.env') || normalized.includes('/scripts/recover')) continue
    latest.set(normalized, {
      path: String(input.path).replace(/\\/g, '/'),
      contents: input.contents,
    })
    writeOps++
  }
}

fs.mkdirSync(outDir, { recursive: true })
const index = []
for (const { path: absPath, contents } of [...latest.values()].sort((a, b) =>
  a.path.localeCompare(b.path),
)) {
  const rel = absPath
    .replace(/^([a-zA-Z]:)?\/?Users\/chris\/Desktop\/SANDRA\/v0-Fotohabito\//i, '')
    .replace(/^C:\/Users\/chris\/Desktop\/SANDRA\/v0-Fotohabito\//i, '')
  if (!rel || rel.startsWith('.')) continue
  const dest = path.join(outDir, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, contents, 'utf8')
  index.push({ rel, bytes: Buffer.byteLength(contents) })
}

fs.writeFileSync(path.join(outDir, '_index.json'), JSON.stringify(index, null, 2))
console.log(JSON.stringify({ writeOps, unique: index.length, outDir }, null, 2))
console.log(index.map((i) => `${i.rel} (${i.bytes})`).join('\n'))

// Also dump Local History snapshots into recovery folder
const histOut = path.join(outDir, '_local-history')
fs.mkdirSync(histOut, { recursive: true })
const histIndex = []
if (fs.existsSync(histRoot)) {
  for (const dir of fs.readdirSync(histRoot, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue
    const entriesPath = path.join(histRoot, dir.name, 'entries.json')
    if (!fs.existsSync(entriesPath)) continue
    let entries
    try {
      entries = JSON.parse(fs.readFileSync(entriesPath, 'utf8'))
    } catch {
      continue
    }
    const resource = String(entries.resource || '')
    if (!/v0-Fotohabito/i.test(resource)) continue
    for (const entry of entries.entries || []) {
      const src = path.join(histRoot, dir.name, entry.id)
      if (!fs.existsSync(src)) continue
      const urlPath = decodeURIComponent(resource.replace(/^file:\/\/\//, '').replace(/^\/([a-zA-Z]%3A)/, '$1'))
      const relGuess = urlPath.replace(/^[a-zA-Z]:\/Users\/chris\/Desktop\/SANDRA\/v0-Fotohabito\//i, '')
      const dest = path.join(histOut, dir.name + '__' + entry.id)
      fs.copyFileSync(src, dest)
      histIndex.push({
        resource: relGuess || resource,
        id: entry.id,
        bytes: fs.statSync(src).size,
        source: entry.source,
        timestamp: entry.timestamp,
        snapshot: path.relative(outDir, dest),
      })
    }
  }
}
fs.writeFileSync(path.join(histOut, '_index.json'), JSON.stringify(histIndex, null, 2))
console.log('\nLocal History snapshots:', histIndex.length)
for (const h of histIndex) {
  console.log(`- ${h.resource} (${h.bytes}b) via ${h.source || 'edit'}`)
}
