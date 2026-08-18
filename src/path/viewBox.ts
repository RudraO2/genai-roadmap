/**
 * Parses an SVG `viewBox` attribute string ("minX minY width height") into its
 * width/height, so a card overlay can convert a path point's SVG-space
 * coordinates into a percentage position without a second geometry source.
 */

export interface ViewBoxSize {
  width: number
  height: number
}

export function parseViewBoxSize(viewBox: string): ViewBoxSize {
  const parts = viewBox.trim().split(/\s+/).map(Number)
  return { width: parts[2] ?? 0, height: parts[3] ?? 0 }
}

export interface PercentPosition {
  leftPct: number
  topPct: number
}

/**
 * An SVG-space point as a percentage of the act's viewBox, so an HTML overlay
 * can sit on the path without measuring the rendered `<svg>` a second time. A
 * zero-sized viewBox yields 0, not `Infinity` — a malformed `viewBox` string
 * must not push an element off-screen.
 */
export function pointToPercent(
  point: { x: number; y: number },
  size: ViewBoxSize,
): PercentPosition {
  return {
    leftPct: size.width === 0 ? 0 : (point.x / size.width) * 100,
    topPct: size.height === 0 ? 0 : (point.y / size.height) * 100,
  }
}
