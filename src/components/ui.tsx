import { ReactNode } from 'react'
import { RequestStatus, STATUS_LABEL } from '../lib/types'
import { STATUS_STYLE } from '../lib/format'
import { Loader2, X } from 'lucide-react'

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`chip ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
}

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />
}

export function PageLoader({ label = 'جارٍ التحميل…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-muted">
      <Spinner className="h-8 w-8 text-kku-600" />
      <p className="text-sm font-bold">{label}</p>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <h3 className="text-base font-extrabold text-ink-soft">{title}</h3>
      {hint && <p className="max-w-sm text-sm text-ink-muted">{hint}</p>}
      {action}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!open) return null
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm">
      <div className={`card w-full ${w} my-8 animate-fade-up`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-extrabold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'kku',
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: 'kku' | 'gold' | 'blue' | 'slate'
}) {
  const tones = {
    kku: 'from-kku-600 to-kku-700',
    gold: 'from-gold-500 to-gold-600',
    blue: 'from-blue-500 to-blue-600',
    slate: 'from-slate-600 to-slate-700',
  }
  return (
    <div className="card overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-ink-muted">{label}</p>
          <p className="mt-1 text-3xl font-extrabold text-ink">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${tones[tone]} text-white shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function Toast({ msg, type = 'success' }: { msg: string; type?: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg animate-fade-up ${
        type === 'success' ? 'bg-kku-600' : 'bg-red-600'
      }`}
    >
      {msg}
    </div>
  )
}
