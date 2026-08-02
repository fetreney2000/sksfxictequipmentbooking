import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export function BerjayaPage() {
  const [searchParams] = useSearchParams()
  const ref = searchParams.get('ref')

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-10 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Permohonan Dihantar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Terima kasih. Permohonan pinjaman anda telah berjaya dihantar dan sedang
          menunggu kelulusan pihak pentadbir sekolah.
        </p>

        {ref && (
          <div className="mx-auto mt-5 w-fit rounded-lg border bg-muted/40 px-6 py-3">
            <p className="text-xs font-medium text-muted-foreground">Rujukan Permohonan</p>
            <p className="mt-0.5 text-2xl font-bold tracking-widest text-primary">{ref}</p>
          </div>
        )}

        <p className="mt-5 text-xs text-muted-foreground">
          Sila simpan rujukan ini untuk sebarang pertanyaan berkaitan permohonan anda.
        </p>

        <div className="mt-6">
          <Button asChild>
            <Link to="/pinjam">Buat Permohonan Baharu</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
