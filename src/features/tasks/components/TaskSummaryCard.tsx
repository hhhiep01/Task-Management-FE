import { Card } from '@/components/ui/Card'

type TaskSummaryCardProps = {
  label: string
  value: number
}

export function TaskSummaryCard({ label, value }: TaskSummaryCardProps) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
    </Card>
  )
}
