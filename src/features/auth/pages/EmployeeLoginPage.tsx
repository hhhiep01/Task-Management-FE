import { RoleLoginForm } from '../components/RoleLoginForm'

export function EmployeeLoginPage() {
  return (
    <RoleLoginForm
      role="employee"
      title="Đăng nhập nhân viên"
      description="Đăng nhập để xem công việc được giao và cập nhật tiến độ."
      submitLabel="Đăng nhập nhân viên"
    />
  )
}
