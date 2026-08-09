import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PeriodStatus } from '@/features/evaluation-periods/types/evaluationPeriod.types'
import { formatFileSize, getFriendlyFileType } from '@/utils/fileMetadata'
import { formatDate } from '@/utils/formatDate'

import {
  useCreateTaskEvidence,
  useDeleteTaskEvidence,
  useDownloadTaskEvidence,
  useTaskEvidences,
  useUpdateTaskEvidence,
  useUploadTaskEvidence,
} from '../hooks/useTaskEvidences'
import { WorkTaskStatus, type Task } from '../types/task.types'
import {
  TaskEvidenceType,
  type TaskEvidence,
  type UpdateTaskEvidenceRequest,
} from '../types/taskEvidence.types'
import { TaskEvidencePreviewModal, type TaskEvidencePreview } from './TaskEvidencePreviewModal'

type EditorMode = 'DOCUMENT' | 'LINK' | 'FILE' | 'EDIT' | null
type FileAction = { evidenceId: string; type: 'preview' | 'download' } | null

const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']
const maxFileSize = 20 * 1024 * 1024
const fieldClassName =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm text-[var(--color-text-strong)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

function isSameUser(left?: string | null, right?: string | null) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase())
}

function evidenceLabel(evidence: TaskEvidence) {
  if (evidence.evidenceType === TaskEvidenceType.FILE) {
    return evidence.fileName || 'Tệp đính kèm'
  }
  if (evidence.evidenceType === TaskEvidenceType.LINK) {
    return evidence.description || evidence.fileUrl || 'Liên kết kết quả'
  }
  return evidence.documentNumber ? `Văn bản ${evidence.documentNumber}` : 'Văn bản minh chứng'
}

function evidenceTypeLabel(type: TaskEvidence['evidenceType']) {
  if (type === TaskEvidenceType.FILE) return 'Tệp'
  if (type === TaskEvidenceType.LINK) return 'Liên kết'
  return 'Văn bản'
}

function isPreviewableFile(evidence: TaskEvidence) {
  const contentType = evidence.contentType?.toLowerCase() ?? ''
  const extension = evidence.fileName?.split('.').pop()?.toLowerCase() ?? ''
  return contentType === 'application/pdf' || contentType === 'image/jpeg' || contentType === 'image/png' || ['pdf', 'jpg', 'jpeg', 'png'].includes(extension)
}

export function TaskEvidenceSection({ task }: { task: Task }) {
  const { user } = useAuth()
  const evidencesQuery = useTaskEvidences(task.id)
  const createMutation = useCreateTaskEvidence(task.id)
  const uploadMutation = useUploadTaskEvidence(task.id)
  const updateMutation = useUpdateTaskEvidence(task.id)
  const deleteMutation = useDeleteTaskEvidence(task.id)
  const downloadMutation = useDownloadTaskEvidence()
  const [mode, setMode] = useState<EditorMode>(null)
  const [editingEvidence, setEditingEvidence] = useState<TaskEvidence | null>(null)
  const [deletingEvidence, setDeletingEvidence] = useState<TaskEvidence | null>(null)
  const [documentNumber, setDocumentNumber] = useState('')
  const [documentDate, setDocumentDate] = useState('')
  const [description, setDescription] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [fileAction, setFileAction] = useState<FileAction>(null)
  const [filePreview, setFilePreview] = useState<TaskEvidencePreview | null>(null)
  const fileRequestPendingRef = useRef(false)
  const previewRequestIdRef = useRef(0)

  useEffect(() => () => {
    if (filePreview?.objectUrl) URL.revokeObjectURL(filePreview.objectUrl)
  }, [filePreview])

  const canEdit =
    isSameUser(user?.id, task.assignee?.id ?? task.assigneeId) &&
    (task.status === WorkTaskStatus.IN_PROGRESS ||
      task.status === WorkTaskStatus.REVISION_REQUIRED) &&
    task.period?.status === PeriodStatus.ACTIVE
  const isSaving = createMutation.isPending || uploadMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error || uploadMutation.error || updateMutation.error

  const resetForm = () => {
    setDocumentNumber('')
    setDocumentDate('')
    setDescription('')
    setFileUrl('')
    setFile(null)
    setFormError('')
    setUploadProgress(0)
  }

  const closeEditor = () => {
    if (isSaving) return
    setMode(null)
    setEditingEvidence(null)
    resetForm()
  }

  const openCreate = (nextMode: Exclude<EditorMode, 'EDIT' | null>) => {
    resetForm()
    setEditingEvidence(null)
    setMode(nextMode)
  }

  const openEdit = (evidence: TaskEvidence) => {
    setEditingEvidence(evidence)
    setDocumentNumber(evidence.documentNumber ?? '')
    setDocumentDate(evidence.documentDate?.slice(0, 10) ?? '')
    setDescription(evidence.description ?? '')
    setFileUrl(evidence.fileUrl ?? '')
    setFormError('')
    setMode('EDIT')
  }

  const selectFile = (selected: File | null) => {
    setFormError('')
    setFile(null)
    if (!selected) return
    const extension = selected.name.split('.').pop()?.toLowerCase() ?? ''
    if (!allowedExtensions.includes(extension)) {
      setFormError('Định dạng tệp không được hỗ trợ.')
      return
    }
    if (selected.size > maxFileSize) {
      setFormError('Tệp vượt quá giới hạn 20 MB.')
      return
    }
    setFile(selected)
  }

  const submitEvidence = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setSuccessMessage('')

    try {
      if (mode === 'FILE') {
        if (!file) {
          setFormError('Vui lòng chọn tệp hợp lệ để tải lên.')
          return
        }
        await uploadMutation.mutateAsync({
          file,
          description,
          onProgress: setUploadProgress,
        })
      } else if (mode === 'DOCUMENT') {
        if (!documentNumber.trim() || !documentDate) {
          setFormError('Vui lòng nhập số và ngày văn bản.')
          return
        }
        await createMutation.mutateAsync({
          evidenceType: 'DOCUMENT',
          documentNumber: documentNumber.trim(),
          documentDate,
          description: description.trim() || null,
          fileUrl: null,
        })
      } else if (mode === 'LINK') {
        if (!isValidHttpUrl(fileUrl)) {
          setFormError('Vui lòng nhập liên kết HTTP hoặc HTTPS hợp lệ.')
          return
        }
        await createMutation.mutateAsync({
          evidenceType: 'LINK',
          documentNumber: null,
          documentDate: null,
          description: description.trim() || null,
          fileUrl: fileUrl.trim(),
        })
      } else if (mode === 'EDIT' && editingEvidence) {
        if (editingEvidence.evidenceType === TaskEvidenceType.DOCUMENT && (!documentNumber.trim() || !documentDate)) {
          setFormError('Vui lòng nhập số và ngày văn bản.')
          return
        }
        if (editingEvidence.evidenceType === TaskEvidenceType.LINK && !isValidHttpUrl(fileUrl)) {
          setFormError('Vui lòng nhập liên kết HTTP hoặc HTTPS hợp lệ.')
          return
        }
        let payload: UpdateTaskEvidenceRequest
        if (editingEvidence.evidenceType === TaskEvidenceType.DOCUMENT) {
          payload = {
            documentNumber: documentNumber.trim(),
            documentDate,
            description: description.trim() || null,
          }
        } else if (editingEvidence.evidenceType === TaskEvidenceType.LINK) {
          payload = {
            fileUrl: fileUrl.trim(),
            description: description.trim() || null,
          }
        } else {
          payload = { description: description.trim() || null }
        }

        await updateMutation.mutateAsync({
          evidenceId: editingEvidence.id,
          payload,
        })
      }
      setSuccessMessage(mode === 'EDIT' ? 'Đã cập nhật minh chứng.' : 'Đã thêm minh chứng.')
      setMode(null)
      setEditingEvidence(null)
      resetForm()
    } catch {
      // Mutation errors are shown through the existing inline alert convention.
    }
  }

  const confirmDelete = async () => {
    if (!deletingEvidence) return
    try {
      await deleteMutation.mutateAsync(deletingEvidence.id)
      setSuccessMessage('Đã xóa minh chứng.')
      setDeletingEvidence(null)
    } catch {
      // Mutation error is rendered in the confirmation dialog.
    }
  }

  const download = async (evidence: TaskEvidence) => {
    if (fileRequestPendingRef.current) return
    fileRequestPendingRef.current = true
    setFileAction({ evidenceId: evidence.id, type: 'download' })
    try {
      const result = await downloadMutation.mutateAsync(evidence)
      const objectUrl = URL.createObjectURL(result.blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = result.fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      // Download error is rendered in the section.
    } finally {
      fileRequestPendingRef.current = false
      setFileAction(null)
    }
  }

  const preview = async (evidence: TaskEvidence) => {
    if (fileRequestPendingRef.current) return
    fileRequestPendingRef.current = true
    const requestId = ++previewRequestIdRef.current
    setFilePreview({ evidence })
    setFileAction({ evidenceId: evidence.id, type: 'preview' })
    try {
      const result = await downloadMutation.mutateAsync(evidence)
      if (requestId === previewRequestIdRef.current) {
        setFilePreview({ evidence, objectUrl: URL.createObjectURL(result.blob) })
      }
    } catch (reason) {
      if (requestId === previewRequestIdRef.current) {
        setFilePreview({ evidence, error: reason instanceof Error ? reason.message : 'Không tải được bản xem trước.' })
      }
    } finally {
      fileRequestPendingRef.current = false
      setFileAction(null)
    }
  }

  const closePreview = () => {
    previewRequestIdRef.current += 1
    if (filePreview?.objectUrl) URL.revokeObjectURL(filePreview.objectUrl)
    setFilePreview(null)
  }

  const evidences = evidencesQuery.data ?? []

  return (
    <Card id="task-evidence" className="min-w-0 scroll-mt-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--color-text-strong)]">Minh chứng</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {evidences.length ? `${evidences.length} minh chứng đã đính kèm` : 'Minh chứng kết quả thực hiện công việc'}
          </p>
        </div>
        {canEdit && evidences.length ? <AddEvidenceMenu onSelect={openCreate} /> : null}
      </div>

      {successMessage ? <p className="mt-4 text-sm font-medium text-[var(--color-success)]" role="status">{successMessage}</p> : null}
      {evidencesQuery.isLoading ? <StateMessage>Đang tải minh chứng...</StateMessage> : null}
      {evidencesQuery.isError ? <StateMessage tone="danger">{evidencesQuery.error instanceof Error ? evidencesQuery.error.message : 'Không tải được minh chứng.'}</StateMessage> : null}

      {!evidencesQuery.isLoading && !evidencesQuery.isError && !evidences.length ? (
        <EmptyEvidenceState canEdit={canEdit} onSelect={openCreate} />
      ) : null}

      {evidences.length ? (
        <div className="mt-3 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {evidences.map((evidence) => (
            <EvidenceCard
              key={evidence.id}
              evidence={evidence}
              canEdit={canEdit}
              onEdit={openEdit}
              onDelete={setDeletingEvidence}
              onDownload={download}
              onPreview={preview}
              fileAction={fileAction}
            />
          ))}
        </div>
      ) : null}

      {downloadMutation.error instanceof Error ? <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">{downloadMutation.error.message}</p> : null}

      <EvidenceEditorModal
        mode={mode}
        evidence={editingEvidence}
        documentNumber={documentNumber}
        documentDate={documentDate}
        description={description}
        fileUrl={fileUrl}
        file={file}
        uploadProgress={uploadProgress}
        isSaving={isSaving}
        error={formError || (mutationError instanceof Error ? mutationError.message : '')}
        onDocumentNumberChange={setDocumentNumber}
        onDocumentDateChange={setDocumentDate}
        onDescriptionChange={setDescription}
        onFileUrlChange={setFileUrl}
        onFileChange={selectFile}
        onSubmit={submitEvidence}
        onClose={closeEditor}
      />

      <Modal
        open={Boolean(deletingEvidence)}
        onClose={() => !deleteMutation.isPending && setDeletingEvidence(null)}
        title="Xóa minh chứng?"
        description={deletingEvidence ? `Minh chứng “${evidenceLabel(deletingEvidence)}” sẽ bị xóa.` : undefined}
        size="sm"
      >
        <div className="grid gap-4">
          {deleteMutation.error instanceof Error ? <p className="text-sm text-[var(--color-danger)]" role="alert">{deleteMutation.error.message}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={deleteMutation.isPending} onClick={() => setDeletingEvidence(null)}>Quay lại</Button>
            <Button variant="danger" disabled={deleteMutation.isPending} onClick={() => void confirmDelete()}>{deleteMutation.isPending ? 'Đang xóa...' : 'Xóa minh chứng'}</Button>
          </div>
        </div>
      </Modal>

      <TaskEvidencePreviewModal
        preview={filePreview}
        actionError={filePreview?.objectUrl && downloadMutation.error instanceof Error ? downloadMutation.error.message : undefined}
        isDownloading={fileAction?.type === 'download'}
        onClose={closePreview}
        onDownload={(evidence) => void download(evidence)}
      />
    </Card>
  )
}

function EvidenceCard({ evidence, canEdit, onEdit, onDelete, onDownload, onPreview, fileAction }: { evidence: TaskEvidence; canEdit: boolean; onEdit: (evidence: TaskEvidence) => void; onDelete: (evidence: TaskEvidence) => void; onDownload: (evidence: TaskEvidence) => void; onPreview: (evidence: TaskEvidence) => void; fileAction: FileAction }) {
  const isCurrentFileAction = fileAction?.evidenceId === evidence.id
  const canPreview = evidence.evidenceType === TaskEvidenceType.FILE && isPreviewableFile(evidence)

  return (
    <article className="grid min-w-0 gap-2.5 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Badge variant={evidence.evidenceType === TaskEvidenceType.FILE ? 'primary' : evidence.evidenceType === TaskEvidenceType.LINK ? 'info' : 'neutral'}>{evidenceTypeLabel(evidence.evidenceType)}</Badge>
          <h3 className="mt-2 truncate font-semibold text-[var(--color-text-strong)]" title={evidenceLabel(evidence)}>{evidenceLabel(evidence)}</h3>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1 sm:justify-end">
          {canPreview ? <Button size="sm" disabled={Boolean(fileAction)} onClick={() => void onPreview(evidence)}>{isCurrentFileAction && fileAction?.type === 'preview' ? 'Đang mở...' : 'Xem trước'}</Button> : null}
          {evidence.evidenceType === TaskEvidenceType.FILE ? <Button size="sm" variant={canPreview ? 'secondary' : 'primary'} disabled={Boolean(fileAction)} onClick={() => void onDownload(evidence)}>{isCurrentFileAction && fileAction?.type === 'download' ? 'Đang tải...' : 'Tải xuống'}</Button> : null}
          {evidence.evidenceType === TaskEvidenceType.LINK && evidence.fileUrl ? <a href={evidence.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--color-primary)] bg-[var(--color-primary)] px-3 text-sm font-semibold text-white transition-colors duration-200 hover:border-[var(--color-primary-hover)] hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">Mở liên kết</a> : null}
        </div>
      </div>
      {evidence.description ? <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text)]">{evidence.description}</p> : null}
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {evidence.evidenceType === TaskEvidenceType.DOCUMENT ? <><Meta label="Số văn bản" value={evidence.documentNumber} /><Meta label="Ngày văn bản" value={formatDate(evidence.documentDate)} /></> : null}
        {evidence.evidenceType === TaskEvidenceType.FILE ? <><Meta label="Kích thước" value={formatFileSize(evidence.fileSize)} /><Meta label="Định dạng" value={getFriendlyFileType(evidence.contentType, evidence.fileName)} /></> : null}
        <Meta label="Người tải lên" value={evidence.uploadedByName} />
        <Meta label="Ngày tạo" value={formatDateTime(evidence.createdAt)} />
        {evidence.updatedAt ? <Meta label="Cập nhật" value={formatDateTime(evidence.updatedAt)} /> : null}
      </dl>
      {evidence.evidenceType === TaskEvidenceType.LINK && evidence.fileUrl ? <p className="truncate text-xs text-[var(--color-primary)]" title={evidence.fileUrl}>{evidence.fileUrl}</p> : null}
      {canEdit ? <div className="flex justify-end gap-1 border-t border-[var(--color-border)] pt-2"><Button size="sm" variant="ghost" onClick={() => onEdit(evidence)}>Sửa</Button><Button size="sm" variant="ghost" className="text-[var(--color-danger)]" onClick={() => onDelete(evidence)}>Xóa</Button></div> : null}
    </article>
  )
}

function EmptyEvidenceState({ canEdit, onSelect }: { canEdit: boolean; onSelect: (mode: Exclude<EditorMode, 'EDIT' | null>) => void }) {
  return (
    <div className="mt-3 flex min-h-32 flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-4 py-5 text-center">
      <h3 className="font-semibold text-[var(--color-text-strong)]">Chưa có minh chứng</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-[var(--color-text-muted)]">
        {canEdit ? 'Đính kèm văn bản, liên kết hoặc tệp để bổ sung kết quả thực hiện công việc.' : 'Chưa có minh chứng nào được gửi.'}
      </p>
      {canEdit ? <div className="mt-4 w-full sm:w-auto"><AddEvidenceMenu fullWidth onSelect={onSelect} /></div> : null}
    </div>
  )
}

function AddEvidenceMenu({ onSelect, fullWidth = false }: { onSelect: (mode: Exclude<EditorMode, 'EDIT' | null>) => void; fullWidth?: boolean }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const select = (mode: Exclude<EditorMode, 'EDIT' | null>) => {
    setOpen(false)
    onSelect(mode)
  }

  return (
    <div ref={menuRef} className={`relative ${fullWidth ? 'w-full sm:w-auto' : ''}`}>
      <Button
        size="sm"
        className={fullWidth ? 'w-full' : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        + Thêm minh chứng
      </Button>
      {open ? (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-1 shadow-lg">
          <MenuItem label="Văn bản" description="Số và ngày văn bản" onClick={() => select('DOCUMENT')} />
          <MenuItem label="Liên kết" description="Đường dẫn kết quả" onClick={() => select('LINK')} />
          <MenuItem label="Tải tệp lên" description="PDF, Office hoặc hình ảnh" onClick={() => select('FILE')} />
        </div>
      ) : null}
    </div>
  )
}

function MenuItem({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" className="w-full rounded-[var(--radius-sm)] px-3 py-2 text-left hover:bg-[var(--color-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" onClick={onClick}>
      <span className="block text-sm font-semibold text-[var(--color-text-strong)]">{label}</span>
      <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">{description}</span>
    </button>
  )
}

function EvidenceEditorModal(props: { mode: EditorMode; evidence: TaskEvidence | null; documentNumber: string; documentDate: string; description: string; fileUrl: string; file: File | null; uploadProgress: number; isSaving: boolean; error: string; onDocumentNumberChange: (value: string) => void; onDocumentDateChange: (value: string) => void; onDescriptionChange: (value: string) => void; onFileUrlChange: (value: string) => void; onFileChange: (file: File | null) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  const { mode, evidence } = props
  const type = mode === 'EDIT' ? evidence?.evidenceType : mode
  return (
    <Modal open={Boolean(mode)} onClose={props.onClose} title={mode === 'EDIT' ? 'Cập nhật minh chứng' : type === 'FILE' ? 'Tải tệp minh chứng' : type === 'LINK' ? 'Thêm liên kết' : 'Thêm văn bản'} size="md">
      <form className="grid gap-4" onSubmit={props.onSubmit}>
        {type === TaskEvidenceType.DOCUMENT ? <><Field label="Số văn bản"><input value={props.documentNumber} onChange={(event) => props.onDocumentNumberChange(event.target.value)} className={fieldClassName} /></Field><Field label="Ngày văn bản"><input type="date" value={props.documentDate} onChange={(event) => props.onDocumentDateChange(event.target.value)} className={fieldClassName} /></Field></> : null}
        {type === TaskEvidenceType.LINK ? <Field label="Liên kết"><input type="url" value={props.fileUrl} onChange={(event) => props.onFileUrlChange(event.target.value)} className={fieldClassName} placeholder="https://example.com/result" /></Field> : null}
        {type === TaskEvidenceType.FILE && mode === 'FILE' ? <Field label="Tệp"><input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => props.onFileChange(event.target.files?.[0] ?? null)} className="block w-full text-sm text-[var(--color-text)] file:mr-3 file:rounded-[var(--radius-md)] file:border-0 file:bg-[var(--color-primary-subtle)] file:px-3 file:py-2 file:font-semibold file:text-[var(--color-primary)]" />{props.file ? <p className="text-xs text-[var(--color-text-muted)]">{props.file.name} · {formatFileSize(props.file.size)}</p> : null}{props.isSaving ? <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"><div className="h-full bg-[var(--color-primary)] transition-[width]" style={{ width: `${props.uploadProgress}%` }} /></div> : null}</Field> : null}
        <Field label="Mô tả"><textarea rows={4} value={props.description} onChange={(event) => props.onDescriptionChange(event.target.value)} className={`${fieldClassName} h-auto min-h-28 py-2`} /></Field>
        {props.error ? <p className="text-sm font-medium text-[var(--color-danger)]" role="alert">{props.error}</p> : null}
        <div className="flex justify-end gap-2"><Button variant="secondary" disabled={props.isSaving} onClick={props.onClose}>Quay lại</Button><Button type="submit" disabled={props.isSaving}>{props.isSaving ? type === TaskEvidenceType.FILE ? `Đang tải ${props.uploadProgress}%` : 'Đang lưu...' : mode === 'EDIT' ? 'Lưu thay đổi' : 'Thêm minh chứng'}</Button></div>
      </form>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-2"><span className="text-sm font-medium text-[var(--color-text)]">{label}</span>{children}</label> }
function Meta({ label, value }: { label: string; value?: string | null }) { return <div className="min-w-0"><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">{label}</dt><dd className="mt-1 truncate font-medium text-[var(--color-text-strong)]" title={value ?? undefined}>{value || '-'}</dd></div> }
function StateMessage({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'danger' }) { return <div className={`mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] px-4 py-5 text-sm ${tone === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`}>{children}</div> }
function isValidHttpUrl(value: string) { try { const url = new URL(value.trim()); return url.protocol === 'http:' || url.protocol === 'https:' } catch { return false } }
function formatDateTime(value: string | null) { if (!value) return '-'; const date = new Date(value); if (Number.isNaN(date.getTime())) return value; return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date) }
