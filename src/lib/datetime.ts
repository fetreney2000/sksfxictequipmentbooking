import { addDays, differenceInCalendarDays, isValid, isBefore, isSameDay } from 'date-fns'
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz'

/**
 * Centralized date/time helpers.
 *
 * Rule: every displayed date, stored-as-display date, and comparison must use
 * the Asia/Kuala_Lumpur timezone (UTC+8), regardless of the device timezone.
 * Never call `new Date()` directly outside this module for display/comparison.
 */

export const TIMEZONE = 'Asia/Kuala_Lumpur'

export const DATE_FORMAT_DISPLAY = 'dd/MM/yyyy'
export const DATE_TIME_FORMAT_DISPLAY = 'dd/MM/yyyy, h:mm a'
export const DATE_STORAGE = 'yyyy-MM-dd'

/** Current instant as a Date whose wall-clock values reflect Kuala Lumpur time. */
export function nowKL(): Date {
  return toZonedTime(new Date(), TIMEZONE)
}

/** Today's date in Kuala Lumpur as a storage string (yyyy-MM-dd). */
export function todayDateStringKL(): string {
  return formatInTimeZone(new Date(), TIMEZONE, DATE_STORAGE)
}

/** Format any Date (instant) to a Kuala Lumpur date string (yyyy-MM-dd). */
export function toDateStringKL(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input)
  return formatInTimeZone(d, TIMEZONE, DATE_STORAGE)
}

/** Format any Date (instant) to a Kuala Lumpur date-time string for display. */
export function toDateTimeDisplayKL(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input)
  return formatInTimeZone(d, TIMEZONE, DATE_TIME_FORMAT_DISPLAY)
}

/** Format any Date (instant) to a Kuala Lumpur date string for display (dd/MM/yyyy). */
export function toDateDisplayKL(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input)
  return formatInTimeZone(d, TIMEZONE, DATE_FORMAT_DISPLAY)
}

/**
 * Parse a stored date string (yyyy-MM-dd) as a KL noon instant so that all
 * date-only values resolve to the same wall-clock date in Kuala Lumpur.
 */
export function parseDateStringKL(dateStr: string): Date {
  return fromZonedTime(`${dateStr}T12:00:00`, TIMEZONE)
}

/** Display a stored date string (yyyy-MM-dd) as dd/MM/yyyy in KL. */
export function formatDateStringKL(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return formatInTimeZone(parseDateStringKL(dateStr), TIMEZONE, DATE_FORMAT_DISPLAY)
}

/** Display a stored date string (yyyy-MM-dd) as a long Bahasa Malaysia-style date. */
export function formatDateStringLongKL(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return formatInTimeZone(parseDateStringKL(dateStr), TIMEZONE, 'd MMMM yyyy')
}

/**
 * Convert a Date picked from a UI calendar into the KL date storage string.
 * The picked date has no time-of-day intent; we read its wall-clock date as KL.
 */
export function calendarDateToStorageKL(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, DATE_STORAGE)
}

/** Parse a storage date string (yyyy-MM-dd) back into a local noon Date for calendar input. */
export function storageToCalendarDateKL(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`)
}

/** True if the stored date string falls on Saturday or Sunday in KL. */
export function isWeekendDateStringKL(dateStr: string): boolean {
  const d = parseDateStringKL(dateStr)
  const day = d.getDay()
  return day === 0 || day === 6
}

/** Add days to a stored date string (yyyy-MM-dd), returns new string. */
export function addDaysToDateStringKL(dateStr: string, days: number): string {
  return formatInTimeZone(
    addDays(parseDateStringKL(dateStr), days),
    TIMEZONE,
    DATE_STORAGE,
  )
}

/** Compare two stored date strings. Returns -1 | 0 | 1. */
export function compareDateStringsKL(a: string, b: string): number {
  const da = parseDateStringKL(a)
  const db = parseDateStringKL(b)
  if (isSameDay(da, db)) return 0
  return isBefore(da, db) ? -1 : 1
}

/** True if a < b for stored date strings. */
export function isBeforeDateStringKL(a: string, b: string): boolean {
  return compareDateStringsKL(a, b) < 0
}

/** True if a >= b for stored date strings. */
export function isOnOrAfterDateStringKL(a: string, b: string): boolean {
  return compareDateStringsKL(a, b) >= 0
}

/** True if a <= b for stored date strings. */
export function isOnOrBeforeDateStringKL(a: string, b: string): boolean {
  return compareDateStringsKL(a, b) <= 0
}

/**
 * Calendar days from date A to date B (positive when B is after A).
 * e.g. daysBetweenKL('2026-08-01', '2026-08-03') === 2
 */
export function daysBetweenKL(fromDateStr: string, toDateStr: string): number {
  return differenceInCalendarDays(
    parseDateStringKL(toDateStr),
    parseDateStringKL(fromDateStr),
  )
}

/** Current KL date-time formatted for display (e.g. for export generation stamps). */
export function nowDisplayKL(): string {
  return formatInTimeZone(new Date(), TIMEZONE, DATE_TIME_FORMAT_DISPLAY)
}

/** First 8 characters (uppercased) of a UUID to use as a short human reference. */
export function shortReference(id: string): string {
  return id.slice(0, 8).toUpperCase()
}

/** Timestamp in KL for storing into timestamptz columns (ISO string with offset). */
export function nowTimestampKL(): string {
  return new Date().toISOString()
}

/** Convert a KL date string to the day-end instant for "today" boundary comparisons. */
export function dateStringToDayEndKL(dateStr: string): string {
  return fromZonedTime(`${dateStr}T23:59:59`, TIMEZONE).toISOString()
}

export { isValid, addDays }