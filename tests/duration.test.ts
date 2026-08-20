import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { estimateHours, formatHours, isEstimate, ONGOING } from '../src/data/duration.ts'

describe('isEstimate', () => {
  it('accepts the grammar and nothing else', () => {
    for (const good of ['30m', '90m', '3h', '1d', '2w', '10w', ONGOING]) {
      assert.ok(isEstimate(good), good)
    }
    for (const bad of ['', '3', 'h', '3H', '1.5h', 'a few days', '-2h', '3 h', 'soon', 42, null]) {
      assert.ok(!isEstimate(bad), String(bad))
    }
  })
})

describe('estimateHours', () => {
  it('converts each unit', () => {
    assert.equal(estimateHours('60m'), 1)
    assert.equal(estimateHours('90m'), 1.5)
    assert.equal(estimateHours('3h'), 3)
    assert.equal(estimateHours('1d'), 6)
    assert.equal(estimateHours('1w'), 20)
  })

  it('counts a habit as nothing, so it cannot inflate a remaining figure', () => {
    assert.equal(estimateHours(ONGOING), 0)
  })

  it('never throws on something the validator would have rejected', () => {
    assert.equal(estimateHours('nonsense'), 0)
  })
})

describe('formatHours', () => {
  it('picks a unit a person would say', () => {
    assert.equal(formatHours(0.5), '30m')
    assert.equal(formatHours(3), '3h')
    assert.equal(formatHours(18), '3 days')
    assert.equal(formatHours(60), '3 weeks')
  })

  it('says so rather than printing a zero', () => {
    assert.equal(formatHours(0), 'nothing timed')
  })

  it('can reach every singular, so no plural guard is dead code', () => {
    assert.equal(formatHours(6), '1 day')
    assert.equal(formatHours(20), '1 week')
  })

  it('hands over between units without skipping one', () => {
    const seen = new Set<string>()
    for (let hours = 0.25; hours < 120; hours += 0.25) {
      const unit = formatHours(hours).replace(/^[\d.]+\s?/, '')
      seen.add(unit)
    }
    for (const unit of ['m', 'h', 'day', 'days', 'week', 'weeks']) {
      assert.ok(seen.has(unit), `never printed "${unit}"`)
    }
  })
})
