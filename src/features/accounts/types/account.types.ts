import type { Organization } from '../../organizations/types/organization.types'
import type { Role } from '../../roles/types/role.types'

export type UserAccount = {
  id: string
  fullName: string
  email: string
  role: Role
  organization: Organization | null
  createdDate?: string | null
  modifiedDate?: string | null
}

export type CreateUserAccountRequest = {
  fullName: string
  email: string
  password: string
  roleId: string
  organizationId: string
}

export type UpdateUserAccountRequest = {
  fullName: string
  email: string
  roleId: string
  organizationId: string
  password?: string
}

export type UserAccountForm = {
  fullName: string
  email: string
  password: string
  roleId: string
  organizationId: string
}
