import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LeaseCalculator from './LeaseCalculator.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LeaseCalculator />
  </StrictMode>,
)
