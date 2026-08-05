import { useState } from 'react'

import { Card } from '@/components/ui/Card'
import { getWorkTypeLabel } from '@/features/work-templates/types/workTemplate.types'
import { formatDate } from '@/utils/formatDate'

import { useMyTasks } from '../hooks/useTasks'
import type { Task } from '../types/task.types'
import { getTaskStatusLabel } from '../types/task.types'

export function MyTasksPanel() {
  const myTasksQuery = useMyTasks()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  return (
    <>
      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-semibold text-slate-950">Công việc của tôi</h2>
          {myTasksQuery.data?.length ? (
            <span className="text-sm font-medium text-slate-500">
              {myTasksQuery.data.length} công việc
            </span>
          ) : null}
        </div>

        {myTasksQuery.isLoading ? (
          <p className="px-5 py-6 text-sm text-slate-600">Đang tải công việc...</p>
        ) : myTasksQuery.isError ? (
          <p className="px-5 py-6 text-sm text-red-700">
            {myTasksQuery.error instanceof Error
              ? myTasksQuery.error.message
              : 'Không tải được danh sách công việc.'}
          </p>
        ) : myTasksQuery.data?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] whitespace-nowrap text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tên công việc</th>
                  <th className="px-5 py-3 font-semibold">Người giao</th>
                  <th className="px-5 py-3 font-semibold">Kỳ đánh giá</th>
                  <th className="px-5 py-3 font-semibold">Danh mục</th>
                  <th className="px-5 py-3 font-semibold">Ngày giao</th>
                  <th className="px-5 py-3 font-semibold">Hạn hoàn thành</th>
                  <th className="px-5 py-3 font-semibold">Tiến độ</th>
                  <th className="px-5 py-3 font-semibold">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {myTasksQuery.data.map((task) => (
                  <tr key={task.id} className="bg-white">
                    <td className="px-5 py-4 font-semibold text-slate-950">{task.title}</td>
                    <td className="px-5 py-4 text-slate-700">
                      {task.assigner?.fullName ?? '-'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{task.period?.name ?? '-'}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {task.workTemplate?.name ?? '-'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(task.assignedDate)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(task.dueDate)}</td>
                    <td className="px-5 py-4 text-slate-600">{task.progressPercent ?? 0}%</td>
                    <td className="px-5 py-4 text-slate-600">
                      {getTaskStatusLabel(task.status)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTask(task)}
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-5 py-6 text-sm text-slate-600">Bạn chưa có công việc nào.</p>
        )}
      </Card>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  )
}

type TaskDetailModalProps = {
  task: Task
  onClose: () => void
}

function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{task.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {task.workTemplate?.name ?? 'Không có danh mục'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>

        <div className="grid gap-5 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="Người giao" value={task.assigner?.fullName} />
            <DetailItem label="Người nhận" value={task.assignee?.fullName} />
            <DetailItem label="Kỳ đánh giá" value={task.period?.name} />
            <DetailItem label="Phòng ban" value={task.period?.organization?.name} />
            <DetailItem label="Ngày giao" value={formatDate(task.assignedDate)} />
            <DetailItem label="Hạn hoàn thành" value={formatDate(task.dueDate)} />
            <DetailItem label="Ngày hoàn thành" value={formatDate(task.completedDate)} />
            <DetailItem label="Trạng thái" value={getTaskStatusLabel(task.status)} />
            <DetailItem label="Tiến độ" value={`${task.progressPercent ?? 0}%`} />
            <DetailItem label="Điểm cơ bản" value={task.baseScore} />
            <DetailItem label="Độ khó" value={`${task.difficultyPercent ?? 0}%`} />
            <DetailItem label="Loại công việc" value={getWorkTypeLabel(task.workType)} />
          </div>

          <DetailBlock label="Mô tả" value={task.description} />
          <DetailBlock label="Kết quả mong đợi" value={task.expectedOutput} />
          <DetailBlock label="Mô tả kết quả" value={task.resultDescription} />
          <DetailBlock label="Yêu cầu minh chứng" value={task.workTemplate?.evidenceRequirement} />
        </div>
      </div>
    </div>
  )
}

type DetailItemProps = {
  label: string
  value?: string | number | null
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value || '-'}</p>
    </div>
  )
}

function DetailBlock({ label, value }: DetailItemProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-2 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800">
        {value || '-'}
      </p>
    </div>
  )
}
