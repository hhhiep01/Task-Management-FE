import { RoleLoginForm } from '../components/RoleLoginForm'

export function EmployeeLoginPage() {
  return (
    <RoleLoginForm
      role="employee"
      title="Employee login"
      description="Sign in to view assigned tasks and update your work progress."
      submitLabel="Login employee"
    />
  )
}
