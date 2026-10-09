import React from 'react'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { profile, loading } = useAuth()

  if (loading) return <div className="flex h-screen items-center justify-center">Carregando...</div>

  if (!profile) {
    // Redireciona para login (ou página inicial se não houver login)
    window.location.href = '/'
    return null
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    // Acesso negado para este papel
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center p-5">
        <h1 className="text-2xl font-serif mb-2">Acesso Restrito</h1>
        <p className="text-graphite">Você não tem permissão para acessar esta área.</p>
        <a href="/" className="mt-4 text-accent underline">Voltar ao início</a>
      </div>
    )
  }

  return <>{children}</>
}
