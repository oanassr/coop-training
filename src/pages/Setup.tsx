import { Logo } from '../components/Brand'
import { Database, KeyRound, Rocket } from 'lucide-react'
import { isConfigured } from '../lib/supabase'
import { Navigate } from 'react-router-dom'

export default function Setup() {
  if (isConfigured) return <Navigate to="/login" replace />
  return (
    <div className="min-h-screen bg-slate-50 bg-kku-mesh px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={64} />
          <h1 className="text-2xl font-extrabold text-ink">إعداد الاتصال بـ Supabase</h1>
          <p className="text-sm text-ink-muted">
            لم يتم ضبط مفاتيح Supabase بعد. اتبع الخطوات التالية لتشغيل النظام.
          </p>
        </div>

        <div className="card space-y-5 p-6">
          <Step
            icon={<Database className="h-5 w-5" />}
            n={1}
            title="أنشئ مشروع Supabase مجاني"
            body="من supabase.com أنشئ مشروعاً جديداً (الباقة المجانية كافية)."
          />
          <Step
            icon={<Rocket className="h-5 w-5" />}
            n={2}
            title="طبّق مخطط قاعدة البيانات"
            body="افتح SQL Editor والصق محتوى الملف supabase/migrations/0001_init.sql ثم شغّله."
          />
          <Step
            icon={<KeyRound className="h-5 w-5" />}
            n={3}
            title="أضف المفاتيح إلى ملف .env"
            body="من Project Settings ← API انسخ Project URL و anon key إلى ملف .env ثم أعد تشغيل الخادم."
          />

          <pre className="overflow-x-auto rounded-xl bg-ink p-4 text-left text-xs text-emerald-200" dir="ltr">
{`# .env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
          </pre>
        </div>
      </div>
    </div>
  )
}

function Step({ icon, n, title, body }: { icon: React.ReactNode; n: number; title: string; body: string }) {
  return (
    <div className="flex gap-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-kku-50 text-kku-700">{icon}</div>
      <div>
        <p className="font-extrabold text-ink">
          <span className="text-kku-600">{n}.</span> {title}
        </p>
        <p className="mt-0.5 text-sm text-ink-muted">{body}</p>
      </div>
    </div>
  )
}
