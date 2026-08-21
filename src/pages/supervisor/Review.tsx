import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { fetchRequests } from '../../lib/queries'
import { LetterRequest } from '../../lib/types'
import { PageLoader } from '../../components/ui'
import { RequestsTable } from '../../components/RequestsTable'

export default function Review() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<LetterRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'all'>('pending')

  useEffect(() => {
    if (!profile) return
    fetchRequests({ supervisorId: profile.id })
      .then(setRows)
      .finally(() => setLoading(false))
  }, [profile])

  const filtered = useMemo(
    () => (tab === 'pending' ? rows.filter((r) => r.status === 'submitted') : rows),
    [rows, tab],
  )
  const pendingCount = rows.filter((r) => r.status === 'submitted').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">طلبات المراجعة</h1>
        <p className="text-sm text-ink-muted">اعتمد أو أعِد طلبات طلابك</p>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={() => setTab('pending')}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tab === 'pending' ? 'bg-kku-600 text-white' : 'bg-white text-ink-soft hover:bg-slate-100'}`}
        >
          بانتظار المراجعة ({pendingCount})
        </button>
        <button
          onClick={() => setTab('all')}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tab === 'all' ? 'bg-kku-600 text-white' : 'bg-white text-ink-soft hover:bg-slate-100'}`}
        >
          كل طلبات طلابي ({rows.length})
        </button>
      </div>

      {loading ? <PageLoader /> : <RequestsTable rows={filtered} show={['student', 'entity']} />}
    </div>
  )
}
