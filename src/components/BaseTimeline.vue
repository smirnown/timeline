<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import {
  defaultLayoutOptions,
  fitPixelsPerYear,
  formatEventDates,
  layoutTimeline,
  type HistoricalEvent,
} from './timeline'

const props = withDefaults(
  defineProps<{
    events: HistoricalEvent[]
    title?: string
    /** Initial horizontal scale: how many pixels one year takes up. */
    pixelsPerYear?: number
  }>(),
  { title: undefined, pixelsPerYear: defaultLayoutOptions.pixelsPerYear },
)

const CARD_WIDTH = defaultLayoutOptions.cardWidth
const PADDING = defaultLayoutOptions.padding
/** Each zoom click scales the timeline by this factor. */
const ZOOM_FACTOR = 1.5
/** Furthest you can zoom in from the initial scale (1.5^6 ≈ 11×). */
const MAX_ZOOM = ZOOM_FACTOR ** 6
/** Fallback zoom-out limit when the viewport is too narrow for the whole range to fit. */
const MIN_ZOOM_FALLBACK = 1 / MAX_ZOOM
/** Tolerance for comparing zoom levels, to absorb floating-point drift. */
const EPSILON = 1e-6

/** Zoom relative to the `pixelsPerYear` prop: 1 is 100%. */
const zoom = ref(1)
watch(
  () => props.pixelsPerYear,
  () => (zoom.value = 1),
)

const viewport = useTemplateRef<HTMLElement>('viewport')
/** Inner width of the scroll viewport, kept current as the window resizes. */
const viewportWidth = ref(0)
watch(viewport, (el, _, onCleanup) => {
  if (!el || typeof ResizeObserver === 'undefined') {
    return
  }
  const observer = new ResizeObserver(() => (viewportWidth.value = el.clientWidth))
  observer.observe(el)
  viewportWidth.value = el.clientWidth
  onCleanup(() => observer.disconnect())
})

/**
 * Zooming out stops once the whole range fits in the viewport; past that it
 * would only add empty space. If the initial scale already fits, that's the floor.
 */
const minZoom = computed(() => {
  const fit = viewportWidth.value
    ? fitPixelsPerYear(props.events, viewportWidth.value, { cardWidth: CARD_WIDTH })
    : null
  return fit === null ? MIN_ZOOM_FALLBACK : Math.min(1, fit / props.pixelsPerYear)
})

const canZoomOut = computed(() => zoom.value > minZoom.value + EPSILON)
const canZoomIn = computed(() => zoom.value < MAX_ZOOM - EPSILON)

const pixelsPerYear = computed(() => props.pixelsPerYear * zoom.value)
const zoomPercent = computed(() => Math.round(zoom.value * 100))

const layout = computed(() =>
  layoutTimeline(props.events, { pixelsPerYear: pixelsPerYear.value, cardWidth: CARD_WIDTH }),
)

/** Zooms by `steps` clicks (negative zooms out), keeping the centred date in place. */
function zoomBy(steps: number) {
  setZoom(zoom.value * ZOOM_FACTOR ** steps)
}

async function setZoom(target: number) {
  const next = Math.min(MAX_ZOOM, Math.max(minZoom.value, target))
  if (Math.abs(next - zoom.value) < EPSILON) {
    return
  }
  const el = viewport.value
  const scale = next / zoom.value
  // Track positions are linear in time after the left padding, so the
  // distance from the padding to the view's centre simply scales.
  const centre = el ? el.scrollLeft + el.clientWidth / 2 - PADDING : 0
  zoom.value = next
  await nextTick()
  if (el) {
    el.scrollLeft = centre * scale + PADDING - el.clientWidth / 2
  }
}
</script>

<template>
  <section class="timeline">
    <div class="timeline-header">
      <h2 v-if="title" class="timeline-title">{{ title }}</h2>
      <div v-if="events.length > 0" class="zoom" role="group" aria-label="Zoom">
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          :disabled="!canZoomOut"
          @click="zoomBy(-1)"
        >
          −
        </button>
        <button
          type="button"
          class="zoom-level"
          title="Reset zoom"
          :aria-label="`Reset zoom (currently ${zoomPercent}%)`"
          :disabled="Math.abs(zoom - 1) < EPSILON"
          @click="setZoom(1)"
        >
          {{ zoomPercent }}%
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          :disabled="!canZoomIn"
          @click="zoomBy(1)"
        >
          +
        </button>
      </div>
    </div>
    <p v-if="events.length === 0" class="timeline-empty">No events yet.</p>

    <!-- The scroll viewport: the track inside has a fixed width, so a long
         timeline scrolls sideways instead of wrapping. -->
    <div
      v-else
      ref="viewport"
      class="viewport"
      role="region"
      tabindex="0"
      :aria-label="title ? `${title} timeline` : 'Timeline'"
    >
      <div class="track" :style="{ width: `${layout.width}px` }">
        <div class="axis" aria-hidden="true">
          <span
            v-for="tick in layout.ticks"
            :key="tick.x"
            class="tick-label"
            :style="{ left: `${tick.x}px` }"
          >
            {{ tick.label }}
          </span>
        </div>
        <div
          v-for="tick in layout.ticks"
          :key="tick.x"
          class="gridline"
          aria-hidden="true"
          :style="{ left: `${tick.x}px` }"
        />

        <ol v-for="(lane, i) in layout.lanes" :key="i" class="lane">
          <li
            v-for="item in lane"
            :key="item.key"
            class="event"
            :style="{
              marginLeft: `${item.x}px`,
              width: `${Math.max(item.barWidth, CARD_WIDTH)}px`,
            }"
          >
            <span
              class="bar"
              :class="{ point: item.isPoint, approximate: item.approximate }"
              :style="item.isPoint ? undefined : { width: `${item.barWidth}px` }"
            />
            <article class="card" :style="{ width: `${CARD_WIDTH}px` }">
              <time class="dates" :datetime="item.event.start">
                {{ formatEventDates(item.event) }}
                <span v-if="item.event.dateNote" class="date-note">
                  ({{ item.event.dateNote }})
                </span>
              </time>
              <h3 class="event-title">
                <a v-if="item.event.url" :href="item.event.url" target="_blank" rel="noopener">
                  {{ item.event.title }}
                </a>
                <template v-else>{{ item.event.title }}</template>
              </h3>
              <p v-if="item.event.description" class="description">
                {{ item.event.description }}
              </p>
            </article>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped>
.timeline {
  --accent: hsla(160, 100%, 37%, 1);
  --axis-height: 2rem;
  min-width: 0;
  margin-bottom: 2.5rem;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.timeline-title {
  color: var(--color-heading);
  font-size: 1.5rem;
}

.zoom {
  display: flex;
  margin-left: auto;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  overflow: hidden;
}

.zoom button {
  min-width: 2.25rem;
  padding: 0.25rem 0.5rem;
  border: 0;
  background: var(--color-background-soft);
  color: var(--color-text);
  font: inherit;
  line-height: 1.4;
  cursor: pointer;
}

.zoom button + button {
  border-left: 1px solid var(--color-border);
}

.zoom button:hover:not(:disabled) {
  background: var(--color-background-mute);
}

.zoom button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.zoom button:disabled {
  cursor: default;
  opacity: 0.45;
}

.zoom .zoom-level {
  min-width: 3.75rem;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
}

.viewport {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
}

.viewport:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.track {
  position: relative;
  min-width: 100%;
  padding-bottom: 1rem;
}

.axis {
  position: relative;
  height: var(--axis-height);
  border-bottom: 1px solid var(--color-border-hover);
  margin-bottom: 0.75rem;
}

.tick-label {
  position: absolute;
  bottom: 0.25rem;
  transform: translateX(-50%);
  font-size: 0.75rem;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.gridline {
  position: absolute;
  top: var(--axis-height);
  bottom: 0;
  border-left: 1px dashed var(--color-border);
  pointer-events: none;
}

/* Every event in a lane shares one grid cell and is pushed right by its
   margin, so the lane grows to the height of its tallest card. */
.lane {
  display: grid;
  list-style: none;
  padding: 0;
  margin-bottom: 0.75rem;
}

.event {
  grid-area: 1 / 1;
  justify-self: start;
  position: relative;
}

.bar {
  display: block;
  height: 6px;
  border-radius: 3px;
  background: var(--accent);
}

/* Only the month is known: fade the bar so it doesn't read as an exact range. */
.bar.approximate {
  background: repeating-linear-gradient(
    -45deg,
    var(--accent) 0 4px,
    color-mix(in srgb, var(--accent) 35%, transparent) 4px 8px
  );
}

.bar.point {
  width: 12px;
  height: 12px;
  margin: -3px 0 -3px -6px;
  border-radius: 50%;
  border: 2px solid var(--color-background-soft);
}

.card {
  border-left: 2px solid var(--accent);
  background: var(--color-background);
  padding: 0.5rem 0.75rem;
  border-radius: 0 6px 6px 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.dates {
  display: block;
  font-size: 0.75rem;
  opacity: 0.8;
}

.date-note {
  font-style: italic;
}

.event-title {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-heading);
}

.event-title a {
  padding: 0;
}

.description {
  margin-top: 0.25rem;
  font-size: 0.85rem;
}
</style>
