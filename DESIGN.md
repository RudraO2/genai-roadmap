# Design: small steps, clear direction

The primary audience includes people encountering AI for the first time. A learner
should be able to answer three questions without knowing this project's vocabulary:
What is this? Where do I start? What do I do next?

## Progressive disclosure

1. Home explains the experience and recommends a starting point. It does not demand
   a choice of technical specialties or display the entire curriculum.
2. Courses describe concrete outcomes and audiences. Chapter outlines expand only
   when requested. Beginner is the default; level selection is optional.
3. A course recommends one next lesson. The current chapter is expanded; other
   chapters are available to explore. Full graph controls, filters, and session
   planning are secondary disclosures rather than entry requirements.
4. A lesson shows one activity instruction at a time. The finish checklist precedes
   completion, then the interface offers the next lesson. Extra resources and
   searches remain accessible in a disclosure.

Use plain language on the primary journey: course, chapter, lesson, next step.
Technical terms belong where learners are ready to use them. Existing graph-only
terminology and XP can remain in the optional advanced view.

## Visual language

Warm neutral paper, near-black text, generous spacing, and restrained flat color.
Green means start, continue, progress, or completion. Course icons and top borders
use stable path colors, assigned from IDs rather than positions in a list. The full
graph retains its semantic activity colors and prerequisite connections.

Use Gabarito for headings, Space Grotesk for body and UI, and JetBrains Mono for
short labels. The hero earns a larger display size because it has one job; other
screens prioritize readable instructions and controls. All colors and type values
remain custom properties in `src/theme.css`.

Use quiet borders and selective rounding. The interface should feel approachable,
without letting every surface compete for attention. One filled primary action
leads a task; secondary links and disclosures remain visually quieter.

## Interaction and accessibility

- Native buttons, links, selects, details, and dialog semantics.
- Visible focus rings, logical headings, and a working skip-to-content link.
- Touch actions at least 44px; no important action depends on hover.
- All status colors have a textual equivalent.
- Browser Back follows navigation history; explicit Close returns to the course.
- Previewing a future lesson names prerequisite lessons instead of giving a dead end.
- No ambient animation. Any transition acknowledges an action and respects reduced
  motion. Lesson stepping works without animation.
- Design phone layouts explicitly: stacked course cards, compact navigation, a
  full-screen lesson reader, and accessible action buttons. The full graph stays
  desktop-only; a narrow screen always uses the chapter list.
- Preserve the printable checklist and browser-local progress/export formats.

## Enforced constraints

- No backend, account, database, or new npm dependency.
- Every color and typography value is a token in `src/theme.css`.
- Tailwind is for layout only. No default palette utilities or Inter.
- No gradients, glow, glassmorphism, blur, colored box shadows, emoji icons,
  decorative bento grids, or continuous animation.
- `npm run build` must pass all six gates. UI changes must also be inspected in
  a browser at desktop and phone widths.

The theme and output scripts enforce these constraints. `public/icon.svg` remains
the existing standalone asset exception for literal color. `og-card.html` is the
source for the existing share image. Existing share-image artwork is independent
of the live learner interface.
