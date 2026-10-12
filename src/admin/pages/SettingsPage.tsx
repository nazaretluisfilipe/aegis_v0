import { PageHeader } from '../ui'
import { useAdminAuth } from '../AdminAuth'
import { btnGhost } from '../ui'

export default function SettingsPage() {
  const { email, signOut } = useAdminAuth()
  return (
    <>
      <PageHeader title="Configurações">Informações reais da sessão atual. Ajustes do painel serão adicionados em etapas futuras.</PageHeader>
      <dl className="glass-panel divide-y divide-line rounded-2xl text-sm">
        <div className="flex flex-wrap justify-between gap-2 p-5"><dt className="text-mute">Conta conectada</dt><dd className="text-white">{email}</dd></div>
        <div className="flex flex-wrap justify-between gap-2 p-5"><dt className="text-mute">Permissão</dt><dd className="text-white">Administrador (verificado no banco de dados)</dd></div>
      </dl>
      <button onClick={signOut} className={btnGhost + ' mt-6'}>Sair do painel</button>
    </>
  )
}
