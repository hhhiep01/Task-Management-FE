import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { UserAccountsPage } from '@/features/accounts/pages/UserAccountsPage'
import { AdminPage } from '@/features/admin/pages/AdminPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ProtectedRoute } from '@/features/auth/routes/ProtectedRoute'
import { RoleRedirect } from '@/features/auth/routes/RoleRedirect'
import { CommonCriteriaPage } from '@/features/common-criteria/pages/CommonCriteriaPage'
import { EmployeePage } from '@/features/employee/pages/EmployeePage'
import { EvaluationPeriodsPage } from '@/features/evaluation-periods/pages/EvaluationPeriodsPage'
import { ManagerPage } from '@/features/manager/pages/ManagerPage'
import { OrganizationsPage } from '@/features/organizations/pages/OrganizationsPage'
import { RolesPage } from '@/features/roles/pages/RolesPage'
import { SelfEvaluationPage } from '@/features/self-evaluations/pages/SelfEvaluationPage'
import { TaskDetailPage } from '@/features/tasks/pages/TaskDetailPage'
import { TasksPage } from '@/features/tasks/pages/TasksPage'
import { WaitingEvaluationPage } from '@/features/tasks/pages/WaitingEvaluationPage'
import { WorkCategoriesPage } from '@/features/work-categories/pages/WorkCategoriesPage'
import { WorkTemplatesPage } from '@/features/work-templates/pages/WorkTemplatesPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute allowedRoles={['admin', 'employee', 'manager']} />}>
        <Route element={<AppLayout />}>
          <Route index element={<RoleRedirect />} />
          <Route path="/common-criteria" element={<CommonCriteriaPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/roles" element={<RolesPage />} />
          <Route path="/admin/accounts" element={<UserAccountsPage />} />
          <Route path="/admin/organizations" element={<OrganizationsPage />} />
          <Route path="/manager/accounts" element={<Navigate to="/admin/accounts" replace />} />
          <Route
            path="/manager/organizations"
            element={<Navigate to="/admin/organizations" replace />}
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route element={<AppLayout />}>
          <Route path="/employee" element={<EmployeePage />} />
          <Route path="/employee/self-evaluation" element={<SelfEvaluationPage />} />
          <Route path="/employee/tasks/:taskId" element={<TaskDetailPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
        <Route element={<AppLayout />}>
          <Route path="/manager" element={<ManagerPage />} />
          <Route path="/manager/evaluation-periods" element={<EvaluationPeriodsPage />} />
          <Route path="/manager/work-categories" element={<WorkCategoriesPage />} />
          <Route path="/manager/work-templates" element={<WorkTemplatesPage />} />
          <Route path="/manager/tasks" element={<TasksPage />} />
          <Route path="/manager/waiting-evaluation" element={<WaitingEvaluationPage />} />
          <Route path="/manager/tasks/:taskId" element={<TaskDetailPage />} />
        </Route>
      </Route>

      <Route path="/not-found" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/not-found" replace />} />
    </Routes>
  )
}
