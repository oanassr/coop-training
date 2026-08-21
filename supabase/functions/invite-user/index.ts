// دالة Edge: تنشئ مستخدم مصادقة لملف موجود وترسل له رابط تفعيل/تعيين كلمة مرور
// النشر: supabase functions deploy invite-user
// المتغيرات SUPABASE_URL و SUPABASE_ANON_KEY و SUPABASE_SERVICE_ROLE_KEY تُحقن تلقائياً.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization') || ''
    // التحقق من هوية المستدعي
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const {
      data: { user },
    } = await caller.auth.getUser()
    if (!user) return json({ error: 'غير مصرّح' }, 401)

    const admin = createClient(url, service)

    // التحقق من صلاحية المستدعي (مرشد/مدير)
    const { data: me } = await admin.from('profiles').select('role').eq('auth_user_id', user.id).single()
    if (!me || !['admin', 'coordinator'].includes(me.role))
      return json({ error: 'الصلاحية غير كافية' }, 403)

    const { profile_id, redirect_to } = await req.json()
    if (!profile_id) return json({ error: 'profile_id مطلوب' }, 400)

    const { data: target, error: tErr } = await admin
      .from('profiles')
      .select('*')
      .eq('id', profile_id)
      .single()
    if (tErr || !target) return json({ error: 'الملف غير موجود' }, 404)

    // إرسال دعوة (تنشئ مستخدماً وترسل رابطاً لتعيين كلمة المرور)
    const { data: invited, error: iErr } = await admin.auth.admin.inviteUserByEmail(target.kku_email, {
      redirectTo: redirect_to,
      data: { full_name: target.full_name, role: target.role },
    })

    if (iErr) {
      const msg = (iErr.message || '').toLowerCase()
      // المستخدم موجود مسبقاً: أعِد إرسال رابط استعادة كلمة المرور
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        const { error: rErr } = await admin.auth.admin.generateLink({
          type: 'recovery',
          email: target.kku_email,
          options: { redirectTo: redirect_to },
        })
        // ربط auth_user_id إن لم يكن مربوطاً
        const { data: list } = await admin.auth.admin.listUsers()
        const existing = list?.users?.find((u) => u.email?.toLowerCase() === target.kku_email.toLowerCase())
        if (existing) {
          await admin.from('profiles').update({ auth_user_id: existing.id, is_active: true }).eq('id', profile_id)
        }
        if (rErr) return json({ error: rErr.message }, 400)
        return json({ ok: true, resent: true })
      }
      return json({ error: iErr.message }, 400)
    }

    // ربط الحساب بالملف وتفعيله
    await admin
      .from('profiles')
      .update({ auth_user_id: invited.user?.id, is_active: true })
      .eq('id', profile_id)

    return json({ ok: true, user_id: invited.user?.id })
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
