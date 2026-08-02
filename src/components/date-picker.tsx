import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  calendarDateToStorageKL,
  formatDateStringKL,
  storageToCalendarDateKL,
} from '@/lib/datetime'

export interface DatePickerProps {
  /** Stored date string (yyyy-MM-dd) or null. */
  value: string | null
  onChange: (date: string | null) => void
  placeholder?: string
  disabled?: boolean
  /** Earliest selectable date (inclusive). */
  minDate?: Date
  /** Latest selectable date (inclusive). */
  maxDate?: Date
  /** Extra function-based day matcher (return true to disable). */
  disabledDays?: (date: Date) => boolean
  buttonClassName?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pilih tarikh',
  disabled,
  minDate,
  maxDate,
  disabledDays,
  buttonClassName,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const disabledMatchers = React.useMemo(() => {
    const matchers: Array<{ before: Date } | { after: Date } | ((d: Date) => boolean)> = []
    if (minDate) {
      const dayStart = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
      matchers.push({ before: dayStart })
    }
    if (maxDate) {
      const dayStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())
      matchers.push({ after: dayStart })
    }
    if (disabledDays) matchers.push(disabledDays)
    return matchers
  }, [minDate, maxDate, disabledDays])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start gap-2 text-left font-normal',
            !value && 'text-muted-foreground',
            buttonClassName,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {value ? formatDateStringKL(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? storageToCalendarDateKL(value) : undefined}
          onSelect={(date) => {
            if (date) {
              onChange(calendarDateToStorageKL(date))
            }
            setOpen(false)
          }}
          startMonth={minDate}
          endMonth={maxDate}
          disabled={disabledMatchers.length > 0 ? disabledMatchers : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
