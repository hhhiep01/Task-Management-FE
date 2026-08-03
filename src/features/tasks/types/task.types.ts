export type TaskStatus = 'Planned' | 'In progress' | 'Review' | 'Done'

export type Task = {
  id: string
  title: string
  owner: string
  status: TaskStatus
  due: string
}

export type TaskSummary = {
  label: string
  value: number
}
