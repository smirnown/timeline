import { test, expect } from '@playwright/test'

test('shows the sample timeline, scrolling horizontally when it overflows', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/')
  await expect(page.locator('h2')).toHaveText('Russia in 1917')

  const viewport = page.getByRole('region', { name: 'Russia in 1917 timeline' })
  const { scrollWidth, clientWidth } = await viewport.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }))
  expect(scrollWidth).toBeGreaterThan(clientWidth)

  // The page itself must not scroll sideways.
  const pageOverflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
  expect(pageOverflows).toBe(false)
})

test('zooming keeps the date at the centre of the view in place', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  const viewport = page.getByRole('region', { name: 'Russia in 1917 timeline' })

  // Centre the view on the October Revolution, then zoom both ways.
  const card = viewport.locator('.event', { hasText: 'The October Revolution begins' })
  const centreOffset = () =>
    card.evaluate((el) => {
      const view = el.closest('.viewport')!.getBoundingClientRect()
      return el.getBoundingClientRect().left - (view.left + view.width / 2)
    })
  await card.evaluate((el) => {
    const view = el.closest('.viewport')!
    view.scrollLeft = (el as HTMLElement).offsetLeft - view.clientWidth / 2
  })
  expect(Math.abs(await centreOffset())).toBeLessThan(2)

  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(page.getByRole('button', { name: /Reset zoom/ })).toHaveText('150%')
  expect(Math.abs(await centreOffset())).toBeLessThan(2)

  await page.getByRole('button', { name: 'Zoom out' }).click()
  await page.getByRole('button', { name: 'Zoom out' }).click()
  await expect(page.getByRole('button', { name: /Reset zoom/ })).toHaveText('67%')
  expect(Math.abs(await centreOffset())).toBeLessThan(2)
})

test('zooming out stops when the whole timeline fits', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  const viewport = page.getByRole('region', { name: 'Russia in 1917 timeline' })
  const zoomOut = page.getByRole('button', { name: 'Zoom out' })

  // More clicks than needed: once the limit is reached the button is disabled
  // and further clicks do nothing.
  for (let i = 0; i < 12; i++) {
    await zoomOut.dispatchEvent('click')
  }
  await expect(zoomOut).toBeDisabled()

  const { scrollWidth, clientWidth, trackWidth } = await viewport.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    trackWidth: el.querySelector<HTMLElement>('.track')!.getBoundingClientRect().width,
  }))
  expect(scrollWidth).toBe(clientWidth)
  expect(Math.abs(trackWidth - clientWidth)).toBeLessThan(1)

  await page.getByRole('button', { name: /Reset zoom/ }).click()
  await expect(page.getByRole('button', { name: /Reset zoom/ })).toHaveText('100%')
  await expect(zoomOut).toBeEnabled()
})
