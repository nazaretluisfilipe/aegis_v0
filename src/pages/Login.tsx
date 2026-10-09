import React, { useState } from 'react'
import { Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { btn } from '../App' // Reutilizando o estilo do botão premium

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (e: any) {
      setError(e.message || 'Falha na autenticação. Verifique seus dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">Acesso do Aluno</h1>
          <p className="text-white/50">Entre para acompanhar sua evolução educacional.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-8 shadow-2xl border-white/10">
          <div className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type="email"
                placeholder="E-mail"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#3b9ce2] transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
              <input
                type="password"
                placeholder="Senha"
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#3b9ce2] transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className={`${btn} w-full justify-center py-4 text-lg`}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar na Área do Aluno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
