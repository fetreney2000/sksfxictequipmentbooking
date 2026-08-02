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
} from '@/lib/datetime'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export function Step1Tarikh() {
  const tarikhPinjaman = useWizardStore((s) => s.tarikh_pinjaman)
  const setTarikhPinjaman = useWizardStore((s) => s.setTarikhPinjaman)

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Langkah 1: Pilih Tarikh Pinjaman</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih tarikh anda ingin meminjam peralatan. Hari Sabtu dan Ahad adalah
          hari cuti, jadi tarikh tersebut tidak dibenarkan.
        </p>
      </div>

      <div className="flex justify-center">
        {today ? (
          <Calendar
            mode="single"
            selected={tarikhPinjaman ? storageToCalendarDateKL(tarikhPinjaman) : undefined}
            onSelect={(date) => setTarikhPinjaman(date ? calendarDateToStorageKL(date) : null)}
            startMonth={todayDate}
            disabled={[{ before: todayDate }, isDayDisabled]}
            className="w-[360px] rounded-lg border"
          />
        ) : (
          <Skeleton className="h-[320px] w-[360px]" />
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
