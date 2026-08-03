import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useWizardStore } from '@/store/wizard'
import { insertPermohonan } from '@/lib/api/permohonan'
import { shortReference, isOnOrAfterDateStringKL } from '@/lib/datetime'
import { Step1Tarikh } from '@/features/public-pinjaman/Step1Tarikh'
import { Step2Peralatan } from '@/features/public-pinjaman/Step2Peralatan'
import { Step3Butiran } from '@/features/public-pinjaman/Step3Butiran'
import { Step4Semakan } from '@/features/public-pinjaman/Step4Semakan'

const STEP_TITLES = ['Pilih Tarikh Pinjaman', 'Pilih Peralatan', 'Butiran Peminjam', 'Semakan & Hantar']

export function PublicWizardPage() {
  const navigate = useNavigate()
  const step = useWizardStore((s) => s.step)
  const setStep = useWizardStore((s) => s.setStep)
  const tarikhPinjaman = useWizardStore((s) => s.tarikh_pinjaman)
  const tarikhPulangan = useWizardStore((s) => s.tarikh_pemulangan_dijangka)
  const items = useWizardStore((s) => s.items)
  const guru = useWizardStore((s) => s.guru)
  const tujuan = useWizardStore((s) => s.tujuan)
  const tujuanLain = useWizardStore((s) => s.tujuan_lain_teks)
  const reset = useWizardStore((s) => s.reset)

  const [submitting, setSubmitting] = useState(false)

  const returnDateValid =
    !tarikhPinjaman ||
    !tarikhPulangan ||
    isOnOrAfterDateStringKL(tarikhPulangan, tarikhPinjaman)

  const canProceed =
    (step === 1 && Boolean(tarikhPinjaman)) ||
    (step === 2 && items.length > 0) ||
    (step === 3 &&
      returnDateValid &&
      Boolean(guru) &&
      Boolean(tujuan) &&
      Boolean(tarikhPulangan) &&
      (tujuan?.tujuan !== 'Lain-lain' || tujuanLain.trim().length > 0)) ||
    step === 4

  const handleSubmit = async () => {
    if (!guru || !tujuan || !tarikhPinjaman || !tarikhPulangan || items.length === 0) return
    setSubmitting(true)
    try {
      const header = await insertPermohonan({
        guru_id: guru.id,
        tarikh_pinjaman: tarikhPinjaman,
        tarikh_pemulangan_dijangka: tarikhPulangan,
        tujuan_id: tujuan.id,
        tujuan_lain_teks: tujuan.tujuan === 'Lain-lain' ? tujuanLain.trim() : null,
        peralatan_ids: items.map((i) => i.peralatan_id),
      })
      const ref = shortReference(header.id)
      reset()
      navigate(`/pinjam/berjaya?ref=${ref}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Permohonan gagal dihantar. Sila cuba lagi.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Sistem Pinjaman ICT</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Permohonan Pinjaman Peralatan ICT</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          Sila lengkapkan maklumat berikut untuk membuat permohonan pinjaman.
        </p>
      </div>

      {/* Step indicator */}
      <ol className="mb-8 flex items-center justify-between gap-1 sm:gap-2">
        {STEP_TITLES.map((title, i) => {
          const n = i + 1
          const active = n === step
          const done = n < step
          return (
            <li key={title} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    done || active ? 'bg-primary' : 'bg-muted',
                    i === 0 && 'invisible',
                  )}
                />
                <div
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-xs transition-all',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : done
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {done ? '\u2713' : n}
                </div>
                <div
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    (done || active) && i < STEP_TITLES.length - 1 ? 'bg-primary' : 'bg-muted',
                    i === STEP_TITLES.length - 1 && 'invisible',
                  )}
                />
              </div>
              <span
                className={cn(
                  'text-center text-[11px] leading-tight sm:text-xs',
                  active ? 'font-semibold text-foreground' : 'text-muted-foreground',
                )}
              >
                {title}
              </span>
            </li>
          )
        })}
      </ol>

       <div className="rounded-2xl border bg-card p-5 shadow-md sm:p-7">
        {step === 1 && <Step1Tarikh />}
        {step === 2 && <Step2Peralatan />}
        {step === 3 && <Step3Butiran />}
        {step === 4 && <Step4Semakan />}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Kembali
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" className="text-muted-foreground hover:text-destructive">
                  <RotateCcw className="size-4" />
                  Mula Semula
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mula Semula Borang?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Semua maklumat yang telah anda isi akan dibuang dan borang akan
                    dikembalikan ke langkah pertama.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => reset()}>Ya, Mula Semula</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {step < 4 ? (
            <Button type="button" onClick={() => setStep(step + 1)} disabled={!canProceed}>
              Seterusnya
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting || !canProceed}>
              {submitting ? 'Menghantar...' : 'Hantar Permohonan'}
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Pentadbir sistem?{' '}
        <Link
          to="/admin/login"
          className="text-muted-foreground underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground"
        >
          Log masuk di sini
        </Link>
      </p>
    </div>
  )
}
