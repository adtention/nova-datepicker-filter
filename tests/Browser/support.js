const path = require('path')
const { expect } = require('@playwright/test')

const harnessPage = `file://${path.join(__dirname, 'harness', 'index.html')}`

/**
 * Each date input the filter can show. `emitted` turns one picked date into the
 * filter value the component should emit for that input.
 */
const pickers = [
  { title: 'single', mode: 'single', placeholder: 'Choose date', emitted: date => date },
  { title: 'range start', mode: 'range', placeholder: 'Start', emitted: date => [date, null] },
  { title: 'range end', mode: 'range', placeholder: 'End', emitted: date => [null, date] },
]

/**
 * Opens the test page and collects console errors and uncaught exceptions.
 *
 * @returns {Promise<{ input: import('@playwright/test').Locator, errors: string[] }>}
 */
async function openFilter(page, picker, { above = 0 } = {}) {
  const errors = []

  page.on('console', message => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })
  page.on('pageerror', error => errors.push(error.message))

  await page.goto(`${harnessPage}?mode=${picker.mode}&above=${above}`)

  const input = page.getByPlaceholder(picker.placeholder, { exact: true })
  await expect(input).toBeVisible()

  return { input, errors }
}

/** The filter value last emitted, parsed from the page. */
async function emittedValue(page) {
  const text = await page.locator('#emitted').textContent()

  return text === '' ? undefined : JSON.parse(text)
}

function openMenu(page) {
  return page.locator('.dp__menu')
}

/**
 * Scrolls the page with the mouse wheel until the input's top edge is at `y` in the
 * viewport. The pointer stays right of the menu: a wheel over an open calendar
 * changes its month instead of scrolling the page.
 */
async function scrollInputTo(page, input, y) {
  await page.mouse.move(1000, 400)

  const box = await input.boundingBox()
  await page.mouse.wheel(0, box.y - y)

  await expect
    .poll(async () => Math.round((await input.boundingBox()).y))
    .toBe(Math.round(y))
}

/**
 * Where the open menu sits relative to the input: 'above' or 'below' once the menu
 * is placed right next to that side of the input, 'moving' while it is anywhere else
 * (during its opening animation, or before floating-ui follows a scroll).
 */
async function menuPlacement(page, input) {
  const menuBox = await openMenu(page).boundingBox()
  const inputBox = await input.boundingBox()

  if (menuBox === null || inputBox === null) {
    return 'closed'
  }

  const gapAbove = inputBox.y - (menuBox.y + menuBox.height)
  const gapBelow = menuBox.y - (inputBox.y + inputBox.height)

  if (gapAbove >= -1 && gapAbove < 30) {
    return 'above'
  }

  if (gapBelow >= -1 && gapBelow < 30) {
    return 'below'
  }

  return 'moving'
}

/** Asserts the menu is next to `side` of the input, and still is a moment later. */
async function expectMenuToStay(page, input, side) {
  await expect.poll(() => menuPlacement(page, input)).toBe(side)

  // floating-ui repositions on scroll and resize; give a late flip time to show.
  await page.waitForTimeout(300)

  expect(await menuPlacement(page, input)).toBe(side)
}

/** An ISO date in the month the calendar opens on (the current month). */
function isoDateThisMonth(day) {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')

  return `${today.getFullYear()}-${month}-${String(day).padStart(2, '0')}`
}

/** Clicks a day of the shown month in the open calendar. */
async function clickDay(page, day) {
  await openMenu(page)
    .locator('.dp__cell_inner:not(.dp__cell_offset):not(.dp__cell_disabled)')
    .getByText(String(day), { exact: true })
    .click()
}

module.exports = {
  pickers,
  openFilter,
  emittedValue,
  openMenu,
  scrollInputTo,
  menuPlacement,
  expectMenuToStay,
  isoDateThisMonth,
  clickDay,
}
