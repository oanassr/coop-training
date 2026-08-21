import { forwardRef } from 'react'
import { LetterRequest, Settings } from '../lib/types'
import { hijriDate, gregDate } from '../lib/format'

function fillTemplate(tpl: string, r: LetterRequest): string {
  return tpl
    .replaceAll('{{student_name}}', r.student?.full_name || '—')
    .replaceAll('{{university_number}}', r.student?.university_number || '—')
    .replaceAll('{{major}}', r.student?.major || '—')
    .replaceAll('{{entity_name}}', r.entity?.name || '—')
    .replaceAll('{{term}}', r.term || '—')
}

interface Props {
  request: LetterRequest
  settings: Settings
  qr?: string
}

// مستند الخطاب الرسمي بمقاس A4 — يُستخدم للمعاينة وتوليد PDF
export const LetterDocument = forwardRef<HTMLDivElement, Props>(({ request, settings, qr }, ref) => {
  const issued = request.issued
  const letterNumber = issued?.letter_number || 'مسودة (غير مُصدَر)'
  const issuedAt = issued?.issued_at ? new Date(issued.issued_at) : new Date()

  const supName = issued?.supervisor_name || request.supervisor?.full_name || '—'
  const supPosition = request.supervisor?.position || 'مشرف التدريب'
  const supSign = issued?.supervisor_signature_snapshot || request.supervisor?.signature_url
  const unitName = issued?.unit_supervisor_name || settings.unit_supervisor_name || 'مشرف وحدة التدريب'
  const unitSign = issued?.unit_signature_snapshot || settings.unit_signature_url
  const stamp = issued?.stamp_snapshot || settings.stamp_url

  return (
    <div
      ref={ref}
      dir="rtl"
      style={{
        width: 794,
        minHeight: 1123,
        background: '#ffffff',
        color: '#0f172a',
        fontFamily: 'Tajawal, sans-serif',
        padding: '48px 56px',
        boxSizing: 'border-box',
        position: 'relative',
        lineHeight: 1.9,
      }}
    >
      {/* ترويسة */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #0f7d45', paddingBottom: 16 }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0a4f2f' }}>{settings.university_name}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{settings.college_name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#c69026', marginTop: 2 }}>{settings.unit_name}</div>
        </div>
        <div style={{ width: 96, textAlign: 'center' }}>
          {settings.logo_url ? (
            <img src={settings.logo_url} crossOrigin="anonymous" alt="" style={{ height: 84, objectFit: 'contain' }} />
          ) : (
            <div style={{ height: 84, width: 84, borderRadius: 16, background: '#0f7d45', display: 'grid', placeItems: 'center', margin: '0 auto' }}>
              <span style={{ color: '#e0bf6a', fontSize: 40 }}>★</span>
            </div>
          )}
        </div>
      </div>

      {/* رقم وتاريخ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginTop: 18, color: '#334155' }}>
        <div>الرقم: <span style={{ color: '#0a4f2f' }} dir="ltr">{letterNumber}</span></div>
        <div>التاريخ: {hijriDate(issuedAt)} هـ — {gregDate(issuedAt)} م</div>
      </div>

      {/* المستلم */}
      <div style={{ marginTop: 26, fontSize: 15 }}>
        <div style={{ fontWeight: 800 }}>سعادة مدير {request.entity?.name || '—'} &nbsp;الموقّر</div>
        <div style={{ fontWeight: 700, marginTop: 6 }}>السلام عليكم ورحمة الله وبركاته،،، وبعد:</div>
      </div>

      {/* الموضوع */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <span style={{ display: 'inline-block', background: '#eefaf1', color: '#0a4f2f', fontWeight: 800, fontSize: 16, padding: '6px 22px', borderRadius: 999 }}>
          الموضوع: طلب تدريب تعاوني لطالب/ة
        </span>
      </div>

      {/* النص */}
      <p style={{ marginTop: 18, fontSize: 15, textAlign: 'justify' }}>{fillTemplate(settings.letter_template, request)}</p>

      {/* بيانات الطالب */}
      <div style={{ marginTop: 14, border: '1px solid #d6f2df', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: '#0f7d45', color: '#fff', fontWeight: 800, fontSize: 14, padding: '8px 16px' }}>بيانات المتدرب/ة</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: 14 }}>
          <Cell label="الاسم" value={request.student?.full_name} />
          <Cell label="الرقم الجامعي" value={request.student?.university_number} ltr />
          <Cell label="التخصص" value={request.student?.major} />
          <Cell label="الفصل الدراسي" value={request.term} />
        </div>
      </div>

      {/* التواقيع */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 40, textAlign: 'center' }}>
        <SignBlock title="مشرف التدريب" name={supName} sub={supPosition} sign={supSign} />
        <SignBlock title="مشرف وحدة التدريب" name={unitName} sub={settings.unit_name} sign={unitSign} stamp={stamp} />
      </div>

      {/* تذييل التحقق */}
      {qr && (
        <div style={{ position: 'absolute', bottom: 40, left: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={qr} alt="qr" style={{ width: 74, height: 74 }} />
          <div style={{ fontSize: 11, color: '#64748b', maxWidth: 150 }}>
            للتحقق من صحة الخطاب امسح الرمز
            {issued && <div dir="ltr" style={{ fontSize: 9, marginTop: 2 }}>رمز: {issued.verify_token.slice(0, 12)}…</div>}
          </div>
        </div>
      )}
      <div style={{ position: 'absolute', bottom: 20, right: 56, left: 56, textAlign: 'center', fontSize: 10, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
        نظام التدريب التعاوني الإلكتروني — {settings.college_name}، {settings.university_name}
      </div>
    </div>
  )
})

function Cell({ label, value, ltr }: { label: string; value?: string | null; ltr?: boolean }) {
  return (
    <div style={{ padding: '9px 16px', borderBottom: '1px solid #eef2f7' }}>
      <span style={{ color: '#64748b', fontWeight: 700 }}>{label}: </span>
      <span style={{ fontWeight: 800 }} dir={ltr ? 'ltr' : 'rtl'}>{value || '—'}</span>
    </div>
  )
}

function SignBlock({
  title,
  name,
  sub,
  sign,
  stamp,
}: {
  title: string
  name: string
  sub?: string
  sign?: string | null
  stamp?: string | null
}) {
  return (
    <div style={{ position: 'relative', width: 220 }}>
      <div style={{ fontWeight: 800, fontSize: 14, color: '#0a4f2f' }}>{title}</div>
      <div style={{ height: 70, display: 'grid', placeItems: 'center', position: 'relative' }}>
        {sign && <img src={sign} crossOrigin="anonymous" alt="" style={{ maxHeight: 64, maxWidth: 160, objectFit: 'contain' }} />}
        {stamp && (
          <img
            src={stamp}
            crossOrigin="anonymous"
            alt=""
            style={{ position: 'absolute', left: -6, bottom: -10, height: 90, opacity: 0.72 }}
          />
        )}
      </div>
      <div style={{ borderTop: '1.5px dotted #94a3b8', paddingTop: 6, fontWeight: 800, fontSize: 14 }}>{name}</div>
      {sub && <div style={{ fontSize: 12, color: '#64748b' }}>{sub}</div>}
    </div>
  )
}
