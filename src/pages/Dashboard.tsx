import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useSettings } from '../lib/settings'
import { supabase } from '../lib/supabase'
import { StatCard, PageLoader } from '../components/ui'
import { hijriDate } from '../lib/format'
import {
  Users,
  Building2,
  FileText,
  Stamp,
  GraduationCap,
  ClipboardCheck,
  Search,
  FilePlus2,
  CheckCircle2,
  Clock,
} from 'lucide-react'

export default function Dashboard() {
  const { profile } = useAuth()
  const { settings } = useSettings()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    const run = async () => {
      const s: Record<string, number> = {}
      const count = async (table: string, filter?: (q: any) => any) => {
        let q = supabase.from(table).select('*', { count: 'exact', head: true })
        if (filter) q = filter(q)
        const { count: c } = await q
        return c ?? 0
      }
      if (profile.role === 'admin' || profile.role === 'coordinator') {
        s.students = await count('profiles', (q) => q.eq('role', 'student'))
        s.faculty = await count('profiles', (q) => q.in('role', ['supervisor', 'training_unit', 'coordinator']))
        s.entities = await count('training_entities')
        s.requests = await count('letter_requests')
        s.issued = await count('letter_requests', (q) => q.in('status', ['issued', 'delivered']))
      } else if (profile.role === 'training_unit') {
        s.queue = await count('letter_requests', (q) =>
          q.in('status', ['supervisor_approved', 'unit_review']),
        )
        s.issued = await count('letter_requests', (q) => q.in('status', ['issued', 'delivered']))
        s.entities = await count('training_entities')
      } else if (profile.role === 'supervisor') {
        s.students = await count('student_assignments', (q) =>
          q.eq('supervisor_id', profile.id).eq('is_active', true),
        )
        s.pending = await count('letter_requests', (q) =>
          q.eq('supervisor_id', profile.id).eq('status', 'submitted'),
        )
        s.approved = await count('letter_requests', (q) =>
          q.eq('supervisor_id', profile.id).eq('status', 'supervisor_approved'),
        )
      } else if (profile.role === 'student') {
        s.total = await count('letter_requests', (q) => q.eq('student_id', profile.id))
        s.issued = await count('letter_requests', (q) =>
          q.eq('student_id', profile.id).in('status', ['issued', 'delivered']),
        )
      }
      setStats(s)
      setLoading(false)
    }
    run()
  }, [profile])

  if (!profile) return null

  return (
    <div className="space-y-6">
      {/* ترحيب */}
      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-l from-kku-700 to-kku-800 p-6 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(224,191,106,0.25),transparent_40%)]" />
          <div className="relative">
            <p className="text-sm text-white/70">{hijriDate()}</p>
            <h2 className="mt-1 text-2xl font-extrabold">أهلاً، {profile.full_name.split(' ')[0]} 👋</h2>
            <p className="mt-1 text-white/80">
              {settings?.current_term ? `الفصل الحالي: ${settings.current_term}` : 'نظام التدريب التعاوني'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          {/* بطاقات الإحصاء */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(profile.role === 'admin' || profile.role === 'coordinator') && (
              <>
                <StatCard label="الطلاب" value={stats.students} icon={<GraduationCap className="h-6 w-6" />} />
                <StatCard label="هيئة التدريس" value={stats.faculty} icon={<Users className="h-6 w-6" />} tone="gold" />
                <StatCard label="جهات التدريب" value={stats.entities} icon={<Building2 className="h-6 w-6" />} tone="blue" />
                <StatCard label="إجمالي الطلبات" value={stats.requests} icon={<FileText className="h-6 w-6" />} tone="slate" />
              </>
            )}
            {profile.role === 'training_unit' && (
              <>
                <StatCard label="بانتظار الاعتماد" value={stats.queue} icon={<Clock className="h-6 w-6" />} tone="gold" />
                <StatCard label="خطابات مُصدَرة" value={stats.issued} icon={<Stamp className="h-6 w-6" />} />
                <StatCard label="جهات التدريب" value={stats.entities} icon={<Building2 className="h-6 w-6" />} tone="blue" />
              </>
            )}
            {profile.role === 'supervisor' && (
              <>
                <StatCard label="طلابي" value={stats.students} icon={<GraduationCap className="h-6 w-6" />} />
                <StatCard label="بانتظار مراجعتي" value={stats.pending} icon={<ClipboardCheck className="h-6 w-6" />} tone="gold" />
                <StatCard label="اعتمدتها" value={stats.approved} icon={<CheckCircle2 className="h-6 w-6" />} tone="blue" />
              </>
            )}
            {profile.role === 'student' && (
              <>
                <StatCard label="طلباتي" value={stats.total} icon={<FileText className="h-6 w-6" />} />
                <StatCard label="خطابات جاهزة" value={stats.issued} icon={<CheckCircle2 className="h-6 w-6" />} tone="gold" />
              </>
            )}
          </div>

          {/* روابط سريعة */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks(profile.role).map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="card group flex items-center gap-4 p-5 transition hover:shadow-glow"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-kku-50 text-kku-700 transition group-hover:bg-kku-600 group-hover:text-white">
                  {q.icon}
                </div>
                <div>
                  <p className="font-extrabold text-ink">{q.label}</p>
                  <p className="text-sm text-ink-muted">{q.hint}</p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function quickLinks(role: string) {
  switch (role) {
    case 'admin':
    case 'coordinator':
      return [
        { to: '/users', label: 'إدارة المستخدمين', hint: 'إضافة وتفعيل هيئة التدريس والطلاب', icon: <Users className="h-6 w-6" /> },
        { to: '/assignments', label: 'توزيع الطلاب', hint: 'إسناد الطلاب للمشرفين', icon: <GraduationCap className="h-6 w-6" /> },
        { to: '/entities', label: 'جهات التدريب', hint: 'اعتماد وإدارة الجهات', icon: <Building2 className="h-6 w-6" /> },
      ]
    case 'training_unit':
      return [
        { to: '/queue', label: 'قائمة الاعتماد', hint: 'إصدار وختم الخطابات', icon: <Stamp className="h-6 w-6" /> },
        { to: '/requests', label: 'كل الطلبات', hint: 'متابعة جميع الطلبات', icon: <FileText className="h-6 w-6" /> },
      ]
    case 'supervisor':
      return [
        { to: '/review', label: 'طلبات المراجعة', hint: 'اعتماد أو إرجاع طلبات طلابك', icon: <ClipboardCheck className="h-6 w-6" /> },
        { to: '/my-students', label: 'طلابي', hint: 'قائمة الطلاب المسندين إليك', icon: <GraduationCap className="h-6 w-6" /> },
      ]
    case 'student':
      return [
        { to: '/browse', label: 'تصفّح الجهات', hint: 'الجهات المعتمدة والمتاحة', icon: <Search className="h-6 w-6" /> },
        { to: '/new-request', label: 'طلب خطاب جديد', hint: 'ابدأ طلب خطاب تدريب', icon: <FilePlus2 className="h-6 w-6" /> },
        { to: '/my-requests', label: 'طلباتي', hint: 'متابعة حالة طلباتك', icon: <FileText className="h-6 w-6" /> },
      ]
    default:
      return []
  }
}
