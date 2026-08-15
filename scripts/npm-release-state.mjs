import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [packagePath, mode = 'check', packPath] = process.argv.slice(2)
if (!packagePath || !['check', 'verify'].includes(mode) || (mode === 'verify' && !packPath)) {
  throw new Error('Usage: node scripts/npm-release-state.mjs <package.json> [check|verify <pack.json>]')
}

const releaseSha = process.env.GITHUB_SHA
if (!releaseSha || !/^[0-9a-f]{40}$/.test(releaseSha)) {
  throw new Error('GITHUB_SHA must contain the release commit SHA.')
}

const packageJson = JSON.parse(await readFile(resolve(packagePath), 'utf8'))
const { name, version } = packageJson
if (typeof name !== 'string' || typeof version !== 'string') {
  throw new Error('The package name and version must be strings.')
}

const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(name)}/${encodeURIComponent(version)}`
const response = await fetch(registryUrl, { headers: { accept: 'application/json' } })

if (response.status === 404) {
  if (mode === 'verify') throw new Error(`${name}@${version} is not available on npm.`)
  process.stdout.write(`name=${name}\nversion=${version}\npublish=true\n`)
  process.exit(0)
}
if (!response.ok) {
  throw new Error(`The npm registry returned HTTP ${response.status} for ${name}@${version}.`)
}

const published = await response.json()
if (published.name !== name || published.version !== version) {
  throw new Error(`The npm registry returned unexpected metadata for ${name}@${version}.`)
}
if (published.gitHead !== releaseSha) {
  throw new Error(`${name}@${version} belongs to ${published.gitHead ?? 'an unknown commit'}, not ${releaseSha}.`)
}

if (mode === 'verify') {
  const packs = JSON.parse(await readFile(resolve(packPath), 'utf8'))
  if (!Array.isArray(packs) || packs.length !== 1 || typeof packs[0].integrity !== 'string') {
    throw new Error('The package artifact metadata is invalid.')
  }
  if (published.dist?.integrity !== packs[0].integrity) {
    throw new Error(`${name}@${version} does not match the verified package artifact.`)
  }
} else {
  process.stdout.write(`name=${name}\nversion=${version}\npublish=false\n`)
}
