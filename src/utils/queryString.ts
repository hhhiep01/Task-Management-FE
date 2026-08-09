type QueryValue = string | number | boolean | null | undefined

export function buildQueryParams(values: Record<string, QueryValue>) {
  const params = new URLSearchParams()

  Object.entries(values).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return
    }

    params.set(key, String(value))
  })

  return params
}
