#!/usr/bin/env node
/**
 * Copy `shared/*.md` into every Skill's `references/` so each Skill stays self-contained.
 * Skills are installed individually, so a shared file must exist inside each one.
 */
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const check = process.argv.includes('--check')
const sharedDir = path.join(root, 'shared')
const skillsDir = path.join(root, 'skills')

const sharedFiles = (await readdir(sharedDir)).filter(file => file.endsWith('.md')).sort()
const skills = (await readdir(skillsDir, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort()

if (!sharedFiles.length || !skills.length) throw new Error('No shared files or Skills found.')

const stale = []
for (const skill of skills) {
  for (const file of sharedFiles) {
    const source = await readFile(path.join(sharedDir, file), 'utf8')
    const target = path.join(skillsDir, skill, 'references', file)
    if (check) {
      const current = existsSync(target) ? await readFile(target, 'utf8') : ''
      if (current !== source) stale.push(path.relative(root, target))
      continue
    }
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, source)
  }
}

if (check && stale.length) {
  console.error(`Shared copies are out of date (${stale.length}):\n${stale.map(file => `  ${file}`).join('\n')}\nRun: npm run sync`)
  process.exit(1)
}

console.log(check
  ? `Shared copies match in ${skills.length} Skills.`
  : `Synced ${sharedFiles.length} shared files into ${skills.length} Skills.`)
