import type { Task, TaskSummary } from '../types/task.types'

export const taskSummaries: TaskSummary[] = [
  { label: 'Backlog', value: 8 },
  { label: 'In progress', value: 4 },
  { label: 'Done', value: 12 },
]

export const recentTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Design task board layout',
    owner: 'Hiep',
    status: 'In progress',
    due: 'Today',
  },
  {
    id: 'task-2',
    title: 'Connect authentication API',
    owner: 'FE team',
    status: 'Planned',
    due: 'Tomorrow',
  },
  {
    id: 'task-3',
    title: 'Prepare sprint demo',
    owner: 'Product',
    status: 'Review',
    due: 'Friday',
  },
]
