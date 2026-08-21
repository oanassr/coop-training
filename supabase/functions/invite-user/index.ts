// دالة Edge: تنشئ حساب مصادقة لملف موجود وترسل رابط تفعيل/تعيين كلمة مرور.
// مكتوبة بـ fetch فقط (بلا استيراد خارجي) لتفادي أخطاء الإقلاع.
// النشر عبر Management API أو: supabase functions deploy invite-user --no-verify-jwt

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const URL = Deno.env.get('SUPABASE_URL')!
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader) return json({ error: 'غير مصرّح' }, 401)

    // 1) التحقق من هوية المستدعي عبر توكنه
    const userRes = await fetch(`${URL}/auth/v1/user`, {
      headers: { apikey: ANON, Authorization: authHeader },
    })
    if (!userRes.ok) return json({ error: 'غير مصرّح' }, 401)
    const caller = await userRes.json()
    const callerId = caller?.id
    if (!callerId) return json({ error: 'غير مصرّح' }, 401)

    // 2) التحقق من صلاحية المستدعي (مرشد/مدير)
    const roleRes = await fetch(
      `${URL}/rest/v1/profiles?select=role&auth_user_id=eq.${callerId}`,
      { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } },
    )
    const roleRows = await roleRes.json()
    const role = roleRows?.[0]?.role
    if (!['admin', 'coordinator'].includes(role)) return json({ error: 'الصلاحية غير كافية' }, 403)

    // 3) قراءة بيانات الطلب
    const { profile_id, redirect_to } = await req.json()
    if (!profile_id) return json({ error: 'profile_id مطلوب' }, 400)

    const tRes = await fetch(
      `${URL}/rest/v1/profiles?select=*&id=eq.${profile_id}`,
      { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } },
    )
    const target = (await tRes.json())?.[0]
    if (!target) return json({ error: 'الملف غير موجود' }, 404)

    const svcHeaders = {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
    }

    // 4) إرسال دعوة (تنشئ مستخدماً وترسل رابط تعيين كلمة مرور)
    const inviteRes = await fetch(
      `${URL}/auth/v1/invite`,
      {
        method: 'POST',
        headers: svcHeaders,
        body: JSON.stringify({
          email: target.kku_email,
          data: { full_name: target.full_name, role: target.role },
          ...(redirect_to ? { redirect_to } : {}),
        }),
      },
    )

    if (inviteRes.ok) {
      const invited = await inviteRes.json()
      await fetch(`${URL}/rest/v1/profiles?id=eq.${profile_id}`, {
        method: 'PATCH',
        headers: { ...svcHeaders, Prefer: 'return=minimal' },
        body: JSON.stringify({ auth_user_id: invited.id, is_active: true }),
      })
      return json({ ok: true, user_id: invited.id })
    }

    // 5) المستخدم موجود مسبقاً: اربط الحساب وأرسل رابط استعادة
    const errText = await inviteRes.text()
    const lower = errText.toLowerCase()
    if (lower.includes('already') || lower.includes('registered') || lower.includes('exists')) {
      // ابحث عن المستخدم لربطه
      const listRes = await fetch(
        `${URL}/auth/v1/admin/users?per_page=200`,
        { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } },
      )
      const list = await listRes.json()
      const existing = (list?.users || []).find(
        (u: any) => (u.email || '').toLowerCase() === target.kku_email.toLowerCase(),
      )
      if (existing) {
        await fetch(`${URL}/rest/v1/profiles?id=eq.${profile_id}`, {
          method: 'PATCH',
          headers: { ...svcHeaders, Prefer: 'return=minimal' },
          body: JSON.stringify({ auth_user_id: existing.id, is_active: true }),
        })
      }
      // إرسال رابط استعادة كلمة المرور
      await fetch(`${URL}/auth/v1/recover`, {
        method: 'POST',
        headers: { apikey: ANON, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target.kku_email }),
      })
      return json({ ok: true, resent: true })
    }

    return json({ error: 'تعذّر إرسال الدعوة: ' + errText }, 400)
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
