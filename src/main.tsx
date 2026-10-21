import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './styles/global.css'
import './styles/buttons.css'
import App from './App.tsx'
import { migrateStorage } from './services/schema'

// Bring any data saved by an older version of the app up to date before anything reads it.
migrateStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
