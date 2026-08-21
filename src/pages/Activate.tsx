import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, isConfigured } from '../lib/supabase'
import { Logo } from '../components/Brand'
import { Spinner } from '../components/ui'
import { Lock, CheckCircle2 } from 'lucide-react'

export default function Activate() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConfigured) {
      navigate('/setup')
      return
    }
    // رابط الدعوة/الاستعادة ينشئ جلسة تلقائياً عبر detectSessionInUrl
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      setHasSession(Boolean(data.session))
      setReady(true)
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setHasSession(Boolean(s))
      setReady(true)
    })
    check()
    return () => sub.subscription.unsubscribe()
  }, [navigate])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('كلمة المرور يجب ألا تقل عن 8 أحرف')
      return
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
    setTimeout(() => navigate('/'), 1600)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 bg-kku-mesh px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={56} />
          <h1 className="text-xl font-extrabold text-ink">تفعيل الحساب وتعيين كلمة المرور</h1>
        </div>

        <div className="card p-7">
          {!ready ? (
            <Spinner className="mx-auto h-6 w-6 text-kku-600" />
          ) : done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-kku-600" />
              <p className="font-extrabold text-ink">تم تفعيل حسابك بنجاح</p>
              <p className="text-sm text-ink-muted">جارٍ تحويلك…</p>
            </div>
          ) : !hasSession ? (
            <div className="space-y-3 text-center">
              <p className="font-bold text-ink">رابط التفعيل غير صالح أو منتهي</p>
              <p className="text-sm text-ink-muted">
                افتح الرابط من رسالة البريد مباشرة، أو اطلب من مرشد التدريب إعادة إرسال الدعوة.
              </p>
              <button onClick={() => navigate('/login')} className="btn-ghost w-full">
                العودة لتسجيل الدخول
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="label">كلمة المرور الجديدة</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className="input pr-9"
                    placeholder="8 أحرف على الأقل"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">تأكيد كلمة المرور</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className="input pr-9"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && (
                <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-bold text-red-700">{error}</div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner className="h-4 w-4" /> : 'تفعيل الحساب'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
