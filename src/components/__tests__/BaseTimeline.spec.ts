import { afterEach, describe, it, expect, vi } from 'vitest'
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

  it('marks events known only to the month', () => {
    const wrapper = mount(BaseTimeline, {
      props: {
        events: [
          { ...russianRevolution[0]!, start: '1917-08', end: '1917-08', title: 'Month only' },
          russianRevolution[2]!,
        ],
      },
    })
    const [monthOnly, exact] = wrapper.findAll('.event')
    expect(monthOnly!.find('time').attributes('datetime')).toBe('1917-08')
    expect(monthOnly!.find('time').text()).not.toMatch(/\d{1,2},/)
    expect(monthOnly!.find('.bar').classes()).toContain('approximate')
    expect(exact!.find('.bar').classes()).not.toContain('approximate')
  })

  it('shows an empty state with no events', () => {
    const wrapper = mount(BaseTimeline, { props: { events: [] } })
    expect(wrapper.text()).toContain('No events yet')
    expect(wrapper.find('.viewport').exists()).toBe(false)
  })

  describe('zoom', () => {
    const trackWidth = (wrapper: ReturnType<typeof mount>) =>
      parseFloat((wrapper.find('.track').element as HTMLElement).style.width)
    const button = (wrapper: ReturnType<typeof mount>, label: string) =>
      wrapper.find(`button[aria-label^="${label}"]`)

    it('scales the track by 1.5× per click and resets', async () => {
      const wrapper = mount(BaseTimeline, { props: { events: russianRevolution } })
      const base = trackWidth(wrapper)
      expect(button(wrapper, 'Reset zoom').text()).toBe('100%')
      expect(button(wrapper, 'Reset zoom').attributes('disabled')).toBeDefined()

      await button(wrapper, 'Zoom in').trigger('click')
      expect(trackWidth(wrapper)).toBeGreaterThan(base * 1.3)
      expect(button(wrapper, 'Reset zoom').text()).toBe('150%')

      await button(wrapper, 'Zoom out').trigger('click')
      await button(wrapper, 'Zoom out').trigger('click')
      expect(button(wrapper, 'Reset zoom').text()).toBe('67%')

      await button(wrapper, 'Reset zoom').trigger('click')
      expect(trackWidth(wrapper)).toBe(base)
    })

    it('stops at the zoom limits', async () => {
      const wrapper = mount(BaseTimeline, { props: { events: russianRevolution } })
      for (let i = 0; i < 10; i++) {
        await button(wrapper, 'Zoom in').trigger('click')
      }
      expect(button(wrapper, 'Zoom in').attributes('disabled')).toBeDefined()
      expect(button(wrapper, 'Reset zoom').text()).toBe('1139%')
    })

    describe('with a measured viewport', () => {
      // jsdom does no layout, so fake the viewport's width and ResizeObserver.
      const stubViewportWidth = (width: number) => {
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(width)
        vi.stubGlobal(
          'ResizeObserver',
          class {
            observe() {}
            disconnect() {}
          },
        )
      }
      afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
      })

      it('stops zooming out once the whole range fits', async () => {
        stubViewportWidth(1000)
        const wrapper = mount(BaseTimeline, { props: { events: russianRevolution } })
        await wrapper.vm.$nextTick()
        for (let i = 0; i < 10; i++) {
          await button(wrapper, 'Zoom out').trigger('click')
        }
        expect(button(wrapper, 'Zoom out').attributes('disabled')).toBeDefined()
        expect(trackWidth(wrapper)).toBeCloseTo(1000, 3)
      })

      it('disables zooming out when the timeline already fits', async () => {
        stubViewportWidth(5000)
        const wrapper = mount(BaseTimeline, { props: { events: russianRevolution } })
        await wrapper.vm.$nextTick()
        expect(trackWidth(wrapper)).toBeLessThan(5000)
        expect(button(wrapper, 'Zoom out').attributes('disabled')).toBeDefined()
        expect(button(wrapper, 'Zoom in').attributes('disabled')).toBeUndefined()
      })
    })

    it('hides the zoom controls when there are no events', () => {
      const wrapper = mount(BaseTimeline, { props: { events: [] } })
      expect(wrapper.find('.zoom').exists()).toBe(false)
    })
  })
})
