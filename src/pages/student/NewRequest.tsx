import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { useToast } from '../../lib/toast'
import { TrainingEntity, StudentAssignment, Profile } from '../../lib/types'
import { PageLoader, Spinner } from '../../components/ui'
import { AlertCircle, Send, Building2, PlusCircle, ListChecks } from 'lucide-react'

const emptyEntity = { name: '', city: '', sector: '', contact_person: '', contact_phone: '', contact_email: '' }

export default function NewRequest() {
  const { profile } = useAuth()
  const { settings } = useSettings()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [entities, setEntities] = useState<TrainingEntity[]>([])
  const [assignment, setAssignment] = useState<(StudentAssignment & { supervisor?: Profile }) | null>(null)
  const [entityId, setEntityId] = useState(params.get('entity') || '')
  const [purpose, setPurpose] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // وضع إضافة جهة جديدة
  const [newMode, setNewMode] = useState(false)
  const [newEntity, setNewEntity] = useState({ ...emptyEntity })

  useEffect(() => {
    if (!profile) return
    const run = async () => {
      const [{ data: ents }, { data: asg }] = await Promise.all([
        supabase.from('training_entities').select('*').eq('is_approved', true).order('name'),
        supabase
          .from('student_assignments')
          .select('*, supervisor:profiles!student_assignments_supervisor_id_fkey(*)')
          .eq('student_id', profile.id)
          .eq('is_active', true)
          .maybeSingle(),
      ])
      setEntities((ents as TrainingEntity[]) || [])
      setAssignment((asg as any) || null)
      setLoading(false)
    }
    run()
  }, [profile])

  const submit = async () => {
    if (!profile) return
    if (!assignment) return toast.show('لم يتم إسنادك لمشرف بعد. تواصل مع مرشد التدريب.', 'error')

    setSaving(true)
    try {
      let finalEntityId = entityId
      // إنشاء جهة جديدة (غير معتمدة) إن كان الطالب في وضع الإضافة
      if (newMode) {
        if (!newEntity.name.trim()) {
          setSaving(false)
          return toast.show('أدخل اسم الجهة الجديدة', 'error')
        }
        const { data: ent, error: eErr } = await supabase
          .from('training_entities')
          .insert({
            name: newEntity.name.trim(),
            city: newEntity.city.trim() || null,
            sector: newEntity.sector.trim() || null,
            contact_person: newEntity.contact_person.trim() || null,
            contact_phone: newEntity.contact_phone.trim() || null,
            contact_email: newEntity.contact_email.trim() || null,
            is_approved: false,
            created_by: profile.id,
          })
          .select('id')
          .single()
        if (eErr) throw eErr
        finalEntityId = ent.id
      } else if (!entityId) {
        setSaving(false)
        return toast.show('اختر جهة التدريب أو أضف جهة جديدة', 'error')
      }

      const { data, error } = await supabase
        .from('letter_requests')
        .insert({
          student_id: profile.id,
          entity_id: finalEntityId,
          supervisor_id: assignment.supervisor_id,
          term: settings?.current_term || 'الفصل الحالي',
          status: 'submitted',
          purpose: purpose.trim() || null,
        })
        .select('id')
        .single()
      if (error) throw error
      await supabase.from('letter_actions').insert({
        request_id: data.id,
        actor_id: profile.id,
        action: 'تقديم الطلب',
        to_status: 'submitted',
        note: newMode ? `جهة جديدة مقترحة: ${newEntity.name.trim()}` : purpose.trim() || null,
      })
      toast.show('تم تقديم طلبك للمشرف')
      navigate(`/requests/${data.id}`)
    } catch (e: any) {
      toast.show(e.message || 'تعذّر تقديم الطلب', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">طلب خطاب تدريب جديد</h1>
        <p className="text-sm text-ink-muted">قدّم طلبك ليعتمده مشرف التدريب ثم وحدة التدريب</p>
      </div>

      {!assignment && (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-extrabold">لم يتم إسنادك لمشرف تدريب بعد</p>
            <p className="text-sm">لا يمكنك تقديم طلب حتى يوزّعك مرشد التدريب على أحد المشرفين.</p>
          </div>
        </div>
      )}

      <div className="card space-y-5 p-6">
        {assignment?.supervisor && (
          <div className="rounded-xl bg-kku-50 px-4 py-3 text-sm">
            <span className="text-ink-muted">مشرف التدريب المسند إليك: </span>
            <span className="font-extrabold text-kku-700">{assignment.supervisor.full_name}</span>
          </div>
        )}

        {/* اختيار الوضع */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNewMode(false)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
              !newMode ? 'border-kku-600 bg-kku-50 text-kku-700' : 'border-slate-200 text-ink-soft hover:bg-slate-50'
            }`}
          >
            <ListChecks className="h-4 w-4" /> اختيار من المعتمدة
          </button>
          <button
            type="button"
            onClick={() => setNewMode(true)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
              newMode ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-slate-200 text-ink-soft hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="h-4 w-4" /> إضافة جهة جديدة
          </button>
        </div>

        {!newMode ? (
          <div>
            <label className="label">جهة التدريب</label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select className="input pr-9" value={entityId} onChange={(e) => setEntityId(e.target.value)}>
                <option value="">— اختر جهة معتمدة —</option>
                {entities.map((e) => {
                  const full = e.capacity > 0 && e.seats_taken >= e.capacity
                  return (
                    <option key={e.id} value={e.id} disabled={full}>
                      {e.name} {e.city ? `— ${e.city}` : ''} {full ? '(مكتملة)' : ''}
                    </option>
                  )
                })}
              </select>
            </div>
            {entities.length === 0 && (
              <p className="mt-1.5 text-xs text-ink-muted">لا توجد جهات معتمدة — يمكنك إضافة جهة جديدة من الأعلى.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4 rounded-xl border border-gold-200 bg-gold-50/40 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-gold-700">
              <AlertCircle className="h-4 w-4" /> ستُراجع وتُعتمد الجهة الجديدة من وحدة التدريب.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">اسم الجهة</label>
                <input className="input" value={newEntity.name} onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })} />
              </div>
              <div>
                <label className="label">المدينة</label>
                <input className="input" value={newEntity.city} onChange={(e) => setNewEntity({ ...newEntity, city: e.target.value })} />
              </div>
              <div>
                <label className="label">القطاع</label>
                <input className="input" placeholder="حكومي / خاص" value={newEntity.sector} onChange={(e) => setNewEntity({ ...newEntity, sector: e.target.value })} />
              </div>
              <div>
                <label className="label">مسؤول التواصل</label>
                <input className="input" value={newEntity.contact_person} onChange={(e) => setNewEntity({ ...newEntity, contact_person: e.target.value })} />
              </div>
              <div>
                <label className="label">جوال التواصل</label>
                <input className="input text-left" dir="ltr" value={newEntity.contact_phone} onChange={(e) => setNewEntity({ ...newEntity, contact_phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">بريد التواصل (اختياري)</label>
                <input className="input text-left" dir="ltr" value={newEntity.contact_email} onChange={(e) => setNewEntity({ ...newEntity, contact_email: e.target.value })} />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="label">ملاحظات / غرض الطلب (اختياري)</label>
          <textarea
            className="input"
            rows={3}
            placeholder="أي تفاصيل تودّ إضافتها لمشرفك أو وحدة التدريب…"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <button onClick={submit} disabled={saving || !assignment} className="btn-primary">
            {saving ? <Spinner className="h-4 w-4" /> : <><Send className="h-4 w-4" /> تقديم الطلب</>}
          </button>
        </div>
      </div>
    </div>
  )
}
