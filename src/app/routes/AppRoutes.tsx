import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { AdminPage } from '@/features/admin/pages/AdminPage'
import { AdminLoginPage } from '@/features/auth/pages/AdminLoginPage'
import { EmployeeLoginPage } from '@/features/auth/pages/EmployeeLoginPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ManagerLoginPage } from '@/features/auth/pages/ManagerLoginPage'
import { ProtectedRoute } from '@/features/auth/routes/ProtectedRoute'
import { RoleRedirect } from '@/features/auth/routes/RoleRedirect'
import { EmployeePage } from '@/features/employee/pages/EmployeePage'
import { ManagerPage } from '@/features/manager/pages/ManagerPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/admin" element={<AdminLoginPage />} />
      <Route path="/login/employee" element={<EmployeeLoginPage />} />
      <Route path="/login/manager" element={<ManagerLoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute allowedRoles={['admin', 'employee', 'manager']} />}>
        <Route element={<AppLayout />}>
          <Route index element={<RoleRedirect />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route element={<AppLayout />}>
          <Route path="/employee" element={<EmployeePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
        <Route element={<AppLayout />}>
          <Route path="/manager" element={<ManagerPage />} />
        </Route>
      </Route>

      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  )
}
