import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'govuk-frontend/dist/govuk/govuk-frontend.min.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
