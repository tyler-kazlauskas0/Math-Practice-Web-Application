import type { RouteObject } from 'react-router'
import AppLayout from './components/layout/AppLayout'
import { ROUTES } from './data/routes'
import ErrorPage from './pages/ErrorPage'
import HomePage from './pages/HomePage'
import MistakesPage from './pages/MistakesPage'
import NotFoundPage from './pages/NotFoundPage'
import PracticeSessionPage from './pages/PracticeSessionPage'
import PracticeSetupPage from './pages/PracticeSetupPage'
import PracticeSummaryPage from './pages/PracticeSummaryPage'
import SettingsPage from './pages/SettingsPage'
import StatisticsPage from './pages/StatisticsPage'

/**
 * Every page in the app. Used with `createBrowserRouter` in the app and `createMemoryRouter`
 * in tests. (A "data router" like these is needed for blocking navigation away from a session.)
 */
export const pageRoutes: RouteObject[] = [
  { path: ROUTES.home, element: <HomePage /> },
  { path: ROUTES.practiceSetup, element: <PracticeSetupPage /> },
  { path: ROUTES.practiceSession, element: <PracticeSessionPage /> },
  { path: ROUTES.practiceSummary, element: <PracticeSummaryPage /> },
  { path: ROUTES.statistics, element: <StatisticsPage /> },
  { path: ROUTES.mistakes, element: <MistakesPage /> },
  { path: ROUTES.settings, element: <SettingsPage /> },
  { path: '*', element: <NotFoundPage /> },
]

/**
 * Wraps pages in the shared layout and friendly error handling. If a page crashes, the
 * error page appears inside the layout (header and menu still work); if the layout itself
 * crashes, the error page appears on its own.
 */
export function withAppLayout(pages: RouteObject[]): RouteObject[] {
  return [
    {
      element: <AppLayout />,
      errorElement: <ErrorPage />,
      children: [{ errorElement: <ErrorPage />, children: pages }],
    },
  ]
}

export const appRoutes = withAppLayout(pageRoutes)
