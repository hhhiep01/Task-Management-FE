import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Pagination'
import { env } from '@/config/env'
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations'
import { useWorkCategories } from '@/features/work-categories/hooks/useWorkCategories'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { usePagedListState } from '@/hooks/usePagedListState'

import {
  useCreateWorkTemplate,
  useDeleteWorkTemplate,
  useUpdateWorkTemplate,
  useWorkTemplates,
} from '../hooks/useWorkTemplates'
import { WorkType, getWorkTypeLabel, workTypeLabels } from '../types/workTemplate.types'
import type { WorkTemplate, WorkTemplatePayload } from '../types/workTemplate.types'

const initialForm: WorkTemplatePayload = {
  workCategoryId: '',
  name: '',
  expectedOutput: '',
  standardDeadline: '',
  workType: WorkType.REGULAR,
  baseScore: 0,
  difficultyPercent: 0,
  evidenceRequirement: '',
  isActive: true,
}

const filterKeys = ['workCategoryId', 'organizationId', 'workType', 'isActive'] as const

const fieldClassName =
  'h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 text-sm text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)]'

const textAreaClassName =
  'min-h-24 w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-3 py-2 text-sm leading-6 text-[var(--color-text-strong)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

type FormFieldErrors = Partial<
  Record<'workCategoryId' | 'name' | 'baseScore' | 'difficultyPercent', string>
>

function getFormFieldErrors(payload: WorkTemplatePayload): FormFieldErrors {
  const errors: FormFieldErrors = {}

  if (!payload.workCategoryId) {
    errors.workCategoryId = 'Vui lòng chọn nhóm công việc.'
  }

  if (!payload.name.trim()) {
    errors.name = 'Tên công việc không được để trống.'
  }

  if (payload.baseScore < 0) {
    errors.baseScore = 'Điểm chuẩn phải lớn hơn hoặc bằng 0.'
  }

  if (payload.difficultyPercent <= 0) {
    errors.difficultyPercent = 'Độ khó phải lớn hơn 0.'
  }

  return errors
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value)
}

function getWorkTypeVariant(workType: string) {
  return workType === WorkType.REGULAR ? ('info' as const) : ('neutral' as const)
}

function getStatusVariant(isActive: boolean) {
  return isActive ? ('success' as const) : ('neutral' as const)
}

export function WorkTemplatesPage() {
  useDocumentTitle('Quản lý danh mục công việc | ' + env.appName)

  const [form, setForm] = useState<WorkTemplatePayload>(initialForm)
  const [editingTemplate, setEditingTemplate] = useState<WorkTemplate | null>(null)
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  const listState = usePagedListState(filterKeys)
  const templatesQuery = useWorkTemplates({
    ...listState.query,
    isActive: listState.filters.isActive
      ? listState.filters.isActive === 'true'
      : undefined,
  })
  const categoriesQuery = useWorkCategories()
  const organizationsQuery = useOrganizations()
  const createTemplateMutation = useCreateWorkTemplate()
  const updateTemplateMutation = useUpdateWorkTemplate()
  const deleteTemplateMutation = useDeleteWorkTemplate()

  const templates = templatesQuery.data?.items ?? []
  const isSubmitting = createTemplateMutation.isPending || updateTemplateMutation.isPending
  const modalTitle = editingTemplate ? 'Chỉnh sửa công việc' : 'Thêm công việc'
  const fieldErrors = showFieldErrors ? getFormFieldErrors(form) : {}
  const formApiError = useMemo(() => {
    const error = createTemplateMutation.error || updateTemplateMutation.error
    return error instanceof Error ? error.message : ''
  }, [createTemplateMutation.error, updateTemplateMutation.error])
  const deleteError =
    deleteTemplateMutation.error instanceof Error ? deleteTemplateMutation.error.message : ''
  const secondaryFilterCount = filterKeys.reduce(
    (count, key) => count + (listState.filters[key] ? 1 : 0),
    0,
  )

  const normalizeWorkType = (value: string) =>
    value === WorkType.AD_HOC ? WorkType.AD_HOC : WorkType.REGULAR

  const resetMutations = () => {
    createTemplateMutation.reset()
    updateTemplateMutation.reset()
  }

  const closeModal = () => {
    setForm(initialForm)
    setEditingTemplate(null)
    setShowFieldErrors(false)
    resetMutations()
    setIsTemplateModalOpen(false)
  }

  const openCreateModal = () => {
    setForm(initialForm)
    setEditingTemplate(null)
    setShowFieldErrors(false)
    resetMutations()
    setIsTemplateModalOpen(true)
  }

  const openEditModal = (template: WorkTemplate) => {
    setEditingTemplate(template)
    setForm({
      workCategoryId: template.workCategory.id,
      name: template.name,
      expectedOutput: template.expectedOutput,
      standardDeadline: template.standardDeadline,
      workType: normalizeWorkType(template.workType),
      baseScore: template.baseScore,
      difficultyPercent: template.difficultyPercent,
      evidenceRequirement: template.evidenceRequirement,
      isActive: template.isActive,
    })
    setShowFieldErrors(false)
    resetMutations()
    setIsTemplateModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const payload: WorkTemplatePayload = {
      workCategoryId: form.workCategoryId,
      name: form.name.trim(),
      expectedOutput: form.expectedOutput.trim(),
      standardDeadline: form.standardDeadline.trim(),
      workType: form.workType,
      baseScore: Number(form.baseScore),
      difficultyPercent: Number(form.difficultyPercent),
      evidenceRequirement: form.evidenceRequirement.trim(),
      isActive: form.isActive,
    }
    const errors = getFormFieldErrors(payload)

    setShowFieldErrors(true)

    if (Object.keys(errors).length > 0) {
      return
    }

    try {
      if (editingTemplate) {
        await updateTemplateMutation.mutateAsync({
          templateId: editingTemplate.id,
          payload,
        })
      } else {
        await createTemplateMutation.mutateAsync(payload)
      }

      closeModal()
    } catch {
      return
    }
  }

  const handleDelete = async (template: WorkTemplate) => {
    const confirmed = window.confirm('Xóa công việc "' + template.name + '"?')

    if (!confirmed) {
      return
    }

    try {
      await deleteTemplateMutation.mutateAsync(template.id)
    } catch {
      return
    }
  }

  const columns: DataTableColumn<WorkTemplate>[] = [
    {
      key: 'name',
      header: 'Tên công việc',
      className: 'min-w-72 max-w-96',
      render: (template) => (
        <div className="min-w-0">
          <p
            className="line-clamp-2 font-semibold leading-5 text-[var(--color-text-strong)]"
            title={template.name}
          >
            {template.name}
          </p>
          {template.expectedOutput ? (
            <p
              className="mt-1 max-w-80 truncate text-xs text-[var(--color-text-muted)]"
              title={template.expectedOutput}
            >
              {template.expectedOutput}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Nhóm công việc',
      className: 'min-w-52 text-[var(--color-text)]',
      render: (template) => (
        <span className="line-clamp-2" title={template.workCategory.name}>
          {template.workCategory.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Loại',
      className: 'whitespace-nowrap',
      render: (template) => (
        <Badge variant={getWorkTypeVariant(template.workType)}>
          {getWorkTypeLabel(template.workType)}
        </Badge>
      ),
    },
    {
      key: 'baseScore',
      header: 'Điểm chuẩn',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap text-right font-medium tabular-nums text-[var(--color-text)]',
      render: (template) => formatNumber(template.baseScore),
    },
    {
      key: 'difficulty',
      header: 'Độ khó',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap text-right font-medium tabular-nums',
      render: (template) => (
        <span
          className={
            template.difficultyPercent > 100
              ? 'text-[var(--color-primary)]'
              : 'text-[var(--color-text)]'
          }
        >
          {formatNumber(template.difficultyPercent)}%
        </span>
      ),
    },
    {
      key: 'deadline',
      header: 'Thời hạn chuẩn',
      className: 'min-w-36 text-[var(--color-text-muted)]',
      render: (template) => template.standardDeadline || '-',
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'whitespace-nowrap',
      render: (template) => (
        <Badge variant={getStatusVariant(template.isActive)}>
          {template.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Thao tác',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap',
      render: (template) => (
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => openEditModal(template)}
          >
            Sửa
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => void handleDelete(template)}
            disabled={deleteTemplateMutation.isPending}
          >
            Xóa
          </Button>
        </div>
      ),
    },
  ]

  return (
    <section className="grid w-full min-w-0 max-w-full gap-6">
      <PageHeader
        eyebrow="Quản lý"
        title="Quản lý danh mục công việc"
        description="Quản lý các công việc chuẩn dùng để giao việc và đánh giá KPI."
        actions={
          <div className="hidden md:block">
            <Button type="button" onClick={openCreateModal}>
              + Thêm công việc
            </Button>
          </div>
        }
      />

      <Card variant="flat" className="w-full min-w-0 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(280px,2fr)_auto] md:items-end">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Tìm kiếm</span>
            <input
              type="search"
              value={listState.searchInput}
              onChange={(event) => listState.setSearchInput(event.target.value)}
              className={fieldClassName}
              placeholder="Tìm theo tên hoặc mã công việc..."
            />
          </label>

          <div className="flex items-center justify-between gap-2 md:hidden">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              aria-expanded={isMobileFiltersOpen}
              aria-controls="work-template-filters"
              onClick={() => setIsMobileFiltersOpen((current) => !current)}
            >
              Bộ lọc{secondaryFilterCount ? ' (' + secondaryFilterCount + ')' : ''}
            </Button>
            <Button type="button" className="flex-1" onClick={openCreateModal}>
              + Thêm
            </Button>
          </div>
        </div>

        <div
          id="work-template-filters"
          className={
            (isMobileFiltersOpen ? 'grid' : 'hidden') +
            ' mt-4 gap-3 md:grid md:grid-cols-2 xl:grid-cols-[repeat(4,minmax(150px,1fr))_auto] xl:items-end'
          }
        >
          <FilterSelect
            label="Nhóm công việc"
            value={listState.filters.workCategoryId}
            onChange={(value) => listState.setFilter('workCategoryId', value)}
            options={
              categoriesQuery.data?.items.map((item) => ({
                value: item.id,
                label: item.name,
              })) ?? []
            }
          />
          <FilterSelect
            label="Phòng ban"
            value={listState.filters.organizationId}
            onChange={(value) => listState.setFilter('organizationId', value)}
            options={
              organizationsQuery.data?.items.map((item) => ({
                value: item.id,
                label: item.name,
              })) ?? []
            }
          />
          <FilterSelect
            label="Loại công việc"
            value={listState.filters.workType}
            onChange={(value) => listState.setFilter('workType', value)}
            options={Object.values(WorkType).map((value) => ({
              value,
              label: workTypeLabels[value],
            }))}
          />
          <FilterSelect
            label="Trạng thái"
            value={listState.filters.isActive}
            onChange={(value) => listState.setFilter('isActive', value)}
            options={[
              { value: 'true', label: 'Đang hoạt động' },
              { value: 'false', label: 'Ngừng hoạt động' },
            ]}
          />
          {listState.hasActiveFilters ? (
            <Button type="button" variant="link" size="sm" onClick={listState.clearFilters}>
              Xóa bộ lọc
            </Button>
          ) : null}
        </div>
      </Card>

      {deleteError ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm font-medium text-[var(--color-danger)]"
        >
          {deleteError}
        </p>
      ) : null}

      {templatesQuery.isLoading ? (
        <CatalogLoadingState />
      ) : templatesQuery.isError ? (
        <CatalogState
          title="Không thể tải danh mục công việc"
          description="Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => void templatesQuery.refetch()}
              disabled={templatesQuery.isFetching}
            >
              {templatesQuery.isFetching ? 'Đang tải...' : 'Thử lại'}
            </Button>
          }
        />
      ) : templates.length ? (
        <>
          <div
            className={
              'hidden min-w-0 max-w-full transition-opacity lg:block ' +
              (templatesQuery.isFetching ? 'opacity-70' : '')
            }
            aria-busy={templatesQuery.isFetching}
          >
            <DataTable
              title="Danh sách công việc"
              items={templates}
              columns={columns}
              getRowKey={(template) => template.id}
              countLabel={(templatesQuery.data?.totalCount ?? 0) + ' công việc'}
              minWidthClassName="min-w-[1120px]"
              rowClassName="transition-colors duration-150 hover:bg-[var(--color-surface-subtle)]"
            />
          </div>

          <div
            className={
              'grid gap-3 transition-opacity lg:hidden ' +
              (templatesQuery.isFetching ? 'opacity-70' : '')
            }
            aria-busy={templatesQuery.isFetching}
          >
            {templates.map((template) => (
              <WorkTemplateMobileCard
                key={template.id}
                template={template}
                onEdit={openEditModal}
                onDelete={handleDelete}
                isDeleting={deleteTemplateMutation.isPending}
              />
            ))}
          </div>

          {templatesQuery.data ? (
            <Card className="overflow-hidden">
              <Pagination
                {...templatesQuery.data}
                onPageChange={listState.setPageNumber}
                onPageSizeChange={listState.setPageSize}
                disabled={templatesQuery.isFetching}
              />
            </Card>
          ) : null}
        </>
      ) : listState.hasActiveFilters ? (
        <CatalogState
          title="Không tìm thấy công việc phù hợp"
          description="Thử thay đổi từ khóa hoặc bộ lọc."
          action={
            <Button type="button" variant="secondary" onClick={listState.clearFilters}>
              Xóa bộ lọc
            </Button>
          }
        />
      ) : (
        <CatalogState
          title="Chưa có công việc trong danh mục"
          description="Hãy thêm công việc chuẩn đầu tiên để sử dụng khi giao việc."
          action={
            <Button type="button" onClick={openCreateModal}>
              + Thêm công việc
            </Button>
          }
        />
      )}

      <Modal
        open={isTemplateModalOpen}
        onClose={closeModal}
        title={modalTitle}
        description="Thiết lập thông tin công việc chuẩn dùng khi giao việc và đánh giá."
        size="xl"
        mobileFullscreen
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="work-template-form"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Đang lưu...'
                : editingTemplate
                  ? 'Lưu thay đổi'
                  : 'Thêm công việc'}
            </Button>
          </>
        }
      >
        <form
          id="work-template-form"
          className="mx-auto grid w-full max-w-4xl gap-5"
          onSubmit={handleSubmit}
          noValidate
        >
          <FormSection title="Thông tin công việc">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                id="work-category"
                label="Nhóm công việc"
                required
                error={fieldErrors.workCategoryId}
              >
                <select
                  id="work-category"
                  value={form.workCategoryId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      workCategoryId: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  aria-invalid={Boolean(fieldErrors.workCategoryId)}
                  aria-describedby={
                    fieldErrors.workCategoryId ? 'work-category-error' : undefined
                  }
                >
                  <option value="">Chọn nhóm công việc</option>
                  {categoriesQuery.data?.items.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                id="work-type"
                label="Loại công việc"
                required
              >
                <select
                  id="work-type"
                  value={form.workType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      workType: normalizeWorkType(event.target.value),
                    }))
                  }
                  className={fieldClassName}
                >
                  <option value={WorkType.REGULAR}>
                    {workTypeLabels[WorkType.REGULAR]}
                  </option>
                  <option value={WorkType.AD_HOC}>
                    {workTypeLabels[WorkType.AD_HOC]}
                  </option>
                </select>
              </FormField>

              <FormField
                id="work-name"
                label="Tên công việc"
                required
                error={fieldErrors.name}
                className="md:col-span-2"
              >
                <input
                  id="work-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className={fieldClassName}
                  placeholder="Ví dụ: Quản lý, vận hành các bến thủy nội địa"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'work-name-error' : undefined}
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Yêu cầu thực hiện">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                id="expected-output"
                label="Kết quả đầu ra"
                helper="Mô tả kết quả cần đạt khi hoàn thành công việc."
                className="md:col-span-2"
              >
                <textarea
                  id="expected-output"
                  value={form.expectedOutput}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      expectedOutput: event.target.value,
                    }))
                  }
                  className={textAreaClassName}
                  placeholder="Mô tả ngắn gọn kết quả cần đạt"
                />
              </FormField>

              <FormField id="standard-deadline" label="Thời hạn chuẩn">
                <input
                  id="standard-deadline"
                  value={form.standardDeadline}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      standardDeadline: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  placeholder="Ví dụ: 3 ngày hoặc Theo quý"
                />
              </FormField>

              <FormField
                id="evidence-requirement"
                label="Yêu cầu minh chứng"
                helper="Ví dụ: văn bản, báo cáo, hình ảnh hoặc đường dẫn tài liệu."
              >
                <textarea
                  id="evidence-requirement"
                  value={form.evidenceRequirement}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      evidenceRequirement: event.target.value,
                    }))
                  }
                  className={textAreaClassName}
                  placeholder="Nêu các minh chứng cần cung cấp"
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Thiết lập đánh giá">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                id="base-score"
                label="Điểm chuẩn"
                required
                helper="Điểm cơ sở dùng để tính điểm thực hiện."
                error={fieldErrors.baseScore}
              >
                <input
                  id="base-score"
                  type="number"
                  min={0}
                  step="any"
                  value={form.baseScore}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      baseScore: Number(event.target.value),
                    }))
                  }
                  className={fieldClassName}
                  aria-invalid={Boolean(fieldErrors.baseScore)}
                  aria-describedby={fieldErrors.baseScore ? 'base-score-error' : undefined}
                />
              </FormField>

              <FormField
                id="difficulty-percent"
                label="Độ khó (%)"
                required
                helper="100% là mức chuẩn. Ví dụ: 110% hoặc 120% cho công việc có độ khó cao hơn."
                error={fieldErrors.difficultyPercent}
              >
                <input
                  id="difficulty-percent"
                  type="number"
                  min={1}
                  step="any"
                  value={form.difficultyPercent}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      difficultyPercent: Number(event.target.value),
                    }))
                  }
                  className={fieldClassName}
                  aria-invalid={Boolean(fieldErrors.difficultyPercent)}
                  aria-describedby={
                    fieldErrors.difficultyPercent ? 'difficulty-percent-error' : undefined
                  }
                />
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Trạng thái">
            <label
              htmlFor="is-active"
              className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3"
            >
              <input
                id="is-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-strong)] accent-[var(--color-primary)]"
              />
              <span>
                <span className="block text-sm font-semibold text-[var(--color-text-strong)]">
                  Đang hoạt động
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--color-text-muted)]">
                  Công việc đang hoạt động có thể được sử dụng khi giao việc.
                </span>
              </span>
            </label>
          </FormSection>

          {categoriesQuery.isError ? (
            <p className="rounded-[var(--radius-md)] bg-[var(--color-warning-soft)] px-3 py-2 text-sm text-[var(--color-warning)]">
              Không tải được danh sách nhóm công việc.
            </p>
          ) : null}

          {formApiError ? (
            <p
              role="alert"
              className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-[var(--color-danger)]"
            >
              {formApiError}
            </p>
          ) : null}
        </form>
      </Modal>
    </section>
  )
}

type FilterSelectProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[var(--color-text)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={
          fieldClassName +
          (value
            ? ' border-[var(--color-primary)] bg-[var(--color-primary-subtle)]'
            : '')
        }
      >
        <option value="">Tất cả</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

type FormFieldProps = {
  id: string
  label: string
  children: ReactNode
  required?: boolean
  helper?: string
  error?: string
  className?: string
}

function FormField({
  id,
  label,
  children,
  required = false,
  helper,
  error,
  className = '',
}: FormFieldProps) {
  return (
    <div className={'grid content-start gap-2 ' + className}>
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-text)]">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="text-[var(--color-danger)]">
              {' '}*
            </span>
            <span className="sr-only"> (bắt buộc)</span>
          </>
        ) : null}
      </label>
      {children}
      {helper ? (
        <p className="text-xs leading-5 text-[var(--color-text-muted)]">{helper}</p>
      ) : null}
      {error ? (
        <p id={id + '-error'} className="text-xs font-medium text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">{title}</h3>
      {children}
    </section>
  )
}

type MobileCardProps = {
  template: WorkTemplate
  onEdit: (template: WorkTemplate) => void
  onDelete: (template: WorkTemplate) => Promise<void>
  isDeleting: boolean
}

function WorkTemplateMobileCard({
  template,
  onEdit,
  onDelete,
  isDeleting,
}: MobileCardProps) {
  return (
    <Card className="grid gap-4 p-4">
      <div className="min-w-0">
        <h2
          className="line-clamp-2 font-semibold leading-5 text-[var(--color-text-strong)]"
          title={template.name}
        >
          {template.name}
        </h2>
        <p
          className="mt-1.5 line-clamp-2 text-sm leading-5 text-[var(--color-text-muted)]"
          title={template.workCategory.name}
        >
          {template.workCategory.name}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={getWorkTypeVariant(template.workType)}>
          {getWorkTypeLabel(template.workType)}
        </Badge>
        <Badge variant={getStatusVariant(template.isActive)}>
          {template.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
        </Badge>
      </div>

      <dl className="grid grid-cols-3 gap-3 border-y border-[var(--color-border)] py-3 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-[var(--color-text-muted)]">Điểm chuẩn</dt>
          <dd className="mt-1 font-semibold tabular-nums text-[var(--color-text-strong)]">
            {formatNumber(template.baseScore)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-[var(--color-text-muted)]">Độ khó</dt>
          <dd className="mt-1 font-semibold tabular-nums text-[var(--color-text-strong)]">
            {formatNumber(template.difficultyPercent)}%
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-[var(--color-text-muted)]">Thời hạn</dt>
          <dd
            className="mt-1 truncate font-medium text-[var(--color-text)]"
            title={template.standardDeadline || undefined}
          >
            {template.standardDeadline || '-'}
          </dd>
        </div>
      </dl>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onEdit(template)}
        >
          Sửa
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => void onDelete(template)}
          disabled={isDeleting}
        >
          Xóa
        </Button>
      </div>
    </Card>
  )
}

function CatalogState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="grid min-h-56 place-items-center px-5 py-10 text-center">
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-[var(--color-text-strong)]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </Card>
  )
}

function CatalogLoadingState() {
  return (
    <div aria-busy="true" aria-label="Đang tải danh mục công việc">
      <span className="sr-only">Đang tải danh mục công việc...</span>

      <Card className="hidden overflow-hidden lg:block">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <SkeletonBar className="h-5 w-40" />
          <SkeletonBar className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-[2fr_1.4fr_repeat(5,0.8fr)_1fr] gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 py-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBar key={index} className="h-3 w-full" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-[2fr_1.4fr_repeat(5,0.8fr)_1fr] gap-4 border-b border-[var(--color-border)] px-4 py-4 last:border-b-0"
          >
            {Array.from({ length: 8 }).map((_, cellIndex) => (
              <SkeletonBar
                key={cellIndex}
                className={cellIndex === 0 ? 'h-8 w-full' : 'h-5 w-full'}
              />
            ))}
          </div>
        ))}
      </Card>

      <div className="grid gap-3 lg:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="grid gap-4 p-4">
            <SkeletonBar className="h-5 w-4/5" />
            <SkeletonBar className="h-4 w-3/5" />
            <div className="flex gap-2">
              <SkeletonBar className="h-6 w-24 rounded-full" />
              <SkeletonBar className="h-6 w-28 rounded-full" />
            </div>
            <SkeletonBar className="h-14 w-full" />
          </Card>
        ))}
      </div>
    </div>
  )
}

function SkeletonBar({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={'animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] ' + className}
    />
  )
}
