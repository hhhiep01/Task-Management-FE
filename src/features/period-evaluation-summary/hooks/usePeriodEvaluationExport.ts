import { useMutation } from '@tanstack/react-query'

import {
  exportEmployeeEvaluationExcel,
  exportPeriodExcel,
} from '../api/periodEvaluationExportApi'

export function useExportPeriodExcel() {
  return useMutation({
    mutationFn: (periodId: string) => exportPeriodExcel(periodId),
  })
}

export function useExportEmployeeExcel() {
  return useMutation({
    mutationFn: ({ periodId, userId }: { periodId: string; userId: string }) =>
      exportEmployeeEvaluationExcel(periodId, userId),
  })
}
