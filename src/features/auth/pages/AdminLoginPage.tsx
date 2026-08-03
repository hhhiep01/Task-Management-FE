import { RoleLoginForm } from '../components/RoleLoginForm'

export function AdminLoginPage() {
  return (
    <RoleLoginForm
      role="admin"
      title="Admin login"
      description="Sign in with an admin account to manage users, roles, and settings."
      submitLabel="Login admin"
      submitClassName="bg-slate-900 hover:bg-slate-800"
      showCreateAccount
    />
  )
}
