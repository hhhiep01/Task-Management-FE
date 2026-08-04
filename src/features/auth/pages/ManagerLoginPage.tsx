import { RoleLoginForm } from '../components/RoleLoginForm'

export function ManagerLoginPage() {
  return (
    <RoleLoginForm
      role="manager"
      title="Đăng nhập trưởng phòng"
      description="Đăng nhập để theo dõi khối lượng công việc, phê duyệt và tiến độ của phòng ban."
      submitLabel="Đăng nhập trưởng phòng"
      submitClassName="bg-emerald-700 hover:bg-emerald-800"
    />
  )
}
