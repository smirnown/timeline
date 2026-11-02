<script setup lang="ts">
import BaseTimeline from '@/components/BaseTimeline.vue'
import { russianRevolution } from '@/data/sampleTimelines'
</script>

<template>
  <main>
    <BaseTimeline title="The Russian Revolution" :events="russianRevolution" />
  </main>
</template>
