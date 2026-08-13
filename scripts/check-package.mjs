import { execFileSync } from 'node:child_process'
import {
  mkdtempSync,
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
try {
  const output = execFileSync(
    'npm',
    ['pack', '--json', '--ignore-scripts', `--pack-destination=${consumerDirectory}`],
    {
      cwd: packageDirectory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  )
  const packs = JSON.parse(output)
  if (!Array.isArray(packs) || packs.length !== 1) throw new Error('npm pack returned an invalid result')

  const packedFiles = new Set(packs[0].files.map(({ path }) => path))
  for (const path of expectedFiles) {
    if (!packedFiles.has(path)) throw new Error(`Package artifact is missing ${path}`)
  }
  for (const path of packedFiles) {
    if (path.startsWith('src/')) throw new Error(`Package artifact contains source file ${path}`)
  }

  const tarball = resolve(consumerDirectory, packs[0].filename)
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

  process.stdout.write(`Verified ${packs[0].id} with ${packedFiles.size} files.\n`)
} finally {
  rmSync(consumerDirectory, { force: true, recursive: true })
}
