import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useSettings } from '../../lib/settings'
import { useToast } from '../../lib/toast'
import { Settings } from '../../lib/types'
import { PageLoader, Spinner } from '../../components/ui'
import { FileUpload } from '../../components/FileUpload'
import { Save, Building2, Stamp, PenLine, FileText } from 'lucide-react'

export default function SettingsPage() {
  const { settings, refresh } = useSettings()
  const toast = useToast()
  const [form, setForm] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  if (!form) return <PageLoader />

  const set = (patch: Partial<Settings>) => setForm({ ...form, ...patch })

  const save = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .update({
        college_name: form.college_name,
        university_name: form.university_name,
        unit_name: form.unit_name,
        unit_supervisor_name: form.unit_supervisor_name,
        current_term: form.current_term,
        letter_template: form.letter_template,
        logo_url: form.logo_url,
        stamp_url: form.stamp_url,
        unit_signature_url: form.unit_signature_url,
      })
      .eq('id', 1)
    setSaving(false)
    if (error) return toast.show(error.message, 'error')
    toast.show('تم حفظ الإعدادات')
    refresh()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">الإعدادات</h1>
          <p className="text-sm text-ink-muted">هوية النظام وقالب الخطاب والتواقيع</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Spinner className="h-4 w-4" /> : <><Save className="h-4 w-4" /> حفظ التغييرات</>}
        </button>
      </div>

      {/* الهوية */}
      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink">
          <Building2 className="h-5 w-5 text-kku-600" /> الهوية العامة
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">اسم الجامعة</label>
            <input className="input" value={form.university_name} onChange={(e) => set({ university_name: e.target.value })} />
          </div>
          <div>
            <label className="label">اسم الكلية</label>
            <input className="input" value={form.college_name} onChange={(e) => set({ college_name: e.target.value })} />
          </div>
          <div>
            <label className="label">اسم وحدة التدريب</label>
            <input className="input" value={form.unit_name} onChange={(e) => set({ unit_name: e.target.value })} />
          </div>
          <div>
            <label className="label">الفصل الدراسي الحالي</label>
            <input className="input" value={form.current_term} onChange={(e) => set({ current_term: e.target.value })} />
          </div>
        </div>
        <div className="mt-4">
          <FileUpload
            label="شعار جامعة الملك خالد"
            hint="يظهر في ترويسة النظام وعلى الخطاب الرسمي. يُفضّل صورة PNG واضحة."
            folder="logo"
            value={form.logo_url}
            onChange={(url) => set({ logo_url: url })}
          />
        </div>
      </section>

      {/* التواقيع والختم */}
      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-ink">
          <Stamp className="h-5 w-5 text-kku-600" /> اعتماد وحدة التدريب
        </h2>
        <div>
          <label className="label">اسم مشرف وحدة التدريب</label>
          <input
            className="input"
            placeholder="الاسم الذي يظهر تحت توقيع الوحدة"
            value={form.unit_supervisor_name || ''}
            onChange={(e) => set({ unit_supervisor_name: e.target.value })}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FileUpload
            label="توقيع مشرف الوحدة"
            hint="يظهر على الخطاب عند الإصدار."
            folder="signatures"
            value={form.unit_signature_url}
            onChange={(url) => set({ unit_signature_url: url })}
          />
          <FileUpload
            label="الختم الرسمي"
            hint="ختم الكلية/الوحدة على الخطاب."
            folder="stamp"
            value={form.stamp_url}
            onChange={(url) => set({ stamp_url: url })}
          />
        </div>
      </section>

      {/* قالب الخطاب */}
      <section className="card p-6">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-ink">
          <FileText className="h-5 w-5 text-kku-600" /> نص قالب الخطاب
        </h2>
        <p className="mb-3 text-sm text-ink-muted">
          يمكنك استخدام المتغيرات التالية وسيتم استبدالها تلقائياً:
          <span className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono" dir="ltr">{'{{student_name}}'}</span>
          <span className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono" dir="ltr">{'{{university_number}}'}</span>
          <span className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono" dir="ltr">{'{{major}}'}</span>
          <span className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono" dir="ltr">{'{{entity_name}}'}</span>
          <span className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono" dir="ltr">{'{{term}}'}</span>
        </p>
        <textarea
          className="input font-medium leading-8"
          rows={6}
          value={form.letter_template}
          onChange={(e) => set({ letter_template: e.target.value })}
        />
      </section>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? <Spinner className="h-4 w-4" /> : <><PenLine className="h-4 w-4" /> حفظ التغييرات</>}
        </button>
      </div>
    </div>
  )
}
