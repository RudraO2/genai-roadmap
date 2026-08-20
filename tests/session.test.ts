/**
 * The session planner. Pure input, pure output, no registry and no DOM, which is
 * why these fixtures are five nodes rather than ninety-four: the thing under test
 * is the planning rule, and a real path would only obscure it.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { planSession, SESSION_BUDGETS } from '../src/data/session.ts'
import type { NodeType, RoadmapNode } from '../src/types.ts'

function node(
  id: string,
  est: string,
  requires: string[] = [],
  type: NodeType = 'core',
): RoadmapNode {
  return {
    id,
    title: id,
    blurb: '',
    stage: 'stage',
    col: 0,
    row: 0,
    level: 'beginner',
    type,
    requires,
    est,
    xp: 10,
    mission: '',
    why: '',
    steps: ['a', 'b'],
    done_when: ['x'],
    links: [],
    search: [],
    tags: [],
  }
}

const ids = (plan: { quests: readonly RoadmapNode[] }): string[] =>
  plan.quests.map((quest) => quest.id)

describe('planSession', () => {
  it('takes what fits and stops', () => {
    const path = [node('a', '30m'), node('b', '30m'), node('c', '30m')]
    const plan = planSession(path, new Set(), 1)
    assert.deepEqual(ids(plan), ['a', 'b'])
    assert.equal(plan.hours, 1)
  })

  it('plans through its own unlocks', () => {
    // b is locked until a is done. A filter would never offer it; a plan must.
    const path = [node('a', '1h'), node('b', '1h', ['a'])]
    assert.deepEqual(ids(planSession(path, new Set(), 2)), ['a', 'b'])
  })

  it('never suggests a quest whose prerequisites are outstanding', () => {
    const path = [node('a', '1h'), node('b', '1h', ['a'])]
    // Only room for one, so b's prerequisite cannot be met inside the session.
    assert.deepEqual(ids(planSession(path, new Set(), 1)), ['a'])
  })

  it('skips what is already done', () => {
    const path = [node('a', '1h'), node('b', '1h')]
    assert.deepEqual(ids(planSession(path, new Set(['a']), 2)), ['b'])
  })

  it('steps over a quest that is too big and keeps looking', () => {
    const path = [node('big', '1w'), node('small', '30m')]
    const plan = planSession(path, new Set(), 1)
    assert.deepEqual(ids(plan), ['small'])
    assert.equal(plan.tooBig?.id, 'big')
  })

  it('prefers core work, and takes the earliest side quest only if nothing else fits', () => {
    const path = [node('side1', '30m', [], 'side'), node('side2', '30m', [], 'side'), node('core', '30m')]
    assert.deepEqual(ids(planSession(path, new Set(), 0.5)), ['core'])
    // With core gone, the earliest side quest is the one taken — not the last.
    assert.deepEqual(ids(planSession(path, new Set(['core']), 0.5)), ['side1'])
  })

  it('never plans an ongoing habit, which would fit every budget forever', () => {
    const path = [node('habit', 'ongoing'), node('task', '30m')]
    const plan = planSession(path, new Set(), 6)
    assert.deepEqual(ids(plan), ['task'])
  })

  it('returns an empty plan and names the blocker when nothing fits', () => {
    const path = [node('big', '1w')]
    const plan = planSession(path, new Set(), 1 / 3)
    assert.deepEqual(ids(plan), [])
    assert.equal(plan.hours, 0)
    assert.equal(plan.tooBig?.id, 'big')
  })

  it('never exceeds the budget it was given', () => {
    const path = Array.from({ length: 30 }, (_, i) => node(`n${i}`, '45m'))
    for (const budget of SESSION_BUDGETS) {
      const plan = planSession(path, new Set(), budget.hours)
      assert.ok(plan.hours <= budget.hours, `${budget.id}: ${plan.hours} > ${budget.hours}`)
    }
  })

  it('terminates on a path where nothing is ready', () => {
    // Every node blocked by one that is not in the list at all.
    const path = [node('a', '1h', ['missing']), node('b', '1h', ['missing'])]
    assert.deepEqual(ids(planSession(path, new Set(), 100)), [])
  })
})
