import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../lib/toast'
import { Profile, Role, ROLE_LABEL } from '../../lib/types'
import { PageLoader, EmptyState, Modal, Spinner } from '../../components/ui'
import { FileUpload } from '../../components/FileUpload'
import { initials } from '../../lib/format'
import {
  UserPlus,
  Search,
  Mail,
  MailCheck,
  Pencil,
  Trash2,
  Users as UsersIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

const ROLE_TABS: { key: Role | 'all'; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'student', label: 'الطلاب' },
  { key: 'supervisor', label: 'المشرفون' },
  { key: 'training_unit', label: 'وحدة التدريب' },
  { key: 'coordinator', label: 'المرشدون' },
]

const emptyForm = {
  id: '',
  role: 'student' as Role,
  full_name: '',
  kku_email: '',
  university_number: '',
  phone: '',
  department: '',
  major: '',
  position: '',
  signature_url: null as string | null,
}

export default function Users() {
  const { profile } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Role | 'all'>('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('role')
      .order('created_at', { ascending: false })
    setRows((data as Profile[]) || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (tab !== 'all' && r.role !== tab) return false
      if (!search.trim()) return true
      const q = search.trim().toLowerCase()
      return (
        r.full_name.toLowerCase().includes(q) ||
        r.kku_email.toLowerCase().includes(q) ||
        (r.university_number || '').includes(q)
      )
    })
  }, [rows, tab, search])

  const openAdd = () => {
    setForm({ ...emptyForm })
    setModal(true)
  }
  const openEdit = (p: Profile) => {
    setForm({
      id: p.id,
      role: p.role,
      full_name: p.full_name,
      kku_email: p.kku_email,
      university_number: p.university_number || '',
      phone: p.phone || '',
      department: p.department || '',
      major: p.major || '',
      position: p.position || '',
      signature_url: p.signature_url,
    })
    setModal(true)
  }

  // للطالب: الإيميل = الرقم الجامعي@kku.edu.sa
  const effectiveEmail =
    form.role === 'student' && form.university_number
      ? `${form.university_number.trim()}@kku.edu.sa`
      : form.kku_email.trim()

  const save = async () => {
    if (!form.full_name.trim()) return toast.show('أدخل الاسم', 'error')
    if (form.role === 'student' && !form.university_number.trim())
      return toast.show('أدخل الرقم الجامعي', 'error')
    if (form.role !== 'student' && !form.kku_email.trim())
      return toast.show('أدخل البريد الجامعي', 'error')

    setSaving(true)
    const payload = {
      role: form.role,
      full_name: form.full_name.trim(),
      kku_email: effectiveEmail,
      university_number: form.role === 'student' ? form.university_number.trim() : null,
      phone: form.phone.trim() || null,
      department: form.department.trim() || null,
      major: form.role === 'student' ? form.major.trim() || null : null,
      position: form.role !== 'student' ? form.position.trim() || null : null,
      signature_url: form.signature_url,
    }
    let error
    if (form.id) {
      ;({ error } = await supabase.from('profiles').update(payload).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('profiles').insert({ ...payload, created_by: profile?.id }))
    }
    setSaving(false)
    if (error) return toast.show(error.message, 'error')
    toast.show(form.id ? 'تم تحديث البيانات' : 'تمت إضافة المستخدم')
    setModal(false)
    load()
  }

  const invite = async (p: Profile) => {
    setInviting(p.id)
    try {
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { profile_id: p.id, redirect_to: `${window.location.origin}${window.location.pathname}#/activate` },
      })
      if (error) throw error
      toast.show(`تم إرسال رابط التفعيل إلى ${p.kku_email}`)
      load()
    } catch (e: any) {
      toast.show(
        e?.message?.includes('Function not found') || e?.message?.includes('Failed to send')
          ? 'دالة الدعوة غير منشورة بعد. راجع خطوات النشر في README.'
          : e?.message || 'تعذّر إرسال الدعوة',
        'error',
      )
    } finally {
      setInviting(null)
    }
  }

  const toggleActive = async (p: Profile) => {
    const { error } = await supabase.from('profiles').update({ is_active: !p.is_active }).eq('id', p.id)
    if (error) return toast.show(error.message, 'error')
    load()
  }

  const remove = async (p: Profile) => {
    if (!confirm(`حذف ${p.full_name}؟ لا يمكن التراجع.`)) return
    const { error } = await supabase.from('profiles').delete().eq('id', p.id)
    if (error) return toast.show(error.message, 'error')
    toast.show('تم الحذف')
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">إدارة المستخدمين</h1>
          <p className="text-sm text-ink-muted">إضافة وتفعيل أعضاء هيئة التدريس والطلاب</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <UserPlus className="h-4 w-4" />
          إضافة مستخدم
        </button>
      </div>

      {/* تبويبات وبحث */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-bold transition ${
                tab === t.key ? 'bg-kku-600 text-white' : 'bg-white text-ink-soft hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ms-auto w-full max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pr-9"
            placeholder="بحث بالاسم أو البريد أو الرقم"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<UsersIcon className="h-12 w-12" />} title="لا يوجد مستخدمون" hint="ابدأ بإضافة مستخدم جديد" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-extrabold text-ink-muted">
                  <th className="px-4 py-3">المستخدم</th>
                  <th className="px-4 py-3">الدور</th>
                  <th className="px-4 py-3">البريد الجامعي</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-kku-50 text-xs font-extrabold text-kku-700">
                          {initials(p.full_name)}
                        </div>
                        <div>
                          <p className="font-extrabold text-ink">{p.full_name}</p>
                          {p.university_number && (
                            <p className="text-xs text-ink-muted" dir="ltr">
                              {p.university_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="chip bg-slate-100 text-slate-700">{ROLE_LABEL[p.role]}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft" dir="ltr">
                      {p.kku_email}
                    </td>
                    <td className="px-4 py-3">
                      {p.is_active ? (
                        <span className="chip bg-kku-100 text-kku-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> مفعّل
                        </span>
                      ) : (
                        <span className="chip bg-amber-50 text-amber-700">
                          <XCircle className="h-3.5 w-3.5" /> غير مفعّل
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => invite(p)}
                          disabled={inviting === p.id}
                          title="إرسال رابط التفعيل"
                          className="rounded-lg p-2 text-kku-600 hover:bg-kku-50"
                        >
                          {inviting === p.id ? (
                            <Spinner className="h-4 w-4" />
                          ) : p.auth_user_id ? (
                            <MailCheck className="h-4 w-4" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          title="تعديل"
                          className="rounded-lg p-2 text-ink-soft hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(p)}
                          title={p.is_active ? 'تعطيل' : 'تفعيل يدوي'}
                          className="rounded-lg p-2 text-ink-soft hover:bg-slate-100"
                        >
                          {p.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => remove(p)}
                          title="حذف"
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'تعديل مستخدم' : 'إضافة مستخدم'} size="lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">الدور</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="student">طالب</option>
              <option value="supervisor">مشرف التدريب</option>
              <option value="training_unit">وحدة التدريب</option>
              <option value="coordinator">مرشد التدريب</option>
            </select>
          </div>
          <div>
            <label className="label">الاسم الكامل</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>

          {form.role === 'student' ? (
            <>
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
                  البريد: <span dir="ltr">{effectiveEmail || '—'}</span>
                </p>
              </div>
              <div>
                <label className="label">التخصص</label>
                <input className="input" value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="label">البريد الجامعي</label>
                <input
                  className="input text-left"
                  dir="ltr"
                  placeholder="oanasr@kku.edu.sa"
                  value={form.kku_email}
                  onChange={(e) => setForm({ ...form, kku_email: e.target.value })}
                />
              </div>
              <div>
                <label className="label">المسمى الوظيفي</label>
                <input
                  className="input"
                  placeholder="عضو هيئة تدريس / مشرف وحدة التدريب"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                />
              </div>
            </>
          )}

          <div>
            <label className="label">الجوال (اختياري)</label>
            <input className="input text-left" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">القسم (اختياري)</label>
            <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>

          {form.role !== 'student' && (
            <div className="sm:col-span-2">
              <FileUpload
                label="التوقيع (قابل للتغيير)"
                hint="صورة توقيع بخلفية شفافة تظهر على الخطابات التي يعتمدها."
                folder="signatures"
                value={form.signature_url}
                onChange={(url) => setForm({ ...form, signature_url: url })}
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setModal(false)} className="btn-ghost">
            إلغاء
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Spinner className="h-4 w-4" /> : 'حفظ'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
