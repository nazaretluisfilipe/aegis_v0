import React, { useEffect, useState } from 'react'
import { Calendar, Video, FileText, User, LogOut, ArrowRight, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'
import { btn, btnGhost, Cta } from '../App'
import { messages } from '../config'

export default function StudentDashboard() {
  const { profile, signOut } = useAuth()
  const [lessons, setLessons] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Buscar próximas aulas
        const { data: lData } = await supabase
          .from('lessons')
          .select('*, subjects(name), teachers(full_name)')
          .order('starts_at', { ascending: true })
          .gte('starts_at', new Date().toISOString())

        // 2. Buscar materiais do aluno
        const { data: mData } = await supabase
          .from('materials')
          .select('*')
          .eq('student_id', profile?.id) // Ajustado para a tabela students

        // 3. Buscar relatórios publicados
        const { data: rData } = await supabase
          .from('reports')
          .select('*')
          .eq('student_id', profile?.id)
          .eq('published', true)
          .order('report_date', { ascending: false })

        setLessons(lData || [])
        setMaterials(mData || [])
        setReports(rData || [])
      } catch (e) {
        console.error('Erro ao carregar dashboard:', e)
      } finally {
        setLoading(false)
      }
    }

    if (profile) loadData()
  }, [profile])

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando Dashboard...</div>

  const nextLesson = lessons[0]

  return (
    <div className="min-h-screen bg-black text-white p-5 sm:p-10">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold">Olá, {profile?.full_name || 'Aluno'}</h1>
          <p className="text-white/50">Acompanhe seu progresso e suas próximas aulas.</p>
        </div>
        <button onClick={signOut} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
          <LogOut size={18} /> Sair
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUNA DA ESQUERDA: FOCO TOTAL NA PRÓXIMA AULA */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-[#3b9ce2]" /> Próxima Aula
            </h2>
            {nextLesson ? (
              <div className="glass-panel rounded-3xl p-8 border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b9ce2]/10 blur-3xl rounded-full" />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <p className="text-[#3b9ce2] font-medium mb-1">{nextLesson.subjects?.name || 'Disciplina'}</p>
                    <h3 className="text-3xl font-bold mb-2">{// Formatação de data simplificada para o exemplo
                      new Date(nextLesson.starts_at).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })
                    }</h3>
                    <p className="text-white/60 flex items-center gap-2">
                      <User size={16} /> Prof. {nextLesson.teachers?.full_name || 'Não atribuído'}
                    </p>
                  </div>
                  <a
                    href={nextLesson.meet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${btn} py-4 px-8 text-lg`}
                  >
                    <Video size={20} /> Entrar na Aula
                  </a>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-12 text-center border-white/10">
                <p className="text-white/50">Nenhuma aula agendada no momento.</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
              <FileText size={20} className="text-[#3b9ce2]" /> Relatórios de Evolução
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reports.map(report => (
                <div key={report.id} className="glass-panel rounded-2xl p-5 border-white/10 hover:border-white/30 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs text-white/40">{report.report_date}</span>
                    <ArrowRight size={16} className="text-white/20 group-hover:text-[#3b9ce2] transition-colors" />
                  </div>
                  <h4 className="font-medium mb-2">Relatório de Desempenho</h4>
                  <p className="text-sm text-white/60 line-clamp-2">{report.performance || 'Sem descrição disponível.'}</p>
                </div>
              ))}
              {reports.length === 0 && <p className="text-white/40 col-span-2 text-center py-10">Ainda não há relatórios publicados.</p>}
            </div>
          </section>
        </div>

        {/* COLUNA DA DIREITA: MATERIAIS E INFO */}
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-medium mb-6 flex items-center gap-2">
              <FileText size={20} className="text-[#3b9ce2]" /> Materiais de Apoio
            </h2>
            <div className="space-y-3">
              {materials.map(mat => (
                <a
                  key={mat.id}
                  href={mat.storage_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-white/10 group-hover:bg-[#3b9ce2]/20 transition-colors">
                    <FileText size={18} className="text-white/70 group-hover:text-[#3b9ce2]" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{mat.title}</p>
                    <p className="text-xs text-white/40 truncate">{mat.description}</p>
                  </div>
                  <ArrowRight size={14} className="text-white/20 group-hover:text-white transition-colors" />
                </a>
              ))}
              {materials.length === 0 && <p className="text-white/40 text-center py-10">Nenhum material disponível.</p>}
            </div>
          </section>

          <div className="glass-panel rounded-3xl p-6 border-white/10 bg-gradient-to-br from-white/5 to-transparent">
            <h3 className="font-medium mb-4">Apoio Aégis</h3>
            <p className="text-sm text-white/60 mb-6">Dúvidas sobre seu plano ou agenda? Nossa equipe está disponível.</p>
            <Cta message={messages.general} className={btnGhost + ' w-full justify-center'}><MessageCircle size={16} /> Chamar no WhatsApp</Cta>
          </div>
        </div>
      </div>
    </div>
  )
}
