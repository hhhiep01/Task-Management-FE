import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useWorkCategories } from '@/features/work-categories/hooks/useWorkCategories'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/utils/formatDate'

import {
  useCreateWorkTemplate,
  useDeleteWorkTemplate,
  useUpdateWorkTemplate,
  useWorkTemplates,
} from '../hooks/useWorkTemplates'
import type { WorkTemplate, WorkTemplatePayload } from '../types/workTemplate.types'

const initialForm: WorkTemplatePayload = {
  workCategoryId: '',
  name: '',
  expectedOutput: '',
  standardDeadline: '',
  workType: '',
  baseScore: 0,
  difficultyPercent: 0,
  evidenceRequirement: '',
  isActive: true,
}

export function WorkTemplatesPage() {
  useDocumentTitle(`Quản lý danh mục công việc | ${env.appName}`)

  const [form, setForm] = useState<WorkTemplatePayload>(initialForm)
  const [editingTemplate, setEditingTemplate] = useState<WorkTemplate | null>(null)
  const [formError, setFormError] = useState('')
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

  const templatesQuery = useWorkTemplates()
  const categoriesQuery = useWorkCategories()
  const createTemplateMutation = useCreateWorkTemplate()
  const updateTemplateMutation = useUpdateWorkTemplate()
  const deleteTemplateMutation = useDeleteWorkTemplate()

  const isSubmitting = createTemplateMutation.isPending || updateTemplateMutation.isPending
  const modalTitle = editingTemplate ? 'Cập nhật danh mục công việc' : 'Tạo danh mục công việc'
  const formApiError = useMemo(() => {
    const error = createTemplateMutation.error || updateTemplateMutation.error
    return error instanceof Error ? error.message : ''
  }, [createTemplateMutation.error, updateTemplateMutation.error])
  const deleteError =
    deleteTemplateMutation.error instanceof Error ? deleteTemplateMutation.error.message : ''

  const closeModal = () => {
    setForm(initialForm)
    setEditingTemplate(null)
    setFormError('')
    setIsTemplateModalOpen(false)
  }

  const openCreateModal = () => {
    setForm(initialForm)
    setEditingTemplate(null)
    setFormError('')
    setIsTemplateModalOpen(true)
  }

  const openEditModal = (template: WorkTemplate) => {
    setEditingTemplate(template)
    setForm({
      workCategoryId: template.workCategory.id,
      name: template.name,
      expectedOutput: template.expectedOutput,
      standardDeadline: template.standardDeadline,
      workType: template.workType,
      baseScore: template.baseScore,
      difficultyPercent: template.difficultyPercent,
      evidenceRequirement: template.evidenceRequirement,
      isActive: template.isActive,
    })
    setFormError('')
    setIsTemplateModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      workCategoryId: form.workCategoryId,
      name: form.name.trim(),
      expectedOutput: form.expectedOutput.trim(),
      standardDeadline: form.standardDeadline.trim(),
      workType: form.workType.trim(),
      baseScore: Number(form.baseScore),
      difficultyPercent: Number(form.difficultyPercent),
      evidenceRequirement: form.evidenceRequirement.trim(),
      isActive: form.isActive,
    }

    if (!payload.workCategoryId || !payload.name) {
      setFormError('Vui lòng chọn nhóm công việc và nhập tên danh mục công việc.')
      return
    }

    if (payload.baseScore < 0) {
      setFormError('Điểm cơ bản không được âm.')
      return
    }

    if (payload.difficultyPercent < 0 || payload.difficultyPercent > 100) {
      setFormError('Tỷ lệ độ khó phải nằm trong khoảng 0 đến 100.')
      return
    }

    setFormError('')

    if (editingTemplate) {
      await updateTemplateMutation.mutateAsync({
        templateId: editingTemplate.id,
        payload,
      })
    } else {
      await createTemplateMutation.mutateAsync(payload)
    }

    closeModal()
  }

  const handleDelete = async (template: WorkTemplate) => {
    const confirmed = window.confirm(`Xóa danh mục công việc "${template.name}"?`)

    if (!confirmed) {
      return
    }

    await deleteTemplateMutation.mutateAsync(template.id)
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
            Trưởng phòng
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Quản lý danh mục công việc</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Tạo, cập nhật và quản lý các danh mục công việc theo nhóm công việc.
          </p>
        </div>

        <Button type="button" onClick={openCreateModal}>
          Tạo danh mục công việc
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Danh sách danh mục công việc</h2>
          {templatesQuery.data?.length ? (
            <span className="text-sm font-medium text-slate-500">
              {templatesQuery.data.length} danh mục
            </span>
          ) : null}
        </div>

        {deleteError && (
          <p className="mx-5 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        {templatesQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-600">Đang tải danh mục công việc...</p>
        ) : templatesQuery.isError ? (
          <p className="px-5 py-6 text-sm text-red-700">
            Không tải được danh sách danh mục công việc.
          </p>
        ) : templatesQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tên công việc</th>
                  <th className="px-5 py-3 font-semibold">Nhóm công việc</th>
                  <th className="px-5 py-3 font-semibold">Loại công việc</th>
                  <th className="px-5 py-3 font-semibold">Kết quả mong đợi</th>
                  <th className="px-5 py-3 font-semibold">Hạn chuẩn</th>
                  <th className="px-5 py-3 font-semibold">Điểm</th>
                  <th className="px-5 py-3 font-semibold">Độ khó</th>
                  <th className="px-5 py-3 font-semibold">Minh chứng</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {templatesQuery.data.map((template) => (
                  <tr key={template.id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-950">{template.name}</td>
                    <td className="px-5 py-4 text-slate-700">{template.workCategory.name}</td>
                    <td className="px-5 py-4 text-slate-600">{template.workType || '-'}</td>
                    <td className="px-5 py-4 text-slate-600">{template.expectedOutput || '-'}</td>
                    <td className="px-5 py-4 text-slate-600">{template.standardDeadline || '-'}</td>
                    <td className="px-5 py-4 text-slate-600">{template.baseScore}</td>
                    <td className="px-5 py-4 text-slate-600">{template.difficultyPercent}%</td>
                    <td className="px-5 py-4 text-slate-600">
                      {template.evidenceRequirement || '-'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {template.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(template.createdDate)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(template)}
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(template)}
                          disabled={deleteTemplateMutation.isPending}
                          className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-8 text-sm text-slate-600">
            Chưa có danh mục công việc nào.
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-2 font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Tạo danh mục đầu tiên
            </button>
          </div>
        )}
      </Card>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-950">{modalTitle}</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md px-2 py-1 text-xl leading-none text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Đóng"
              >
                x
              </button>
            </div>

            <form className="grid max-h-[calc(100vh-120px)] gap-4 overflow-y-auto p-5" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Nhóm công việc</span>
                <select
                  value={form.workCategoryId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, workCategoryId: event.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Chọn nhóm công việc</option>
                  {categoriesQuery.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Tên công việc</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Kiểm tra hệ thống định kỳ"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Loại công việc</span>
                  <input
                    value={form.workType}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, workType: event.target.value }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Định kỳ"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Kết quả mong đợi</span>
                <textarea
                  value={form.expectedOutput}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, expectedOutput: event.target.value }))
                  }
                  className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Mô tả kết quả cần đạt"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Yêu cầu minh chứng</span>
                <textarea
                  value={form.evidenceRequirement}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, evidenceRequirement: event.target.value }))
                  }
                  className="min-h-20 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Ví dụ: biên bản, hình ảnh, file báo cáo"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Hạn chuẩn</span>
                  <input
                    value={form.standardDeadline}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, standardDeadline: event.target.value }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Ví dụ: 3 ngày"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Trạng thái</span>
                  <select
                    value={String(form.isActive)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.value === 'true',
                      }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  >
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Ngừng hoạt động</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Điểm cơ bản</span>
                  <input
                    type="number"
                    min={0}
                    value={form.baseScore}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        baseScore: Math.max(0, Number(event.target.value)),
                      }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Tỷ lệ độ khó (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.difficultyPercent}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        difficultyPercent: clampPercent(Number(event.target.value)),
                      }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  />
                </label>
              </div>

              {categoriesQuery.isError && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Không tải được danh sách nhóm công việc.
                </p>
              )}

              {(formError || formApiError) && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError || formApiError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Hủy
                </button>
                <Button type="submit" disabled={isSubmitting} className="disabled:opacity-60">
                  {isSubmitting
                    ? 'Đang lưu...'
                    : editingTemplate
                      ? 'Lưu thay đổi'
                      : 'Tạo danh mục'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value))
}
