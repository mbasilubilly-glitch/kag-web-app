import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { registerServiceWorker } from './serviceWorkerRegistration'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Opting into v7's behavior now (still on the v6 package) is the
        officially recommended way to migrate gradually - it's what the
        console warnings themselves point at. Neither flag changes any
        route in this app: v7_startTransition only affects render
        scheduling, and v7_relativeSplatPath only affects relative links
        inside splat (`*`) routes, which this app's route tree doesn't use. */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

registerServiceWorker()
