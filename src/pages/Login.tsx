import { useState, FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Brand'
import { Spinner } from '../components/ui'
import { useToast } from '../lib/toast'
import { Mail, Lock, ShieldCheck, FileCheck2, Building2, GraduationCap } from 'lucide-react'

export default function Login() {
  const { session, signIn, configured } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!configured) return <Navigate to="/setup" replace />
  if (session) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/')
  }

  const forgot = async () => {
    if (!email.trim()) {
      setError('أدخل بريدك الجامعي أولاً لإرسال رابط استعادة كلمة المرور')
      return
    }
    const redirectTo = `${window.location.origin}${window.location.pathname}#/activate`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })
    if (error) toast.show(error.message, 'error')
    else toast.show('تم إرسال رابط استعادة كلمة المرور إلى بريدك')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* الجانب التعريفي */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-kku-700 via-kku-800 to-kku-900 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(224,191,106,0.18),transparent_45%)]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-2 backdrop-blur">
              <Logo size={48} />
            </div>
            <div>
              <p className="text-lg font-extrabold">جامعة الملك خالد</p>
              <p className="text-sm text-white/70">كلية الأعمال — وحدة التدريب التعاوني</p>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold leading-snug">
              منصّة اعتماد خطابات
              <br />
              التدريب التعاوني
            </h2>
            <p className="max-w-md text-white/80">
              رحلة رقمية متكاملة من اختيار جهة التدريب حتى إصدار الخطاب الرسمي المعتمد والمختوم.
            </p>
            <div className="grid gap-3 pt-2">
              <Feature icon={<GraduationCap className="h-5 w-5" />} text="الطالب يختار الجهة ويقدّم طلبه إلكترونياً" />
              <Feature icon={<ShieldCheck className="h-5 w-5" />} text="اعتماد المشرف ثم وحدة التدريب بالتوقيع والختم" />
              <Feature icon={<FileCheck2 className="h-5 w-5" />} text="خطاب PDF رسمي مع رمز تحقّق QR" />
              <Feature icon={<Building2 className="h-5 w-5" />} text="إدارة مرنة للجهات والمشرفين والصلاحيات" />
            </div>
          </div>

          <p className="text-xs text-white/50">© {new Date().getFullYear()} جامعة الملك خالد — جميع الحقوق محفوظة</p>
        </div>
      </div>

      {/* نموذج الدخول */}
      <div className="flex items-center justify-center bg-slate-50 bg-kku-mesh px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <Logo size={56} />
            <div>
              <p className="font-extrabold text-ink">جامعة الملك خالد</p>
              <p className="text-sm text-kku-600">وحدة التدريب التعاوني</p>
            </div>
          </div>

          <div className="card p-7">
            <h1 className="text-xl font-extrabold text-ink">تسجيل الدخول</h1>
            <p className="mt-1 text-sm text-ink-muted">أدخل بريدك الجامعي وكلمة المرور</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">البريد الجامعي</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    dir="ltr"
                    className="input pr-9 text-left"
                    placeholder="446801567@kku.edu.sa"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">كلمة المرور</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    className="input pr-9"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-bold text-red-700">{error}</div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? <Spinner className="h-4 w-4" /> : 'دخول'}
              </button>

              <button type="button" onClick={forgot} className="w-full text-center text-sm font-bold text-kku-600 hover:underline">
                نسيت كلمة المرور؟
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-ink-muted">
            حساب هيئة التدريس يُضاف من مرشد التدريب. الطالب يستخدم رقمه الجامعي@kku.edu.sa
          </p>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-300 backdrop-blur">
        {icon}
      </div>
      <span className="text-sm text-white/85">{text}</span>
    </div>
  )
}
