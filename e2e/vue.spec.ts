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
