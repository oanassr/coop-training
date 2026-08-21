import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { useToast } from '../../lib/toast'
import { Profile } from '../../lib/types'
import { PageLoader, EmptyState, Modal, Spinner } from '../../components/ui'
import { CredentialsModal, Creds } from '../../components/CredentialsModal'
import { initials } from '../../lib/format'
import { GraduationCap, Mail, Phone, UserPlus, KeyRound, CheckCircle2, XCircle } from 'lucide-react'

const empty = { full_name: '', university_number: '', major: '', phone: '' }

export default function MyStudents() {
  const { profile } = useAuth()
  const { settings } = useSettings()
  const toast = useToast()
  const [students, setStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState<string | null>(null)
  const [creds, setCreds] = useState<Creds | null>(null)

  const load = async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('student_assignments')
      .select('student:profiles!student_assignments_student_id_fkey(*)')
      .eq('supervisor_id', profile.id)
      .eq('is_active', true)
    setStudents(((data as any[]) || []).map((r) => r.student).filter(Boolean))
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [profile])

  const addStudent = async () => {
    if (!profile) return
    if (!form.full_name.trim()) return toast.show('أدخل اسم الطالب', 'error')
    if (!form.university_number.trim()) return toast.show('أدخل الرقم الجامعي', 'error')
    setSaving(true)
    try {
      const email = `${form.university_number.trim()}@kku.edu.sa`
      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .insert({
          role: 'student',
          full_name: form.full_name.trim(),
          kku_email: email,
          university_number: form.university_number.trim(),
          major: form.major.trim() || null,
          phone: form.phone.trim() || null,
          created_by: profile.id,
        })
        .select('id')
        .single()
      if (pErr) throw pErr
      const { error: aErr } = await supabase.from('student_assignments').insert({
        student_id: prof.id,
        supervisor_id: profile.id,
        term: settings?.current_term || 'الفصل الحالي',
        is_active: true,
        assigned_by: profile.id,
      })
      if (aErr) throw aErr
      toast.show('تمت إضافة الطالب وإسناده إليك')
      setModal(false)
      setForm({ ...empty })
      load()
    } catch (e: any) {
      toast.show(e.message || 'تعذّر الإضافة', 'error')
    } finally {
      setSaving(false)
    }
  }

  const activate = async (s: Profile) => {
    setActivating(s.id)
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', { body: { profile_id: s.id } })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      setCreds({ name: s.full_name, email: data.email, password: data.password, emailed: !!data.emailed })
      load()
    } catch (e: any) {
      toast.show(e?.message || 'تعذّر التفعيل', 'error')
    } finally {
      setActivating(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">طلابي</h1>
          <p className="text-sm text-ink-muted">الطلاب المسندون إليك — يمكنك إضافة طالب وتفعيل حسابه</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <UserPlus className="h-4 w-4" />
          إضافة طالب
        </button>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={<GraduationCap className="h-12 w-12" />}
          title="لا يوجد طلاب مسندون"
          hint="أضف طالباً وسيُسند إليك مباشرة"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between">
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
                {s.is_active ? (
                  <span className="chip bg-kku-100 text-kku-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> مفعّل
                  </span>
                ) : (
                  <span className="chip bg-amber-50 text-amber-700">
                    <XCircle className="h-3.5 w-3.5" /> غير مفعّل
                  </span>
                )}
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
              <div className="mt-4 border-t border-slate-100 pt-3">
                <button
                  onClick={() => activate(s)}
                  disabled={activating === s.id}
                  className="btn-ghost w-full"
                >
                  {activating === s.id ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      {s.is_active ? 'إعادة تعيين كلمة المرور' : 'تفعيل وإنشاء كلمة مرور'}
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="إضافة طالب">
        <div className="grid gap-4">
          <div>
            <label className="label">الاسم الكامل</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="label">الرقم الجامعي</label>
            <input
              className="input text-left"
              dir="ltr"
              placeholder="446801567"
              value={form.university_number}
              onChange={(e) => setForm({ ...form, university_number: e.target.value })}
            />
            <p className="mt-1 text-xs text-ink-muted">
              البريد: <span dir="ltr">{form.university_number ? `${form.university_number}@kku.edu.sa` : '—'}</span>
            </p>
          </div>
          <div>
            <label className="label">التخصص (اختياري)</label>
            <input className="input" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
          </div>
          <div>
            <label className="label">الجوال (اختياري)</label>
            <input className="input text-left" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setModal(false)} className="btn-ghost">
            إلغاء
          </button>
          <button onClick={addStudent} disabled={saving} className="btn-primary">
            {saving ? <Spinner className="h-4 w-4" /> : 'إضافة'}
          </button>
        </div>
      </Modal>

      <CredentialsModal creds={creds} onClose={() => setCreds(null)} />
    </div>
  )
}
