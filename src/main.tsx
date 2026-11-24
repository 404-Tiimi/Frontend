import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { HashRouter } from 'react-router-dom'

// HashRouter: reitti on #-merkin jälkeen (esim. /Frontend/#/inquiry/1),
// joten GitHub Pages ei palauta 404:ää suoraan avattaessa tai päivitettäessä
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
