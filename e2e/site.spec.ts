import { expect, test, type Page } from '@playwright/test'

/**
 * Open the home page as a returning visitor (no intro), so interaction tests
 * don't wait on WebGL start-up. The first-visit intro has its own test.
 */
async function enterHome(page: Page, path = '/') {
  await page.addInitScript(() => sessionStorage.setItem('imm-entered', 'silent'))
  await page.goto(path)
  // Hidden by CSS before first paint; removed once the page hydrates.
  await expect(page.locator('.loader')).toBeHidden()
}

test.describe('public site', () => {
  test('home renders the headline and works without the 3D layer', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByRole('link', { name: /résumé/i }).first()).toBeVisible()
  })

  test('removed pages are gone', async ({ page }) => {
    for (const path of ['/work', '/about', '/contact', '/uses']) {
      expect((await page.goto(path))?.status(), path).toBe(404)
    }
  })

  test('projects viewer switches projects', async ({ page }) => {
    await enterHome(page)
    const nav = page.getByRole('navigation', { name: 'Projects' })
    await nav.getByRole('button').nth(1).click()
    await expect(page.locator('.works__name')).not.toHaveText(/AI Agent Builder/)
  })

  test('skills show tech logos and roles show company logos', async ({ page }) => {
    await page.goto('/')
    expect(await page.locator('.tech svg').count()).toBeGreaterThan(20)
    expect(await page.locator('.row__logo').count()).toBeGreaterThanOrEqual(4)
  })

  test('every case study linked from a project renders', async ({ page }) => {
    for (const slug of [
      'agent-builder',
      'noviro',
      'athletes-untapped',
      'headout-booking-automation',
      'flipkart-pick-issues',
    ]) {
      const res = await page.goto(`/work/${slug}`)
      expect(res?.status(), slug).toBe(200)
    }
  })

  test('case study pages render', async ({ page }) => {
    await page.goto('/work/carenav')
    await expect(page.locator('h1')).toContainText(/carenav/i)
  })

  test('contact form validates before sending', async ({ page }) => {
    await enterHome(page, '/#contact')
    await page.getByRole('button', { name: /send message/i }).click()
    await expect(page.getByText(/please enter your name/i)).toBeVisible()
    // Optional fields stay tucked away until asked for.
    await expect(page.locator('#company')).toBeHidden()
    await page.getByText(/add details/i).click()
    await expect(page.locator('#company')).toBeVisible()
  })

  test('first visit offers the sound choice, then the site', async ({ page }) => {
    test.slow() // the intro waits for the 3D scene, which is slow in headless software rendering
    await page.goto('/')
    await page.getByRole('button', { name: /without sound/i }).click({ timeout: 60_000 })
    await expect(page.locator('.loader')).toHaveCount(0)
  })

  test('returning visitors never see the intro', async ({ page }) => {
    await enterHome(page)
    await page.goto('/resume')
    await page.goto('/')
    // What matters is that it's never visible — the pre-paint script hides it immediately.
    await expect(page.locator('.loader')).toBeHidden({ timeout: 1000 })
    await expect(page.getByRole('button', { name: /enter with sound/i })).toBeHidden()
  })

  test('/justme draws the name in beads', async ({ page }) => {
    await page.goto('/justme')
    await expect(page.locator('.justme .particle-name[data-ready]')).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'Enter the site' })).toHaveAttribute('href', '/')
  })

  test('the logo is the bead name on every page', async ({ page }) => {
    await page.goto('/resume')
    await expect(page.locator('.site-header .particle-name[data-ready]')).toHaveCount(1)
    await expect(page.getByRole('link', { name: /adarsh — home/ })).toHaveAttribute('href', '/')
  })

  test('/baki explains where its picture goes until one is added, and stays out of search', async ({
    page,
  }) => {
    await page.goto('/baki')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    const status = await page.locator('.particle-image').getAttribute('data-status')
    if (status === 'missing') await expect(page.getByText('public/images/baki.jpg')).toBeVisible()
  })

  test('the Professional/Casual switch moves between the two versions', async ({ page }) => {
    await enterHome(page)
    // The radio sits over its label, so this is exactly where a real click lands.
    await page.getByRole('radio', { name: 'Casual' }).click()
    await expect(page).toHaveURL(/\/casual$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Casual' })).toBeChecked()
    await page.getByRole('radio', { name: 'Professional' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('the casual page shows every section', async ({ page }) => {
    await page.goto('/casual')
    for (const id of ['socials', 'adventures', 'fitness', 'memes'])
      await expect(page.locator(`#${id}`)).toBeVisible()
  })

  test('unknown pages 404', async ({ page }) => {
    const res = await page.goto('/definitely-not-here')
    expect(res?.status()).toBe(404)
  })

  test('the API is reachable through the site', async ({ request }) => {
    const res = await request.get('/api/health')
    expect(res.ok()).toBeTruthy()
  })
})
