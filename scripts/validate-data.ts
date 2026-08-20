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

import { formatIssues, validateRoadmap } from '../src/data/validate.ts'

const here = dirname(fileURLToPath(import.meta.url))
const path = join(here, '..', 'data', 'roadmap.json')

let raw: unknown
try {
  raw = JSON.parse(readFileSync(path, 'utf8'))
} catch (error) {
  console.error(`could not read ${path}: ${(error as Error).message}`)
  process.exit(1)
}

const result = validateRoadmap(raw)

if (result.issues.length > 0) {
  console.error(formatIssues(result.issues))
  console.error('')
}

const file = raw as { nodes?: unknown[]; stages?: unknown[]; paths?: unknown[] }
const nodes = Array.isArray(file.nodes) ? file.nodes : []
const links = nodes.reduce<number>(
  (total, node) => total + ((node as { links?: unknown[] }).links?.length ?? 0),
  0,
)

console.log(
  `roadmap: ${nodes.length} nodes, ${file.stages?.length ?? 0} stages, ` +
    `${file.paths?.length ?? 0} paths, ${links} links, ` +
    `${result.errors.length} errors, ${result.warnings.length} warnings`,
)

process.exit(result.ok ? 0 : 1)
