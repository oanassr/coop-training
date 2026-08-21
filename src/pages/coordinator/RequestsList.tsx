import { useEffect, useMemo, useState } from 'react'
import { fetchRequests } from '../../lib/queries'
import { LetterRequest, RequestStatus, STATUS_LABEL } from '../../lib/types'
import { PageLoader } from '../../components/ui'
import { RequestsTable } from '../../components/RequestsTable'
import { Search } from 'lucide-react'

const STATUS_FILTERS: (RequestStatus | 'all')[] = [
  'all',
  'submitted',
  'supervisor_approved',
  'unit_review',
  'issued',
  'delivered',
  'needs_revision',
]

export default function RequestsList() {
  const [rows, setRows] = useState<LetterRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<RequestStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchRequests()
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return (
        (r.request_number || '').toLowerCase().includes(q) ||
        (r.student?.full_name || '').toLowerCase().includes(q) ||
        (r.entity?.name || '').toLowerCase().includes(q)
      )
    })
  }, [rows, status, search])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">الطلبات</h1>
        <p className="text-sm text-ink-muted">جميع طلبات خطابات التدريب</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                status === s ? 'bg-kku-600 text-white' : 'bg-white text-ink-soft hover:bg-slate-100'
              }`}
            >
              {s === 'all' ? 'الكل' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative ms-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pr-9" placeholder="بحث" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <PageLoader /> : <RequestsTable rows={filtered} />}
    </div>
  )
}
