# Fonts

Self-hosted so the app makes no third-party request at runtime. `CONTEXT.md` section 10 puts
the whole project on a static host with no backend; a CDN font link would quietly
reintroduce a network dependency the deploy cannot control.

Both families are SIL Open Font License 1.1. Downloaded 2026-08-18 with a desktop Chrome
user agent, which is what makes the Google Fonts CSS endpoint hand back `woff2` rather than
`ttf`.

| File | Family | Weights | Subset | Source |
| --- | --- | --- | --- | --- |
| `instrument-serif-400-latin.woff2` | Instrument Serif | 400 | latin | `https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zUTjg.woff2` |
| `instrument-serif-400-latin-ext.woff2` | Instrument Serif | 400 | latin-ext | `https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-6zsTjmbI.woff2` |
| `jetbrains-mono-400-700-latin.woff2` | JetBrains Mono | 400–700 variable | latin | `https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2` |
| `jetbrains-mono-400-700-latin-ext.woff2` | JetBrains Mono | 400–700 variable | latin-ext | `https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx7cwhsk.woff2` |

The `unicode-range` values in `../theme.css` are copied verbatim from the same endpoint. They
matter: the latin subset covers U+2191 and U+2193 but **not** U+2192, so a `→` in the UI
falls back to whatever the system serves. Structural marks use ASCII in the mono face.

Only latin and latin-ext are vendored. Cyrillic, Greek and Vietnamese are not — no string in
the registry needs them. If one ever does, fetch the matching subset from the same endpoint
rather than dropping the `unicode-range` guards.
