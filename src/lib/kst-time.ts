export const KST_TIME_ZONE = 'Asia/Seoul'

const DEFAULT_LOCAL_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
}

const DEFAULT_KST_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZoneName: 'short'
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

export function toKSTISOString(value: Date | string): string {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: KST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date)

  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+09:00`
}

export function localToUTC(localDateString: string): Date {
  const date = new Date(localDateString)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid local datetime string')
  }
  return date
}

export function formatKST(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(undefined, {
    ...DEFAULT_KST_OPTIONS,
    ...options,
    timeZone: KST_TIME_ZONE
  }).format(date)
}

export function formatLocal(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, DEFAULT_LOCAL_TIME_OPTIONS).format(date)
}

export function nowKST(): Date {
  return new Date()
}

export function parseLocalDate(isoString: string): string {
  const date = toDate(isoString)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hour}:${minute}`
}
