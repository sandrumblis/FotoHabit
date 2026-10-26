import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('c:/Users/chris/Desktop/SANDRA/v0-Fotohabito')
const skip = new Set([
  'node_modules',
  '.next',
  '.git',
  '.recovery-from-transcript',
  '.recovery-replay',
])

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (/\.(ts|tsx|js|jsx|css|sql|md)$/.test(entry.name)) acc.push(full)
  }
  return acc
}

const pairs = [
  [/Kore Habits/g, 'FotoHabit'],
  [/Kore PRO/g, 'FotoHabit PRO'],
  [/comunidad Kore/g, 'comunidad FotoHabit'],
  [/juez amigable y flexible de Kore \(Kore Habits\)/g, 'juez amigable y flexible de FotoHabit'],
  [/juez amigable y flexible de Kore \(FotoHabit\)/g, 'juez amigable y flexible de FotoHabit'],
  [/https:\/\/kore\.habits/g, 'https://fotohabit.app'],
  [/Mi progreso en Kore/g, 'Mi progreso en FotoHabit'],
  [/Mi logro en Kore/g, 'Mi logro en FotoHabit'],
  [/Logro Kore/g, 'Logro FotoHabit'],
  [/Feed de la comunidad Kore/g, 'Feed de la comunidad FotoHabit'],
  [/en Kore Habits/g, 'en FotoHabit'],
  [/Compartir fuera de Kore/g, 'Compartir fuera de FotoHabit'],
  [/Publicar en la comunidad Kore/g, 'Publicar en FotoHabit (Feed global)'],
  [/Publicar en FotoHabit \(Feed global\)/g, 'Publicar en FotoHabit (Feed global)'],
  [/Kore comprueba/g, 'FotoHabit comprueba'],
  [/animate-kore-scan/g, 'animate-fotohabit-scan'],
  [/kore-logro/g, 'fotohabit-logro'],
  [/kore-progreso/g, 'fotohabit-progreso'],
  [/kore-capture/g, 'fotohabit-capture'],
  [/\?v=kore-k2/g, '?v=fotohabit-2'],
  [/\?v=kore-k\b/g, '?v=fotohabit-1'],
  [/ctx\.fillText\('Kore'/g, "ctx.fillText('FotoHabit'"],
  [/name: 'Kore'/g, "name: 'FotoHabit'"],
  [/>Kore</g, '>FotoHabit<'],
  [/title: 'Kore Habits · /g, "title: 'FotoHabit · "],
  [/title: "Kore Habits · /g, 'title: "FotoHabit · '],
]

let changed = 0
for (const file of walk(root)) {
  let text = fs.readFileSync(file, 'utf8')
  const original = text
  for (const [re, rep] of pairs) text = text.replace(re, rep)
  // Remaining standalone brand token in string literals / JSX text
  text = text.replace(/(['"`])Kore\1/g, "$1FotoHabit$1")
  text = text.replace(/`kore-/g, '`fotohabit-')
  if (text !== original) {
    fs.writeFileSync(file, text)
    changed += 1
    console.log('updated', path.relative(root, file))
  }
}
console.log('files changed', changed)
