import { describe, it, expect } from 'vitest'
import { fitPixelsPerYear, layoutTimeline, parseDay, type HistoricalEvent } from '../timeline'

const ev = (start: string, end = start, title = start): HistoricalEvent => ({
  start,
  end,
  title,
  description: '',
  url: null,
})

describe('parseDay', () => {
  it('counts days since the Unix epoch in UTC', () => {
    expect(parseDay('1970-01-01')).toBe(0)
    expect(parseDay('1970-01-02')).toBe(1)
    expect(parseDay('1969-12-31')).toBe(-1)
  })

  it('does not remap years below 100', () => {
    expect(parseDay('0079-08-24')).toBeLessThan(parseDay('1000-01-01'))
  })

  it('rejects malformed dates', () => {
    expect(() => parseDay('1917/11/07')).toThrow('Invalid date')
  })
})

describe('layoutTimeline', () => {
  const opts = { pixelsPerYear: 120, cardWidth: 200, gap: 10, padding: 20 }

  it('returns an empty layout for no events', () => {
    expect(layoutTimeline([], opts)).toEqual({ width: 0, lanes: [], ticks: [] })
  })

  it('places events left to right in chronological order', () => {
    const { lanes } = layoutTimeline([ev('1950-01-01'), ev('1900-01-01')], opts)
    expect(lanes).toHaveLength(1)
    expect(lanes[0]!.map((e) => e.event.start)).toEqual(['1900-01-01', '1950-01-01'])
    expect(lanes[0]![0]!.x).toBe(20)
    expect(lanes[0]![1]!.x).toBeCloseTo(20 + 50 * 120, 0)
  })

  it('moves events whose cards would overlap into new lanes', () => {
    const { lanes } = layoutTimeline(
      [ev('1917-03-08', '1917-03-16'), ev('1917-11-07'), ev('1917-11-07', '1922-10-25')],
      opts,
    )
    expect(lanes.map((l) => l.map((e) => e.event.start))).toEqual([
      ['1917-03-08'],
      ['1917-11-07'],
      ['1917-11-07'],
    ])
    expect(lanes[1]![0]!.isPoint).toBe(true)
    expect(lanes[2]![0]!.isPoint).toBe(false)
  })

  it('reuses a lane once the previous card has ended', () => {
    const { lanes } = layoutTimeline([ev('1900-01-01'), ev('1901-01-01'), ev('1903-01-01')], opts)
    expect(lanes.map((l) => l.length)).toEqual([2, 1])
  })

  it('accounts for long bars, not just cards, when packing', () => {
    const { lanes } = layoutTimeline([ev('1900-01-01', '1910-01-01'), ev('1905-01-01')], opts)
    expect(lanes).toHaveLength(2)
  })

  it('is wide enough to fit the last card plus padding', () => {
    const { width, lanes } = layoutTimeline([ev('1900-01-01'), ev('1920-01-01')], opts)
    const last = lanes[0]![1]!
    expect(width).toBeCloseTo(last.x + 200 + 20)
  })

  it('labels ticks by year when zoomed out and by month when zoomed in', () => {
    const events = [ev('1917-01-01', '1918-01-01')]
    const years = layoutTimeline(events, { ...opts, pixelsPerYear: 100 }).ticks
    expect(years.map((t) => t.label)).toContain('1918')
    const months = layoutTimeline(events, { ...opts, pixelsPerYear: 2000 }).ticks
    expect(months.length).toBeGreaterThan(12)
    expect(months[0]!.label).toMatch(/1917/)
    expect(months[0]!.label).not.toBe('1917')
  })
})

describe('fitPixelsPerYear', () => {
  const opts = { cardWidth: 200, gap: 10, padding: 20 }

  it('finds the scale at which the layout exactly fills the width', () => {
    const cases: HistoricalEvent[][] = [
      [ev('1900-01-01'), ev('1950-06-01')],
      [ev('1900-01-01', '1990-01-01'), ev('1910-01-01')],
      [ev('1905-01-22', '1907-06-16'), ev('1917-03-08'), ev('1917-11-07', '1922-10-25')],
    ]
    for (const events of cases) {
      for (const available of [400, 1000, 2500]) {
        const fit = fitPixelsPerYear(events, available, opts)!
        expect(layoutTimeline(events, { ...opts, pixelsPerYear: fit }).width).toBeCloseTo(
          available,
          6,
        )
      }
    }
  })

  it('is limited by a long bar when it reaches past the last card', () => {
    // 10-year bar, nothing else: the bar alone must fit in 1000 - 2·20 px.
    const fit = fitPixelsPerYear([ev('1900-01-01', '1910-01-01')], 1000, opts)!
    expect(
      layoutTimeline([ev('1900-01-01', '1910-01-01')], { ...opts, pixelsPerYear: fit })
        .lanes[0]![0]!.barWidth,
    ).toBeCloseTo(960, 6)
  })

  it('returns Infinity when every event is on the same day', () => {
    expect(fitPixelsPerYear([ev('1917-11-07'), ev('1917-11-07')], 1000, opts)).toBe(Infinity)
  })

  it('returns null when not even one card fits', () => {
    expect(fitPixelsPerYear([ev('1900-01-01'), ev('1901-01-01')], 230, opts)).toBeNull()
  })
})
