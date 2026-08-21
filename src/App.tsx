import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { useAuth } from './lib/auth'
import { SettingsProvider } from './lib/settings'
import { ToastProvider } from './lib/toast'
import { Role } from './lib/types'
import { PageLoader } from './components/ui'
import Layout from './components/Layout'

import Login from './pages/Login'
import Activate from './pages/Activate'
import Verify from './pages/Verify'
import Setup from './pages/Setup'
import Dashboard from './pages/Dashboard'
import RequestDetail from './pages/RequestDetail'

import Users from './pages/coordinator/Users'
import Assignments from './pages/coordinator/Assignments'
import Entities from './pages/coordinator/Entities'
import RequestsList from './pages/coordinator/RequestsList'
import SettingsPage from './pages/coordinator/Settings'

import MyStudents from './pages/supervisor/MyStudents'
import Review from './pages/supervisor/Review'
import MySignature from './pages/supervisor/MySignature'

import Queue from './pages/unit/Queue'

import Browse from './pages/student/Browse'
import NewRequest from './pages/student/NewRequest'
import MyRequests from './pages/student/MyRequests'

function RequireAuth({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { session, profile, loading, profileLoading, configured } = useAuth()
  const location = useLocation()
  if (!configured) return <Navigate to="/setup" replace />
  if (loading) return <PageLoader />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  if (profileLoading) return <PageLoader label="جارٍ تحميل بياناتك…" />
  if (!profile)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="card max-w-md p-8">
          <h2 className="text-lg font-extrabold text-ink">لا يوجد ملف مرتبط بحسابك</h2>
          <p className="mt-2 text-sm text-ink-muted">
            تم تسجيل دخولك لكن لا يوجد ملف تعريفي مفعّل. تواصل مع مرشد التدريب.
          </p>
        </div>
      </div>
    )
  if (roles && !roles.includes(profile.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

const STAFF: Role[] = ['admin', 'coordinator', 'training_unit']
const ADMIN_COORD: Role[] = ['admin', 'coordinator']

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <Routes>
          {/* عامة */}
          <Route path="/login" element={<Login />} />
          <Route path="/activate" element={<Activate />} />
          <Route path="/verify/:token" element={<Verify />} />
          <Route path="/setup" element={<Setup />} />

          {/* محمية */}
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/requests/:id" element={<RequestDetail />} />

            {/* المرشد / المدير */}
            <Route path="/users" element={<Guard roles={ADMIN_COORD}><Users /></Guard>} />
            <Route path="/assignments" element={<Guard roles={ADMIN_COORD}><Assignments /></Guard>} />
            <Route path="/settings" element={<Guard roles={ADMIN_COORD}><SettingsPage /></Guard>} />

            {/* الطاقم */}
            <Route path="/entities" element={<Guard roles={STAFF}><Entities /></Guard>} />
            <Route path="/requests" element={<Guard roles={STAFF}><RequestsList /></Guard>} />

            {/* المشرف */}
            <Route path="/my-students" element={<Guard roles={['supervisor']}><MyStudents /></Guard>} />
            <Route path="/review" element={<Guard roles={['supervisor']}><Review /></Guard>} />
            <Route path="/my-signature" element={<Guard roles={['supervisor', 'training_unit']}><MySignature /></Guard>} />

            {/* وحدة التدريب */}
            <Route path="/queue" element={<Guard roles={['training_unit', 'admin', 'coordinator']}><Queue /></Guard>} />

            {/* الطالب */}
            <Route path="/browse" element={<Guard roles={['student']}><Browse /></Guard>} />
            <Route path="/new-request" element={<Guard roles={['student']}><NewRequest /></Guard>} />
            <Route path="/my-requests" element={<Guard roles={['student']}><MyRequests /></Guard>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SettingsProvider>
    </ToastProvider>
  )
}

// حارس داخلي للأدوار داخل التخطيط
function Guard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { profile } = useAuth()
  if (profile && !roles.includes(profile.role)) return <Navigate to="/" replace />
  return <>{children}</>
}
