import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual'
}
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { FavouritesProvider } from './contexts/FavouritesContext.tsx'
import { NotificationProvider } from './contexts/NotificationContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <FavouritesProvider>
            <App />
          </FavouritesProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  </StrictMode>,
)
