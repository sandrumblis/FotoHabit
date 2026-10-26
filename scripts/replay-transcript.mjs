import fs from 'node:fs'
import path from 'node:path'

const jsonl =
  'C:/Users/chris/.cursor/projects/c-Users-chris-Desktop-SANDRA-v0-Fotohabito/agent-transcripts/615b27db-37f3-4f44-9d73-fa4447190b1c/615b27db-37f3-4f44-9d73-fa4447190b1c.jsonl'
const projectRoot = 'C:/Users/chris/Desktop/SANDRA/v0-Fotohabito'
const outDir = path.join(projectRoot, '.recovery-replay')

function norm(p) {
  return String(p).replace(/\\/g, '/')
}

function toRel(abs) {
  const n = norm(abs)
  const marker = '/v0-Fotohabito/'
  const idx = n.toLowerCase().indexOf(marker.toLowerCase())
  if (idx < 0) return null
  return n.slice(idx + marker.length)
}

const files = new Map() // rel -> contents
let writes = 0
let replaces = 0
let replaceMiss = 0

const lines = fs.readFileSync(jsonl, 'utf8').split(/\n/)
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
    if (part?.type !== 'tool_use') continue
    const input = part.input || {}
    if (!input.path) continue
    const rel = toRel(input.path)
    if (!rel) continue
    if (rel.startsWith('.env') || rel.includes('.recovery')) continue

    if (part.name === 'Write' && typeof input.contents === 'string') {
      files.set(rel, input.contents)
      writes++
      continue
    }

    if (part.name === 'StrReplace' && typeof input.old_string === 'string') {
      const current = files.get(rel)
      if (current == null) {
        replaceMiss++
        continue
      }
      const all = Boolean(input.replace_all)
      if (all) {
        if (!current.includes(input.old_string)) {
          replaceMiss++
          continue
        }
        files.set(rel, current.split(input.old_string).join(input.new_string ?? ''))
        replaces++
      } else {
        const i = current.indexOf(input.old_string)
        if (i < 0) {
          replaceMiss++
          continue
        }
        files.set(
          rel,
          current.slice(0, i) + (input.new_string ?? '') + current.slice(i + input.old_string.length),
        )
        replaces++
      }
    }
  }
}

fs.mkdirSync(outDir, { recursive: true })
const index = []
for (const [rel, contents] of [...files.entries()].sort()) {
  const dest = path.join(outDir, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, contents, 'utf8')
  index.push({ rel, bytes: Buffer.byteLength(contents) })
}
fs.writeFileSync(path.join(outDir, '_index.json'), JSON.stringify({ writes, replaces, replaceMiss, index }, null, 2))
console.log(JSON.stringify({ writes, replaces, replaceMiss, files: index.length }, null, 2))
