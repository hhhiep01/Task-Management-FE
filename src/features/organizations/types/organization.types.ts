export type Organization = {
  id: string
  code: string
  name: string
  parentId: string | null
  parentName: string | null
  createdDate: string
  modifiedDate: string | null
}

export type OrganizationPayload = {
  code: string
  name: string
  parentId: string | null
}

export type CreateOrganizationRequest = OrganizationPayload

export type UpdateOrganizationRequest = OrganizationPayload
