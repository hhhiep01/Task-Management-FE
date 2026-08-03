import { AppProvider } from './providers/AppProvider'
import { AppRoutes } from './routes/AppRoutes'

export function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
