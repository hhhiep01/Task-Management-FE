export type Organization = {
  id: string
  code: string
  name: string
  createdDate: string
  modifiedDate: string | null
}

export type OrganizationPayload = {
  code: string
  name: string
}

export type CreateOrganizationRequest = OrganizationPayload

export type UpdateOrganizationRequest = OrganizationPayload
