export type Role = {
  id: string
  code: string
  name: string
  createdDate: string
  modifiedDate: string | null
}

export type RolePayload = {
  code: string
  name: string
}

export type CreateRoleRequest = RolePayload

export type UpdateRoleRequest = RolePayload
