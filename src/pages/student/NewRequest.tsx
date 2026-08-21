import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useSettings } from '../../lib/settings'
import { useToast } from '../../lib/toast'
import { TrainingEntity, StudentAssignment, Profile } from '../../lib/types'
import { PageLoader, Spinner } from '../../components/ui'
import { AlertCircle, Send, Building2 } from 'lucide-react'

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
    if (!entityId) return toast.show('اختر جهة التدريب', 'error')
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('letter_requests')
        .insert({
          student_id: profile.id,
          entity_id: entityId,
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
        note: purpose.trim() || null,
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
        </div>

        <div>
          <label className="label">ملاحظات / غرض الطلب (اختياري)</label>
          <textarea
            className="input"
            rows={4}
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
