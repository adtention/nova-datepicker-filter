// The date menu keeps the side it opened on while the page scrolls; see resources/js/menuSide.js.
const { test, expect } = require('@playwright/test')
const { pickers, openFilter, openMenu, scrollInputTo, expectMenuToStay } = require('./support')

// Viewport is 800px high and the menu about 330px. With the input's top at 700 only
// the space above fits the menu; at 80 only the space below does.
const LOW = 700
const HIGH = 80

for (const picker of pickers) {
  test.describe(picker.title, () => {
    test('menu stays on the side it opened on while the page scrolls', async ({ page }) => {
      const { input, errors } = await openFilter(page, picker, { above: 1200 })

      await scrollInputTo(page, input, LOW)
      await input.click()
      await expectMenuToStay(page, input, 'above')

      await scrollInputTo(page, input, HIGH)
      await expectMenuToStay(page, input, 'above')

      await page.keyboard.press('Escape')
      await expect(openMenu(page)).toHaveCount(0)

      await input.click()
      await expectMenuToStay(page, input, 'below')

      await scrollInputTo(page, input, LOW)
      await expectMenuToStay(page, input, 'below')

      expect(errors).toEqual([])
    })

    test('menu closed right after opening does not decide the side of the next opening', async ({ page }) => {
      const { input, errors } = await openFilter(page, picker, { above: 1200 })

      // Open where only the space below fits, and close again within a frame or two,
      // before menuSide.js has read where the menu landed.
      await scrollInputTo(page, input, HIGH)
      await input.click()
      await page.keyboard.press('Escape')
      await expect(openMenu(page)).toHaveCount(0)

      await scrollInputTo(page, input, LOW)
      await input.click()
      await expectMenuToStay(page, input, 'above')

      expect(errors).toEqual([])
    })
  })
}
