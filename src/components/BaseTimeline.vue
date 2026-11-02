<script setup lang="ts">
import { computed } from 'vue'
import {
  defaultLayoutOptions,
  formatEventDates,
  layoutTimeline,
  type HistoricalEvent,
} from './timeline'

const props = withDefaults(
  defineProps<{
    events: HistoricalEvent[]
    title?: string
    /** Horizontal zoom: how many pixels one year takes up. */
    pixelsPerYear?: number
  }>(),
  { title: undefined, pixelsPerYear: defaultLayoutOptions.pixelsPerYear },
)

const CARD_WIDTH = defaultLayoutOptions.cardWidth

const layout = computed(() =>
  layoutTimeline(props.events, { pixelsPerYear: props.pixelsPerYear, cardWidth: CARD_WIDTH }),
)
</script>

<template>
  <section class="timeline">
    <h2 v-if="title" class="timeline-title">{{ title }}</h2>
    <p v-if="events.length === 0" class="timeline-empty">No events yet.</p>

    <!-- The scroll viewport: the track inside has a fixed width, so a long
         timeline scrolls sideways instead of wrapping. -->
    <div
      v-else
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
              :class="{ point: item.isPoint }"
              :style="item.isPoint ? undefined : { width: `${item.barWidth}px` }"
            />
            <article class="card" :style="{ width: `${CARD_WIDTH}px` }">
              <time class="dates" :datetime="item.event.start">
                {{ formatEventDates(item.event) }}
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

.timeline-title {
  color: var(--color-heading);
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
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

.event-title {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-heading);
}

.description {
  margin-top: 0.25rem;
  font-size: 0.85rem;
}
</style>
