/**
 * Progress derivation, against the real registry. These are the numbers every
 * surface in the app reads, so a regression here would be wrong in four places
 * at once and look consistent while it did it.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { registry } from '../src/data/roadmap.ts'
import {
  blockedBy,
  computePathProgress,
  levelFit,
  stageStateFor,
  stateOf,
  tallyFor,
} from '../src/data/state.ts'
import type { Level } from '../src/types.ts'

const engineer = registry.getPath('engineer')

describe('stateOf', () => {
  it('is ready only when every prerequisite is done', () => {
    const node = registry.getNode('rag-pipeline')
    assert.ok(node.requires.length > 0, 'fixture must have prerequisites')
    assert.equal(stateOf(node, new Set()), 'locked')
    assert.equal(stateOf(node, new Set(node.requires)), 'ready')
    assert.equal(stateOf(node, new Set([...node.requires, node.id])), 'done')
  })

  it('counts done before ready, so a completed quest never reads as available', () => {
    const node = registry.getNode('what-is-genai')
    assert.equal(stateOf(node, new Set([node.id])), 'done')
  })
})

describe('blockedBy', () => {
  it('names only the prerequisites still outstanding', () => {
    const node = registry.getNode('rag-pipeline')
    const [first] = node.requires
    const blockers = blockedBy(node, new Set([first!]))
    assert.equal(blockers.length, node.requires.length - 1)
    assert.ok(!blockers.some((blocker) => blocker.id === first))
  })
})

describe('computePathProgress', () => {
  it('starts at zero with everything ahead', () => {
    const progress = computePathProgress(engineer, new Set())
    assert.equal(progress.overall.done, 0)
    assert.equal(progress.percent, 0)
    assert.ok(progress.overall.total > 0)
    assert.ok(progress.hoursLeft > 0)
  })

  it('reaches exactly 100 per cent, and stops recommending', () => {
    const all = new Set(registry.nodesForPath('engineer').map((node) => node.id))
    const progress = computePathProgress(engineer, all)
    assert.equal(progress.percent, 100)
    assert.equal(progress.next, null)
    assert.equal(progress.readyCount, 0)
    assert.equal(progress.hoursLeft, 0)
  })

  it('never recommends something that is locked', () => {
    // Walk the whole path taking the recommendation each time. If the
    // recommendation were ever wrong, this would surface it at some depth
    // rather than only on the first step.
    const done = new Set<string>()
    for (let step = 0; step < 200; step += 1) {
      const progress = computePathProgress(engineer, done)
      const next = progress.next
      if (next === null) break
      assert.equal(stateOf(next, done), 'ready', `${next.id} was recommended while locked`)
      done.add(next.id)
    }
    assert.equal(computePathProgress(engineer, done).next, null)
  })

  it('prefers core work over a side quest when both are open', () => {
    const progress = computePathProgress(engineer, new Set())
    assert.notEqual(progress.next?.type, 'side')
  })

  it('measures per cent in XP, not in node count', () => {
    const nodes = registry.nodesForPath('engineer')
    const cheapest = [...nodes].sort((a, b) => a.xp - b.xp)[0]!
    const progress = computePathProgress(engineer, new Set([cheapest.id]))
    const byCount = (1 / nodes.length) * 100
    assert.ok(progress.percent < byCount, 'a cheap quest must be worth less than 1/n of the bar')
  })

  it('keeps the stage tallies summing to the overall one', () => {
    const done = new Set(['what-is-genai', 'model-zoo', 'chat-craft'])
    const progress = computePathProgress(engineer, done)
    let stageDone = 0
    let stageTotal = 0
    let stageHours = 0
    for (const stageId of engineer.stages) {
      const tally = tallyFor(progress, stageId)
      stageDone += tally.done
      stageTotal += tally.total
      stageHours += tally.hoursLeft
    }
    assert.equal(stageDone, progress.overall.done)
    assert.equal(stageTotal, progress.overall.total)
    assert.ok(Math.abs(stageHours - progress.hoursLeft) < 1e-9)
  })

  it('puts the current stage where the recommendation is', () => {
    const progress = computePathProgress(engineer, new Set())
    assert.equal(progress.currentStage, progress.next?.stage)
    assert.equal(stageStateFor(progress, progress.currentStage!), 'current')
  })

  it('falls back to the last stage once the path is finished', () => {
    const all = new Set(registry.nodesForPath('engineer').map((node) => node.id))
    const progress = computePathProgress(engineer, all)
    assert.equal(progress.currentStage, engineer.stages[engineer.stages.length - 1])
  })
})

describe('levelFit', () => {
  it('marks anything below the learner as review', () => {
    assert.equal(levelFit(registry.getNode('what-is-genai'), 'advanced'), 'review')
  })

  it('does not flag one level up, because that is what a roadmap is for', () => {
    const intermediate = registry.nodes.find((node) => node.level === 'intermediate')!
    assert.equal(levelFit(intermediate, 'beginner'), 'match')
  })

  it('flags two levels up', () => {
    const advanced = registry.nodes.find((node) => node.level === 'advanced')!
    assert.equal(levelFit(advanced, 'beginner'), 'stretch')
  })

  it('marks a quest at the learner’s own level as a match, at every level', () => {
    for (const level of ['beginner', 'intermediate', 'advanced'] as Level[]) {
      const node = registry.nodes.find((candidate) => candidate.level === level)!
      assert.equal(levelFit(node, level), 'match')
    }
  })
})
