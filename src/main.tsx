import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import './styles/global.css'
import './styles/buttons.css'
import App from './App.tsx'
import { appRoutes } from './routes.tsx'
import { checkAndRepairStoredData } from './services/dataHealth'
import { migrateStorage } from './services/schema'

// Bring any data saved by an older version of the app up to date, then repair anything
// damaged, before anything reads it.
migrateStorage()
checkAndRepairStoredData()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App router={createBrowserRouter(appRoutes)} />
  </StrictMode>,
)
