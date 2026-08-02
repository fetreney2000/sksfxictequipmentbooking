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

type DocxModule = typeof import('docx')
type Paragraph = InstanceType<DocxModule['Paragraph']>
type Table = InstanceType<DocxModule['Table']>

const NAVY = '1E3A8A'
const GRAY = '64748B'

async function docxDeps(): Promise<DocxModule> {
  return import('docx')
}

async function headerParagraphs(docx: DocxModule, title: string): Promise<Paragraph[]> {
  const { AlignmentType, Paragraph, TextRun } = docx
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: SEKOLAH_NAMA, bold: true, size: 26, color: NAVY }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: SEKOLAH_SUBTITLE, size: 20, color: GRAY }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: title, bold: true, size: 24, color: NAVY })],
      spacing: { after: 200 },
    }),
  ]
}

async function detailParagraphs(
  docx: DocxModule,
  rows: [string, string][],
): Promise<Paragraph[]> {
  const { Paragraph, TextRun } = docx
  return rows.map(
    ([label, value]) =>
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: `${label}: `, bold: true, size: 20 }),
          new TextRun({ text: value, size: 20 }),
        ],
      }),
  )
}

async function tableFor<T>(
  docx: DocxModule,
  headers: string[],
  rows: T[],
  mapRow: (row: T, index: number) => string[],
): Promise<Table> {
  const { BorderStyle, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } = docx
  const makeRow = (cells: string[], isHeader: boolean) =>
    new TableRow({
      tableHeader: isHeader,
      children: cells.map(
        (cellText) =>
          new TableCell({
            shading: isHeader ? { fill: NAVY } : undefined,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cellText,
                    bold: isHeader,
                    color: isHeader ? 'FFFFFF' : '000000',
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
      ),
    })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    },
    rows: [
      makeRow(headers, true),
      ...rows.map((r, i) => makeRow(mapRow(r, i), false)),
    ],
  })
}

async function signatureParagraphs(docx: DocxModule): Promise<Paragraph[]> {
  const { Paragraph, TextRun } = docx
  return [
    new Paragraph({ text: '', spacing: { before: 600 } }),
    new Paragraph({
      spacing: { before: 600 },
      children: [
        new TextRun({ text: 'Nama & Tandatangan Peminjam', bold: true, size: 20 }),
        new TextRun({ text: '\t\t\t\t\t\t' }),
        new TextRun({ text: 'Pegawai Meluluskan', bold: true, size: 20 }),
      ],
    }),
    new Paragraph({
      spacing: { before: 1000 },
      children: [
        new TextRun({ text: '________________________', size: 20 }),
        new TextRun({ text: '\t\t\t\t\t' }),
        new TextRun({ text: '________________________', size: 20 }),
      ],
    }),
  ]
}

async function triggerDownload(doc: Blob, filename: string) {
  const url = URL.createObjectURL(doc)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function exportPermohonanDocx(
  permohonan: PermohonanJoined,
  items: PermohonanItemJoined[],
  filename: string,
) {
  const docx = await docxDeps()
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = docx

  const detailRows: [string, string][] = [
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

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri' } },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          ...(await headerParagraphs(docx, 'Slip Pinjaman Peralatan ICT')),
          new Paragraph({
            alignment: docx.AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Dijana: ${nowDisplayKL()}`, size: 16, color: GRAY }),
            ],
            spacing: { after: 200 },
          }),
          ...(await detailParagraphs(docx, detailRows)),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({ text: 'Senarai Peralatan', bold: true, size: 22, color: NAVY }),
            ],
            spacing: { before: 200, after: 120 },
          }),
          await tableFor<PermohonanItemJoined>(
            docx,
            ['No.', 'Kategori', 'Jenama', 'Nama Peralatan', 'Nombor Siri'],
            items,
            (item, index) => [
              String(index + 1),
              item.peralatan.kategori.nama_kategori,
              item.peralatan.jenama.nama_jenama,
              item.peralatan.nama_peralatan ?? '-',
              item.peralatan.nombor_siri,
            ],
          ),
          ...(await signatureParagraphs(docx)),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  await triggerDownload(blob, filename)
}

export async function exportLaporanDocx(params: {
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
  const docx = await docxDeps()
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = docx

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Calibri' } },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          ...(await headerParagraphs(docx, 'Laporan Pinjaman Peralatan ICT')),
          new Paragraph({
            alignment: docx.AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Dijana: ${nowDisplayKL()}`, size: 16, color: GRAY }),
            ],
            spacing: { after: 200 },
          }),
          ...(await detailParagraphs(docx, [
            [
              'Tempoh Laporan',
              `${formatDateStringKL(params.dariTarikh)} hingga ${formatDateStringKL(params.hinggaTarikh)}`,
            ],
            ['Jumlah Permohonan', String(params.jumlah)],
            ['Menunggu Kelulusan', String(params.pecahanStatus.menunggu_kelulusan ?? 0)],
            ['Diluluskan', String(params.pecahanStatus.diluluskan ?? 0)],
            ['Ditolak', String(params.pecahanStatus.ditolak ?? 0)],
            ['Selesai', String(params.pecahanStatus.selesai ?? 0)],
            ['Dibatalkan', String(params.pecahanStatus.dibatalkan ?? 0)],
          ])),
          ...(params.peralatanTerkini.length > 0
            ? [
                new Paragraph({
                  heading: HeadingLevel.HEADING_2,
                  children: [
                    new TextRun({
                      text: 'Peralatan Paling Kerap Dipinjam',
                      bold: true,
                      size: 22,
                      color: NAVY,
                    }),
                  ],
                  spacing: { before: 200, after: 120 },
                }),
                await tableFor<{ nama: string; jumlah: number }>(
                  docx,
                  ['Peralatan', 'Bilangan'],
                  params.peralatanTerkini,
                  (p) => [p.nama, String(p.jumlah)],
                ),
              ]
            : []),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [
              new TextRun({ text: 'Senarai Permohonan', bold: true, size: 22, color: NAVY }),
            ],
            spacing: { before: 300, after: 120 },
          }),
          await tableFor(
            docx,
            ['Rujukan', 'Nama Guru', 'Tarikh Pinjaman', 'Tarikh Pulangan (Dijangka)', 'Status', 'Bil. Peralatan'],
            params.rows,
            (r) => [
              r.rujukan,
              r.namaGuru,
              r.tarikhPinjaman,
              r.tarikhPulangan,
              r.status,
              String(r.bilPeralatan),
            ],
          ),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  await triggerDownload(blob, params.filename)
}
