import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTimeline from '../BaseTimeline.vue'
import { russianRevolution } from '@/data/sampleTimelines'

describe('BaseTimeline', () => {
  it('renders a card for every event', () => {
    const wrapper = mount(BaseTimeline, { props: { title: 'Russia', events: russianRevolution } })
    expect(wrapper.find('h2').text()).toBe('Russia')
    expect(wrapper.findAll('.event-title').map((h) => h.text())).toEqual(
      expect.arrayContaining(russianRevolution.map((e) => e.title)),
    )
  })

  it('gives the track a fixed pixel width so it scrolls instead of wrapping', () => {
    const wrapper = mount(BaseTimeline, { props: { events: russianRevolution } })
    const width = parseFloat((wrapper.find('.track').element as HTMLElement).style.width)
    // ~17.75 years at 120px/year, plus the trailing card
    expect(width).toBeGreaterThan(17 * 120)
  })

  it('links the title when an event has a url', () => {
    const wrapper = mount(BaseTimeline, {
      props: {
        events: [{ ...russianRevolution[0]!, url: 'https://example.com/1905' }],
      },
    })
    expect(wrapper.find('.event-title a').attributes('href')).toBe('https://example.com/1905')
  })

  it('shows an empty state with no events', () => {
    const wrapper = mount(BaseTimeline, { props: { events: [] } })
    expect(wrapper.text()).toContain('No events yet')
    expect(wrapper.find('.viewport').exists()).toBe(false)
  })
})
