/**
 * Properties of the real registry that the interface assumes without checking.
 *
 * The validator already rejects a dangling edge, a cycle and a grid collision.
 * What is here is the layer above that: the promises the *app* makes — that
 * walking a path in order is always possible, that a session plan over real data
 * is achievable, and that the content rules in CLAUDE.md actually hold.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { estimateHours, isEstimate } from '../src/data/duration.ts'
import { registry } from '../src/data/roadmap.ts'
import { planSession, SESSION_BUDGETS } from '../src/data/session.ts'

describe('every path', () => {
  it('can be walked start to finish in the order it is listed', () => {
    for (const path of registry.paths) {
      const done = new Set<string>()
      for (const node of registry.nodesForPath(path.id)) {
        for (const required of node.requires) {
          // A prerequisite that is not on this path at all cannot block it —
          // that is what lets stages be shared between paths.
          if (!registry.nodesForPath(path.id).some((n) => n.id === required)) continue
          assert.ok(
            done.has(required),
            `${path.id}: ${node.id} is listed before its prerequisite ${required}`,
          )
        }
        done.add(node.id)
      }
    }
  })

  it('starts with at least one quest that is ready on a first visit', () => {
    for (const path of registry.paths) {
      const open = registry
        .nodesForPath(path.id)
        .filter((node) => node.requires.every((id) => !registry.nodesById.has(id)))
      assert.ok(open.length > 0, `${path.id} has nothing to start on`)
    }
  })

  it('names stages that exist, in an order with no repeats', () => {
    for (const path of registry.paths) {
      assert.equal(new Set(path.stages).size, path.stages.length, `${path.id} repeats a stage`)
      for (const stage of path.stages) registry.getStage(stage)
    }
  })
})

describe('every quest', () => {
  it('carries an estimate the arithmetic can read', () => {
    for (const node of registry.nodes) {
      assert.ok(isEstimate(node.est), `${node.id}: "${node.est}"`)
    }
  })

  it('carries instructions rather than a bookmark', () => {
    for (const node of registry.nodes) {
      assert.ok(node.steps.length >= 2, `${node.id} has fewer than two steps`)
      assert.ok(node.done_when.length >= 1, `${node.id} has no finish condition`)
      assert.ok(node.links.length >= 1, `${node.id} points nowhere`)
      assert.ok(node.search.length >= 1, `${node.id} has no search`)
    }
  })

  it('keeps every unverified link to a shallow, stable root', () => {
    for (const node of registry.nodes) {
      for (const link of node.links) {
        assert.match(link.url, /^https:\/\//, `${node.id}: ${link.url}`)
        if (link.verified) continue
        const depth = new URL(link.url).pathname.split('/').filter(Boolean).length
        assert.ok(depth <= 2, `${node.id}: unverified deep link ${link.url}`)
      }
    }
  })

  it('is reachable on at least one path', () => {
    const reachable = new Set(registry.paths.flatMap((p) => registry.nodesForPath(p.id).map((n) => n.id)))
    for (const node of registry.nodes) {
      assert.ok(reachable.has(node.id), `${node.id} is on no path and can never be seen`)
    }
  })
})

describe('planSession over real data', () => {
  it('only ever suggests quests that are genuinely unlocked', () => {
    for (const path of registry.paths) {
      const ordered = registry.nodesForPath(path.id)
      for (const budget of SESSION_BUDGETS) {
        const done = new Set<string>()
        for (const quest of planSession(ordered, done, budget.hours).quests) {
          assert.ok(
            quest.requires.every((id) => done.has(id) || !ordered.some((n) => n.id === id)),
            `${path.id}/${budget.id}: ${quest.id} was planned while locked`,
          )
          done.add(quest.id)
        }
      }
    }
  })

  it('fills every budget with something, from a standing start', () => {
    for (const path of registry.paths) {
      const ordered = registry.nodesForPath(path.id)
      for (const budget of SESSION_BUDGETS) {
        const plan = planSession(ordered, new Set(), budget.hours)
        assert.ok(plan.quests.length > 0, `${path.id} offers nothing for ${budget.label}`)
        assert.ok(plan.hours <= budget.hours + 1e-9, `${path.id}/${budget.id} overshot`)
      }
    }
  })

  it('adds up to what it says it does', () => {
    const ordered = registry.nodesForPath('engineer')
    const plan = planSession(ordered, new Set(), 6)
    const summed = plan.quests.reduce((total, quest) => total + estimateHours(quest.est), 0)
    assert.ok(Math.abs(summed - plan.hours) < 1e-9)
  })
})
