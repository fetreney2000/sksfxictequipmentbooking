import type { WorkBook, WorkSheet } from 'xlsx'

export interface GuruImportResult {
  sheetFound: boolean
  totalNames: number
  uniqueNames: number
  added: number
  duplicates: number
  errors: string[]
}

export const SHEET_NAMA_GURU = 'Nama Guru'
export const GURU_IMPORT_COLUMN = 'B'
export const GURU_IMPORT_HEADER_ROW = 1

/** Words commonly used as a header label above the name list. */
const HEADER_KEYWORDS =
  /^(nama|name|guru|nama guru|nama penuh|senarai guru|senarai nama|teacher|no|bil|bilangan|nombor|kod|id|a|b|c|[a-z]{1,2})$/i

/**
 * Find the "Nama Guru" sheet, tolerating case differences in the sheet name.
 */
function findSheet(workbook: WorkBook): WorkSheet | null {
  const exact = workbook.Sheets[SHEET_NAMA_GURU]
  if (exact) return exact
  const lower = SHEET_NAMA_GURU.toLowerCase()
  const match = workbook.SheetNames.find((name) => name.trim().toLowerCase() === lower)
  return match ? workbook.Sheets[match] : null
}

/**
 * Extract names from a column of a sheet. Row 0 is treated as a header and
 * skipped only when it is blank or clearly a header label; otherwise it is
 * treated as a real name (files without a header row).
 */
function extractNames(rows: unknown[][], columnIndex: number): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const raw = row && row[columnIndex] !== undefined ? row[columnIndex] : ''
    const name = String(raw).trim()
    if (!name) continue
    if (i === 0 && HEADER_KEYWORDS.test(name)) continue
    if (seen.has(name)) continue
    seen.add(name)
    names.push(name)
  }
  return names
}

/**
 * Parse an uploaded Excel file: read the sheet named "Nama Guru" (case
 * insensitive), extract names from column B (falling back to column A when
 * column B is empty), and return the cleaned list plus diagnostics.
 */
export function parseGuruWorkbook(file: File): Promise<{
  names: string[]
  sheetFound: boolean
  errors: string[]
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Tidak dapat membaca fail. Sila cuba lagi.'))
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx')
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' }) as WorkBook

        const sheet = findSheet(workbook)
        if (!sheet) {
          resolve({
            names: [],
            sheetFound: false,
            errors: [
              `Fail tidak mengandungi helaian bernama "${SHEET_NAMA_GURU}". Sila pastikan nama helaian betul.`,
            ],
          })
          return
        }

        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as unknown[][]

        let names = extractNames(rows, 1)
        if (names.length === 0) {
          names = extractNames(rows, 0)
        }

        resolve({ names, sheetFound: true, errors: [] })
      } catch {
        reject(new Error('Format fail tidak sah. Sila muat naik fail Excel (.xlsx).'))
      }
    }
    reader.readAsArrayBuffer(file)
  })
}
