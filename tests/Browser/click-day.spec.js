// Clicking a day in the calendar emits that day as an ISO date.
const { test, expect } = require('@playwright/test')
const { pickers, openFilter, emittedValue, openMenu, isoDateThisMonth, clickDay } = require('./support')

const single = pickers.find(picker => picker.title === 'single')

test('single: clicking a day emits that ISO date', async ({ page }) => {
  const { input, errors } = await openFilter(page, single)

  await input.click()
  await clickDay(page, 15)

  await expect.poll(() => emittedValue(page)).toBe(isoDateThisMonth(15))
  await expect(openMenu(page)).toHaveCount(0)
  expect(errors).toEqual([])
})

test('range: from and to are set independently by clicking days', async ({ page }) => {
  const { errors } = await openFilter(page, pickers.find(picker => picker.title === 'range start'))
  const start = page.getByPlaceholder('Start', { exact: true })
  const end = page.getByPlaceholder('End', { exact: true })

  await start.click()
  await clickDay(page, 10)
  await expect.poll(() => emittedValue(page)).toEqual([isoDateThisMonth(10), null])

  await end.click()
  await clickDay(page, 20)
  await expect.poll(() => emittedValue(page)).toEqual([isoDateThisMonth(10), isoDateThisMonth(20)])

  await start.click()
  await clickDay(page, 12)
  await expect.poll(() => emittedValue(page)).toEqual([isoDateThisMonth(12), isoDateThisMonth(20)])

  expect(errors).toEqual([])
})

test('single: clicking another day changes a date already picked', async ({ page }) => {
  const { input, errors } = await openFilter(page, single)

  await input.click()
  await clickDay(page, 15)
  await expect.poll(() => emittedValue(page)).toBe(isoDateThisMonth(15))

  await input.click()
  await clickDay(page, 18)
  await expect.poll(() => emittedValue(page)).toBe(isoDateThisMonth(18))
  expect(errors).toEqual([])
})
