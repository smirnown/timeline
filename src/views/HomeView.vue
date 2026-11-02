<script setup lang="ts">
import BaseTimeline from '@/components/BaseTimeline.vue'
import { revolution1917, revolution1917Source as source } from '@/data/revolution1917'
</script>

<template>
  <main>
    <BaseTimeline title="Russia in 1917" :events="revolution1917" :pixels-per-year="12000" />
    <p class="source">
      Dates follow the Gregorian calendar; the Julian (Old Style) dates used in Russia at the time
      are shown in brackets. Adapted from
      <a :href="source.url" target="_blank" rel="noopener">{{ source.title }}</a>
      by {{ source.author }}, Soviet History Archive, licensed
      <a :href="source.licenseUrl" target="_blank" rel="noopener">{{ source.license }}</a
      >.
    </p>
  </main>
</template>

<style scoped>
.source {
  margin-top: -1.5rem;
  font-size: 0.85rem;
  opacity: 0.8;
}
</style>
