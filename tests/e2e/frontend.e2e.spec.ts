import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000/ro')

    await expect(page).toHaveTitle(/Balkan House/)

    const heading = page.locator('h1').first()

    await expect(heading).toContainText('Gust de acasă')
  })
})
