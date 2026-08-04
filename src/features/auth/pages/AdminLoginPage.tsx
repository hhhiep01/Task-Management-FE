import { RoleLoginForm } from '../components/RoleLoginForm'

export function AdminLoginPage() {
  return (
    <RoleLoginForm
      role="admin"
      title="Đăng nhập quản trị"
      description="Đăng nhập bằng tài khoản quản trị để quản lý người dùng, vai trò và cấu hình hệ thống."
      submitLabel="Đăng nhập quản trị"
      submitClassName="bg-slate-900 hover:bg-slate-800"
      showCreateAccount
    />
  )
}
