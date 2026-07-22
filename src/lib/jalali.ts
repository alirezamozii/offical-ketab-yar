import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from 'date-fns-jalali'


/**
 * Formats a Date object to Persian month name and year (e.g. "تیر ۱۴۰۵").
 */
export function formatJalaliMonth(date: Date): string {
  return format(date, 'MMMM yyyy')
}

/**
 * Returns all Date objects inside the Jalali month containing the given date.
 */
export function getJalaliMonthDays(date: Date): Date[] {
  const start = startOfMonth(date)
  const end = endOfMonth(date)
  return eachDayOfInterval({ start, end })
}

/**
 * Maps a standard JS getDay() (Sun=0..Sat=6) to Persian week index (Sat=0..Fri=6).
 */
export function getPersianWeekDay(date: Date): number {
  const jsDay = date.getDay()
  return (jsDay + 1) % 7
}

/**
 * Converts a Date to YYYY-MM-DD string in Gregorian calendar.
 * This is used for reading-history keys matching database records.
 */
export function toGregorianKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatJalaliDay(date: Date): string {
  return format(date, 'd')
}

export { addMonths, subMonths }
