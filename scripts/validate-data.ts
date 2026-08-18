/**
 * Command-line gate over the same validator the app uses.
 *
 *   npm run validate:data
 *
 * Reads the JSON with `fs` rather than importing it, so the validator stays free of
 * any bundler-specific import syntax and this script runs under plain Node with
 * `--experimental-strip-types`. Exits 1 on any error, 0 otherwise.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { formatIssues, validateRegistry } from '../src/data/validate.ts'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, '..', 'data')

function readJson(name: string): unknown {
  const path = join(dataDir, name)
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    console.error(`could not read ${path}: ${(error as Error).message}`)
    process.exit(1)
  }
}

const nodesRaw = readJson('nodes.json')
const tracksRaw = readJson('tracks.json')

const result = validateRegistry(nodesRaw, tracksRaw)

if (result.issues.length > 0) {
  console.error(formatIssues(result.issues))
  console.error('')
}

const nodeCount = Array.isArray((nodesRaw as { nodes?: unknown }).nodes)
  ? ((nodesRaw as { nodes: unknown[] }).nodes).length
  : 0
const trackCount = Object.keys((tracksRaw as { tracks?: object }).tracks ?? {}).length

console.log(
  `registry: ${nodeCount} nodes, ${trackCount} tracks, ` +
    `${result.errors.length} errors, ${result.warnings.length} warnings`,
)

process.exit(result.ok ? 0 : 1)
