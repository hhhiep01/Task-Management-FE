import { Card } from '@/components/ui/Card'
import { env } from '@/config/env'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function AdminPage() {
  useDocumentTitle(`Admin | ${env.appName}`)

  return (
    <section>
      <p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">
        Admin page
      </p>
      <h1 className="mt-2 text-4xl font-bold text-slate-950">System administration</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Admin can manage users, roles, system settings, and workspace-wide data.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">User permissions</h2>
          <p className="mt-2 text-slate-600">Create accounts and assign access roles.</p>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-950">System settings</h2>
          <p className="mt-2 text-slate-600">Configure global behavior for the app.</p>
        </Card>
      </div>
    </section>
  )
}
