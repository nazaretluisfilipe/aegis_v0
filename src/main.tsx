import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// O painel administrativo (/admin) é carregado sob demanda: o site público não baixa nem executa nada dele.
const AdminApp = lazy(() => import('./admin/AdminApp'))
const ResponsiblePortal = lazy(() => import('./responsavel/ResponsiblePortal'))
const PasswordRecovery = lazy(() => import('./responsavel/PasswordRecovery'))
const GuardianActivation = lazy(() => import('./responsavel/GuardianActivation'))
const isAdminRoute = /^\/admin(\/|$)/.test(location.pathname)
const isResponsibleRoute = /^\/responsavel(\/|$)/.test(location.pathname)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute
      ? <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black text-white/60" role="status">Carregando…</div>}><AdminApp /></Suspense>
      : isResponsibleRoute
        ? <Suspense fallback={<div role="status">Carregando...</div>}>{location.pathname.startsWith('/responsavel/recuperar') ? <PasswordRecovery /> : location.pathname.startsWith('/responsavel/ativar') ? <GuardianActivation /> : <ResponsiblePortal />}</Suspense>
        : <App />}
  </React.StrictMode>
)
