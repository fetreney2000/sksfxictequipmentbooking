import {
  SEKOLAH_NAMA,
  SEKOLAH_SUBTITLE,
  STATUS_PERMOHONAN_LABEL,
} from '@/lib/constants'
import {
  formatDateStringKL,
  nowDisplayKL,
  shortReference,
} from '@/lib/datetime'
import type { PermohonanJoined, PermohonanItemJoined } from '@/lib/types'

type jsPDFModule = typeof import('jspdf')
type AutoTableModule = typeof import('jspdf-autotable')

const NAVY: [number, number, number] = [30, 58, 138]
const GRAY: [number, number, number] = [100, 116, 139]

async function pdfDeps() {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  return { jsPDF, autoTable }
}

function headerBlock(
  doc: InstanceType<jsPDFModule['jsPDF']>,
  autoTable: AutoTableModule['default'],
  title: string,
) {
  void autoTable
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...NAVY)
  doc.text(SEKOLAH_NAMA, 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...GRAY)
  doc.text(SEKOLAH_SUBTITLE, 14, 24)

  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.6)
  doc.line(14, 28, 196, 28)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...NAVY)
  doc.text(title, 14, 36)
}

function lastY(doc: InstanceType<jsPDFModule['jsPDF']>): number {
  return (
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60
  )
}

function signatureBlock(doc: InstanceType<jsPDFModule['jsPDF']>, y: number) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const spaceHeight = 52
  let startY = y
  if (startY + spaceHeight > pageHeight - 20) {
    doc.addPage()
    startY = 40
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  doc.text('Nama & Tandatangan Peminjam', 24, startY)
  doc.text('Pegawai Meluluskan', 132, startY)

  const labelY = startY + spaceHeight
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  const leftLabel = 'Pegawai yang Meminjam: '
  const rightLabel = 'Pegawai yang Meluluskan: '
  doc.text(leftLabel, 24, labelY)
  doc.text(rightLabel, 132, labelY)

  doc.setLineWidth(0.3)
  doc.setDrawColor(...GRAY)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(24 + doc.getTextWidth(leftLabel), labelY + 2, 110, labelY + 2)
  doc.line(132 + doc.getTextWidth(rightLabel), labelY + 2, 196, labelY + 2)
  doc.setLineDashPattern([], 0)
}

export function permohonanFilename(p: PermohonanJoined, ext: string): string {
  const ref = shortReference(p.id)
  const nama = (p.guru?.nama_guru ?? 'peminjam')
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '')
  return `Pinjaman_${ref}_${nama}.${ext}`
}

export async function exportPermohonanPdf(
  permohonan: PermohonanJoined,
  items: PermohonanItemJoined[],
  filename: string,
) {
  const { jsPDF, autoTable } = await pdfDeps()
  const doc = new jsPDF()
  headerBlock(doc, autoTable, 'Slip Pinjaman Peralatan ICT')

  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(`Dijana: ${nowDisplayKL()}`, 196, 36, { align: 'right' })

  const detailRows = [
    ['Rujukan', shortReference(permohonan.id)],
    ['Nama Guru', permohonan.guru?.nama_guru ?? '-'],
    ['Tarikh Pinjaman', formatDateStringKL(permohonan.tarikh_pinjaman)],
    [
      'Tarikh Pemulangan (Dijangka)',
      formatDateStringKL(permohonan.tarikh_pemulangan_dijangka),
    ],
    [
      'Tarikh Pemulangan (Sebenar)',
      permohonan.tarikh_pemulangan_sebenar
        ? formatDateStringKL(permohonan.tarikh_pemulangan_sebenar)
        : '-',
    ],
    ['Tujuan Pinjaman', permohonan.tujuan?.tujuan ?? '-'],
  ]

  if (permohonan.tujuan?.tujuan === 'Lain-lain' && permohonan.tujuan_lain_teks) {
    detailRows.push(['Tujuan Lain', permohonan.tujuan_lain_teks])
  }

  detailRows.push(['Status', STATUS_PERMOHONAN_LABEL[permohonan.status]])

  if (permohonan.catatan_admin) {
    detailRows.push(['Catatan Pentadbir', permohonan.catatan_admin])
  }

  autoTable(doc, {
    startY: 42,
    head: [['Butiran', 'Maklumat']],
    body: detailRows,
    theme: 'grid',
    headStyles: { fillColor: NAVY, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
  })

  const itemsStart = lastY(doc) + 6

  autoTable(doc, {
    startY: itemsStart,
    head: [['No.', 'Kategori', 'Jenama', 'Nama Peralatan', 'Nombor Siri']],
    body: items.map((item, i) => [
      String(i + 1),
      item.peralatan.kategori.nama_kategori,
      item.peralatan.jenama.nama_jenama,
      item.peralatan.nama_peralatan ?? '-',
      item.peralatan.nombor_siri,
    ]),
    theme: 'grid',
    headStyles: { fillColor: NAVY, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { cellWidth: 12 } },
  })

  signatureBlock(doc, Math.min(lastY(doc) + 25, 270))

  doc.save(filename)
}

export async function exportLaporanPdf(params: {
  filename: string
  dariTarikh: string
  hinggaTarikh: string
  jumlah: number
  pecahanStatus: Record<string, number>
  peralatanTerkini: { nama: string; jumlah: number }[]
  rows: {
    rujukan: string
    namaGuru: string
    tarikhPinjaman: string
    tarikhPulangan: string
    status: string
    bilPeralatan: number
  }[]
}) {
  const { jsPDF, autoTable } = await pdfDeps()
  const doc = new jsPDF()
  headerBlock(doc, autoTable, 'Laporan Pinjaman Peralatan ICT')

  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(`Dijana: ${nowDisplayKL()}`, 196, 36, { align: 'right' })

  autoTable(doc, {
    startY: 42,
    head: [['Tajuk', 'Maklumat']],
    body: [
      ['Tempoh Laporan', `${formatDateStringKL(params.dariTarikh)} hingga ${formatDateStringKL(params.hinggaTarikh)}`],
      ['Jumlah Permohonan', String(params.jumlah)],
      ['Menunggu Kelulusan', String(params.pecahanStatus.menunggu_kelulusan ?? 0)],
      ['Diluluskan', String(params.pecahanStatus.diluluskan ?? 0)],
      ['Ditolak', String(params.pecahanStatus.ditolak ?? 0)],
      ['Selesai', String(params.pecahanStatus.selesai ?? 0)],
      ['Dibatalkan', String(params.pecahanStatus.dibatalkan ?? 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55 } },
  })

  let y = lastY(doc)

  if (params.peralatanTerkini.length > 0) {
    autoTable(doc, {
      startY: y + 6,
      head: [['Peralatan Paling Kerap Dipinjam', 'Bilangan']],
      body: params.peralatanTerkini.map((p) => [p.nama, String(p.jumlah)]),
      theme: 'grid',
      headStyles: { fillColor: NAVY, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2.5 },
    })
    y = lastY(doc)
  }

  autoTable(doc, {
    startY: y + 6,
    head: [
      ['Rujukan', 'Nama Guru', 'Tarikh Pinjaman', 'Tarikh Pulangan (Dijangka)', 'Status', 'Bil. Peralatan'],
    ],
    body: params.rows.map((r) => [
      r.rujukan,
      r.namaGuru,
      r.tarikhPinjaman,
      r.tarikhPulangan,
      r.status,
      String(r.bilPeralatan),
    ]),
    theme: 'grid',
    headStyles: { fillColor: NAVY, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 18 },
      3: { cellWidth: 30 },
    },
  })

  doc.save(params.filename)
}
