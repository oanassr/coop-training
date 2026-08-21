import { RequestStatus } from './types'

export function hijriDate(d: Date | string = new Date()): string {
  const date = typeof d === 'string' ? new Date(d) : d
  try {
    // تقويم أم القرى الرسمي المعتمد في السعودية، بأرقام لاتينية
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return date.toLocaleDateString('ar')
  }
}

export function gregDate(d: Date | string = new Date()): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function dateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// لون الشارة لكل حالة
export const STATUS_STYLE: Record<RequestStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-50 text-blue-700',
  needs_revision: 'bg-amber-50 text-amber-700',
  supervisor_approved: 'bg-teal-50 text-teal-700',
  supervisor_rejected: 'bg-red-50 text-red-700',
  unit_review: 'bg-indigo-50 text-indigo-700',
  issued: 'bg-kku-100 text-kku-700',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-500 line-through',
}

// ترتيب مراحل سير العمل للمتتبّع البصري
export const WORKFLOW_STEPS: { key: string; label: string; statuses: RequestStatus[] }[] = [
  { key: 'submit', label: 'تقديم الطلب', statuses: ['submitted', 'needs_revision'] },
  { key: 'supervisor', label: 'اعتماد المشرف', statuses: ['supervisor_approved', 'supervisor_rejected'] },
  { key: 'unit', label: 'اعتماد الوحدة', statuses: ['unit_review'] },
  { key: 'issued', label: 'الإصدار والختم', statuses: ['issued'] },
  { key: 'delivered', label: 'التسليم للجهة', statuses: ['delivered'] },
]

export function stepIndexForStatus(status: RequestStatus): number {
  switch (status) {
    case 'draft':
    case 'submitted':
    case 'needs_revision':
      return 0
    case 'supervisor_approved':
    case 'supervisor_rejected':
      return 1
    case 'unit_review':
      return 2
    case 'issued':
      return 3
    case 'delivered':
      return 4
    default:
      return 0
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}
