import { expect, test } from '@playwright/test'
import { dropBinaryFile, dropTextFile } from './helpers'

const nginxSample =
  '192.168.1.1 - - [15/Jan/2024:10:30:45 +0000] "GET /api/users HTTP/1.1" 200 1234'

test.describe('Glow PRD §18 smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' })
  })

  test('empty state shows placeholder and hint', async ({ page }) => {
    await expect(page.getByPlaceholder(/Paste your log output/i)).toBeVisible()
    await expect(page.getByText('Paste some log output to get started.')).toBeVisible()
  })

  test('nginx-style line highlights IP, timestamp, method, path, status', async ({ page }) => {
    await page.locator('#glow-log-input').fill(nginxSample)
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.token-ip')).toContainText('192.168.1.1', { timeout: 15_000 })
    await expect(viewer.locator('.token-timestamp')).toBeAttached()
    await expect(viewer.locator('.token-http-method')).toContainText('GET')
    await expect(viewer.locator('.token-path')).toContainText('/api/users')
    await expect(viewer.locator('.token-status-2xx')).toContainText('200')
  })

  test('ERROR line gets level-error class', async ({ page }) => {
    await page.locator('#glow-log-input').fill('ERROR disk full')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.token-level-error')).toContainText('ERROR', { timeout: 15_000 })
  })

  test('WARN line gets level-warn class', async ({ page }) => {
    await page.locator('#glow-log-input').fill('WARN slow query')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.token-level-warn')).toContainText('WARN', { timeout: 15_000 })
  })

  test('UUID highlighted', async ({ page }) => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    await page.locator('#glow-log-input').fill(`trace=${id}`)
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.token-uuid')).toContainText(id, { timeout: 15_000 })
  })

  test('script injection appears escaped in DOM', async ({ page }) => {
    await page.locator('#glow-log-input').fill('<script>alert(1)</script>')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect.poll(async () => viewer.locator('.log-line').innerHTML()).toContain('&lt;script&gt;')
    const html = await viewer.locator('.log-line').innerHTML()
    expect(html).not.toMatch(/<script[^>]*>/)
  })

  test('very long quoted payload finishes highlighting quickly', async ({ page }) => {
    const inner = 'a'.repeat(10_000)
    await page.locator('#glow-log-input').fill(`"${inner}"`)
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.log-line')).toBeVisible({ timeout: 15_000 })
    const html = await viewer.locator('.log-line').innerHTML()
    expect(html.length).toBeGreaterThan(9000)
  })

  test('theme switches shell theme attribute', async ({ page }) => {
    await expect(page.locator('[data-shell-theme="dark"]')).toBeAttached()
    await page.locator('label:has-text("Theme")').locator('select').selectOption('light')
    await expect(page.locator('[data-shell-theme="light"]')).toBeAttached({ timeout: 10_000 })
  })

  test('line numbers toggle hides gutter', async ({ page }) => {
    await page.locator('#glow-log-input').fill('one\ntwo')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    const gutter = viewer.locator('..').locator('> pre').first()
    await expect(gutter).toContainText('1', { timeout: 15_000 })
    await page.locator('label', { hasText: 'Line numbers' }).locator('input[type="checkbox"]').uncheck()
    await expect(viewer.locator('..').locator('> pre')).toHaveCount(0)
  })

  test('copy outputs raw text', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.locator('#glow-log-input').fill('clipboard-raw-test')
    await page.getByRole('button', { name: 'Copy' }).click()
    await expect.poll(async () => page.evaluate(() => navigator.clipboard.readText())).toBe('clipboard-raw-test')
  })

  test('load example populates input with sample log', async ({ page }) => {
    await page.getByRole('button', { name: 'Load example' }).click()
    await expect(page.locator('#glow-log-input')).not.toHaveValue('')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.token-level-error')).toHaveCount(3, { timeout: 15_000 })
    await expect(viewer.locator('.token-uuid')).toBeAttached()
  })

  test('clear resets input and output', async ({ page }) => {
    await page.locator('#glow-log-input').fill('to be cleared')
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.locator('#glow-log-input')).toHaveValue('')
    await expect(page.getByText('Paste some log output to get started.')).toBeVisible()
  })

  test('text file drop loads and highlights', async ({ page }) => {
    const payload = 'ERROR dropped-file-test\n192.168.0.1 GET /health 200'
    await dropTextFile(page, '#glow-log-input', 'sample.log', payload)
    await expect(page.locator('#glow-log-input')).toHaveValue(payload, { timeout: 15_000 })
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.token-level-error')).toContainText('ERROR', { timeout: 15_000 })
  })

  test('binary file drop shows rejection message', async ({ page }) => {
    await dropBinaryFile(page, '#glow-log-input', 'image.png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
    await expect(page.getByText('This does not appear to be a text file.')).toBeVisible({ timeout: 15_000 })
  })

  test('offline banner appears and highlighting still works', async ({ page, context }) => {
    await context.setOffline(true)
    await expect(page.getByText(/You are offline/i)).toBeVisible({ timeout: 10_000 })
    await page.locator('#glow-log-input').fill('ERROR offline-mode-test')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.token-level-error')).toContainText('ERROR', { timeout: 15_000 })
    await context.setOffline(false)
  })

  test('legal routes load', async ({ page }) => {
    await page.goto('/privacy', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1, name: /Privacy/i })).toBeVisible()
    await page.goto('/terms', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1, name: /Terms of service/i })).toBeVisible()
    await page.goto('/credits', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1, name: /Credits/i })).toBeVisible()
  })

  test('share link restores workspace in new tab', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.locator('#glow-log-input').fill('share-round-trip-test')
    await page.locator('label:has-text("Theme")').locator('select').selectOption('light')
    await expect(page.locator('[data-shell-theme="light"]')).toBeAttached({ timeout: 10_000 })
    await page.getByRole('button', { name: 'Share link' }).click()
    await expect.poll(async () => page.evaluate(() => window.location.hash)).toMatch(/state=/)

    const url = await page.evaluate(() => window.location.href)
    expect(url).toContain('#state=')

    const page2 = await context.newPage()
    await page2.goto(url, { waitUntil: 'load' })
    await expect(page2.locator('#glow-log-input')).toHaveValue('share-round-trip-test', { timeout: 15_000 })
    await expect(page2.locator('[data-shell-theme="light"]')).toBeAttached({ timeout: 15_000 })
    await page2.close()
  })
})
