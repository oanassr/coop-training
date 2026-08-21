import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import { Logo } from '../components/Brand'
import { Spinner } from '../components/ui'
import { STATUS_LABEL } from '../lib/types'
import { dateTime } from '../lib/format'
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'

interface VerifyResult {
  letter_number: string
  student_name: string
  university_number: string | null
  entity_name: string | null
  term: string
  issued_at: string
  status: string
}

export default function Verify() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<VerifyResult | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!isConfigured || !token) {
        setLoading(false)
        return
      }
      const { data } = await supabase.rpc('verify_letter', { token })
      setResult((data && data[0]) || null)
      setLoading(false)
    }
    run()
  }, [token])

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 bg-kku-mesh px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={60} />
          <div className="flex items-center gap-2 text-kku-700">
            <ShieldCheck className="h-5 w-5" />
            <h1 className="text-lg font-extrabold">التحقّق من صحة خطاب التدريب</h1>
          </div>
        </div>

        <div className="card p-7">
          {loading ? (
            <div className="py-8 text-center">
              <Spinner className="mx-auto h-8 w-8 text-kku-600" />
            </div>
          ) : result ? (
            <div>
              <div className="mb-5 flex flex-col items-center gap-2 text-center">
                <CheckCircle2 className="h-14 w-14 text-kku-600" />
                <p className="text-lg font-extrabold text-kku-700">خطاب صحيح ومعتمد</p>
              </div>
              <dl className="divide-y divide-slate-100 text-sm">
                <Row label="رقم الخطاب" value={result.letter_number} />
                <Row label="اسم الطالب/ة" value={result.student_name} />
                {result.university_number && <Row label="الرقم الجامعي" value={result.university_number} />}
                {result.entity_name && <Row label="جهة التدريب" value={result.entity_name} />}
                <Row label="الفصل الدراسي" value={result.term} />
                <Row label="تاريخ الإصدار" value={dateTime(result.issued_at)} />
                <Row label="الحالة" value={STATUS_LABEL[result.status as keyof typeof STATUS_LABEL] ?? result.status} />
              </dl>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <XCircle className="h-14 w-14 text-red-500" />
              <p className="text-lg font-extrabold text-red-600">خطاب غير موجود</p>
              <p className="text-sm text-ink-muted">
                لم يتم العثور على خطاب مطابق لرمز التحقق. تأكّد من صحة الرابط.
              </p>
            </div>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-ink-muted">
          نظام التدريب التعاوني — كلية الأعمال، جامعة الملك خالد
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="font-bold text-ink-muted">{label}</dt>
      <dd className="font-extrabold text-ink">{value}</dd>
    </div>
  )
}
