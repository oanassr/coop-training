import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { useToast } from '../../lib/toast'
import { FileUpload } from '../../components/FileUpload'
import { Spinner } from '../../components/ui'
import { PenLine, Info } from 'lucide-react'

export default function MySignature() {
  const { profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [sig, setSig] = useState<string | null>(profile?.signature_url ?? null)
  const [saving, setSaving] = useState(false)

  if (!profile) return null

  const save = async (url: string | null) => {
    setSig(url)
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ signature_url: url }).eq('id', profile.id)
    setSaving(false)
    if (error) return toast.show(error.message, 'error')
    toast.show('تم حفظ التوقيع')
    refreshProfile()
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">توقيعي</h1>
        <p className="text-sm text-ink-muted">ارفع صورة توقيعك التي ستظهر على خطابات التدريب التي تعتمدها</p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-kku-50 p-4 text-kku-800">
        <Info className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm">
          يُفضّل صورة توقيع واضحة بخلفية شفافة (PNG). يمكنك تغييره في أي وقت، وستستخدم الخطابات
          الجديدة التوقيع الحالي، بينما تحتفظ الخطابات الصادرة سابقاً بتوقيعها وقت الإصدار.
        </p>
      </div>

      <div className="card p-6">
        <FileUpload
          label="صورة التوقيع"
          hint={saving ? 'جارٍ الحفظ…' : undefined}
          folder="signatures"
          value={sig}
          onChange={save}
        />
        {saving && (
          <p className="mt-3 flex items-center gap-2 text-sm font-bold text-kku-600">
            <Spinner className="h-4 w-4" /> جارٍ الحفظ…
          </p>
        )}
      </div>

      <div className="card flex items-center gap-4 p-5">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold-100 text-gold-700">
          <PenLine className="h-6 w-6" />
        </div>
        <div>
          <p className="font-extrabold text-ink">{profile.full_name}</p>
          <p className="text-sm text-ink-muted">{profile.position || 'مشرف التدريب'}</p>
        </div>
      </div>
    </div>
  )
}
