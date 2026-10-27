import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = path.dirname(fileURLToPath(import.meta.url))
const frontendDir = path.resolve(here, '..')
const screenshotsDir = path.resolve(frontendDir, '..', 'docs', 'screenshots')
await mkdir(screenshotsDir, { recursive: true })

const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1'], {
  cwd: frontendDir,
  stdio: 'ignore',
  env: { ...process.env, VITE_API_TARGET: 'http://127.0.0.1:8000' },
})

let browser
try {
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  await page.route('**/api/documents', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  }))
  await page.route('**/api/chat', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      answer: 'To reset your device, disconnect the power adapter, wait 10 seconds, and reconnect it [device-support-guide.pdf, p. 3].',
      sources: [{
        source: 'device-support-guide.pdf',
        page: 3,
        excerpt: 'Reset procedure: disconnect the power adapter, wait at least 10 seconds, then reconnect the adapter and wait for the status light.',
        score: 0.82,
      }],
      abstained: false,
    }),
  }))

  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded', timeout: 2000 })
      if (response?.ok()) { ready = true; break }
    } catch { /* wait for Vite to start */ }
    await sleep(500)
  }
  if (!ready) throw new Error('Vite did not become ready on port 5173')

  await page.getByText('Your support knowledge,', { exact: false }).waitFor()
  await page.screenshot({ path: path.join(screenshotsDir, 'chat-home.png'), fullPage: true })

  await page.getByRole('textbox', { name: 'Your question' }).fill('How do I reset my device?')
  await page.locator('.send-btn').click()
  await page.getByText('To reset your device,', { exact: false }).waitFor()
  await page.getByText('device-support-guide.pdf', { exact: true }).waitFor()
  await page.screenshot({ path: path.join(screenshotsDir, 'chat-with-citations.png'), fullPage: true })
  console.log('Captured docs/screenshots/chat-home.png and chat-with-citations.png')
} finally {
  if (browser) await browser.close()
  server.kill('SIGTERM')
}
