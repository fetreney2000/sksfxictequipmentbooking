import { Badge } from '@/components/ui/badge'
import {
  STATUS_PERMOHONAN_LABEL,
  STATUS_PERMOHONAN_VARIANT,
  STATUS_PERALATAN_LABEL,
  STATUS_PERALATAN_VARIANT,
} from '@/lib/constants'
import type { PermohonanStatus, PeralatanStatus } from '@/lib/types'

export function StatusPermohonanBadge({ status }: { status: PermohonanStatus }) {
  return (
    <Badge variant={STATUS_PERMOHONAN_VARIANT[status]} className="whitespace-nowrap">
      {STATUS_PERMOHONAN_LABEL[status]}
    </Badge>
  )
}

export function StatusPeralatanBadge({ status }: { status: PeralatanStatus }) {
  return (
    <Badge variant={STATUS_PERALATAN_VARIANT[status]} className="whitespace-nowrap">
      {STATUS_PERALATAN_LABEL[status]}
    </Badge>
  )
}
