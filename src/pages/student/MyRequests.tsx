import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { fetchRequests } from '../../lib/queries'
import { LetterRequest } from '../../lib/types'
import { PageLoader } from '../../components/ui'
import { RequestsTable } from '../../components/RequestsTable'
import { FilePlus2 } from 'lucide-react'

export default function MyRequests() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<LetterRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchRequests({ studentId: profile.id })
      .then(setRows)
      .finally(() => setLoading(false))
  }, [profile])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">طلباتي</h1>
          <p className="text-sm text-ink-muted">تابع حالة طلبات خطابات التدريب</p>
        </div>
        <Link to="/new-request" className="btn-primary">
          <FilePlus2 className="h-4 w-4" />
          طلب جديد
        </Link>
      </div>

      {loading ? <PageLoader /> : <RequestsTable rows={rows} show={['entity', 'supervisor']} />}
    </div>
  )
}
