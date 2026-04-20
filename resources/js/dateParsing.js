const DAY_FIRST_LOCALES = new Set(['da', 'de', 'nb', 'nn', 'no', 'se', 'sv'])
const MONTH_FIRST_LOCALES = new Set(['en', 'en-us'])

/**
 * Create a strictly validated local Date object from discrete date parts.
 *
 * Returns null when the parts do not represent a valid calendar date.
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns {Date|null}
 */
function createStrictDate(year, month, day) {
  const parsedDate = new Date(year, month - 1, day)

  if (
    Number.isNaN(parsedDate.getTime())
    || parsedDate.getFullYear() !== year
    || parsedDate.getMonth() !== month - 1
    || parsedDate.getDate() !== day
  ) {
    return null
  }

  return parsedDate
}

/**
 * Normalize locale codes so locale-based parsing can be applied consistently.
 *
 * @param {unknown} locale
 * @returns {string|null}
 */
function normalizeLocaleCode(locale) {
  if (typeof locale !== 'string') {
    return null
  }

  const normalizedLocaleCode = locale.trim().toLowerCase().replace(/_/g, '-')

  return normalizedLocaleCode === '' ? null : normalizedLocaleCode
}

/**
 * Convert flexible date parts into a strictly validated local Date instance.
 *
 * @param {string|number} year
 * @param {string|number} month
 * @param {string|number} day
 * @returns {Date|null}
 */
function parseFlexibleDateParts(year, month, day) {
  return createStrictDate(Number(year), Number(month), Number(day))
}

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

  const dateParts = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (dateParts === null) {
    return null
  }

  return parseFlexibleDateParts(dateParts[1], dateParts[2], dateParts[3])
}

/**
 * Determine whether a locale should parse ambiguous numeric dates as
 * month-first instead of day-first.
 *
 * @param {string|undefined|null} locale
 * @returns {boolean}
 */
export function isLocaleMonthFirst(locale) {
  const normalizedLocaleCode = normalizeLocaleCode(locale)

  if (normalizedLocaleCode === null) {
    return false
  }

  if (
    MONTH_FIRST_LOCALES.has(normalizedLocaleCode)
    || normalizedLocaleCode.startsWith('en-us-')
  ) {
    return true
  }

  if (
    DAY_FIRST_LOCALES.has(normalizedLocaleCode)
    || normalizedLocaleCode.startsWith('da-')
    || normalizedLocaleCode.startsWith('de-')
    || normalizedLocaleCode.startsWith('nb-')
    || normalizedLocaleCode.startsWith('nn-')
    || normalizedLocaleCode.startsWith('no-')
    || normalizedLocaleCode.startsWith('se-')
    || normalizedLocaleCode.startsWith('sv-')
  ) {
    return false
  }

  return false
}

/**
 * Parse user-entered dates in a locale-aware, flexible way while returning a
 * local Date instance compatible with the date picker.
 *
 * Accepted inputs, in priority order:
 * - ISO-like year-first dates with -, / or . separators
 * - 8-digit compact values (YYYYMMDD when the first 4 digits look like a year)
 * - Locale-ordered separated numeric dates with a 4-digit year
 * - 6-digit compact values with 20YY expansion
 *
 * @param {unknown} value
 * @param {string|undefined|null} locale
 * @returns {Date|null}
 */
export function parseFlexibleDateInput(value, locale) {
  if (typeof value !== 'string') {
    return null
  }

  const normalizedValue = value.trim()

  if (normalizedValue === '') {
    return null
  }

  const isoDateMatch = normalizedValue.match(/^(\d{4})([-/.])(\d{1,2})\2(\d{1,2})$/)

  if (isoDateMatch !== null) {
    return parseFlexibleDateParts(isoDateMatch[1], isoDateMatch[3], isoDateMatch[4])
  }

  const isMonthFirst = isLocaleMonthFirst(locale)
  const compactEightDigitMatch = normalizedValue.match(/^(\d{8})$/)

  if (compactEightDigitMatch !== null) {
    const digits = compactEightDigitMatch[1]
    const leadingYear = Number(digits.slice(0, 4))

    if (leadingYear >= 1900) {
      return parseFlexibleDateParts(
        digits.slice(0, 4),
        digits.slice(4, 6),
        digits.slice(6, 8),
      )
    }

    if (isMonthFirst) {
      return parseFlexibleDateParts(
        digits.slice(4, 8),
        digits.slice(0, 2),
        digits.slice(2, 4),
      )
    }

    return parseFlexibleDateParts(
      digits.slice(4, 8),
      digits.slice(2, 4),
      digits.slice(0, 2),
    )
  }

  const separatedNumericMatch = normalizedValue.match(/^(\d{1,2})([-/.])(\d{1,2})\2(\d{4})$/)

  if (separatedNumericMatch !== null) {
    if (isMonthFirst) {
      return parseFlexibleDateParts(
        separatedNumericMatch[4],
        separatedNumericMatch[1],
        separatedNumericMatch[3],
      )
    }

    return parseFlexibleDateParts(
      separatedNumericMatch[4],
      separatedNumericMatch[3],
      separatedNumericMatch[1],
    )
  }

  const compactSixDigitMatch = normalizedValue.match(/^(\d{6})$/)

  if (compactSixDigitMatch !== null) {
    const digits = compactSixDigitMatch[1]
    const expandedYear = `20${digits.slice(4, 6)}`

    if (isMonthFirst) {
      return parseFlexibleDateParts(
        expandedYear,
        digits.slice(0, 2),
        digits.slice(2, 4),
      )
    }

    return parseFlexibleDateParts(
      expandedYear,
      digits.slice(2, 4),
      digits.slice(0, 2),
    )
  }

  return null
}

/**
 * Resolve a BCP 47 locale string from a field's locale meta value.
 *
 * Returns undefined when the locale is absent or empty so that
 * Intl.DateTimeFormat falls back to the runtime default.
 *
 * @param {object} field
 * @returns {string|undefined}
 */
export function resolveLocale(field) {
  if (typeof field?.locale === 'string' && field.locale !== '') {
    return field.locale
  }

  return undefined
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
