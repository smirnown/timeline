/**
 * An ISO calendar date: `YYYY-MM-DD`, or `YYYY-MM` when only the month is known.
 * A month-only `start` counts from the month's first day and a month-only `end`
 * runs to its last day, so `{ start: '1917-08', end: '1917-08' }` spans August.
 */
export type DateString = string

export type HistoricalEvent = {
  start: DateString
  /** Equal to `start` for single-day (or single-month) events. */
  end: DateString
  title: string
  description: string
  url: string | null
  /** Optional aside shown next to the dates, e.g. the date in another calendar. */
  dateNote?: string
}

export type TimelineLayoutOptions = {
  /** Horizontal scale of the timeline. */
  pixelsPerYear: number
  /** Width of each annotation card, used to keep cards from overlapping. */
  cardWidth: number
  /** Minimum horizontal space between two cards in the same lane. */
  gap: number
  /** Empty space before the first event and after the last card. */
  padding: number
  /** Minimum distance between axis ticks. */
  minTickSpacing: number
}

export const defaultLayoutOptions: TimelineLayoutOptions = {
  pixelsPerYear: 120,
  cardWidth: 220,
  gap: 16,
  padding: 24,
  minTickSpacing: 80,
}

export type PlacedEvent = {
  key: string
  event: HistoricalEvent
  /** Left edge of the event, in px from the start of the track. */
  x: number
  /** Width of the event's date-range bar in px (0 for single-day events). */
  barWidth: number
  isPoint: boolean
  /** True when either end of the event is only known to the month. */
  approximate: boolean
}

export type Tick = { x: number; label: string }

export type TimelineLayout = {
  /** Total width of the track in px. */
  width: number
  /** Events grouped into rows so that no two cards in a row overlap. */
  lanes: PlacedEvent[][]
  ticks: Tick[]
}

const MS_PER_DAY = 86_400_000
const DAYS_PER_YEAR = 365.2425
/** Shortest bar drawn for a multi-day event, so short ranges stay visible. */
const MIN_BAR_WIDTH = 4
/** Candidate tick intervals, in months. */
const TICK_STEPS = [1, 2, 3, 6, 12, 24, 60, 120, 240, 600, 1200, 6000]

type ParsedDate = { year: number; monthIndex: number; day: number | null }

function parseDate(value: DateString): ParsedDate {
  const match = /^(-?\d{1,6})-(\d{2})(?:-(\d{2}))?$/.exec(value)
  if (!match) {
    throw new Error(`Invalid date "${value}", expected YYYY-MM-DD or YYYY-MM`)
  }
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = match[3] === undefined ? null : Number(match[3])
  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Invalid date "${value}": month must be 01–12`)
  }
  if (day !== null && (day < 1 || day > daysInMonth(year, monthIndex))) {
    throw new Error(`Invalid date "${value}": no such day in that month`)
  }
  return { year, monthIndex, day }
}

function daysInMonth(year: number, monthIndex: number): number {
  return dayFromParts(year, monthIndex + 1, 1) - dayFromParts(year, monthIndex, 1)
}

/** True for a `YYYY-MM` date, whose day isn't known. */
export function isMonthOnly(value: DateString): boolean {
  return parseDate(value).day === null
}

/**
 * Parses a date into a whole number of days since 1970-01-01 (UTC). A
 * month-only date resolves to the month's first day, or its last day when
 * `edge` is `'end'`.
 */
export function parseDay(value: DateString, edge: 'start' | 'end' = 'start'): number {
  const { year, monthIndex, day } = parseDate(value)
  if (day !== null) {
    return dayFromParts(year, monthIndex, day)
  }
  return edge === 'start'
    ? dayFromParts(year, monthIndex, 1)
    : dayFromParts(year, monthIndex, daysInMonth(year, monthIndex))
}

/** First and last day an event covers, tolerating `start` and `end` given in either order. */
export function eventSpan(event: HistoricalEvent): { startDay: number; endDay: number } {
  return {
    startDay: Math.min(parseDay(event.start, 'start'), parseDay(event.end, 'start')),
    endDay: Math.max(parseDay(event.start, 'end'), parseDay(event.end, 'end')),
  }
}

function dayFromParts(year: number, monthIndex: number, day: number): number {
  const date = new Date(0)
  // setUTCFullYear, unlike Date.UTC, doesn't remap years 0–99 to the 1900s.
  date.setUTCFullYear(year, monthIndex, day)
  return Math.round(date.getTime() / MS_PER_DAY)
}

const monthYearFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})
const fullDateFormat = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value: DateString): string {
  const format = isMonthOnly(value) ? monthYearFormat : fullDateFormat
  return format.format(parseDay(value) * MS_PER_DAY)
}

/** Human-readable date or date range for an event, e.g. "Aug 1917" or "Mar 8, 1917 – Mar 16, 1917". */
export function formatEventDates(event: HistoricalEvent): string {
  const start = formatDate(event.start)
  return event.start === event.end ? start : `${start} – ${formatDate(event.end)}`
}

export function layoutTimeline(
  events: HistoricalEvent[],
  options: Partial<TimelineLayoutOptions> = {},
): TimelineLayout {
  const opts = { ...defaultLayoutOptions, ...options }
  if (events.length === 0) {
    return { width: 0, lanes: [], ticks: [] }
  }

  const pxPerDay = opts.pixelsPerYear / DAYS_PER_YEAR
  const spans = events.map((event, index) => ({ event, index, ...eventSpan(event) }))
  const firstDay = Math.min(...spans.map((s) => s.startDay))
  const toX = (day: number) => opts.padding + (day - firstDay) * pxPerDay

  // Chronological order; on ties, shorter events first so they sit higher up.
  spans.sort((a, b) => a.startDay - b.startDay || a.endDay - b.endDay || a.index - b.index)

  // Greedy interval packing: put each event in the first lane where its
  // footprint (bar or card, whichever is wider) doesn't collide.
  const lanes: PlacedEvent[][] = []
  const laneRightEdges: number[] = []
  let width = 0
  for (const span of spans) {
    const x = toX(span.startDay)
    const isPoint = span.startDay === span.endDay
    const barWidth = isPoint ? 0 : Math.max((span.endDay - span.startDay) * pxPerDay, MIN_BAR_WIDTH)
    const right = x + Math.max(barWidth, opts.cardWidth)

    let lane = laneRightEdges.findIndex((edge) => edge + opts.gap <= x)
    if (lane === -1) {
      lane = lanes.length
      lanes.push([])
      laneRightEdges.push(-Infinity)
    }
    lanes[lane]!.push({
      key: `${span.index}:${span.event.start}:${span.event.title}`,
      event: span.event,
      x,
      barWidth,
      isPoint,
      approximate: isMonthOnly(span.event.start) || isMonthOnly(span.event.end),
    })
    laneRightEdges[lane] = right
    width = Math.max(width, right + opts.padding)
  }

  const lastDay = firstDay + (width - opts.padding) / pxPerDay
  return { width, lanes, ticks: buildTicks(firstDay, lastDay, toX, opts) }
}

/**
 * The largest `pixelsPerYear` at which the laid-out timeline is no wider than
 * `availableWidth` — i.e. the scale where the whole range just fits on screen.
 * Returns `Infinity` when any scale fits (all events on one day) and `null`
 * when none does (too narrow for even a single card).
 */
export function fitPixelsPerYear(
  events: HistoricalEvent[],
  availableWidth: number,
  options: Partial<TimelineLayoutOptions> = {},
): number | null {
  const opts = { ...defaultLayoutOptions, ...options }
  // Mirrors layoutTimeline: width = 2·padding + max over events of
  // (offset + max(barWidth, cardWidth)), where offset and barWidth grow
  // linearly with the scale k (px/day). Each event therefore caps k at
  //   card + offsetDays·k ≤ room   and   (offsetDays + lengthDays)·k ≤ room.
  const room = availableWidth - 2 * opts.padding
  if (events.length === 0) {
    return Infinity
  }
  if (room < opts.cardWidth) {
    return null
  }
  const spans = events.map(eventSpan)
  const firstDay = Math.min(...spans.map((s) => s.startDay))
  let maxPxPerDay = Infinity
  for (const { startDay, endDay } of spans) {
    const offsetDays = startDay - firstDay
    if (offsetDays > 0) {
      maxPxPerDay = Math.min(maxPxPerDay, (room - opts.cardWidth) / offsetDays)
    }
    if (endDay > firstDay) {
      maxPxPerDay = Math.min(maxPxPerDay, room / (endDay - firstDay))
    }
  }
  return maxPxPerDay * DAYS_PER_YEAR
}

function buildTicks(
  firstDay: number,
  lastDay: number,
  toX: (day: number) => number,
  opts: TimelineLayoutOptions,
): Tick[] {
  const pxPerMonth = opts.pixelsPerYear / 12
  const step =
    TICK_STEPS.find((months) => months * pxPerMonth >= opts.minTickSpacing) ??
    TICK_STEPS[TICK_STEPS.length - 1]!

  const first = new Date(firstDay * MS_PER_DAY)
  const firstMonth = first.getUTCFullYear() * 12 + first.getUTCMonth()
  const ticks: Tick[] = []
  for (let m = Math.ceil(firstMonth / step) * step; ; m += step) {
    const year = Math.floor(m / 12)
    const monthIndex = m - year * 12
    const day = dayFromParts(year, monthIndex, 1)
    if (day > lastDay) {
      break
    }
    if (day < firstDay) {
      continue
    }
    const label = step % 12 === 0 ? String(year) : monthYearFormat.format(day * MS_PER_DAY)
    ticks.push({ x: toX(day), label })
  }
  return ticks
}
