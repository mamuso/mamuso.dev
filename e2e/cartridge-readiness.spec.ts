import { test, expect } from '@playwright/test'
import { waitForCartridgeLayout } from './cartridge-helpers'

test('stable parked controls are not ready for a coordinate click', async ({ page }) => {
  // Model a slow shader warm-up: animation frames continue, but the entrance
  // has not started and its projected controls remain parked inside the canvas.
  await page.setContent(`
    <canvas width="300" height="200"></canvas>
    <button disabled style="position:absolute;left:100px;top:100px">View test cartridge</button>
    <script>
      setTimeout(() => {
        const control = document.querySelector('button');
        control.style.left = '160px';
        control.disabled = false;
      }, 1200);
    </script>
  `)
  const control = page.getByRole('button', { name: 'View test cartridge' })
  await waitForCartridgeLayout(page, control)
  await expect(control).toBeEnabled()
  await expect(control).toHaveCSS('left', '160px')
})
