import { Link } from 'react-router-dom'
import { LetterRequest } from '../lib/types'
import { StatusBadge, EmptyState } from './ui'
import { gregDate } from '../lib/format'
import { FileText, ChevronLeft } from 'lucide-react'

export function RequestsTable({
  rows,
  show = ['student', 'entity', 'supervisor'],
}: {
  rows: LetterRequest[]
  show?: ('student' | 'entity' | 'supervisor')[]
}) {
  if (rows.length === 0) {
    return <EmptyState icon={<FileText className="h-12 w-12" />} title="لا توجد طلبات" hint="ستظهر الطلبات هنا عند توفرها" />
  }
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs font-extrabold text-ink-muted">
              <th className="px-4 py-3">رقم الطلب</th>
              {show.includes('student') && <th className="px-4 py-3">الطالب</th>}
              {show.includes('entity') && <th className="px-4 py-3">جهة التدريب</th>}
              {show.includes('supervisor') && <th className="px-4 py-3">المشرف</th>}
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">التاريخ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-bold text-ink" dir="ltr">
                  {r.request_number}
                </td>
                {show.includes('student') && (
                  <td className="px-4 py-3 text-ink-soft">{r.student?.full_name || '—'}</td>
                )}
                {show.includes('entity') && (
                  <td className="px-4 py-3 text-ink-soft">{r.entity?.name || '—'}</td>
                )}
                {show.includes('supervisor') && (
                  <td className="px-4 py-3 text-ink-soft">{r.supervisor?.full_name || '—'}</td>
                )}
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-ink-muted">{gregDate(r.created_at)}</td>
                <td className="px-4 py-3">
                  <Link
                    to={`/requests/${r.id}`}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-bold text-kku-600 hover:bg-kku-50"
                  >
                    التفاصيل
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
