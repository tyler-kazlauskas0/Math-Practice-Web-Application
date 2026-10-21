import { RouterProvider, type RouterProviderProps } from 'react-router'
import MistakePatternsProvider from './components/MistakePatternsProvider'
import SettingsProvider from './components/SettingsProvider'

/** The whole app. `router` is made from `appRoutes` (see `routes.tsx`). */
function App({ router }: { router: RouterProviderProps['router'] }) {
  return (
    <SettingsProvider>
      <MistakePatternsProvider>
        <RouterProvider router={router} />
      </MistakePatternsProvider>
    </SettingsProvider>
  )
}

export default App
