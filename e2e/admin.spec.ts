import { expect, test } from '@playwright/test'

const email = process.env.E2E_ADMIN_EMAIL
const password = process.env.E2E_ADMIN_PASSWORD

test.describe('admin', () => {
  test('redirects signed-out visitors to sign in', async ({ page }) => {
    await page.goto('/admin/projects')
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fprojects/)
  })

  test.describe('signed in', () => {
    test.skip(!email || !password, 'set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD')

    test('edits a post and sees it on the site', async ({ page }) => {
      await page.goto('/admin/login')
      await page.fill('#email', email!)
      await page.fill('#password', password!)
      await page.getByRole('button', { name: 'Sign in' }).click()
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

      const slug = `e2e-${Date.now()}`
      await page.goto('/admin/posts/new')
      await page.fill('#f-slug', slug)
      await page.fill('#f-title', `E2E post ${slug}`)
      await page.selectOption('#f-platform', 'blog')
      await page.fill('#f-url', 'https://example.com/post')
      await page.fill('#f-date', '2026-01-01')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(page).toHaveURL(/\/admin\/posts\/[0-9a-f-]{36}$/)

      await page.goto('/content')
      await expect(page.getByText(`E2E post ${slug}`)).toBeVisible()

      // Clean up.
      await page.goto('/admin/posts')
      page.once('dialog', (d) => d.accept())
      await page
        .getByRole('listitem')
        .filter({ hasText: slug })
        .getByRole('button', { name: 'Delete' })
        .click()
      await expect(page.getByText(`E2E post ${slug}`)).toHaveCount(0)
    })
  })
})
