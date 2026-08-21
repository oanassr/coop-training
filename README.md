# نظام اعتماد طلبات التدريب التعاوني

منصّة إلكترونية لإدارة دورة اعتماد خطابات التدريب التعاوني في **كلية الأعمال — جامعة الملك خالد**،
بين الطالب ومشرف التدريب ووحدة التدريب وجهة التدريب.

- 🎓 الطالب يتصفّح الجهات المعتمدة ويقدّم طلب خطاب.
- ✍️ مشرف التدريب يعتمد ويوقّع.
- 🏛️ وحدة التدريب تصدر الخطاب بالتوقيع والختم ورقم رسمي.
- 📄 خطاب PDF رسمي مع رمز **QR للتحقق** من صحته.
- 🔐 صلاحيات موزّعة، وتواقيع/مشرفون قابلون للتغيير بمرونة.

**التقنية:** React + Vite + TypeScript + Tailwind — الواجهة على **GitHub Pages**،
والبيانات على **Supabase** (PostgreSQL + Auth + Storage + Edge Functions) ضمن الباقة المجانية.

---

## 1) التشغيل محلياً

```bash
npm install
cp .env.example .env   # ثم املأ المفاتيح
npm run dev
```

يفتح على `http://localhost:5175`. إن لم تُضبط مفاتيح Supabase ستظهر شاشة إرشاد الإعداد.

## 2) إعداد Supabase (مجاني)

1. أنشئ مشروعاً جديداً على [supabase.com](https://supabase.com).
2. من **Project Settings → API** انسخ:
   - `Project URL` إلى `VITE_SUPABASE_URL`
   - `anon public` إلى `VITE_SUPABASE_ANON_KEY`
   في ملف `.env`.
3. من **SQL Editor** الصق محتوى `supabase/migrations/0001_init.sql` وشغّله
   (ينشئ الجداول والصلاحيات والدوال و buckets التخزين).
4. أنشئ أول مدير:
   - **Authentication → Users → Add user** (فعّل Auto Confirm).
   - عدّل البريد في `supabase/bootstrap_admin.sql` وشغّله في SQL Editor.

### إعدادات المصادقة (مهم لروابط التفعيل)
من **Authentication → URL Configuration**:
- **Site URL**: رابط موقعك (محلياً `http://localhost:5175` أو رابط GitHub Pages).
- **Redirect URLs**: أضف (مع `**`):
  - `http://localhost:5175/**`
  - `https://<username>.github.io/<repo>/**`

> رسائل الدعوة تُرسل عبر بريد Supabase الافتراضي (بحدود على الباقة المجانية). لضمان وصولها
> لعناوين `@kku.edu.sa` دون spam، اضبط **SMTP مخصّص** من Authentication → Emails لاحقاً.

## 3) نشر دالة التفعيل (Edge Function)

تُنشئ حساب المستخدم وترسل رابط التفعيل عند ضغط "إرسال الدعوة" في صفحة المستخدمين.

```bash
npm i -g supabase
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase functions deploy invite-user
```

(متغيرات `SUPABASE_URL` و `SUPABASE_ANON_KEY` و `SUPABASE_SERVICE_ROLE_KEY` تُحقن تلقائياً.)

## 4) النشر على GitHub Pages

1. أنشئ مستودعاً على GitHub وادفع الكود:
   ```bash
   git init && git add . && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
2. **Settings → Secrets and variables → Actions** أضف:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Settings → Pages → Build and deployment → Source = GitHub Actions**.
4. أي دفعة على `main` تبني وتنشر تلقائياً (راجع تبويب Actions).

---

## الأدوار
| الدور | الصلاحيات |
|------|-----------|
| مدير النظام | إعداد عام + إدارة كاملة |
| مرشد التدريب | إضافة/تفعيل المستخدمين، توزيع الطلاب، الجهات، الإعدادات |
| وحدة التدريب | إصدار الخطابات بالتوقيع والختم |
| مشرف التدريب | اعتماد/إرجاع طلبات طلابه |
| الطالب | تصفّح الجهات، تقديم الطلب، تحميل الخطاب |

## دورة الطلب
`مُقدَّم للمشرف` → `اعتماد المشرف` → `اعتماد وحدة التدريب (إصدار + ختم)` → `سُلّم للجهة`

## البنية
- `supabase/migrations/0001_init.sql` — قاعدة البيانات + RLS.
- `supabase/functions/invite-user/` — دالة الدعوة/التفعيل.
- `src/pages/*` — الشاشات حسب الدور.
- `src/components/LetterDocument.tsx` — قالب الخطاب الرسمي (PDF).

## أسماء المستخدمين
- هيئة التدريس: البريد الجامعي مثل `oanasr@kku.edu.sa`.
- الطالب: `<الرقم الجامعي>@kku.edu.sa` مثل `446801567@kku.edu.sa`.
