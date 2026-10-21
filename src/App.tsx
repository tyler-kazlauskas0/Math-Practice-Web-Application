import { Route, Routes } from 'react-router'
import AppLayout from './components/layout/AppLayout'
import MistakePatternsProvider from './components/MistakePatternsProvider'
import SettingsProvider from './components/SettingsProvider'
import { ROUTES } from './data/routes'
import HomePage from './pages/HomePage'
import MistakesPage from './pages/MistakesPage'
import NotFoundPage from './pages/NotFoundPage'
import PracticeSessionPage from './pages/PracticeSessionPage'
import PracticeSetupPage from './pages/PracticeSetupPage'
import PracticeSummaryPage from './pages/PracticeSummaryPage'
import SettingsPage from './pages/SettingsPage'
import StatisticsPage from './pages/StatisticsPage'

function App() {
  return (
    <SettingsProvider>
      <MistakePatternsProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.home} element={<HomePage />} />
            <Route path={ROUTES.practiceSetup} element={<PracticeSetupPage />} />
            <Route path={ROUTES.practiceSession} element={<PracticeSessionPage />} />
            <Route path={ROUTES.practiceSummary} element={<PracticeSummaryPage />} />
            <Route path={ROUTES.statistics} element={<StatisticsPage />} />
            <Route path={ROUTES.mistakes} element={<MistakesPage />} />
            <Route path={ROUTES.settings} element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </MistakePatternsProvider>
    </SettingsProvider>
  )
}

export default App
