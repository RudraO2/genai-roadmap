/**
 * The built-output gate. Runs after `vite build`, over dist/.
 *
 *   npm run check:output
 *
 * Two jobs the source gate cannot do.
 *
 * 1. Deploy. GitHub Pages serves a project site from /<repo>/, so an absolute asset
 *    path renders a blank page; a missing .nojekyll lets Jekyll rewrite the artifact;
 *    a missing 404.html leaves a stray path dead. All three are checked here because
 *    all three are properties of the output, not of the source.
 *
 * 2. Section 8 after Tailwind. index.css clears the theme namespaces that would let
 *    `backdrop-blur-md`, `shadow-lg`, `rounded-2xl` and `animate-pulse` exist. That is
 *    enforcement by construction, and this asserts it held (BACKLOG T077). The bare
 *    `.filter` and `.backdrop-filter` enabler classes are expected: Tailwind emits both
 *    unconditionally and each expands to a list of empty custom properties, so the
 *    string is present and the capability is not.
 *
 * Exits 1 on any problem, 0 otherwise.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const dist = join(root, 'dist')

type OutputRuleId =
  | 'missing-file'
  | 'absolute-asset'
  | 'sourcemap'
  | 'banned-utility'
  | 'gradient'

interface Problem {
  file: string
  rule: OutputRuleId
  text: string
}

/** Everything the deploy needs on disk before it is worth checking anything else. */
const REQUIRED = ['index.html', '404.html', '.nojekyll']

/**
 * A section 8 utility class, at selector position. Every one of these is a class
 * Tailwind would emit if a theme namespace in index.css were ever un-cleared.
 */
const BANNED_UTILITY =
  /\.(?:backdrop-blur|blur|drop-shadow|inset-shadow|text-shadow|shadow|rounded|animate)(?:-[a-zA-Z0-9\\[\]./%_-]+)?(?=[\s,{:>+~])/g

/** The default Tailwind palette, which section 8 bans by name. */
const PALETTE_UTILITY =
  /\.(?:bg|text|border|fill|stroke|ring|outline|decoration|accent|caret|divide|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d/g

const GRADIENT = /\b(?:repeating-)?(?:linear|radial|conic)-gradient\(/g

const SOURCE_MAPPING = /sourceMappingURL/g

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

const problems: Problem[] = []

function report(file: string, rule: OutputRuleId, text: string): void {
  problems.push({ file, rule, text })
}

function collect(file: string, source: string, pattern: RegExp, rule: OutputRuleId): void {
  pattern.lastIndex = 0
  const seen = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) seen.add(match[0])
  for (const text of [...seen].sort()) report(file, rule, text)
}

if (!existsSync(dist)) {
  console.error('dist/ does not exist — run `vite build` before this gate')
  console.error('')
  console.log('output gate: 0 built files scanned, 1 problem')
  process.exit(1)
}

const entries = readdirSync(dist, { recursive: true, encoding: 'utf8' }).map((entry) =>
  entry.split('\\').join('/'),
)

for (const required of REQUIRED) {
  if (!entries.includes(required)) report(`dist/${required}`, 'missing-file', 'not in the build')
}

for (const entry of entries) {
  const path = `dist/${entry}`

  if (entry.endsWith('.map')) {
    report(path, 'sourcemap', 'sourcemaps are not shipped — see vite.config.ts')
    continue
  }

  if (!/\.(?:html|css|js)$/.test(entry)) continue

  const source = readFileSync(join(dist, entry), 'utf8')

  collect(path, source, SOURCE_MAPPING, 'sourcemap')
  collect(path, source, GRADIENT, 'gradient')

  if (entry.endsWith('.html')) {
    // `base: './'` in vite.config.ts is what keeps these relative. A leading slash
    // here means the deploy works from a domain root and nowhere else.
    collect(path, source, /(?:href|src)="\/[^/"][^"]*"/g, 'absolute-asset')
  }

  if (entry.endsWith('.css')) {
    collect(path, source, BANNED_UTILITY, 'banned-utility')
    collect(path, source, PALETTE_UTILITY, 'banned-utility')
  }
}

problems.sort((a, b) => (a.file === b.file ? 0 : a.file < b.file ? -1 : 1))

for (const problem of problems) {
  console.error(`${problem.file}  ${problem.rule}  ${problem.text}`)
}
if (problems.length > 0) console.error('')

const scanned = entries.filter((entry) => /\.(?:html|css|js)$/.test(entry)).length
console.log(
  `output gate: ${plural(scanned, 'built file')} scanned, ${plural(problems.length, 'problem')}`,
)

process.exit(problems.length > 0 ? 1 : 0)
