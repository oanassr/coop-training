import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../lib/toast'
import { TrainingEntity } from '../../lib/types'
import { PageLoader, EmptyState, Modal, Spinner } from '../../components/ui'
import { Building2, Plus, Search, Pencil, Trash2, MapPin, Phone, User, CheckCircle2 } from 'lucide-react'

const empty = {
  id: '',
  name: '',
  sector: '',
  city: '',
  address: '',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  capacity: 0,
  is_approved: true,
  notes: '',
}

export default function Entities() {
  const { profile } = useAuth()
  const toast = useToast()
  const [rows, setRows] = useState<TrainingEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('training_entities').select('*').order('name')
    setRows((data as TrainingEntity[]) || [])
    setLoading(false)
  }
  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (!search.trim()) return true
        const q = search.trim().toLowerCase()
        return r.name.toLowerCase().includes(q) || (r.city || '').toLowerCase().includes(q) || (r.sector || '').toLowerCase().includes(q)
      }),
    [rows, search],
  )

  const save = async () => {
    if (!form.name.trim()) return toast.show('أدخل اسم الجهة', 'error')
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      sector: form.sector.trim() || null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
      contact_person: form.contact_person.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      capacity: Number(form.capacity) || 0,
      is_approved: form.is_approved,
      notes: form.notes.trim() || null,
    }
    let error
    if (form.id) {
      ;({ error } = await supabase.from('training_entities').update(payload).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('training_entities').insert({ ...payload, created_by: profile?.id }))
    }
    setSaving(false)
    if (error) return toast.show(error.message, 'error')
    toast.show(form.id ? 'تم التحديث' : 'تمت إضافة الجهة')
    setModal(false)
    load()
  }

  const remove = async (e: TrainingEntity) => {
    if (!confirm(`حذف ${e.name}؟`)) return
    const { error } = await supabase.from('training_entities').delete().eq('id', e.id)
    if (error) return toast.show(error.message, 'error')
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">جهات التدريب</h1>
          <p className="text-sm text-ink-muted">الجهات المعتمدة والمتاحة لتدريب الطلاب</p>
        </div>
        <button
          onClick={() => {
            setForm({ ...empty })
            setModal(true)
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          إضافة جهة
        </button>
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pr-9" placeholder="بحث بالاسم أو المدينة" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Building2 className="h-12 w-12" />} title="لا توجد جهات" hint="أضف جهات التدريب المعتمدة" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => {
            const full = e.capacity > 0 && e.seats_taken >= e.capacity
            return (
              <div key={e.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-kku-50 text-kku-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-extrabold leading-tight text-ink">{e.name}</p>
                      {e.sector && <p className="text-xs text-ink-muted">{e.sector}</p>}
                    </div>
                  </div>
                  {e.is_approved ? (
                    <span className="chip bg-kku-100 text-kku-700">معتمدة</span>
                  ) : (
                    <span className="chip bg-slate-100 text-slate-500">غير معتمدة</span>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 text-sm text-ink-soft">
                  {e.city && (
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" /> {e.city}
                    </p>
                  )}
                  {e.contact_person && (
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" /> {e.contact_person}
                    </p>
                  )}
                  {e.contact_phone && (
                    <p className="flex items-center gap-2" dir="ltr">
                      <Phone className="h-4 w-4 text-slate-400" /> {e.contact_phone}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className={`chip ${full ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                    {e.capacity > 0 ? `المقاعد: ${e.seats_taken}/${e.capacity}` : `المتدربون: ${e.seats_taken}`}
                    {full && ' — مكتملة'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setForm({
                          id: e.id,
                          name: e.name,
                          sector: e.sector || '',
                          city: e.city || '',
                          address: e.address || '',
                          contact_person: e.contact_person || '',
                          contact_email: e.contact_email || '',
                          contact_phone: e.contact_phone || '',
                          capacity: e.capacity,
                          is_approved: e.is_approved,
                          notes: e.notes || '',
                        })
                        setModal(true)
                      }}
                      className="rounded-lg p-2 text-ink-soft hover:bg-slate-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(e)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'تعديل جهة' : 'إضافة جهة'} size="lg">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">اسم الجهة</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">القطاع</label>
            <input className="input" placeholder="حكومي / خاص / غير ربحي" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
          </div>
          <div>
            <label className="label">المدينة</label>
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">العنوان</label>
            <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="label">مسؤول التواصل</label>
            <input className="input" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
          </div>
          <div>
            <label className="label">جوال التواصل</label>
            <input className="input text-left" dir="ltr" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
          </div>
          <div>
            <label className="label">بريد التواصل</label>
            <input className="input text-left" dir="ltr" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
          </div>
          <div>
            <label className="label">عدد المقاعد (0 = غير محدد)</label>
            <input
              type="number"
              min={0}
              className="input text-left"
              dir="ltr"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">ملاحظات</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded accent-kku-600"
              checked={form.is_approved}
              onChange={(e) => setForm({ ...form, is_approved: e.target.checked })}
            />
            <span className="text-sm font-bold text-ink-soft">جهة معتمدة (تظهر للطلاب)</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={() => setModal(false)} className="btn-ghost">
            إلغاء
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Spinner className="h-4 w-4" /> : <><CheckCircle2 className="h-4 w-4" /> حفظ</>}
          </button>
        </div>
      </Modal>
    </div>
  )
}
