import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// O painel administrativo (/admin) é carregado sob demanda: o site público não baixa nem executa nada dele.
const AdminApp = lazy(() => import('./admin/AdminApp'))
const isAdminRoute = /^\/admin(\/|$)/.test(location.pathname)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute
      ? <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-white/60" role="status">Carregando…</div>}><AdminApp /></Suspense>
      : <App />}
  </React.StrictMode>
)
