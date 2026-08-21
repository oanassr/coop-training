// دالة Edge: تنشئ حساب المستخدم بكلمة مرور مُولّدة وتفعّله فوراً، وتعيد كلمة المرور
// لمن أضافه (وترسلها بالإيميل إذا ضُبط RESEND_API_KEY). مكتوبة بـ fetch فقط.
// المستدعي: مدير/مرشد (أي مستخدم) أو مشرف (للطلاب فقط).

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}
function genPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const digits = '23456789'
  const all = upper + lower + digits
  const rnd = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n
  let p = upper[rnd(upper.length)] + lower[rnd(lower.length)] + digits[rnd(digits.length)]
  for (let i = 0; i < 7; i++) p += all[rnd(all.length)]
  return p + '@9'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const URL = Deno.env.get('SUPABASE_URL')!
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const RESEND = Deno.env.get('RESEND_API_KEY')
    const MAIL_FROM = Deno.env.get('MAIL_FROM') || 'onboarding@resend.dev'

    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader) return json({ error: 'غير مصرّح' }, 401)

    // هوية المستدعي
    const userRes = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: ANON, Authorization: authHeader } })
    if (!userRes.ok) return json({ error: 'غير مصرّح' }, 401)
    const callerId = (await userRes.json())?.id
    if (!callerId) return json({ error: 'غير مصرّح' }, 401)

    const svc = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' }

    // صلاحية المستدعي
    const roleRows = await (await fetch(`${URL}/rest/v1/profiles?select=role&auth_user_id=eq.${callerId}`, { headers: svc })).json()
    const callerRole = roleRows?.[0]?.role
    if (!['admin', 'coordinator', 'supervisor'].includes(callerRole)) return json({ error: 'الصلاحية غير كافية' }, 403)

    const { profile_id } = await req.json()
    if (!profile_id) return json({ error: 'profile_id مطلوب' }, 400)

    const target = (await (await fetch(`${URL}/rest/v1/profiles?select=*&id=eq.${profile_id}`, { headers: svc })).json())?.[0]
    if (!target) return json({ error: 'الملف غير موجود' }, 404)

    // المشرف لا يفعّل إلا الطلاب
    if (callerRole === 'supervisor' && target.role !== 'student')
      return json({ error: 'المشرف يستطيع تفعيل الطلاب فقط' }, 403)

    const password = genPassword()

    // إنشاء المستخدم (مفعّل فوراً)
    let userId: string | null = null
    const createRes = await fetch(`${URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: svc,
      body: JSON.stringify({
        email: target.kku_email,
        password,
        email_confirm: true,
        user_metadata: { full_name: target.full_name, role: target.role },
      }),
    })
    if (createRes.ok) {
      userId = (await createRes.json())?.id
    } else {
      // موجود مسبقاً: ابحث عنه وأعد تعيين كلمة مروره
      const errText = (await createRes.text()).toLowerCase()
      if (errText.includes('already') || errText.includes('registered') || errText.includes('exists')) {
        const list = await (await fetch(`${URL}/auth/v1/admin/users?per_page=500`, { headers: svc })).json()
        const existing = (list?.users || []).find((u: any) => (u.email || '').toLowerCase() === target.kku_email.toLowerCase())
        if (!existing) return json({ error: 'تعذّر إيجاد الحساب لإعادة التعيين' }, 400)
        userId = existing.id
        await fetch(`${URL}/auth/v1/admin/users/${userId}`, {
          method: 'PUT',
          headers: svc,
          body: JSON.stringify({ password, email_confirm: true }),
        })
      } else {
        return json({ error: 'تعذّر إنشاء الحساب: ' + errText }, 400)
      }
    }

    // ربط الملف وتفعيله
    await fetch(`${URL}/rest/v1/profiles?id=eq.${profile_id}`, {
      method: 'PATCH',
      headers: { ...svc, Prefer: 'return=minimal' },
      body: JSON.stringify({ auth_user_id: userId, is_active: true }),
    })

    // إرسال بالإيميل إن توفّرت خدمة بريد
    let emailed = false
    if (RESEND) {
      try {
        const html = `<div dir="rtl" style="font-family:Tahoma,Arial;line-height:1.9">
          <h2 style="color:#0f7d45">نظام التدريب التعاوني — جامعة الملك خالد</h2>
          <p>مرحباً ${target.full_name}،</p>
          <p>تم إنشاء حسابك في نظام التدريب التعاوني. بيانات الدخول:</p>
          <p><b>اسم المستخدم:</b> ${target.kku_email}<br/><b>كلمة المرور:</b> ${password}</p>
          <p>يمكنك تغيير كلمة المرور بعد الدخول.</p>
        </div>`
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: MAIL_FROM, to: target.kku_email, subject: 'بيانات الدخول - نظام التدريب التعاوني', html }),
        })
        emailed = r.ok
      } catch { emailed = false }
    }

    return json({ ok: true, password, email: target.kku_email, emailed })
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
