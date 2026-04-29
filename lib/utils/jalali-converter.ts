/**
 * Jalali (Persian/Iranian) Calendar Converter
 * Converts between Jalali and Gregorian calendars
 */

export interface JalaliDate {
    year: number
    month: number
    day: number
}

export interface GregorianDate {
    year: number
    month: number
    day: number
}

/**
 * Check if a Gregorian year is a leap year
 */
function isGregorianLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/**
 * Check if a Jalali year is a leap year
 */
function isJalaliLeapYear(year: number): boolean {
    const breaks = [1, 5, 9, 13, 17, 22, 26, 30]
    const gy = year + 621
    let jp = breaks[0]

    let jump = 0
    for (let i = 1; i < breaks.length; i++) {
        const jm = breaks[i]
        jump = jm - jp
        if (year < jm) break
        jp = jm
    }

    let n = year - jp

    if (jump - n < 6) {
        n = n - jump + Math.floor((jump + 4) / 33) * 33
    }

    let leap = ((n + 1) % 33 - 1) % 4
    if (leap === -1) leap = 4

    return leap === 0
}

/**
 * Convert Jalali date to Gregorian date
 */
function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDate {
    const gy = jy + 621
    const gDayNo = 365 * jy + Math.floor((jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd

    if (jm < 7) {
        return gregorianFromDayNumber(gDayNo + (jm - 1) * 31 - 1)
    } else {
        return gregorianFromDayNumber(gDayNo + (jm - 7) * 30 + 186 - 1)
    }
}

/**
 * Convert Gregorian date to Jalali date
 */
function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
    const gDayNo = gregorianToDayNumber(gy, gm, gd)
    const jDayNo = gDayNo - 79

    const jNp = Math.floor(jDayNo / 12053)
    const jDayNo2 = jDayNo % 12053

    let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo2 / 1461)
    let jDayNo3 = jDayNo2 % 1461

    if (jDayNo3 >= 366) {
        jy += Math.floor((jDayNo3 - 1) / 365)
        jDayNo3 = (jDayNo3 - 1) % 365
    }

    let jm: number
    let jd: number

    if (jDayNo3 < 186) {
        jm = 1 + Math.floor(jDayNo3 / 31)
        jd = 1 + (jDayNo3 % 31)
    } else {
        jm = 7 + Math.floor((jDayNo3 - 186) / 30)
        jd = 1 + ((jDayNo3 - 186) % 30)
    }

    return { year: jy, month: jm, day: jd }
}

/**
 * Convert Gregorian date to day number
 */
function gregorianToDayNumber(gy: number, gm: number, gd: number): number {
    let d = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) - 80 + gd

    if (gm > 2) {
        d += Math.floor((gm + 1) * 30.6) - 63
    } else {
        d += (gm - 1) * 31
    }

    return d
}

/**
 * Convert day number to Gregorian date
 */
function gregorianFromDayNumber(dayNo: number): GregorianDate {
    let gy = Math.floor((dayNo + 80) / 366)
    let gDayNo = dayNo - (365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) - 80)

    if (gDayNo <= 0) {
        gy--
        gDayNo = dayNo - (365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400) - 80)
    }

    const gm = Math.floor((gDayNo - 1) / 30.6 + 3)
    const gd = gDayNo - Math.floor((gm - 2) * 30.6)

    return { year: gy, month: gm, day: gd }
}

/**
 * Format Jalali date as string (YYYY/MM/DD)
 */
export function formatJalaliDate(date: JalaliDate): string {
    const year = date.year.toString().padStart(4, '0')
    const month = date.month.toString().padStart(2, '0')
    const day = date.day.toString().padStart(2, '0')
    return `${year}/${month}/${day}`
}

/**
 * Parse Jalali date string (YYYY/MM/DD)
 */
function parseJalaliDate(dateString: string): JalaliDate | null {
    const parts = dateString.split('/')
    if (parts.length !== 3) return null

    const year = parseInt(parts[0])
    const month = parseInt(parts[1])
    const day = parseInt(parts[2])

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null
    if (month < 1 || month > 12) return null
    if (day < 1 || day > 31) return null

    return { year, month, day }
}

/**
 * Convert JavaScript Date to Jalali date
 */
export function dateToJalali(date: Date): JalaliDate {
    return gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

/**
 * Convert Jalali date to JavaScript Date
 */
export function jalaliToDate(jalali: JalaliDate): Date {
    const gregorian = jalaliToGregorian(jalali.year, jalali.month, jalali.day)
    return new Date(gregorian.year, gregorian.month - 1, gregorian.day)
}

/**
 * Get Jalali month names in Persian
 */
export const JALALI_MONTH_NAMES = [
    'فروردین',
    'اردیبهشت',
    'خرداد',
    'تیر',
    'مرداد',
    'شهریور',
    'مهر',
    'آبان',
    'آذر',
    'دی',
    'بهمن',
    'اسفند',
]

/**
 * Get Jalali weekday names in Persian
 */
const JALALI_WEEKDAY_NAMES = [
    'یکشنبه',
    'دوشنبه',
    'سه‌شنبه',
    'چهارشنبه',
    'پنج‌شنبه',
    'جمعه',
    'شنبه',
]

/**
 * Validate Jalali date
 */
export function isValidJalaliDate(year: number, month: number, day: number): boolean {
    if (month < 1 || month > 12) return false
    if (day < 1) return false

    if (month <= 6 && day > 31) return false
    if (month > 6 && month < 12 && day > 30) return false
    if (month === 12) {
        const maxDay = isJalaliLeapYear(year) ? 30 : 29
        if (day > maxDay) return false
    }

    return true
}

/**
 * Calculate age from Jalali birth date
 */
function calculateAgeFromJalali(birthDate: JalaliDate): number {
    const today = dateToJalali(new Date())
    let age = today.year - birthDate.year

    if (today.month < birthDate.month || (today.month === birthDate.month && today.day < birthDate.day)) {
        age--
    }

    return age
}

/**
 * Calculate age from Gregorian birth date
 */
export function calculateAge(birthDate: Date): number {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }

    return age
}
