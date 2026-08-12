import { ApiClientError, httpClient } from '@/services/httpClient'

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const periodEvaluationExportApiLinks = {
  period: (periodId: string) => `/api/Report/evaluation-period/${periodId}/excel`,
  employee: (periodId: string, userId: string) =>
    `/api/Report/evaluation-period/${periodId}/employees/${userId}/excel`,
}

export type ExportedExcelFile = {
  blob: Blob
  fileName: string
}

function getFilename(contentDisposition: string | undefined, fallback: string) {
  if (!contentDisposition) return fallback

  const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded)
    } catch {
      return encoded
    }
  }

  return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback
}

async function requestExcel(url: string, fallbackFileName: string): Promise<ExportedExcelFile> {
  const response = await httpClient.get<Blob>(url, {
    responseType: 'blob',
    headers: { Accept: XLSX_CONTENT_TYPE },
  })

  return {
    blob: response.data,
    fileName: getFilename(response.headers['content-disposition'], fallbackFileName),
  }
}

export function exportPeriodExcel(periodId: string) {
  return requestExcel(periodEvaluationExportApiLinks.period(periodId), 'TongHopDanhGia.xlsx')
}

export function exportEmployeeEvaluationExcel(periodId: string, userId: string) {
  return requestExcel(
    periodEvaluationExportApiLinks.employee(periodId, userId),
    'DanhGia_NhanVien.xlsx',
  )
}

export async function getExportErrorMessage(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return 'Không thể xuất file Excel. Vui lòng thử lại.'
  }

  if (error.status === 401) return 'Phiên đăng nhập đã hết hạn.'
  if (error.status === 403) return 'Bạn không có quyền xuất báo cáo.'
  if (error.status === 404) return 'Không tìm thấy kỳ đánh giá hoặc kết quả nhân viên.'

  if (error.responseData instanceof Blob && error.responseData.type.includes('application/json')) {
    try {
      const payload = JSON.parse(await error.responseData.text()) as { errorMessage?: string; message?: string }
      return payload.errorMessage || payload.message || 'Không thể xuất file Excel. Vui lòng thử lại.'
    } catch {
      return 'Không thể xuất file Excel. Vui lòng thử lại.'
    }
  }

  return error.message || 'Không thể xuất file Excel. Vui lòng thử lại.'
}
