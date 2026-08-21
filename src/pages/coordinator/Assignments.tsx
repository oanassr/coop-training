import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { useToast } from '../../lib/toast'
import { Profile, StudentAssignment } from '../../lib/types'
import { PageLoader, EmptyState, Spinner } from '../../components/ui'
import { initials } from '../../lib/format'
import { Network, Search, GraduationCap } from 'lucide-react'

export default function Assignments() {
  const { profile } = useAuth()
  const { settings } = useSettings()
  const toast = useToast()
  const [students, setStudents] = useState<Profile[]>([])
  const [supervisors, setSupervisors] = useState<Profile[]>([])
  const [assign, setAssign] = useState<Record<string, StudentAssignment>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unassigned'>('all')

  const load = async () => {
    setLoading(true)
    const [{ data: st }, { data: sv }, { data: asg }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
      supabase.from('profiles').select('*').eq('role', 'supervisor').order('full_name'),
      supabase.from('student_assignments').select('*').eq('is_active', true),
    ])
    setStudents((st as Profile[]) || [])
    setSupervisors((sv as Profile[]) || [])
    const map: Record<string, StudentAssignment> = {}
    ;(asg as StudentAssignment[] | null)?.forEach((a) => (map[a.student_id] = a))
    setAssign(map)
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const changeSupervisor = async (studentId: string, supervisorId: string) => {
    setSavingId(studentId)
    try {
      const current = assign[studentId]
      if (current && current.supervisor_id === supervisorId) return
      // تعطيل الإسناد الحالي
      if (current) {
        await supabase.from('student_assignments').update({ is_active: false }).eq('id', current.id)
      }
      if (supervisorId) {
        const { error } = await supabase.from('student_assignments').insert({
          student_id: studentId,
          supervisor_id: supervisorId,
          term: settings?.current_term || 'الفصل الحالي',
          is_active: true,
          assigned_by: profile?.id,
        })
        if (error) throw error
        // تحديث المشرف على الطلبات المعلّقة (المرونة عند تغيير المشرف)
        await supabase
          .from('letter_requests')
          .update({ supervisor_id: supervisorId })
          .eq('student_id', studentId)
          .in('status', ['submitted', 'needs_revision', 'supervisor_rejected'])
      }
      toast.show('تم تحديث الإسناد')
      await load()
    } catch (e: any) {
      toast.show(e.message || 'تعذّر الحفظ', 'error')
    } finally {
      setSavingId(null)
    }
  }

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (filter === 'unassigned' && assign[s.id]) return false
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return s.full_name.toLowerCase().includes(q) || (s.university_number || '').includes(q)
    })
  }, [students, assign, search, filter])

  const unassignedCount = students.filter((s) => !assign[s.id]).length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">توزيع الطلاب على المشرفين</h1>
        <p className="text-sm text-ink-muted">
          إسناد كل طالب لمشرف تدريب. تغيير المشرف يحدّث الطلبات المعلّقة تلقائياً.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold ${filter === 'all' ? 'bg-kku-600 text-white' : 'bg-white text-ink-soft hover:bg-slate-100'}`}
          >
            الكل ({students.length})
          </button>
          <button
            onClick={() => setFilter('unassigned')}
            className={`rounded-lg px-3 py-1.5 text-sm font-bold ${filter === 'unassigned' ? 'bg-gold-500 text-white' : 'bg-white text-ink-soft hover:bg-slate-100'}`}
          >
            غير موزّعين ({unassignedCount})
          </button>
        </div>
        <div className="relative ms-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pr-9" placeholder="بحث عن طالب" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : supervisors.length === 0 ? (
        <EmptyState icon={<Network className="h-12 w-12" />} title="لا يوجد مشرفون" hint="أضف مشرفي التدريب أولاً من صفحة المستخدمين" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<GraduationCap className="h-12 w-12" />} title="لا يوجد طلاب" hint="أضف طلاباً أو غيّر عوامل التصفية" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-extrabold text-ink-muted">
                  <th className="px-4 py-3">الطالب</th>
                  <th className="px-4 py-3">الرقم الجامعي</th>
                  <th className="px-4 py-3">المشرف المسند</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-kku-50 text-xs font-extrabold text-kku-700">
                          {initials(s.full_name)}
                        </div>
                        <span className="font-extrabold text-ink">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft" dir="ltr">
                      {s.university_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          className="input max-w-xs py-2"
                          value={assign[s.id]?.supervisor_id || ''}
                          onChange={(e) => changeSupervisor(s.id, e.target.value)}
                          disabled={savingId === s.id}
                        >
                          <option value="">— بدون مشرف —</option>
                          {supervisors.map((sv) => (
                            <option key={sv.id} value={sv.id}>
                              {sv.full_name}
                            </option>
                          ))}
                        </select>
                        {savingId === s.id && <Spinner className="h-4 w-4 text-kku-600" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
