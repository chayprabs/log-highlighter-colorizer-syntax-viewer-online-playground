import type { Page } from '@playwright/test'

/** Simulate drag-and-drop of a text file onto a drop target (PRD §18 items 8–9). */
export async function dropTextFile(page: Page, selector: string, name: string, content: string): Promise<void> {
  const dataTransfer = await page.evaluateHandle(
    ({ fileName, text }) => {
      const dt = new DataTransfer()
      dt.items.add(new File([text], fileName, { type: 'text/plain' }))
      return dt
    },
    { fileName: name, text: content }
  )
  await page.locator(selector).dispatchEvent('drop', { dataTransfer })
}

/** Simulate drag-and-drop of a binary file (null-byte sniff should reject). */
export async function dropBinaryFile(page: Page, selector: string, name: string, bytes: number[]): Promise<void> {
  const dataTransfer = await page.evaluateHandle(
    ({ fileName, data }) => {
      const dt = new DataTransfer()
      dt.items.add(new File([new Uint8Array(data)], fileName, { type: 'application/octet-stream' }))
      return dt
    },
    { fileName: name, data: bytes }
  )
  await page.locator(selector).dispatchEvent('drop', { dataTransfer })
}
