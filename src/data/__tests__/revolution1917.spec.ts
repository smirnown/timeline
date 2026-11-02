import { describe, it, expect } from 'vitest'
import { fromOldStyle, revolution1917 } from '../revolution1917'

describe('fromOldStyle', () => {
  it('shifts Julian 1917 dates 13 days forward', () => {
    expect(fromOldStyle('February 23')).toEqual({
      start: '1917-03-08',
      end: '1917-03-08',
      dateNote: 'O.S. Feb 23',
    })
    expect(fromOldStyle('October 25').start).toBe('1917-11-07')
    expect(fromOldStyle('December 31').start).toBe('1918-01-13')
  })

  it('handles ranges within and across months', () => {
    expect(fromOldStyle('March 21-22')).toEqual({
      start: '1917-04-03',
      end: '1917-04-04',
      dateNote: 'O.S. Mar 21–22',
    })
    expect(fromOldStyle('July 26 - August 3')).toEqual({
      start: '1917-08-08',
      end: '1917-08-16',
      dateNote: 'O.S. Jul 26–Aug 3',
    })
  })

  it('spans the whole month for month-only dates', () => {
    expect(fromOldStyle('August')).toEqual({
      start: '1917-08-14',
      end: '1917-09-13',
      dateNote: 'O.S. August',
    })
  })

  it('rejects unrecognised dates', () => {
    expect(() => fromOldStyle('Smarch 3')).toThrow('Unknown month')
  })
})

describe('revolution1917', () => {
  it('contains every entry from the source, in order', () => {
    expect(revolution1917).toHaveLength(123)
    const starts = revolution1917.map((e) => e.start)
    expect(starts).toEqual([...starts].sort())
  })
})
