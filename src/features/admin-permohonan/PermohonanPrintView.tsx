import { SEKOLAH_NAMA, SEKOLAH_SUBTITLE, STATUS_PERMOHONAN_LABEL } from '@/lib/constants'
import { formatDateStringKL, nowDisplayKL, shortReference } from '@/lib/datetime'
import type { PermohonanJoined, PermohonanItemJoined } from '@/lib/types'

export function PermohonanPrintView({
  permohonan,
  items,
}: {
  permohonan: PermohonanJoined
  items: PermohonanItemJoined[]
}) {
  const detailRows: [string, string][] = [
    ['Rujukan', shortReference(permohonan.id)],
    ['Nama Guru', permohonan.guru?.nama_guru ?? '-'],
    ['Tarikh Pinjaman', formatDateStringKL(permohonan.tarikh_pinjaman)],
    ['Tarikh Pemulangan (Dijangka)', formatDateStringKL(permohonan.tarikh_pemulangan_dijangka)],
    [
      'Tarikh Pemulangan (Sebenar)',
      permohonan.tarikh_pemulangan_sebenar
        ? formatDateStringKL(permohonan.tarikh_pemulangan_sebenar)
        : '-',
    ],
    ['Tujuan Pinjaman', permohonan.tujuan?.tujuan ?? '-'],
    ['Status', STATUS_PERMOHONAN_LABEL[permohonan.status]],
  ]
  if (permohonan.tujuan?.tujuan === 'Lain-lain' && permohonan.tujuan_lain_teks) {
    detailRows.push(['Tujuan Lain', permohonan.tujuan_lain_teks])
  }
  if (permohonan.catatan_admin) {
    detailRows.push(['Catatan Pentadbir', permohonan.catatan_admin])
  }

  return (
    <div className="bg-white p-8 text-black">
      <div className="border-b-2 border-blue-900 pb-3 text-center">
        <h1 className="text-lg font-bold text-blue-900">{SEKOLAH_NAMA}</h1>
        <p className="text-sm text-gray-600">{SEKOLAH_SUBTITLE}</p>
      </div>
      <h2 className="mt-4 text-center text-base font-bold text-blue-900">
        Slip Pinjaman Peralatan ICT
      </h2>
      <p className="mt-1 text-center text-xs text-gray-500">Dijana: {nowDisplayKL()}</p>

      <table className="mt-5 w-full border-collapse text-sm">
        <tbody>
          {detailRows.map(([label, value]) => (
            <tr key={label}>
              <td className="w-56 border px-3 py-1.5 font-semibold">{label}</td>
              <td className="border px-3 py-1.5">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="mt-5 text-sm font-bold">Senarai Peralatan</h3>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="w-10 border bg-blue-50 px-3 py-1.5 text-left">No.</th>
            <th className="border bg-blue-50 px-3 py-1.5 text-left">Kategori</th>
            <th className="border bg-blue-50 px-3 py-1.5 text-left">Jenama</th>
            <th className="border bg-blue-50 px-3 py-1.5 text-left">Nama Peralatan</th>
            <th className="border bg-blue-50 px-3 py-1.5 text-left">Nombor Siri</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id}>
              <td className="border px-3 py-1.5">{i + 1}</td>
              <td className="border px-3 py-1.5">{item.peralatan.kategori.nama_kategori}</td>
              <td className="border px-3 py-1.5">{item.peralatan.jenama.nama_jenama}</td>
              <td className="border px-3 py-1.5">{item.peralatan.nama_peralatan ?? '-'}</td>
              <td className="border px-3 py-1.5">{item.peralatan.nombor_siri}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-14">
        <div className="flex justify-between text-sm">
          <p className="font-semibold">Nama &amp; Tandatangan Peminjam</p>
          <p className="font-semibold">Pegawai Meluluskan</p>
        </div>
        <div className="h-20" aria-hidden="true" />
        <div className="flex justify-between gap-6 border-t border-dashed border-gray-400 pt-3 text-sm text-gray-600">
          <p>Pegawai yang Meminjam: ........................</p>
          <p>Pegawai yang Meluluskan: ........................</p>
        </div>
      </div>
    </div>
  )
}
