export type HistoricalEvent = {
  /** ISO calendar date, `YYYY-MM-DD` */
  start: string
  /** ISO calendar date, `YYYY-MM-DD`. Equal to `start` for single-day events. */
  end: string
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

/** Parses `YYYY-MM-DD` into a whole number of days since 1970-01-01 (UTC). */
export function parseDay(iso: string): number {
  const match = /^(-?\d{1,6})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) {
    throw new Error(`Invalid date "${iso}", expected YYYY-MM-DD`)
  }
  return dayFromParts(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
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

/** Human-readable date or date range for an event. */
export function formatEventDates(event: HistoricalEvent): string {
  const start = fullDateFormat.format(parseDay(event.start) * MS_PER_DAY)
  if (event.start === event.end) {
    return start
  }
  return `${start} – ${fullDateFormat.format(parseDay(event.end) * MS_PER_DAY)}`
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
  const spans = events.map((event, index) => {
    const a = parseDay(event.start)
    const b = parseDay(event.end)
    return { event, index, startDay: Math.min(a, b), endDay: Math.max(a, b) }
  })
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
    })
    laneRightEdges[lane] = right
    width = Math.max(width, right + opts.padding)
  }

  const lastDay = firstDay + (width - opts.padding) / pxPerDay
  return { width, lanes, ticks: buildTicks(firstDay, lastDay, toX, opts) }
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
