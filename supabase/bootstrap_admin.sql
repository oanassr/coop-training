-- ============================================================================
--  إنشاء أول حساب "مدير نظام" (يُشغّل مرة واحدة بعد تطبيق 0001_init.sql)
-- ============================================================================
--  الخطوة 1: من لوحة Supabase → Authentication → Users → Add user
--            أدخل البريد الجامعي للمدير وكلمة مرور مؤقتة، وفعّل "Auto Confirm User".
--
--  الخطوة 2: بدّل البريد أدناه ببريد المدير نفسه ثم شغّل هذا الأمر في SQL Editor.
-- ----------------------------------------------------------------------------

insert into public.profiles (auth_user_id, role, full_name, kku_email, is_active)
select u.id, 'admin', 'مدير النظام', u.email, true
from auth.users u
where u.email = 'ADMIN_EMAIL@kku.edu.sa'   -- << بدّل هذا
on conflict (kku_email) do update
  set auth_user_id = excluded.auth_user_id,
      role = 'admin',
      is_active = true;
