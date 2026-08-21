import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useSettings } from '../lib/settings'
import { Role, ROLE_LABEL } from '../lib/types'
import { Logo } from './Brand'
import { initials } from '../lib/format'
import {
  LayoutDashboard,
  Users,
  Network,
  Building2,
  FileText,
  Settings as SettingsIcon,
  GraduationCap,
  ClipboardCheck,
  Stamp,
  Search,
  FilePlus2,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { to: '/', label: 'لوحة المعلومات', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/users', label: 'المستخدمون', icon: <Users className="h-5 w-5" /> },
    { to: '/assignments', label: 'توزيع الطلاب', icon: <Network className="h-5 w-5" /> },
    { to: '/entities', label: 'جهات التدريب', icon: <Building2 className="h-5 w-5" /> },
    { to: '/requests', label: 'الطلبات', icon: <FileText className="h-5 w-5" /> },
    { to: '/settings', label: 'الإعدادات', icon: <SettingsIcon className="h-5 w-5" /> },
  ],
  coordinator: [
    { to: '/', label: 'لوحة المعلومات', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/users', label: 'المستخدمون', icon: <Users className="h-5 w-5" /> },
    { to: '/assignments', label: 'توزيع الطلاب', icon: <Network className="h-5 w-5" /> },
    { to: '/entities', label: 'جهات التدريب', icon: <Building2 className="h-5 w-5" /> },
    { to: '/requests', label: 'الطلبات', icon: <FileText className="h-5 w-5" /> },
    { to: '/settings', label: 'الإعدادات', icon: <SettingsIcon className="h-5 w-5" /> },
  ],
  training_unit: [
    { to: '/', label: 'لوحة المعلومات', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/queue', label: 'قائمة الاعتماد', icon: <Stamp className="h-5 w-5" /> },
    { to: '/entities', label: 'جهات التدريب', icon: <Building2 className="h-5 w-5" /> },
    { to: '/requests', label: 'كل الطلبات', icon: <FileText className="h-5 w-5" /> },
  ],
  supervisor: [
    { to: '/', label: 'لوحة المعلومات', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/my-students', label: 'طلابي', icon: <GraduationCap className="h-5 w-5" /> },
    { to: '/review', label: 'طلبات المراجعة', icon: <ClipboardCheck className="h-5 w-5" /> },
  ],
  student: [
    { to: '/', label: 'لوحة المعلومات', icon: <LayoutDashboard className="h-5 w-5" /> },
    { to: '/browse', label: 'جهات التدريب', icon: <Search className="h-5 w-5" /> },
    { to: '/new-request', label: 'طلب خطاب جديد', icon: <FilePlus2 className="h-5 w-5" /> },
    { to: '/my-requests', label: 'طلباتي', icon: <FileText className="h-5 w-5" /> },
  ],
}

export default function Layout() {
  const { profile, signOut } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (!profile) return null
  const items = NAV[profile.role]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const SideContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <Logo size={44} />
        <div className="leading-tight">
          <p className="text-sm font-extrabold text-ink">{settings?.university_name ?? 'جامعة الملك خالد'}</p>
          <p className="text-xs font-bold text-kku-600">{settings?.unit_name ?? 'وحدة التدريب التعاوني'}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
                isActive
                  ? 'bg-kku-600 text-white shadow-sm'
                  : 'text-ink-soft hover:bg-kku-50 hover:text-kku-700'
              }`
            }
          >
            {it.icon}
            {it.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 bg-kku-mesh">
      {/* الشريط الجانبي - سطح المكتب */}
      <aside className="fixed inset-y-0 right-0 z-30 hidden w-72 border-l border-slate-200 bg-white lg:block">
        {SideContent}
      </aside>

      {/* الشريط الجانبي - الجوال */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-72 bg-white shadow-xl animate-fade-up">
            {SideContent}
          </aside>
        </div>
      )}

      <div className="lg:pr-72">
        {/* الشريط العلوي */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-ink-soft hover:bg-slate-100 lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <p className="text-xs font-bold text-ink-muted">{settings?.college_name ?? 'كلية الأعمال'}</p>
              <h1 className="text-base font-extrabold text-ink">نظام التدريب التعاوني</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-left sm:block">
              <p className="text-sm font-extrabold text-ink">{profile.full_name}</p>
              <p className="text-xs font-bold text-kku-600">{ROLE_LABEL[profile.role]}</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-kku-600 to-kku-800 text-sm font-extrabold text-white">
              {initials(profile.full_name)}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
