#!/usr/bin/env node
/**
 * Validate the Skill repository:
 *  1. frontmatter, naming and trigger length for every Skill
 *  2. README indexes every Skill and every Skill is indexed once
 *  3. shared references and generated operation tables are current
 *  4. every documented CLI command exists in the published CLI manifest
 *  5. every HTTP path exists in the published OpenAPI
 *  6. no credentials, and every external link resolves
 */
import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = path.resolve(import.meta.dirname, '..')
const skillsDir = path.join(root, 'skills')
const products = ['agents', 'box', 'powers', 'gateway']
const origin = (process.env.SINECLOUD_OPENAPI_ORIGIN ?? 'https://sinecloud.dev').replace(/\/$/, '')
const skipLinks = process.env.SKIP_LINKS === '1'
const bin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'sinecloud.cmd' : 'sinecloud')

const failures = []
const notes = []
const fail = message => failures.push(message)
const note = message => notes.push(message)

const sharedCommandAllowlist = new Set([
  'auth login', 'auth status', 'auth logout',
  'api list', 'api call', 'openapi get', 'doctor', 'completion',
])

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!match) return null
  const fields = {}
  let current
  for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/)
    if (entry) {
      current = entry[1]
      fields[current] = entry[2].startsWith('|') || entry[2].startsWith('>') ? '' : entry[2].trim()
      continue
    }
    if (current && /^\s+\S/.test(line)) {
      fields[current] = `${fields[current] ? `${fields[current]} ` : ''}${line.trim()}`
    }
  }
  for (const [key, value] of Object.entries(fields)) {
    if (/^(['"]).*\1$/.test(value)) fields[key] = value.slice(1, -1)
  }
  return fields
}

async function readSkill(name) {
  const file = path.join(skillsDir, name, 'SKILL.md')
  if (!existsSync(file)) return null
  return readFile(file, 'utf8')
}

async function markdownFiles(dir) {
  const output = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) output.push(...await markdownFiles(full))
    else if (entry.name.endsWith('.md')) output.push(full)
  }
  return output
}

const skillNames = (await readdir(skillsDir, { withFileTypes: true }))
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort()

// 1. Structure and frontmatter.
const skillDocs = new Map()
for (const name of skillNames) {
  const text = await readSkill(name)
  if (!text) { fail(`${name}: missing SKILL.md`); continue }
  skillDocs.set(name, text)
  const fields = parseFrontmatter(text)
  if (!fields) { fail(`${name}: SKILL.md has no frontmatter`); continue }
  if (fields.name !== name) fail(`${name}: frontmatter name is "${fields.name}"`)
  if (!fields.description) fail(`${name}: frontmatter description is missing`)
  else if (fields.description.length < 40) fail(`${name}: description is too short to trigger reliably (${fields.description.length} chars)`)
  else if (fields.description.length > 1500) fail(`${name}: description is longer than 1500 characters`)
  if (!/TRIGGER/.test(fields.description) || !/SKIP/.test(fields.description)) fail(`${name}: description needs TRIGGER and SKIP clauses`)
  if (/\bTODO\b|\bTBD\b/.test(text)) fail(`${name}: contains a TODO/TBD placeholder`)
  for (const reference of ['references/access.md', 'references/costs.md', 'references/feedback.md']) {
    if (!text.includes(reference)) fail(`${name}: does not link ${reference}`)
    if (!existsSync(path.join(skillsDir, name, reference))) fail(`${name}: ${reference} is missing (run: npm run sync)`)
  }
}

// 2. README index.
const readme = await readFile(path.join(root, 'README.md'), 'utf8')
for (const name of skillNames) {
  const hits = readme.split(`./skills/${name}/SKILL.md`).length - 1
  if (hits !== 1) fail(`README.md: ./skills/${name}/SKILL.md appears ${hits} times (expected 1)`)
}

// 3. Shared copies and generated tables.
for (const [script, hint] of [['sync-shared.mjs', 'npm run sync'], ['generate-operations.mjs', 'npm run generate']]) {
  try {
    await run(process.execPath, [path.join(root, 'scripts', script), '--check'], { cwd: root, maxBuffer: 16 * 1024 * 1024 })
  } catch (error) {
    fail(`${script} --check failed\n${String(error.stderr ?? error.message).trim()}\nRun: ${hint}`)
  }
}

// 4. CLI commands.
if (!existsSync(bin)) {
  fail('The Sine Cloud CLI is not installed. Run: npm install')
} else {
  const commands = new Set()
  const operationIds = new Set()
  for (const product of products) {
    const { stdout } = await run(bin, ['api', 'list', '--product', product, '--json'], { cwd: root, maxBuffer: 8 * 1024 * 1024 })
    for (const entry of JSON.parse(stdout)) {
      commands.add(entry.command.join(' '))
      operationIds.add(entry.operationId)
    }
  }
  const files = [...(await markdownFiles(skillsDir)), path.join(root, 'README.md'), path.join(root, 'README.zh-CN.md')]
  for (const file of files) {
    const text = await readFile(file, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const invocation = line.match(/^\s*(?:npx @sinecloud\/cli@\S+|sinecloud)\s+(.+?)\s*$/)
      if (!invocation) continue
      // Flags carry values that are not part of the command path, and a pipeline ends the command.
      const command = invocation[1].split(/\s+#|\s*\||\s*>|&&|\\$/)[0]
      const words = []
      for (const word of command.split(/\s+/)) {
        if (/^(?:--|-\w|@|\$|<|\{|["'`])/.test(word)) break
        words.push(word)
      }
      const relative = path.relative(root, file)
      const instructions = relative.startsWith(`skills${path.sep}`) && !relative.endsWith('operations.md')
      const candidate = words.join(' ')
      if (!candidate) continue
      if (candidate.startsWith('api call ')) {
        const operationId = words[2]
        if (!operationId || !operationIds.has(operationId)) fail(`${relative}: api call uses unknown operationId "${operationId}"`)
        continue
      }
      if (candidate.startsWith('api list') || candidate.startsWith('auth ') || candidate === 'doctor' || candidate === 'completion') continue
      if (candidate.startsWith('openapi get')) {
        const product = words[2]
        // A placeholder such as <agents|box|powers|gateway> is documentation, not an invocation.
        if (product && !product.startsWith('<') && !products.includes(product) && product !== 'index') fail(`${relative}: openapi get expects a product or index, got "${product}"`)
        continue
      }
      // Instructions must not restate per-operation commands: the generated table is the only list.
      if (instructions) {
        fail(`${relative}: uses the operation command "sinecloud ${candidate}"; write "api call <operationId>" and leave command names to references/operations.md`)
        continue
      }
      const matches = [...commands].some(known => known === candidate || candidate.startsWith(`${known} `))
      if (!matches) fail(`${relative}: unknown CLI command "sinecloud ${candidate}"`)
    }
  }
}

// 5. HTTP paths.
{
  const knownPaths = new Set(['/api/mcp', '/api/openapi/index.json'])
  for (const product of products) {
    const response = await fetch(`${origin}/api/openapi/${product}.json`)
    if (!response.ok) { fail(`OpenAPI ${product}: HTTP ${response.status}`); continue }
    const document = await response.json()
    for (const route of Object.keys(document.paths ?? {})) knownPaths.add(route)
    note(`${product}: ${Object.keys(document.paths ?? {}).length} published paths`)
  }
  for (const file of await markdownFiles(skillsDir)) {
    const text = await readFile(file, 'utf8')
    for (const match of text.matchAll(/`(\/api\/[A-Za-z0-9_./{}-]+)`/g)) {
      const candidate = match[1]
      if (!knownPaths.has(candidate)) fail(`${path.relative(root, file)}: unknown API path ${candidate}`)
    }
  }
}

// 6. Credentials and links.
{
  const patterns = [
    [/\bsc_[A-Za-z0-9]{16,}\b/g, 'an API key'],
    [/\bsk-[A-Za-z0-9]{16,}\b/g, 'a provider secret'],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/g, 'a private key'],
  ]
  const links = new Set()
  for (const file of await markdownFiles(root)) {
    const text = await readFile(file, 'utf8')
    for (const [pattern, label] of patterns) {
      if (pattern.test(text)) fail(`${path.relative(root, file)}: contains ${label}`)
      pattern.lastIndex = 0
    }
    for (const match of text.matchAll(/https:\/\/[^\s)`"'<>]+/g)) {
      const url = match[0].replace(/[.,;:]+$/, '')
      if (url.startsWith(`${origin}/api/`)) continue
      links.add(url)
    }
  }
  if (!skipLinks) {
    for (const url of [...links].sort()) {
      let status = 0
      for (let attempt = 0; attempt < 2 && !(status && status < 400); attempt += 1) {
        try {
          const response = await fetch(url, { method: 'GET', redirect: 'follow' })
          status = response.status
        } catch {
          status = 0
        }
      }
      if (status >= 400 || status === 0) fail(`link check: ${url} returned ${status || 'no response'}`)
    }
    note(`link check: ${links.size} unique external URLs`)
  } else {
    note('link check skipped (SKIP_LINKS=1)')
  }
}

for (const message of notes) console.log(`· ${message}`)
if (failures.length) {
  console.error(`\n${failures.length} validation failure(s):\n${failures.map(message => `  - ${message}`).join('\n')}`)
  process.exit(1)
}
console.log(`\nValidated ${skillNames.length} Skills: ${skillNames.join(', ')}.`)
