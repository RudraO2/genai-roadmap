/**
 * The layout solver. It owns every pixel on the map, so the properties worth
 * asserting are geometric: nothing overlaps, nothing is drawn out of order, and
 * an edge never points at a box that is not on the canvas.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { computeLayout, METRICS } from '../src/data/layout.ts'
import { registry } from '../src/data/roadmap.ts'

const overlaps = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

describe('computeLayout', () => {
  it('lays out every path without overlapping a single box', () => {
    for (const path of registry.paths) {
      const layout = computeLayout(path.id)
      const boxes = [...layout.nodes.values()]
      assert.ok(boxes.length > 0, path.id)
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          assert.ok(
            !overlaps(boxes[i]!.box, boxes[j]!.box),
            `${path.id}: ${boxes[i]!.node.id} overlaps ${boxes[j]!.node.id}`,
          )
        }
      }
    }
  })

  it('draws every box inside the canvas', () => {
    for (const path of registry.paths) {
      const layout = computeLayout(path.id)
      for (const { node, box } of layout.nodes.values()) {
        assert.ok(box.x >= 0 && box.x + box.w <= layout.width, `${path.id}/${node.id} horizontally`)
        assert.ok(box.y >= 0 && box.y + box.h <= layout.height, `${path.id}/${node.id} vertically`)
      }
    }
  })

  it('never places a prerequisite below the quest that needs it', () => {
    for (const path of registry.paths) {
      const layout = computeLayout(path.id)
      for (const { node, box } of layout.nodes.values()) {
        for (const required of node.requires) {
          const source = layout.nodes.get(required)
          if (!source) continue
          assert.ok(
            source.box.y <= box.y,
            `${path.id}: ${required} sits below its dependent ${node.id}`,
          )
        }
      }
    }
  })

  it('stacks bands in the path’s own stage order, with no gaps left behind', () => {
    for (const path of registry.paths) {
      const layout = computeLayout(path.id)
      const order = layout.bands.map((band) => band.stage.id)
      const expected = path.stages.filter((id) => order.includes(id))
      assert.deepEqual(order, expected, path.id)
      for (let i = 1; i < layout.bands.length; i += 1) {
        const previous = layout.bands[i - 1]!
        assert.equal(layout.bands[i]!.y, previous.y + previous.height + METRICS.bandGap)
      }
    }
  })

  it('closes the gap when a filtered row empties', () => {
    const full = computeLayout('engineer')
    const sides = new Set(
      registry.nodesForPath('engineer').filter((node) => node.type === 'side').map((n) => n.id),
    )
    const filtered = computeLayout('engineer', { hidden: sides })
    assert.ok(filtered.height <= full.height)
    assert.equal(filtered.nodes.size, full.nodes.size - sides.size)
  })

  it('draws a collapsed stage as a header and nothing else', () => {
    const collapsed = new Set(registry.getPath('engineer').stages.slice(1))
    const layout = computeLayout('engineer', { collapsed })
    for (const band of layout.bands) {
      if (!collapsed.has(band.stage.id)) continue
      assert.equal(band.nodes.length, 0, band.stage.id)
      assert.equal(band.height, METRICS.collapsedH)
      assert.ok(band.count > 0, 'a collapsed band must still report what it holds')
    }
    // Collapsing all but one stage has to make the canvas dramatically shorter:
    // that is the entire reason the feature exists.
    assert.ok(layout.height < computeLayout('engineer').height / 2)
  })

  it('drops the edges of a stage it did not draw', () => {
    const collapsed = new Set(registry.getPath('engineer').stages.slice(1))
    const layout = computeLayout('engineer', { collapsed })
    for (const edge of layout.edges) {
      assert.ok(layout.nodes.has(edge.from), `edge from missing node ${edge.from}`)
      assert.ok(layout.nodes.has(edge.to), `edge to missing node ${edge.to}`)
    }
  })

  it('routes every edge to a path string a browser could draw', () => {
    for (const path of registry.paths) {
      for (const edge of computeLayout(path.id).edges) {
        assert.match(edge.d, /^M [\d.-]+ [\d.-]+/, `${path.id}: ${edge.id}`)
        assert.ok(!edge.d.includes('NaN'), `${path.id}: ${edge.id} has a NaN coordinate`)
      }
    }
  })

  it('is deterministic', () => {
    assert.deepEqual(computeLayout('creator').bands.map((b) => b.y), computeLayout('creator').bands.map((b) => b.y))
  })
})
