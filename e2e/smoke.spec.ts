import { expect, test } from '@playwright/test'
import { dropBinaryFile, dropTextFile } from './helpers'

const nginxSample =
  '192.168.1.1 - - [15/Jan/2024:10:30:45 +0000] "GET /api/users HTTP/1.1" 200 1234'

test.describe('Glow smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' })
  })

  test('empty state shows placeholder and hint', async ({ page }) => {
    await expect(page.getByPlaceholder(/Paste your log output/i)).toBeVisible()
    await expect(page.getByText('Highlighted output will appear here')).toBeVisible()
    await expect(page.getByText('← Start in the input panel')).toBeVisible()
  })

  test('nginx-style line highlights timestamp, IP, path, status', async ({ page }) => {
    await page.locator('#glow-log-input').fill(nginxSample)
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.gs-t-timestamp')).toBeVisible({ timeout: 15_000 })
    await expect(viewer.locator('.gs-t-ip')).toContainText('192.168.1.1')
    await expect(viewer.locator('.gs-t-status-2xx')).toContainText('200')
    await expect(viewer.getByText('/api/users')).toBeVisible()
  })

  test('ERROR line gets error class', async ({ page }) => {
    await page.locator('#glow-log-input').fill('ERROR disk full')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.gs-t-error')).toContainText('ERROR', { timeout: 15_000 })
  })

  test('WARN line gets warn class', async ({ page }) => {
    await page.locator('#glow-log-input').fill('WARN slow query')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.gs-t-warn')).toContainText('WARN', { timeout: 15_000 })
  })

  test('UUID highlighted', async ({ page }) => {
    const id = '550e8400-e29b-41d4-a716-446655440000'
    await page.locator('#glow-log-input').fill(`trace=${id}`)
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.gs-t-uuid')).toContainText(id, { timeout: 15_000 })
  })

  test('script injection is escaped in DOM', async ({ page }) => {
    await page.locator('#glow-log-input').fill('<script>alert(1)</script>')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer).toContainText('<script>alert(1)</script>', { timeout: 15_000 })
    const html = await viewer.locator('.gs-out-line').innerHTML()
    expect(html).not.toMatch(/<script[^>]*>/)
  })

  test('theme toggle flips data-theme on shell', async ({ page }) => {
    const shell = page.locator('.glow-shell')
    const initial = await shell.getAttribute('data-theme')
    await page.getByRole('button', { name: /Switch to/i }).click()
    await expect(shell).not.toHaveAttribute('data-theme', initial ?? '')
  })

  test('line numbers toggle hides gutter', async ({ page }) => {
    await page.locator('#glow-log-input').fill('one\ntwo')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.gs-ln')).toHaveCount(2, { timeout: 15_000 })
    await page.getByRole('button', { name: 'Line numbers' }).click()
    await expect(viewer.locator('.gs-ln')).toHaveCount(0)
  })

  test('copy outputs raw text', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.locator('#glow-log-input').fill('clipboard-raw-test')
    await page.getByRole('button', { name: 'Copy' }).click()
    await expect.poll(async () => page.evaluate(() => navigator.clipboard.readText())).toBe('clipboard-raw-test')
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  })

  test('load example populates input with sample log', async ({ page }) => {
    await page.getByRole('button', { name: 'Load Example' }).click()
    await expect(page.locator('#glow-log-input')).not.toHaveValue('')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.gs-t-error').first()).toBeVisible({ timeout: 15_000 })
    await expect(viewer.locator('.gs-t-uuid').first()).toBeVisible()
  })

  test('clear resets input and output', async ({ page }) => {
    await page.locator('#glow-log-input').fill('to be cleared')
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.locator('#glow-log-input')).toHaveValue('')
    await expect(page.getByText('Highlighted output will appear here')).toBeVisible()
  })

  test('text file drop loads and highlights', async ({ page }) => {
    const payload = 'ERROR dropped-file-test\n192.168.0.1 GET /health 200'
    await dropTextFile(page, '.gs-input-wrap', 'sample.log', payload)
    await expect(page.locator('#glow-log-input')).toHaveValue(payload, { timeout: 15_000 })
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.gs-t-error')).toContainText('ERROR', { timeout: 15_000 })
  })

  test('binary file drop shows rejection message', async ({ page }) => {
    await dropBinaryFile(page, '.gs-input-wrap', 'image.png', [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
    await expect(page.getByText(/Could not read that file/i)).toBeVisible({ timeout: 15_000 })
  })

  test('offline banner appears and highlighting still works', async ({ page, context }) => {
    await context.setOffline(true)
    await expect(page.getByText(/You are offline/i)).toBeVisible({ timeout: 10_000 })
    await page.locator('#glow-log-input').fill('ERROR offline-mode-test')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.gs-t-error')).toContainText('ERROR', { timeout: 15_000 })
    await context.setOffline(false)
  })

  test('search filters visible lines', async ({ page }) => {
    await page.locator('#glow-log-input').fill('INFO ok\nERROR bad\nINFO fine')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.gs-out-line')).toHaveCount(3, { timeout: 15_000 })
    await page.getByRole('searchbox', { name: 'Search log lines' }).fill('ERROR')
    await expect(viewer.locator('.gs-out-line')).toHaveCount(1)
    await expect(viewer.locator('.gs-t-error')).toContainText('ERROR')
  })

  test('token filter toggles error highlighting', async ({ page }) => {
    await page.locator('#glow-log-input').fill('ERROR visible')
    const viewer = page.getByRole('region', { name: 'Highlighted log output' })
    await expect(viewer.locator('.gs-t-error')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Token filters' }).click()
    await page.getByRole('checkbox', { name: 'Error' }).uncheck()
    await expect(viewer.locator('.gs-t-error')).toHaveCount(0, { timeout: 15_000 })
  })

  test('share button copies link with state', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.locator('#glow-log-input').fill('ERROR share-test')
    await page.getByRole('button', { name: 'Share link' }).click()
    await expect.poll(async () => page.evaluate(() => navigator.clipboard.readText())).toContain('#state=')
  })

  test('legal routes load', async ({ page }) => {
    await page.goto('/privacy', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1, name: /Your logs stay on your machine/i })).toBeVisible()
    await page.goto('/terms', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1, name: /Use it freely/i })).toBeVisible()
    await page.goto('/credits', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1, name: /Built on open source/i })).toBeVisible()
  })
})
