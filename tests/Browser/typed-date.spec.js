// A date typed in the Danish format and confirmed with Enter becomes the ISO filter value.
const { test, expect } = require('@playwright/test')
const { pickers, openFilter, emittedValue } = require('./support')

for (const picker of pickers) {
  test(`${picker.title}: typed date with Enter emits the ISO date`, async ({ page }) => {
    const { input, errors } = await openFilter(page, picker)

    await input.click()
    await page.keyboard.type('03.10.2026')
    await page.keyboard.press('Enter')

    await expect.poll(() => emittedValue(page)).toEqual(picker.emitted('2026-10-03'))
    await expect(input).toHaveValue('2026-10-03')
    expect(errors).toEqual([])
  })
}
