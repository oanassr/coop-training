import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { TrainingEntity } from '../../lib/types'
import { PageLoader, EmptyState } from '../../components/ui'
import { Building2, Search, MapPin, User, Phone, FilePlus2 } from 'lucide-react'

export default function Browse() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<TrainingEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('training_entities')
      .select('*')
      .eq('is_approved', true)
      .order('name')
      .then(({ data }) => {
        setRows((data as TrainingEntity[]) || [])
        setLoading(false)
      })
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">جهات التدريب المعتمدة</h1>
        <p className="text-sm text-ink-muted">اختر جهة مناسبة ثم اطلب خطاب تدريب</p>
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input className="input pr-9" placeholder="بحث بالاسم أو المدينة" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Building2 className="h-12 w-12" />} title="لا توجد جهات متاحة" hint="تواصل مع وحدة التدريب لاعتماد جهات جديدة" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => {
            const full = e.capacity > 0 && e.seats_taken >= e.capacity
            return (
              <div key={e.id} className="card flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-kku-50 text-kku-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-extrabold leading-tight text-ink">{e.name}</p>
                    {e.sector && <p className="text-xs text-ink-muted">{e.sector}</p>}
                  </div>
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
                  <span className={`chip ${full ? 'bg-red-50 text-red-700' : 'bg-kku-100 text-kku-700'}`}>
                    {full ? 'مكتملة' : e.capacity > 0 ? `متاح ${e.capacity - e.seats_taken} مقعد` : 'متاحة'}
                  </span>
                  <button
                    disabled={full}
                    onClick={() => navigate(`/new-request?entity=${e.id}`)}
                    className="btn-primary py-2 disabled:opacity-40"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    طلب خطاب
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
