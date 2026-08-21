import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useSettings } from '../lib/settings'
import { useToast } from '../lib/toast'
import { fetchRequest } from '../lib/queries'
import { transition } from '../lib/workflow'
import { LetterRequest, LetterAction, STATUS_LABEL } from '../lib/types'
import { PageLoader, StatusBadge, Modal, Spinner } from '../components/ui'
import { LetterDocument } from '../components/LetterDocument'
import { WORKFLOW_STEPS, stepIndexForStatus, dateTime, initials } from '../lib/format'
import { makeQr, downloadPdf, elementToPdfBlob } from '../lib/pdf'
import {
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Stamp,
  Download,
  FileText,
  Building2,
  User,
  GraduationCap,
  Clock,
  Truck,
  Eye,
} from 'lucide-react'

export default function RequestDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const { settings } = useSettings()
  const toast = useToast()
  const navigate = useNavigate()

  const [req, setReq] = useState<LetterRequest | null>(null)
  const [actions, setActions] = useState<LetterAction[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [qr, setQr] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [noteModal, setNoteModal] = useState<null | { kind: 'return' | 'reject'; title: string }>(null)
  const [note, setNote] = useState('')
  const letterRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    if (!id) return
    const r = await fetchRequest(id)
    setReq(r)
    const { data: acts } = await supabase
      .from('letter_actions')
      .select('*, actor:profiles!letter_actions_actor_id_fkey(*)')
      .eq('request_id', id)
      .order('created_at', { ascending: true })
    setActions((acts as any) || [])
    if (r?.issued?.verify_token) {
      const url = `${window.location.origin}${window.location.pathname}#/verify/${r.issued.verify_token}`
      setQr(await makeQr(url))
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <PageLoader />
  if (!req || !profile || !settings)
    return <div className="card p-8 text-center font-bold text-ink-muted">الطلب غير موجود أو لا تملك صلاحية عرضه.</div>

  const role = profile.role
  const isAssignedSupervisor = role === 'supervisor' && req.supervisor_id === profile.id
  const isOwner = role === 'student' && req.student_id === profile.id
  const isUnit = role === 'training_unit' || role === 'coordinator' || role === 'admin'
  const currentStep = stepIndexForStatus(req.status)

  // ---- إجراءات المشرف ----
  const supervisorApprove = async () => {
    setBusy(true)
    try {
      await transition({
        requestId: req.id,
        from: req.status,
        to: 'supervisor_approved',
        actorId: profile.id,
        action: 'اعتماد المشرف',
      })
      toast.show('تم اعتماد الطلب وإحالته لوحدة التدريب')
      load()
    } catch (e: any) {
      toast.show(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const doNoteAction = async () => {
    if (!noteModal) return
    setBusy(true)
    try {
      const to = noteModal.kind === 'return' ? 'needs_revision' : role === 'supervisor' ? 'supervisor_rejected' : 'needs_revision'
      await transition({
        requestId: req.id,
        from: req.status,
        to,
        actorId: profile.id,
        action: noteModal.kind === 'return' ? 'إرجاع للتعديل' : 'رفض الطلب',
        note: note.trim() || undefined,
      })
      toast.show('تم تنفيذ الإجراء')
      setNoteModal(null)
      setNote('')
      load()
    } catch (e: any) {
      toast.show(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  // ---- إصدار الخطاب (وحدة التدريب) ----
  const issueLetter = async () => {
    setBusy(true)
    try {
      const { data: numData, error: numErr } = await supabase.rpc('next_letter_number')
      if (numErr) throw numErr
      const letterNumber = numData as unknown as string

      const { error: insErr } = await supabase.from('issued_letters').insert({
        request_id: req.id,
        letter_number: letterNumber,
        issued_by: profile.id,
        supervisor_name: req.supervisor?.full_name || null,
        supervisor_signature_snapshot: req.supervisor?.signature_url || null,
        unit_supervisor_name: settings.unit_supervisor_name || null,
        unit_signature_snapshot: settings.unit_signature_url || null,
        stamp_snapshot: settings.stamp_url || null,
      })
      if (insErr) throw insErr

      await transition({
        requestId: req.id,
        from: req.status,
        to: 'issued',
        actorId: profile.id,
        action: 'إصدار الخطاب واعتماده',
        note: `رقم الخطاب: ${letterNumber}`,
      })

      // حجز مقعد في الجهة
      if (req.entity) {
        await supabase
          .from('training_entities')
          .update({ seats_taken: (req.entity.seats_taken || 0) + 1 })
          .eq('id', req.entity.id)
      }

      toast.show('تم إصدار الخطاب بنجاح')
      await load()
      // رفع نسخة PDF أرشيفية (أفضل جهد)
      setTimeout(() => uploadArchive(letterNumber), 600)
    } catch (e: any) {
      toast.show(e.message || 'تعذّر الإصدار', 'error')
    } finally {
      setBusy(false)
    }
  }

  const uploadArchive = async (letterNumber: string) => {
    if (!letterRef.current) return
    try {
      const blob = await elementToPdfBlob(letterRef.current)
      const path = `${req.id}.pdf`
      await supabase.storage.from('letters').upload(path, blob, { upsert: true, contentType: 'application/pdf' })
      const { data } = supabase.storage.from('letters').getPublicUrl(path)
      await supabase.from('issued_letters').update({ pdf_url: data.publicUrl }).eq('request_id', req.id)
    } catch {
      /* أرشفة اختيارية */
    }
  }

  const markDelivered = async () => {
    setBusy(true)
    try {
      await transition({
        requestId: req.id,
        from: req.status,
        to: 'delivered',
        actorId: profile.id,
        action: 'تأكيد التسليم للجهة',
      })
      toast.show('تم تحديث الحالة إلى: سُلّم للجهة')
      load()
    } catch (e: any) {
      toast.show(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    if (!letterRef.current) return
    setBusy(true)
    try {
      await downloadPdf(letterRef.current, `خطاب-تدريب-${req.request_number}.pdf`)
    } finally {
      setBusy(false)
    }
  }

  const canDownload = req.status === 'issued' || req.status === 'delivered'

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-bold text-ink-muted hover:text-ink">
        <ArrowRight className="h-4 w-4" /> رجوع
      </button>

      {/* رأس */}
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-ink" dir="ltr">
                {req.request_number}
              </h1>
              <StatusBadge status={req.status} />
            </div>
            <p className="mt-1 text-sm text-ink-muted">طلب خطاب تدريب — {req.term}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canDownload && (
              <>
                <button onClick={() => setShowPreview(true)} className="btn-ghost">
                  <Eye className="h-4 w-4" /> معاينة
                </button>
                <button onClick={download} disabled={busy} className="btn-primary">
                  {busy ? <Spinner className="h-4 w-4" /> : <><Download className="h-4 w-4" /> تحميل PDF</>}
                </button>
              </>
            )}
          </div>
        </div>

        {/* المتتبّع البصري */}
        <div className="mt-6 flex items-center">
          {WORKFLOW_STEPS.map((s, i) => {
            const done = i < currentStep
            const active = i === currentStep
            return (
              <div key={s.key} className="flex flex-1 items-center last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-full text-sm font-extrabold transition ${
                      done
                        ? 'bg-kku-600 text-white'
                        : active
                        ? 'bg-gold-500 text-white ring-4 ring-gold-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`mt-1.5 hidden text-center text-xs font-bold sm:block ${active ? 'text-gold-600' : done ? 'text-kku-700' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className={`mx-1 h-0.5 flex-1 ${i < currentStep ? 'bg-kku-500' : 'bg-slate-200'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* التفاصيل + الإجراءات */}
        <div className="space-y-6 lg:col-span-2">
          {/* بيانات */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-extrabold text-ink">تفاصيل الطلب</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Info icon={<GraduationCap className="h-4 w-4" />} label="الطالب" value={req.student?.full_name} sub={req.student?.university_number || undefined} />
              <Info icon={<Building2 className="h-4 w-4" />} label="جهة التدريب" value={req.entity?.name} sub={req.entity?.city || undefined} />
              <Info icon={<User className="h-4 w-4" />} label="مشرف التدريب" value={req.supervisor?.full_name} />
              <Info icon={<FileText className="h-4 w-4" />} label="الفصل" value={req.term} />
            </div>
            {req.purpose && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-ink-soft">
                <span className="font-bold text-ink">ملاحظات الطالب: </span>
                {req.purpose}
              </div>
            )}
          </div>

          {/* لوحة الإجراءات */}
          {(isAssignedSupervisor || isUnit || isOwner) && (
            <div className="card p-6">
              <h2 className="mb-4 text-lg font-extrabold text-ink">الإجراءات</h2>
              <div className="flex flex-wrap gap-2">
                {/* مشرف: طلب مُقدَّم */}
                {isAssignedSupervisor && req.status === 'submitted' && (
                  <>
                    <button onClick={supervisorApprove} disabled={busy} className="btn-primary">
                      <Check className="h-4 w-4" /> اعتماد وتوقيع
                    </button>
                    <button onClick={() => setNoteModal({ kind: 'return', title: 'إرجاع للتعديل' })} className="btn-gold">
                      <RotateCcw className="h-4 w-4" /> إرجاع للتعديل
                    </button>
                    <button onClick={() => setNoteModal({ kind: 'reject', title: 'رفض الطلب' })} className="btn-danger">
                      <X className="h-4 w-4" /> رفض
                    </button>
                  </>
                )}

                {/* وحدة التدريب: بعد اعتماد المشرف */}
                {isUnit && (req.status === 'supervisor_approved' || req.status === 'unit_review') && (
                  <>
                    <button onClick={issueLetter} disabled={busy} className="btn-primary">
                      {busy ? <Spinner className="h-4 w-4" /> : <><Stamp className="h-4 w-4" /> إصدار واعتماد وختم</>}
                    </button>
                    <button onClick={() => setNoteModal({ kind: 'return', title: 'إرجاع للمشرف/الطالب' })} className="btn-gold">
                      <RotateCcw className="h-4 w-4" /> إرجاع للتعديل
                    </button>
                  </>
                )}

                {/* طالب: إعادة تقديم بعد الإرجاع */}
                {isOwner && (req.status === 'needs_revision' || req.status === 'supervisor_rejected') && (
                  <button
                    onClick={async () => {
                      setBusy(true)
                      try {
                        await transition({ requestId: req.id, from: req.status, to: 'submitted', actorId: profile.id, action: 'إعادة تقديم الطلب' })
                        toast.show('تمت إعادة تقديم الطلب')
                        load()
                      } finally {
                        setBusy(false)
                      }
                    }}
                    disabled={busy}
                    className="btn-primary"
                  >
                    <Check className="h-4 w-4" /> إعادة التقديم
                  </button>
                )}

                {/* طالب: تأكيد التسليم */}
                {isOwner && req.status === 'issued' && (
                  <button onClick={markDelivered} disabled={busy} className="btn-primary">
                    <Truck className="h-4 w-4" /> تأكيد التسليم للجهة
                  </button>
                )}

                {/* لا إجراء متاح */}
                {!actionAvailable(req.status, { isAssignedSupervisor, isUnit, isOwner }) && (
                  <p className="text-sm text-ink-muted">لا توجد إجراءات متاحة في هذه المرحلة.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* السجل الزمني */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink">
            <Clock className="h-5 w-5 text-kku-600" /> سجل الإجراءات
          </h2>
          <ol className="relative space-y-5 border-r-2 border-slate-100 pr-4">
            {actions.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -right-[22px] top-1 grid h-4 w-4 place-items-center rounded-full bg-kku-600 ring-4 ring-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                <p className="text-sm font-extrabold text-ink">{a.action}</p>
                <p className="text-xs text-ink-muted">
                  {a.actor ? a.actor.full_name : 'النظام'}
                  {a.to_status ? ` — ${STATUS_LABEL[a.to_status]}` : ''}
                </p>
                {a.note && <p className="mt-1 rounded-lg bg-slate-50 px-2 py-1 text-xs text-ink-soft">{a.note}</p>}
                <p className="mt-0.5 text-[11px] text-slate-400">{dateTime(a.created_at)}</p>
              </li>
            ))}
            {actions.length === 0 && <p className="text-sm text-ink-muted">لا يوجد سجل بعد.</p>}
          </ol>
        </div>
      </div>

      {/* مستند الخطاب — يُرسم دائماً (خارج الشاشة) لالتقاط PDF، ويُعرض داخل المعاينة */}
      <div style={{ position: 'fixed', left: -10000, top: 0 }} aria-hidden>
        <LetterDocument ref={letterRef} request={req} settings={settings} qr={qr} />
      </div>

      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="معاينة الخطاب" size="xl">
        <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4">
          <div className="mx-auto w-fit shadow-lg">
            <LetterDocument request={req} settings={settings} qr={qr} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={download} disabled={busy} className="btn-primary">
            <Download className="h-4 w-4" /> تحميل PDF
          </button>
        </div>
      </Modal>

      <Modal open={!!noteModal} onClose={() => setNoteModal(null)} title={noteModal?.title || ''}>
        <label className="label">سبب / ملاحظة (تظهر لمقدّم الطلب)</label>
        <textarea className="input" rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="اكتب سبب الإرجاع أو الرفض…" />
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setNoteModal(null)} className="btn-ghost">
            إلغاء
          </button>
          <button onClick={doNoteAction} disabled={busy} className="btn-primary">
            {busy ? <Spinner className="h-4 w-4" /> : 'تأكيد'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function actionAvailable(
  status: string,
  ctx: { isAssignedSupervisor: boolean; isUnit: boolean; isOwner: boolean },
): boolean {
  if (ctx.isAssignedSupervisor && status === 'submitted') return true
  if (ctx.isUnit && (status === 'supervisor_approved' || status === 'unit_review')) return true
  if (ctx.isOwner && (status === 'needs_revision' || status === 'supervisor_rejected' || status === 'issued')) return true
  return false
}

function Info({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value?: string | null; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-kku-50 text-kku-700">{icon}</div>
      <div>
        <p className="text-xs font-bold text-ink-muted">{label}</p>
        <p className="font-extrabold text-ink">{value || '—'}</p>
        {sub && <p className="text-xs text-ink-muted" dir="ltr">{sub}</p>}
      </div>
    </div>
  )
}
