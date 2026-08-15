import { execFileSync } from 'node:child_process'
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const packageDirectory = resolve(root, 'packages/charts')
const manifest = JSON.parse(readFileSync(resolve(packageDirectory, 'package.json'), 'utf8'))
const expectedFiles = [
  'LICENSE',
  'README.md',
  'dist/browser.d.ts',
  'dist/browser.js',
  'dist/index.d.ts',
  'dist/index.js',
  'dist/styles.css',
  'dist/tanstack.d.ts',
  'dist/tanstack.js',
  'package.json',
]

if (manifest.private === true) throw new Error('The package must be public')
if (manifest.publishConfig?.access !== 'public') throw new Error('publishConfig.access must be public')
if (!/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(manifest.version)) {
  throw new Error(`Package version must be an explicit SemVer version: ${manifest.version}`)
}

const consumerDirectory = mkdtempSync(resolve(tmpdir(), 'aperture-consumer-'))
const artifactDirectory = process.argv[2] ? resolve(process.argv[2]) : consumerDirectory
const stagingDirectory = process.argv[2] ? mkdtempSync(resolve(tmpdir(), 'aperture-package-')) : undefined
try {
  mkdirSync(artifactDirectory, { recursive: true })
  if (stagingDirectory) {
    const releaseSha = process.env.GITHUB_SHA
    if (!releaseSha || !/^[0-9a-f]{40}$/.test(releaseSha)) {
      throw new Error('GITHUB_SHA must contain the release commit SHA.')
    }
    cpSync(resolve(packageDirectory, 'dist'), resolve(stagingDirectory, 'dist'), { recursive: true })
    cpSync(resolve(packageDirectory, 'README.md'), resolve(stagingDirectory, 'README.md'))
    cpSync(resolve(packageDirectory, 'LICENSE'), resolve(stagingDirectory, 'LICENSE'))
    writeFileSync(
      resolve(stagingDirectory, 'package.json'),
      `${JSON.stringify({ ...manifest, gitHead: releaseSha }, null, 2)}\n`,
    )
  }
  const output = execFileSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', `--pack-destination=${artifactDirectory}`],
    {
      cwd: stagingDirectory ?? packageDirectory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  )
  const packs = JSON.parse(output)
  if (!Array.isArray(packs) || packs.length !== 1) throw new Error('npm pack returned an invalid result')
  if (packs[0].name !== manifest.name || packs[0].version !== manifest.version) {
    throw new Error('npm pack returned unexpected package metadata')
  }

  const packedFiles = new Set(packs[0].files.map(({ path }) => path))
  for (const path of expectedFiles) {
    if (!packedFiles.has(path)) throw new Error(`Package artifact is missing ${path}`)
  }
  for (const path of packedFiles) {
    if (path.startsWith('src/')) throw new Error(`Package artifact contains source file ${path}`)
  }

  const tarball = resolve(artifactDirectory, packs[0].filename)
  if (stagingDirectory) {
    const packedManifest = JSON.parse(
      execFileSync('tar', ['-xOf', tarball, 'package/package.json'], { encoding: 'utf8' }),
    )
    if (packedManifest.gitHead !== process.env.GITHUB_SHA) {
      throw new Error('The package artifact does not contain the release commit SHA')
    }
  }
  writeFileSync(resolve(consumerDirectory, 'package.json'), '{"private":true,"type":"module"}\n')
  execFileSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--registry=https://registry.npmjs.org/',
      tarball,
      'react@^19',
      'react-dom@^19',
      '@types/react@^19',
      '@types/react-dom@^19',
    ],
    { cwd: consumerDirectory, stdio: 'inherit' },
  )
  writeFileSync(
    resolve(consumerDirectory, 'consumer.tsx'),
    "import { ChartProvider, LineChart } from '@kevin-courbet/aperture'\nimport { AdvancedChart } from '@kevin-courbet/aperture/tanstack'\nvoid ChartProvider\nvoid LineChart\nvoid AdvancedChart\n",
  )
  writeFileSync(
    resolve(consumerDirectory, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        jsx: 'react-jsx',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        noEmit: true,
        skipLibCheck: false,
        strict: true,
        target: 'ES2022',
      },
      include: ['consumer.tsx'],
    }),
  )
  execFileSync(resolve(root, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json'], {
    cwd: consumerDirectory,
    stdio: 'inherit',
  })
  execFileSync(
    'node',
    [
      '--input-type=module',
      '--eval',
      "await import('@kevin-courbet/aperture'); await import('@kevin-courbet/aperture/tanstack')",
    ],
    { cwd: consumerDirectory, stdio: 'inherit' },
  )

  if (artifactDirectory !== consumerDirectory) {
    writeFileSync(resolve(artifactDirectory, 'pack.json'), `${JSON.stringify(packs, null, 2)}\n`)
  }

  process.stdout.write(`Verified ${packs[0].id} with ${packedFiles.size} files.\n`)
} finally {
  rmSync(consumerDirectory, { force: true, recursive: true })
  if (stagingDirectory) rmSync(stagingDirectory, { force: true, recursive: true })
}
