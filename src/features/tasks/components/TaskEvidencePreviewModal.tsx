import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

import type { TaskEvidence } from '../types/taskEvidence.types'

export type TaskEvidencePreview = {
  evidence: TaskEvidence
  objectUrl?: string
  error?: string
}

function getExtension(fileName?: string | null) {
  return fileName?.split('.').pop()?.toLowerCase() ?? ''
}

export function TaskEvidencePreviewModal({
  preview,
  actionError,
  isDownloading,
  onClose,
  onDownload,
}: {
  preview: TaskEvidencePreview | null
  actionError?: string
  isDownloading: boolean
  onClose: () => void
  onDownload: (evidence: TaskEvidence) => void
}) {
  const extension = getExtension(preview?.evidence.fileName)

  return (
    <Modal
      open={Boolean(preview)}
      onClose={onClose}
      title={preview?.evidence.fileName || 'Xem tệp minh chứng'}
      description="Bản xem trước tệp gốc được tải từ hệ thống."
      size="xl"
      footer={preview ? (
        <Button size="sm" variant="secondary" disabled={isDownloading} onClick={() => onDownload(preview.evidence)}>
          {isDownloading ? 'Đang tải...' : 'Tải xuống'}
        </Button>
      ) : undefined}
    >
      {preview?.error ? <PreviewError message={preview.error} /> : null}
      {!preview?.error && !preview?.objectUrl ? <PreviewLoading /> : null}
      {actionError ? <div className="mb-3"><PreviewError message={actionError} /></div> : null}
      {preview?.objectUrl && ['jpg', 'jpeg', 'png'].includes(extension) ? (
        <div className="flex min-h-72 max-h-[70vh] justify-center overflow-auto rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] p-3">
          <img
            src={preview.objectUrl}
            alt={preview.evidence.description || preview.evidence.fileName || 'Minh chứng'}
            className="h-auto max-h-[66vh] max-w-full object-contain"
          />
        </div>
      ) : null}
      {preview?.objectUrl && extension === 'pdf' ? (
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
          <iframe src={preview.objectUrl} title={preview.evidence.fileName || 'Tệp PDF minh chứng'} className="h-[70vh] min-h-96 w-full" />
        </div>
      ) : null}
    </Modal>
  )
}

function PreviewLoading() {
  return <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-4 py-12 text-center text-sm text-[var(--color-text-muted)]" role="status">Đang tải bản xem trước...</div>
}

function PreviewError({ message }: { message: string }) {
  return <div className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-4 py-4 text-sm text-[var(--color-danger)]" role="alert">{message}</div>
}
