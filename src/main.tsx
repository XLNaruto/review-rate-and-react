import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// After a deploy, a tab still running the previous build can request a lazy
// chunk that no longer exists (the host answers with index.html, so the import
// fails). Reload once to pick up the new build; the timestamp guard stops a
// reload loop if the chunk is genuinely broken.
const RELOAD_KEY = 'chunk-reload-at'
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < 10_000) return
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    /* storage blocked — still reload */
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
