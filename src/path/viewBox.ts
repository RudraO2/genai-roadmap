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
