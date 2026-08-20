/**
 * The source gate. DESIGN.md's banned list, as a command.
 *
 *   npm run check:theme
 *
 * "No hardcoded colour outside theme.css" was checked by hand for eleven specs
 * This reads every file under src/ except theme.css itself, plus
 * index.html and public/, and fails the build on:
 *
 *   colour-literal    a hex, an rgb()/hsl()/oklch() call, or a named CSS colour
 *   type-literal      a font or spacing declaration that is not a var(--token)
 *   banned-construct  a gradient, a backdrop-filter, a blur, a coloured shadow
 *   unknown-token     var(--x) where theme.css declares no --x
 *
 * theme.css is the one file allowed to hold values, so it is not scanned — it is
 * read for the list of tokens everything else must spend.
 *
 * scripts/ is not scanned either, and must not be added: this file holds all 148 CSS
 * named colours as data, so a gate that read its own source would never pass again.
 * Nothing under scripts/ renders anything, so there is nothing there to enforce.
 *
 * Exits 1 on any violation, 0 otherwise. Warnings never fail a build.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

/** The one file allowed to hold literals. Repo-relative, forward slashes. */
const THEME_FILE = 'src/theme.css'

type RuleId = 'colour-literal' | 'type-literal' | 'banned-construct' | 'unknown-token'

interface Violation {
  file: string
  line: number
  rule: RuleId
  text: string
}

/**
 * Every CSS named colour. `transparent` and `currentcolor` are deliberately absent:
 * they name a relationship rather than a value, and section 8 has no quarrel with
 * either — the panel backdrops are built out of both.
 */
const NAMED_COLOURS = new Set(
  (
    'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue ' +
    'blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk ' +
    'crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki ' +
    'darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen ' +
    'darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue ' +
    'dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite ' +
    'gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki ' +
    'lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan ' +
    'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen ' +
    'lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen ' +
    'magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen ' +
    'mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream ' +
    'mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid ' +
    'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum ' +
    'powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown ' +
    'seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen ' +
    'steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen'
  ).split(' '),
)

/** Declarations whose value must be a theme token, never a literal. */
const TYPE_PROPERTIES = new Set([
  'font',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'letter-spacing',
  'line-height',
])

/** What a type declaration may say instead of a token. */
const TYPE_KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'normal'])

/**
 * A hex colour, and only a hex colour. The lookbehind keeps a URL fragment
 * (`.../commit#abc123`) and an id selector out of the results; the lookahead makes
 * a seven-digit string fail all three lengths rather than matching the first six.
 */
const HEX = /(?<![\w/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z])/g

/** `color-mix(` is absent by design — see the header of theme.css. */
const COLOUR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/g

const GRADIENT = /\b(?:repeating-)?(?:linear|radial|conic)-gradient\(/g

const BACKDROP_FILTER = /-?(?:webkit-)?backdrop-filter\b/g

const VAR_USE = /var\(\s*(--[a-zA-Z0-9-]+)/g

/** A declaration, anywhere a declaration can start. Selectors and @media do not match. */
const DECLARATION = /(^|[;{])\s*([-a-zA-Z]+)\s*:\s*([^;{}]*)/g

const DECLARED_TOKEN = /^[ \t]*(--[a-zA-Z0-9-]+)[ \t]*:/gm

/** The same declaration written as an inline style in TSX: `{ '--card-x': … }`. */
const QUOTED_TOKEN = /['"](--[a-zA-Z0-9-]+)['"]\s*:/g

function read(file: string): string {
  return readFileSync(join(root, file), 'utf8')
}

/**
 * Blank out `/* … *\/` while keeping every byte's line intact, so a reported line
 * number still points at the right line. Stylesheets here explain their colour
 * decisions in prose — a gate that fails on its own documentation would only teach
 * people to delete the documentation.
 */
function stripCssComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, ' '),
  )
}

function lineOf(source: string, index: number): number {
  let line = 1
  for (let i = 0; i < index; i += 1) if (source[i] === '\n') line += 1
  return line
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function snippet(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > 80 ? `${flat.slice(0, 77)}...` : flat
}

/** Files this gate reads, repo-relative and forward-slashed. */
function scanTargets(): string[] {
  const targets: string[] = ['index.html']
  const dirs: Array<{ dir: string; extensions: string[] }> = [
    { dir: 'src', extensions: ['.css', '.ts', '.tsx'] },
    { dir: 'public', extensions: ['.html'] },
  ]

  for (const { dir, extensions } of dirs) {
    if (!existsSync(join(root, dir))) continue
    for (const entry of readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' })) {
      const path = `${dir}/${entry.split('\\').join('/')}`
      if (!extensions.some((extension) => path.endsWith(extension))) continue
      if (path === THEME_FILE) continue
      targets.push(path)
    }
  }

  return targets
}

/**
 * A declaration's value with everything that is not a bare keyword removed:
 * quoted strings, custom property names (so `var(--accent-red)` is not "red"),
 * and function names (so `tan(…)` is not "tan").
 */
function keywordsIn(value: string): string[] {
  const bare = value
    .replace(/(["'])(?:\\.|(?!\1).)*\1/g, ' ')
    .replace(/--[a-zA-Z0-9-]+/g, ' ')
    .replace(/[a-zA-Z-]+\(/g, '(')
  return bare.match(/[a-zA-Z]+/g) ?? []
}

function checkPattern(
  file: string,
  source: string,
  pattern: RegExp,
  rule: RuleId,
  found: Violation[],
): void {
  pattern.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(source)) !== null) {
    found.push({ file, line: lineOf(source, match.index), rule, text: snippet(match[0]) })
  }
}

function checkDeclarations(file: string, source: string, found: Violation[]): void {
  DECLARATION.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = DECLARATION.exec(source)) !== null) {
    const property = (match[2] ?? '').toLowerCase()
    const value = match[3] ?? ''
    const trimmed = value.trim()
    // Point at the property, not at the `;` the match starts on — that semicolon
    // usually sits on the previous line, and a gate that reports the wrong line is
    // worse than no gate. Lower-cased both sides so a `Color:` still finds itself.
    const offset = match[0].toLowerCase().indexOf(property)
    const at = match.index + (offset < 0 ? 0 : offset)
    const report = (rule: RuleId): void => {
      found.push({ file, line: lineOf(source, at), rule, text: snippet(`${property}: ${trimmed}`) })
    }

    if (TYPE_PROPERTIES.has(property)) {
      const token = /^var\(\s*--[a-zA-Z0-9-]+\s*\)$/.test(trimmed)
      if (!token && !TYPE_KEYWORDS.has(trimmed.toLowerCase())) report('type-literal')
    }

    if (property === 'box-shadow' && trimmed.toLowerCase() !== 'none') report('banned-construct')
    if (property === 'filter' && /\bblur\(/.test(trimmed)) report('banned-construct')

    for (const keyword of keywordsIn(value)) {
      if (NAMED_COLOURS.has(keyword.toLowerCase())) {
        report('colour-literal')
        break
      }
    }
  }
}

function checkTokens(
  file: string,
  source: string,
  declared: ReadonlySet<string>,
  used: Set<string>,
  found: Violation[],
): void {
  VAR_USE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = VAR_USE.exec(source)) !== null) {
    const name = match[1] ?? ''
    used.add(name)
    // Tailwind writes its own --tw-* internals through the utilities it emits.
    if (name.startsWith('--tw-') || declared.has(name)) continue
    found.push({ file, line: lineOf(source, match.index), rule: 'unknown-token', text: name })
  }
}

function collectTokens(source: string, into: Set<string>): void {
  for (const pattern of [DECLARED_TOKEN, QUOTED_TOKEN]) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source)) !== null) into.add(match[1] ?? '')
  }
}

const files = scanTargets()
// TS and TSX are read raw: no colour literal exists in either today, and scanning
// the comments too means a hex cannot be parked in one "for reference".
const sources = new Map<string, string>(
  files.map((file) => {
    const raw = read(file)
    return [file, file.endsWith('.css') ? stripCssComments(raw) : raw]
  }),
)

const themeTokens = new Set<string>()
collectTokens(stripCssComments(read(THEME_FILE)), themeTokens)

/**
 * Every custom property this project declares anywhere, not only in theme.css. A
 * local property is a legitimate thing — the cards position themselves with one —
 * and a colour smuggled into one is caught by `colour-literal` wherever it is
 * written. What is left for this set to catch is the typo: `var(--text-secondry)`
 * renders as nothing at all today and nothing says a word.
 */
const declaredTokens = new Set<string>(themeTokens)
for (const source of sources.values()) collectTokens(source, declaredTokens)

const violations: Violation[] = []
const usedTokens = new Set<string>()

for (const file of files) {
  const source = sources.get(file) ?? ''

  checkPattern(file, source, HEX, 'colour-literal', violations)
  checkPattern(file, source, COLOUR_FUNCTION, 'colour-literal', violations)
  checkPattern(file, source, GRADIENT, 'banned-construct', violations)
  checkPattern(file, source, BACKDROP_FILTER, 'banned-construct', violations)
  checkTokens(file, source, declaredTokens, usedTokens, violations)
  if (file.endsWith('.css')) checkDeclarations(file, source, violations)
}

violations.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1))

for (const violation of violations) {
  console.error(`${violation.file}:${violation.line}  ${violation.rule}  ${violation.text}`)
}
if (violations.length > 0) console.error('')

// "Unused" means no scanned file reads it. A token theme.css only spends on another
// token still warns, deliberately: the question worth asking is whether the interface
// reads it, not whether the palette refers to itself.
const unused = [...themeTokens].filter((token) => !usedTokens.has(token)).sort()
if (unused.length > 0) {
  console.log(`warning: declared in ${THEME_FILE} and read nowhere: ${unused.join(', ')}`)
}

console.log(
  `theme gate: ${plural(files.length, 'file')} scanned, ` +
    `${plural(themeTokens.size, 'token')} declared, ` +
    `${plural(violations.length, 'violation')}, ${plural(unused.length, 'warning')}`,
)

process.exit(violations.length > 0 ? 1 : 0)
