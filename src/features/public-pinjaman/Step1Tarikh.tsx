import { useQuery } from '@tanstack/react-query'
import { formatInTimeZone } from 'date-fns-tz'
import { ms } from 'date-fns/locale'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { useWizardStore } from '@/store/wizard'
import {
  TIMEZONE,
  todayDateStringKL,
  isWeekendDateStringKL,
  parseDateStringKL,
  calendarDateToStorageKL,
  storageToCalendarDateKL,
  isBeforeDateStringKL,
} from '@/lib/datetime'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export function Step1Tarikh() {
  const tarikhPinjaman = useWizardStore((s) => s.tarikh_pinjaman)
  const setTarikhPinjaman = useWizardStore((s) => s.setTarikhPinjaman)
  const tarikhPulangan = useWizardStore((s) => s.tarikh_pemulangan_dijangka)
  const setTarikhPulangan = useWizardStore((s) => s.setTarikhPemulanganDijangka)

  const { data: today } = useQuery({
    queryKey: ['today-kl'],
    queryFn: () => todayDateStringKL(),
    staleTime: 60_000,
  })

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Supabase belum dikonfigurasikan. Sila tetapkan VITE_SUPABASE_URL dan
        VITE_SUPABASE_ANON_KEY dalam fail .env.
      </div>
    )
  }

  const todayStr = today ?? todayDateStringKL()
  const todayDate = storageToCalendarDateKL(todayStr)

  const isDayDisabled = (date: Date) => {
    const dayStr = calendarDateToStorageKL(date)
    return isWeekendDateStringKL(dayStr)
  }

  const handleSelect = (date: Date | undefined) => {
    const next = date ? calendarDateToStorageKL(date) : null
    setTarikhPinjaman(next)
    if (next && tarikhPulangan && isBeforeDateStringKL(tarikhPulangan, next)) {
      setTarikhPulangan(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Langkah 1: Pilih Tarikh Pinjaman</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih tarikh anda ingin meminjam peralatan. Hari Sabtu dan Ahad adalah
          hari cuti, jadi tarikh tersebut tidak dibenarkan.
        </p>
      </div>

      <div>
        {today ? (
          <Calendar
            mode="single"
            selected={tarikhPinjaman ? storageToCalendarDateKL(tarikhPinjaman) : undefined}
            onSelect={handleSelect}
            startMonth={todayDate}
            disabled={[{ before: todayDate }, isDayDisabled]}
            className="mx-auto w-[80%] rounded-lg border"
            classNames={{ root: 'w-[80%]' }}
          />
        ) : (
          <Skeleton className="mx-auto h-[320px] w-[80%]" />
        )}
      </div>

      {tarikhPinjaman && (
        <div className="rounded-lg bg-primary/5 px-4 py-3 text-sm">
          <Label className="font-medium">Tarikh Pinjaman Dipilih</Label>
          <p className="mt-0.5 text-primary">
            {formatInTimeZone(parseDateStringKL(tarikhPinjaman), TIMEZONE, 'EEEE, d MMMM yyyy', {
              locale: ms,
            })}
          </p>
        </div>
      )}
    </div>
  )
}
