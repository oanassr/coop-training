-- ============================================================================
--  نظام اعتماد طلبات التدريب التعاوني — كلية الأعمال، جامعة الملك خالد
--  مخطط قاعدة البيانات + سياسات الأمان (RLS) + الدوال
--  يُطبَّق عبر: Supabase Dashboard > SQL Editor  (أو supabase db push)
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
--  الأنواع (Enums)
-- ----------------------------------------------------------------------------
do $$ begin
  create type role_type as enum ('admin','coordinator','training_unit','supervisor','student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status as enum (
    'draft',              -- مسودة
    'submitted',          -- مُقدَّم للمشرف
    'needs_revision',     -- يحتاج تعديل
    'supervisor_approved',-- اعتمده المشرف
    'supervisor_rejected',-- رفضه المشرف
    'unit_review',        -- لدى وحدة التدريب
    'issued',             -- مُصدَر ومختوم
    'delivered',          -- سُلّم للجهة
    'cancelled'           -- ملغى
  );
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
--  الجداول
-- ----------------------------------------------------------------------------

-- الملفات الشخصية (مستقلة عن auth.users حتى يمكن إنشاء مسودة قبل التفعيل)
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  role          role_type not null default 'student',
  full_name     text not null,
  kku_email     text not null unique,          -- اسم المستخدم = الإيميل الجامعي
  university_number text unique,               -- الرقم الجامعي (للطالب)
  national_id   text,
  phone         text,
  department    text,
  major         text,                          -- تخصص الطالب
  position      text,                          -- المسمى الوظيفي (يظهر تحت التوقيع)
  signature_url text,                          -- توقيع عضو هيئة التدريس (قابل للتغيير)
  is_active     boolean not null default false,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- جهات التدريب
create table if not exists public.training_entities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  sector        text,                          -- القطاع (حكومي/خاص/...)
  city          text,
  address       text,
  contact_person text,
  contact_email text,
  contact_phone text,
  is_approved   boolean not null default true,
  capacity      int not null default 0,        -- عدد المقاعد المتاحة (0 = غير محدد)
  seats_taken   int not null default 0,
  notes         text,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- توزيع الطلاب على المشرفين (يحفظ السجل: is_active للحالي، والباقي تاريخ)
create table if not exists public.student_assignments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  supervisor_id uuid not null references public.profiles(id) on delete cascade,
  term          text not null,
  is_active     boolean not null default true,
  assigned_by   uuid references public.profiles(id) on delete set null,
  assigned_at   timestamptz not null default now()
);
create index if not exists idx_assign_student on public.student_assignments(student_id) where is_active;
create index if not exists idx_assign_supervisor on public.student_assignments(supervisor_id) where is_active;

-- تسلسل أرقام الطلبات
create sequence if not exists public.request_seq start 1;

-- طلبات/خطابات التدريب
create table if not exists public.letter_requests (
  id            uuid primary key default gen_random_uuid(),
  request_number text unique,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  entity_id     uuid references public.training_entities(id) on delete set null,
  supervisor_id uuid references public.profiles(id) on delete set null, -- لقطة وقت التقديم
  term          text not null,
  status        request_status not null default 'submitted',
  purpose       text,                          -- تفاصيل/غرض الخطاب
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_req_student on public.letter_requests(student_id);
create index if not exists idx_req_supervisor on public.letter_requests(supervisor_id);
create index if not exists idx_req_status on public.letter_requests(status);

-- سجل الإجراءات (التتبّع الزمني)
create table if not exists public.letter_actions (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null references public.letter_requests(id) on delete cascade,
  actor_id      uuid references public.profiles(id) on delete set null,
  action        text not null,
  from_status   request_status,
  to_status     request_status,
  note          text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_action_request on public.letter_actions(request_id);

-- الخطابات المُصدَرة (لقطة ثابتة لا تتأثر بتغيّر التوقيعات لاحقاً)
create table if not exists public.issued_letters (
  id            uuid primary key default gen_random_uuid(),
  request_id    uuid not null unique references public.letter_requests(id) on delete cascade,
  letter_number text not null,
  pdf_url       text,
  issued_by     uuid references public.profiles(id) on delete set null,
  issued_at     timestamptz not null default now(),
  supervisor_name text,
  supervisor_signature_snapshot text,
  unit_supervisor_name text,
  unit_signature_snapshot text,
  stamp_snapshot text,
  verify_token  text not null default replace(gen_random_uuid()::text,'-','')
);

-- الإعدادات العامة (صف واحد id=1)
create table if not exists public.settings (
  id            int primary key default 1,
  college_name  text not null default 'كلية الأعمال',
  university_name text not null default 'جامعة الملك خالد',
  unit_name     text not null default 'وحدة التدريب التعاوني',
  unit_supervisor_name text default 'مشرف وحدة التدريب',
  unit_signature_url text,
  stamp_url     text,
  logo_url      text,
  current_term  text not null default 'الفصل الأول 1448هـ',
  letter_prefix text not null default 'ت.ت',
  letter_counter int not null default 0,
  letter_template text not null default
'إشارة إلى ما ورد بشأن تدريب طلاب كلية الأعمال بجامعة الملك خالد ضمن برنامج التدريب التعاوني، نأمل التكرم بالموافقة على تدريب الطالب/ة الموضحة بياناته أدناه لدى منشأتكم الموقرة، علماً بأن فترة التدريب تمتد وفق الخطة المعتمدة. شاكرين لكم حسن تعاونكم.'::text,
  updated_at    timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
--  الدوال المساعدة (SECURITY DEFINER لتفادي التكرار في RLS)
-- ----------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.my_role()
returns role_type language sql stable security definer set search_path = public as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin','coordinator','training_unit'), false);
$$;

create or replace function public.is_admin_coord()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin','coordinator'), false);
$$;

-- إسناد رقم الطلب تلقائياً
create or replace function public.set_request_number()
returns trigger language plpgsql as $$
begin
  if new.request_number is null then
    new.request_number := 'TR-' || to_char(now(),'YYYY') || '-' ||
                          lpad(nextval('public.request_seq')::text, 5, '0');
  end if;
  return new;
end $$;

drop trigger if exists trg_request_number on public.letter_requests;
create trigger trg_request_number before insert on public.letter_requests
  for each row execute function public.set_request_number();

-- توليد رقم الخطاب الرسمي (يزيد العدّاد ذرّياً)
create or replace function public.next_letter_number()
returns text language plpgsql security definer set search_path = public as $$
declare n int; pfx text;
begin
  update public.settings set letter_counter = letter_counter + 1, updated_at = now()
    where id = 1 returning letter_counter, letter_prefix into n, pfx;
  return pfx || '/' || lpad(n::text, 4, '0') || '/' || to_char(now(),'YYYY');
end $$;

-- تحديث updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_touch_profiles on public.profiles;
create trigger trg_touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();

-- منع تصعيد الصلاحيات: لا يغيّر الدور أو حالة التفعيل إلا المرشد/المدير أو الدالة الخلفية (service role)
create or replace function public.prevent_priv_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role
      or new.is_active is distinct from old.is_active
      or new.auth_user_id is distinct from old.auth_user_id) then
    if auth.uid() is not null and not public.is_admin_coord() then
      raise exception 'غير مصرّح بتغيير الدور أو حالة التفعيل';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_prevent_escalation on public.profiles;
create trigger trg_prevent_escalation before update on public.profiles
  for each row execute function public.prevent_priv_escalation();
drop trigger if exists trg_touch_requests on public.letter_requests;
create trigger trg_touch_requests before update on public.letter_requests
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_touch_entities on public.training_entities;
create trigger trg_touch_entities before update on public.training_entities
  for each row execute function public.touch_updated_at();

-- التحقق العام من صحة خطاب (يستدعى بمفتاح anon، يعيد بيانات محدودة فقط)
create or replace function public.verify_letter(token text)
returns table (
  letter_number text, student_name text, university_number text,
  entity_name text, term text, issued_at timestamptz, status request_status
) language sql stable security definer set search_path = public as $$
  select il.letter_number, sp.full_name, sp.university_number,
         te.name, lr.term, il.issued_at, lr.status
  from public.issued_letters il
  join public.letter_requests lr on lr.id = il.request_id
  join public.profiles sp on sp.id = lr.student_id
  left join public.training_entities te on te.id = lr.entity_id
  where il.verify_token = token
  limit 1;
$$;

-- ----------------------------------------------------------------------------
--  تفعيل RLS
-- ----------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.training_entities enable row level security;
alter table public.student_assignments enable row level security;
alter table public.letter_requests   enable row level security;
alter table public.letter_actions    enable row level security;
alter table public.issued_letters    enable row level security;
alter table public.settings          enable row level security;

-- ---- profiles ----
drop policy if exists p_profiles_select on public.profiles;
create policy p_profiles_select on public.profiles for select using (
  auth_user_id = auth.uid()
  or public.is_staff()
  or exists (
    select 1 from public.student_assignments a
    where a.student_id = profiles.id and a.is_active
      and a.supervisor_id = public.current_profile_id()
  )
);
drop policy if exists p_profiles_insert on public.profiles;
create policy p_profiles_insert on public.profiles for insert with check (public.is_admin_coord());
drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update on public.profiles for update using (
  public.is_admin_coord() or auth_user_id = auth.uid()
) with check (
  public.is_admin_coord() or auth_user_id = auth.uid()
);
drop policy if exists p_profiles_delete on public.profiles;
create policy p_profiles_delete on public.profiles for delete using (public.is_admin_coord());

-- ---- training_entities ----
drop policy if exists p_entities_select on public.training_entities;
create policy p_entities_select on public.training_entities for select using (
  is_approved = true or public.is_staff() or created_by = public.current_profile_id()
);
drop policy if exists p_entities_write on public.training_entities;
create policy p_entities_write on public.training_entities for all using (
  public.is_staff()
) with check (public.is_staff());

-- ---- student_assignments ----
drop policy if exists p_assign_select on public.student_assignments;
create policy p_assign_select on public.student_assignments for select using (
  public.is_staff()
  or student_id = public.current_profile_id()
  or supervisor_id = public.current_profile_id()
);
drop policy if exists p_assign_write on public.student_assignments;
create policy p_assign_write on public.student_assignments for all using (
  public.is_admin_coord()
) with check (public.is_admin_coord());

-- ---- letter_requests ----
drop policy if exists p_req_select on public.letter_requests;
create policy p_req_select on public.letter_requests for select using (
  public.is_staff()
  or student_id = public.current_profile_id()
  or supervisor_id = public.current_profile_id()
);
drop policy if exists p_req_insert on public.letter_requests;
create policy p_req_insert on public.letter_requests for insert with check (
  student_id = public.current_profile_id() or public.is_staff()
);
drop policy if exists p_req_update on public.letter_requests;
create policy p_req_update on public.letter_requests for update using (
  public.is_staff()
  or student_id = public.current_profile_id()
  or supervisor_id = public.current_profile_id()
) with check (
  public.is_staff()
  or student_id = public.current_profile_id()
  or supervisor_id = public.current_profile_id()
);
drop policy if exists p_req_delete on public.letter_requests;
create policy p_req_delete on public.letter_requests for delete using (public.is_admin_coord());

-- ---- letter_actions ----
drop policy if exists p_actions_select on public.letter_actions;
create policy p_actions_select on public.letter_actions for select using (
  exists (
    select 1 from public.letter_requests lr where lr.id = letter_actions.request_id and (
      public.is_staff()
      or lr.student_id = public.current_profile_id()
      or lr.supervisor_id = public.current_profile_id()
    )
  )
);
drop policy if exists p_actions_insert on public.letter_actions;
create policy p_actions_insert on public.letter_actions for insert with check (
  exists (
    select 1 from public.letter_requests lr where lr.id = letter_actions.request_id and (
      public.is_staff()
      or lr.student_id = public.current_profile_id()
      or lr.supervisor_id = public.current_profile_id()
    )
  )
);

-- ---- issued_letters ----
drop policy if exists p_issued_select on public.issued_letters;
create policy p_issued_select on public.issued_letters for select using (
  exists (
    select 1 from public.letter_requests lr where lr.id = issued_letters.request_id and (
      public.is_staff()
      or lr.student_id = public.current_profile_id()
      or lr.supervisor_id = public.current_profile_id()
    )
  )
);
drop policy if exists p_issued_write on public.issued_letters;
create policy p_issued_write on public.issued_letters for all using (
  public.is_staff()
) with check (public.is_staff());

-- ---- settings ----
drop policy if exists p_settings_select on public.settings;
create policy p_settings_select on public.settings for select using (auth.uid() is not null);
drop policy if exists p_settings_update on public.settings;
create policy p_settings_update on public.settings for update using (public.is_admin_coord())
  with check (public.is_admin_coord());

-- ----------------------------------------------------------------------------
--  Storage buckets  (تُنشأ يدوياً من اللوحة أيضاً: assets عام، letters خاص)
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('assets','assets', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
  values ('letters','letters', true) on conflict (id) do nothing;

-- رفع/تعديل ملفات assets للطاقم فقط، والقراءة عامة
drop policy if exists p_assets_read on storage.objects;
create policy p_assets_read on storage.objects for select using (bucket_id in ('assets','letters'));
drop policy if exists p_assets_write on storage.objects;
create policy p_assets_write on storage.objects for insert to authenticated
  with check (bucket_id in ('assets','letters'));
drop policy if exists p_assets_update on storage.objects;
create policy p_assets_update on storage.objects for update to authenticated
  using (bucket_id in ('assets','letters'));
drop policy if exists p_assets_delete on storage.objects;
create policy p_assets_delete on storage.objects for delete to authenticated
  using (bucket_id in ('assets','letters'));
