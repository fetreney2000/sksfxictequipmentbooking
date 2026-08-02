import type { WorkBook } from 'xlsx'

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

/**
 * Parse an uploaded Excel file: read the sheet named exactly "Nama Guru",
 * extract names from column B (row 1 treated as header and skipped),
 * trim + deduplicate, and return the cleaned list plus diagnostics.
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

        if (!workbook.SheetNames.includes(SHEET_NAMA_GURU)) {
          resolve({
            names: [],
            sheetFound: false,
            errors: [
              `Fail tidak mengandungi helaian bernama "${SHEET_NAMA_GURU}". Sila pastikan nama helaian betul.`,
            ],
          })
          return
        }

        const sheet = workbook.Sheets[SHEET_NAMA_GURU]
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as unknown[][]

        const names: string[] = []
        const seen = new Set<string>()
        for (let i = GURU_IMPORT_HEADER_ROW; i < rows.length; i++) {
          const row = rows[i]
          const raw = row && row[1] !== undefined ? row[1] : ''
          const name = String(raw).trim()
          if (!name) continue
          if (seen.has(name)) continue
          seen.add(name)
          names.push(name)
        }

        resolve({ names, sheetFound: true, errors: [] })
      } catch {
        reject(new Error('Format fail tidak sah. Sila muat naik fail Excel (.xlsx).'))
      }
    }
    reader.readAsArrayBuffer(file)
  })
}
