/**
 * Parse an ISO 8601 date string (YYYY-MM-DD) into a local Date object.
 *
 * Returns null when the value is not a string, does not match the expected
 * format, or represents an invalid calendar date.
 *
 * @param {unknown} value
 * @returns {Date|null}
 */
export function parseIsoDate(value) {
  if (typeof value !== 'string') {
    return null
  }

  const dateParts = value.match(/^(\d{4})-(\d{2})-(\d{2})/)

  if (dateParts === null) {
    return null
  }

  const parsedDate = new Date(
    Number(dateParts[1]),
    Number(dateParts[2]) - 1,
    Number(dateParts[3]),
  )

  if (
    Number.isNaN(parsedDate.getTime())
    || parsedDate.getFullYear() !== Number(dateParts[1])
    || parsedDate.getMonth() !== Number(dateParts[2]) - 1
    || parsedDate.getDate() !== Number(dateParts[3])
  ) {
    return null
  }

  return parsedDate
}

/**
 * Format a Date object as ISO date (YYYY-MM-DD).
 *
 * @param {Date} value
 * @returns {string}
 */
export function formatIsoDate(value) {
  const year = String(value.getFullYear())
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Normalize mixed date values to an ISO date string accepted by Nova filters.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
export function normalizeDateFilterValue(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : formatIsoDate(value)
  }

  const parsedDate = parseIsoDate(value)

  return parsedDate === null ? null : formatIsoDate(parsedDate)
}
