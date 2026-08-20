import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formatRoute, parseRoute } from '../src/data/route.ts'

describe('parseRoute', () => {
  it('reads the three shapes', () => {
    assert.deepEqual(parseRoute('#/'), { path: null, quest: null })
    assert.deepEqual(parseRoute('#/engineer'), { path: 'engineer', quest: null })
    assert.deepEqual(parseRoute('#/engineer/rag-pipeline'), {
      path: 'engineer',
      quest: 'rag-pipeline',
    })
  })

  it('treats an empty or malformed hash as the picker', () => {
    for (const hash of ['', '#', '#/', '#//', '#/nope', '#/nope/nope']) {
      assert.deepEqual(parseRoute(hash), { path: null, quest: null }, hash)
    }
  })

  it('drops a quest that does not exist rather than throwing', () => {
    assert.deepEqual(parseRoute('#/engineer/no-such-quest'), { path: 'engineer', quest: null })
  })

  it('drops a real quest that is not on the named path', () => {
    // lora-qlora is Model Builder's; asking for it on the engineer map is a
    // link that has gone stale, not a redirect to another path.
    assert.deepEqual(parseRoute('#/engineer/lora-qlora'), { path: 'engineer', quest: null })
  })

  it('ignores anything past the second segment', () => {
    assert.deepEqual(parseRoute('#/engineer/rag-pipeline/extra/junk'), {
      path: 'engineer',
      quest: 'rag-pipeline',
    })
  })

  it('round-trips through formatRoute', () => {
    for (const route of [
      { path: null, quest: null },
      { path: 'creator', quest: null },
      { path: 'builder', quest: 'lora-qlora' },
    ] as const) {
      assert.deepEqual(parseRoute(formatRoute(route)), route)
    }
  })
})
