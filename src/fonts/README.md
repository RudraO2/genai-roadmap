# Fonts

Self-hosted so the app makes no third-party request at runtime. `CONTEXT.md` section 10 puts
the whole project on a static host with no backend; a CDN font link would quietly
reintroduce a network dependency the deploy cannot control.

All three families are SIL Open Font License 1.1. Downloaded with a desktop Chrome
user agent, which is what makes the Google Fonts CSS endpoint hand back `woff2` rather than
`ttf`.

| File | Family | Weights | Subset | Source |
| --- | --- | --- | --- | --- |
| `gabarito-400-900-latin.woff2` | Gabarito | 400–900 variable | latin | `https://fonts.gstatic.com/s/gabarito/v9/QGYtz_0dZAGKJJ4t3HtoW4U.woff2` |
| `gabarito-400-900-latin-ext.woff2` | Gabarito | 400–900 variable | latin-ext | `https://fonts.gstatic.com/s/gabarito/v9/QGYtz_0dZAGKJJ4t3HtmW4XUng.woff2` |
| `space-grotesk-300-700-latin.woff2` | Space Grotesk | 300–700 variable | latin | `https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPbF4Cw.woff2` |
| `space-grotesk-300-700-latin-ext.woff2` | Space Grotesk | 300–700 variable | latin-ext | `https://fonts.gstatic.com/s/spacegrotesk/v22/V8mDoQDjQSkFtoMM3T6r8E7mPb94C-s0.woff2` |
| `jetbrains-mono-400-700-latin.woff2` | JetBrains Mono | 400–700 variable | latin | `https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2` |
| `jetbrains-mono-400-700-latin-ext.woff2` | JetBrains Mono | 400–700 variable | latin-ext | `https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPx7cwhsk.woff2` |

The `unicode-range` values in `../theme.css` are copied verbatim from the same endpoint. They
matter: the latin subset covers U+2191 and U+2193 but **not** U+2192, so a `→` in the UI
falls back to whatever the system serves. Structural marks use ASCII in the mono face.

Only latin and latin-ext are vendored. Cyrillic, Greek and Vietnamese are not — no string in
the registry needs them. If one ever does, fetch the matching subset from the same endpoint
rather than dropping the `unicode-range` guards.

Instrument Serif was vendored here from spec 02 to spec 13 and is gone. `CONTEXT.md`
section 8 was amended on 2026-08-19: the identity is paper roadmap, the display face is
Gabarito, and there is no serif in the stack. Do not re-add one without amending it again.
