import { useEffect, useMemo, useState } from 'react'
import { fetchRequests } from '../../lib/queries'
import { LetterRequest } from '../../lib/types'
import { PageLoader } from '../../components/ui'
import { RequestsTable } from '../../components/RequestsTable'

export default function Queue() {
  const [rows, setRows] = useState<LetterRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'issued'>('pending')

  useEffect(() => {
    fetchRequests()
      .then(setRows)
      .finally(() => setLoading(false))
  }, [])

  const pending = useMemo(
    () => rows.filter((r) => r.status === 'supervisor_approved' || r.status === 'unit_review'),
    [rows],
  )
  const issued = useMemo(() => rows.filter((r) => r.status === 'issued' || r.status === 'delivered'), [rows])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">قائمة الاعتماد النهائي</h1>
        <p className="text-sm text-ink-muted">اعتمد وأصدِر الخطابات الموقّعة من المشرفين بالتوقيع والختم</p>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={() => setTab('pending')}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tab === 'pending' ? 'bg-kku-600 text-white' : 'bg-white text-ink-soft hover:bg-slate-100'}`}
        >
          بانتظار الإصدار ({pending.length})
        </button>
        <button
          onClick={() => setTab('issued')}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tab === 'issued' ? 'bg-kku-600 text-white' : 'bg-white text-ink-soft hover:bg-slate-100'}`}
        >
          المُصدَرة ({issued.length})
        </button>
      </div>

      {loading ? <PageLoader /> : <RequestsTable rows={tab === 'pending' ? pending : issued} show={['student', 'entity', 'supervisor']} />}
    </div>
  )
}
