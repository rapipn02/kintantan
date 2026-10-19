import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'
import { consumeDeepLink } from './app/deepLink.ts'
import { useGameStore } from './app/gameStore.ts'
import { installViewportGuards } from './shared/lib/viewportGuards.ts'
import './styles/index.css'

installViewportGuards()

// Proses deep link sekali di luar React (aman dari render ganda StrictMode).
const token = consumeDeepLink()
if (token !== undefined) {
  const result = token ? useGameStore.getState().claim(token) : { ok: false }
  if (!result.ok) useGameStore.getState().showToast('QR tidak dikenali')
}

// Minta browser tidak menghapus cache offline (peta, desain) saat penyimpanan HP menipis.
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.ready
    .then(() => navigator.storage?.persist?.())
    .catch(() => undefined)
}

const root = document.getElementById('root')
if (!root) throw new Error('#root tidak ditemukan')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
