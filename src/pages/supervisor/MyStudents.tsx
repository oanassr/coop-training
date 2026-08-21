import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { Profile } from '../../lib/types'
import { PageLoader, EmptyState } from '../../components/ui'
import { initials } from '../../lib/format'
import { GraduationCap, Mail, Phone } from 'lucide-react'

export default function MyStudents() {
  const { profile } = useAuth()
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('student_assignments')
      .select('student:profiles!student_assignments_student_id_fkey(*)')
      .eq('supervisor_id', profile.id)
      .eq('is_active', true)
      .then(({ data }) => {
        setStudents(((data as any[]) || []).map((r) => r.student).filter(Boolean))
        setLoading(false)
      })
  }, [profile])

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">طلابي</h1>
        <p className="text-sm text-ink-muted">الطلاب المسندون إليك في التدريب التعاوني</p>
      </div>

      {students.length === 0 ? (
        <EmptyState icon={<GraduationCap className="h-12 w-12" />} title="لا يوجد طلاب مسندون" hint="سيظهر الطلاب هنا بعد توزيعهم عليك من مرشد التدريب" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-kku-50 text-sm font-extrabold text-kku-700">
                  {initials(s.full_name)}
                </div>
                <div>
                  <p className="font-extrabold text-ink">{s.full_name}</p>
                  {s.university_number && (
                    <p className="text-xs text-ink-muted" dir="ltr">
                      {s.university_number}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-ink-soft">
                {s.major && <p>التخصص: {s.major}</p>}
                <p className="flex items-center gap-2" dir="ltr">
                  <Mail className="h-4 w-4 text-slate-400" /> {s.kku_email}
                </p>
                {s.phone && (
                  <p className="flex items-center gap-2" dir="ltr">
                    <Phone className="h-4 w-4 text-slate-400" /> {s.phone}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
