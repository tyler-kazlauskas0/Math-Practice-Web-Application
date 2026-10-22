import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import './styles/global.css'
import './styles/buttons.css'
import App from './App.tsx'
import { appRoutes, preloadPages } from './routes.tsx'
import { checkAndRepairStoredData } from './services/dataHealth'
import { migrateStorage } from './services/schema'

// Bring any data saved by an older version of the app up to date, then repair anything
// damaged, before anything reads it.
migrateStorage()
checkAndRepairStoredData()

// Where the app lives on the site (the root, unless Vite's `base` says otherwise).
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App router={createBrowserRouter(appRoutes, { basename })} />
  </StrictMode>,
)

// Once the first page is showing, download the other pages in the background, so they open
// instantly. If that fails (e.g. offline), each page tries again when it's opened.
const whenIdle =
  window.requestIdleCallback ?? ((callback: () => void) => setTimeout(callback, 1000))
whenIdle(() => preloadPages().catch(() => {}))
