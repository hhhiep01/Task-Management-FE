import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useOrganizations } from '@/features/organizations/hooks/useOrganizations'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { formatDate } from '@/utils/formatDate'

import {
  useCreateWorkCategory,
  useDeleteWorkCategory,
  useUpdateWorkCategory,
  useWorkCategories,
} from '../hooks/useWorkCategories'
import type { WorkCategory, WorkCategoryPayload } from '../types/workCategory.types'

const initialForm: WorkCategoryPayload = {
  organizationId: '',
  code: '',
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
}

export function WorkCategoriesPage() {
  useDocumentTitle(`Quản lý nhóm công việc | ${env.appName}`)

  const [form, setForm] = useState<WorkCategoryPayload>(initialForm)
  const [editingCategory, setEditingCategory] = useState<WorkCategory | null>(null)
  const [formError, setFormError] = useState('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  const categoriesQuery = useWorkCategories()
  const organizationsQuery = useOrganizations()
  const createCategoryMutation = useCreateWorkCategory()
  const updateCategoryMutation = useUpdateWorkCategory()
  const deleteCategoryMutation = useDeleteWorkCategory()

  const isSubmitting = createCategoryMutation.isPending || updateCategoryMutation.isPending
  const modalTitle = editingCategory ? 'Cập nhật nhóm công việc' : 'Tạo nhóm công việc'
  const formApiError = useMemo(() => {
    const error = createCategoryMutation.error || updateCategoryMutation.error
    return error instanceof Error ? error.message : ''
  }, [createCategoryMutation.error, updateCategoryMutation.error])
  const deleteError =
    deleteCategoryMutation.error instanceof Error ? deleteCategoryMutation.error.message : ''

  const closeModal = () => {
    setForm(initialForm)
    setEditingCategory(null)
    setFormError('')
    setIsCategoryModalOpen(false)
  }

  const openCreateModal = () => {
    setForm(initialForm)
    setEditingCategory(null)
    setFormError('')
    setIsCategoryModalOpen(true)
  }

  const openEditModal = (category: WorkCategory) => {
    setEditingCategory(category)
    setForm({
      organizationId: category.organization.id,
      code: category.code,
      name: category.name,
      description: category.description,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    })
    setFormError('')
    setIsCategoryModalOpen(true)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const payload = {
      organizationId: form.organizationId,
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    }

    if (!payload.organizationId || !payload.code || !payload.name) {
      setFormError('Vui lòng nhập đầy đủ phòng ban, mã nhóm và tên nhóm công việc.')
      return
    }

    if (payload.sortOrder < 0) {
      setFormError('Thứ tự sắp xếp không được âm.')
      return
    }

    setFormError('')

    if (editingCategory) {
      await updateCategoryMutation.mutateAsync({
        categoryId: editingCategory.id,
        payload,
      })
    } else {
      await createCategoryMutation.mutateAsync(payload)
    }

    closeModal()
  }

  const handleDelete = async (category: WorkCategory) => {
    const confirmed = window.confirm(`Xóa nhóm công việc "${category.name}"?`)

    if (!confirmed) {
      return
    }

    await deleteCategoryMutation.mutateAsync(category.id)
  }

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
            Trưởng phòng
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Quản lý nhóm công việc</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Tạo, cập nhật và sắp xếp các nhóm công việc theo từng phòng ban.
          </p>
        </div>

        <Button type="button" onClick={openCreateModal}>
          Tạo nhóm công việc
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Danh sách nhóm công việc</h2>
          {categoriesQuery.data?.length ? (
            <span className="text-sm font-medium text-slate-500">
              {categoriesQuery.data.length} nhóm
            </span>
          ) : null}
        </div>

        {deleteError && (
          <p className="mx-5 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {deleteError}
          </p>
        )}

        {categoriesQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-600">Đang tải nhóm công việc...</p>
        ) : categoriesQuery.isError ? (
          <p className="px-5 py-6 text-sm text-red-700">
            Không tải được danh sách nhóm công việc.
          </p>
        ) : categoriesQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Mã nhóm</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Tên nhóm</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Phòng ban</th>
                  <th className="min-w-64 px-5 py-3 font-semibold">Mô tả</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Thứ tự</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="whitespace-nowrap px-5 py-3 font-semibold">Ngày tạo</th>
                  <th className="whitespace-nowrap px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categoriesQuery.data.map((category) => (
                  <tr key={category.id} className="bg-white">
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-950">{category.code}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-700">{category.name}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{category.organization.name}</td>
                    <td className="min-w-64 whitespace-normal px-5 py-4 text-slate-600">{category.description || '-'}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{category.sortOrder}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {category.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                      {formatDate(category.createdDate)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(category)}
                          disabled={deleteCategoryMutation.isPending}
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
            Chưa có nhóm công việc nào.
            <button
              type="button"
              onClick={openCreateModal}
              className="ml-2 font-semibold text-cyan-700 hover:text-cyan-800"
            >
              Tạo nhóm công việc đầu tiên
            </button>
          </div>
        )}
      </Card>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
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

            <form className="grid gap-4 p-5" onSubmit={handleSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Phòng ban</span>
                <select
                  value={form.organizationId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, organizationId: event.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                >
                  <option value="">Chọn phòng ban</option>
                  {organizationsQuery.data?.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Mã nhóm</span>
                  <input
                    value={form.code}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, code: event.target.value }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                    placeholder="INFRA"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Tên nhóm</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, name: event.target.value }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                    placeholder="Quản lý hạ tầng"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700">Mô tả</span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
                  placeholder="Mô tả nhóm công việc"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700">Thứ tự sắp xếp</span>
                  <input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sortOrder: Math.max(0, Number(event.target.value)),
                      }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
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

              {organizationsQuery.isError && (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Không tải được danh sách phòng ban.
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
                    : editingCategory
                      ? 'Lưu thay đổi'
                      : 'Tạo nhóm'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
