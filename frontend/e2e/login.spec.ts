// Smoke test proving the Playwright harness runs against the Vite dev server.
import { test, expect } from '@playwright/test'

test('login page renders the brand heading and username input', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: "Sam's Table" })).toBeVisible()
  await expect(page.getByLabel('Username')).toBeVisible()
})
