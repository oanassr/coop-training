import { useState } from 'react'
import { Modal } from './ui'
import { Copy, Check, Mail, KeyRound, CheckCircle2 } from 'lucide-react'

export interface Creds {
  name: string
  email: string
  password: string
  emailed?: boolean
}

export function CredentialsModal({ creds, onClose }: { creds: Creds | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  if (!creds) return null

  const text = `بيانات الدخول لنظام التدريب التعاوني\nالاسم: ${creds.name}\nاسم المستخدم: ${creds.email}\nكلمة المرور: ${creds.password}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <Modal open={!!creds} onClose={onClose} title="تم تفعيل الحساب">
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl bg-kku-50 p-3 text-kku-800">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <p className="text-sm font-bold">
            تم إنشاء حساب <span className="font-extrabold">{creds.name}</span> وتفعيله. سلّمه بيانات الدخول التالية:
          </p>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 p-4">
          <Row icon={<Mail className="h-4 w-4" />} label="اسم المستخدم" value={creds.email} />
          <Row icon={<KeyRound className="h-4 w-4" />} label="كلمة المرور" value={creds.password} mono />
        </div>

        {creds.emailed ? (
          <p className="flex items-center gap-2 text-sm font-bold text-kku-600">
            <Mail className="h-4 w-4" /> تم إرسال البيانات أيضاً إلى بريد المستخدم.
          </p>
        ) : (
          <p className="text-sm text-ink-muted">
            ⚠️ انسخ هذه البيانات الآن — لن تظهر كلمة المرور مرة أخرى. ينصح المستخدم بتغييرها بعد الدخول.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={copy} className="btn-ghost">
            {copied ? <Check className="h-4 w-4 text-kku-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'تم النسخ' : 'نسخ البيانات'}
          </button>
          <button onClick={onClose} className="btn-primary">
            تم
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Row({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm font-bold text-ink-muted">
        {icon} {label}
      </span>
      <span className={`font-extrabold text-ink ${mono ? 'font-mono' : ''}`} dir="ltr">
        {value}
      </span>
    </div>
  )
}
