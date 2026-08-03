# Task Management FE

Frontend project using React, TypeScript, Vite, and Tailwind CSS.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- TanStack Query
- Oxlint

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Environment

Create `.env` from `.env.example` when the project needs runtime config:

```bash
VITE_APP_NAME=Task Management FE
VITE_API_BASE_URL=http://localhost:3000
```

## Folder Structure

```text
src/
  app/                 App root, providers, routes
  assets/              Static assets imported by the app
  components/          Shared reusable UI and layout components
  config/              Environment and app configuration
  features/            Feature modules grouped by business domain
  hooks/               Shared React hooks
  services/            API clients and external service helpers
  styles/              Global styles and Tailwind entry
  types/               Shared TypeScript types
  utils/               Shared utility functions
```

## Import Alias

Use `@/` for imports from `src`.

```ts
import { Button } from '@/components/ui/Button'
```

## API Pattern

Keep API functions and query hooks inside each feature:

```text
src/features/tasks/
  api/taskApi.ts
  hooks/useTasks.ts
  hooks/useTask.ts
```

## Routing And Permissions

Routes live in `src/app/routes/AppRoutes.tsx`. Protected pages use
`ProtectedRoute` with role-based access:

```tsx
<Route element={<ProtectedRoute allowedRoles={['admin']} />}>
  <Route path="/admin" element={<AdminPage />} />
</Route>
```

Auth state is currently a demo localStorage-based provider in
`src/features/auth/providers/AuthProvider.tsx`. Replace `login` with the real
API login flow when the backend is ready.

Login screens are split by role:

```text
/login/admin
/login/employee
/login/manager
```
