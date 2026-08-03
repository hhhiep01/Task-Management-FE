import { RoleLoginForm } from '../components/RoleLoginForm'

export function ManagerLoginPage() {
  return (
    <RoleLoginForm
      role="manager"
      title="Manager login"
      description="Sign in to review team workload, approvals, and delivery status."
      submitLabel="Login manager"
      submitClassName="bg-emerald-700 hover:bg-emerald-800"
    />
  )
}
