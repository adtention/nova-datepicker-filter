import { da, de, enUS, nb, sv } from 'date-fns/locale'

const localeMap = Object.freeze({
  da,
  de,
  en: enUS,
  'en-us': enUS,
  nb,
  nn: nb,
  no: nb,
  se: sv,
  sv,
})

function normalizeLocaleCode(localeCode) {
  if (typeof localeCode !== 'string') {
    return null
  }

  const normalizedLocaleCode = localeCode.trim().toLowerCase().replace('_', '-')

  if (normalizedLocaleCode === '') {
    return null
  }

  return normalizedLocaleCode
}

export function resolveDateFnsLocale(localeCode) {
  const normalizedLocaleCode = normalizeLocaleCode(localeCode)

  if (normalizedLocaleCode === null) {
    return undefined
  }

  const languageCode = normalizedLocaleCode.split('-')[0]

  return localeMap[normalizedLocaleCode] ?? localeMap[languageCode]
}
