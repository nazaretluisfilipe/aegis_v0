import React from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeads() {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
      setLeads(data || [])
      setLoading(false)
    }
    fetchLeads()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('leads').update({ status }).eq('id', id)
    setLeads(leads.map(l => l.id === id ? { ...l, status } : l))
  }

  if (loading) return <div className="p-10 text-white">Carregando leads...</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Gestão de Leads</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/70">
          <thead className="border-b border-white/10 text-white">
            <tr>
              <th className="pb-3">Responsável</th>
              <th className="pb-3">Aluno</th>
              <th className="pb-3">Disciplina</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads.map(lead => (
              <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                <td className="py-4 font-medium text-white">{lead.guardian_name}</td>
                <td className="py-4">{lead.student_name}</td>
                <td className="py-4">{lead.subjects?.join(', ')}</td>
                <td className="py-4">
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="bg-black border border-white/20 rounded px-2 py-1 text-xs outline-none"
                  >
                    <option value="new">Novo</option>
                    <option value="contacted">Contato</option>
                    <option value="negotiating">Negociação</option>
                    <option value="won">Fechado</option>
                    <option value="lost">Perdido</option>
                  </select>
                </td>
                <td className="py-4">
                  <a href={`https://wa.me/${lead.whatsapp}`} target="_blank" rel="noreferrer" className="text-[#3b9ce2] hover:underline">WhatsApp</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
