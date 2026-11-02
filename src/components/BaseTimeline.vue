<script setup lang="ts">
type HistoricalEvent = {
  start: string
  end: string
  title: string
  description: string
  url: string | null
}

const events: HistoricalEvent[] = [
  {
    start: '1905-01-22',
    end: '1907-06-16',
    title: 'The Russian Revolution of 1905',
    description: 'foo',
    url: null,
  },
  {
    start: '1917-03-08',
    end: '1917-03-16',
    title: 'The February Revolution',
    description: 'bar',
    url: null,
  },
  {
    start: '1917-11-07',
    end: '1917-11-07',
    title: 'The October Revolution',
    description: 'baz',
    url: null,
  },
  {
    start: '1917-11-07',
    end: '1922-10-25',
    title: 'The Russian Civil War',
    description: 'buz',
    url: null,
  },
]
</script>

<template>
  <div></div>
</template>

<style scoped></style>
