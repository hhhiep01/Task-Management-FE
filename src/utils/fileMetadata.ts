const friendlyMimeTypes: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPEG',
  'image/png': 'PNG',
}

export function getFileExtension(fileName?: string | null) {
  const extension = fileName?.split('.').pop()?.trim().toLowerCase()
  return extension && extension !== fileName?.toLowerCase() ? extension : ''
}

export function getFriendlyFileType(contentType?: string | null, fileName?: string | null) {
  const mimeType = contentType?.split(';')[0].trim().toLowerCase()
  if (mimeType && friendlyMimeTypes[mimeType]) return friendlyMimeTypes[mimeType]

  const extension = getFileExtension(fileName)
  return extension ? extension.toUpperCase() : 'Tệp'
}

export function formatFileSize(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) return '-'
  if (value < 1024) return `${value} B`

  const unit = value < 1024 * 1024 ? 'KB' : 'MB'
  const divisor = unit === 'KB' ? 1024 : 1024 * 1024
  const amount = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value / divisor)
  return `${amount} ${unit}`
}
