import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Automatically register Service Worker for offline PWA functionality
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nouvelle version de Travel Tracker PWA disponible.');
  },
  onOfflineReady() {
    console.log('Travel Tracker PWA est prête pour une utilisation hors-ligne.');
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
