import {useEffect,useState,type FormEvent} from 'react'
import {supabaseAdmin as db} from '../admin/supabaseAdmin'
import {Brand,btn,btnGhost} from '../admin/ui'

const field='mt-2 w-full rounded-xl border border-white/20 bg-[#080d19] p-3 text-white outline-none focus:border-[#2F7BFF]'
export default function GuardianActivation(){
 const [status,setStatus]=useState<'checking'|'ready'|'missing'|'completed'>('checking')
 const [password,setPassword]=useState(''),[confirm,setConfirm]=useState('')
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[email,setEmail]=useState('')
 useEffect(()=>{
  if(!db){setStatus('missing');return}
  let mounted=true
  const check=async()=>{
   const {data:{user}}=await db!.auth.getUser()
   if(!mounted)return
   if(user){setEmail(user.email||'');setStatus('ready')}
   else setStatus('missing')
  }
  const {data}=db.auth.onAuthStateChange((_event,session)=>{
   if(session)queueMicrotask(()=>{void check()})
  })
  void check()
  return()=>{mounted=false;data.subscription.unsubscribe()}
 },[])
 async function activate(event:FormEvent){
  event.preventDefault()
  if(!db||busy)return
  if(password.length<10){setError('Use uma senha com pelo menos 10 caracteres.');return}
  if(password!==confirm){setError('As senhas não coincidem.');return}
  setBusy(true);setError('')
  const changed=await db.auth.updateUser({password})
  if(changed.error){setError('Não foi possível definir sua senha. Solicite outro convite ou um link de recuperação.');setBusy(false);return}
  const {data,error:claimError}=await db.functions.invoke('aegis-guardian-access',{body:{action:'claim'}})
  if(claimError||!data?.ok){
   setError('Senha definida, mas ainda não foi possível vincular seu cadastro. Contate a equipe Aégis e não compartilhe sua senha.')
   setBusy(false);return
  }
  setBusy(false);setStatus('completed')
 }
 return <main className="min-h-screen bg-black px-5 py-12 text-white">
  <div className="mx-auto w-full max-w-lg space-y-6">
   <div className="flex justify-center"><Brand/></div>
   <section className="glass-panel space-y-5 rounded-3xl p-7 sm:p-9">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#3b9ce2]">Aégis Educational</p>
    <h1 className="text-3xl font-serif">Ative sua área do responsável</h1>
    {status==='checking'&&<p role="status" className="text-mute">Verificando a confirmação do convite…</p>}
    {status==='missing'&&<div className="space-y-3">
     <p className="text-mute">O convite está expirado ou esta sessão não foi reconhecida. Solicite um novo link à equipe Aégis ou use a recuperação de senha.</p>
     <a href="/responsavel/recuperar" className={btn}>Recuperar acesso</a>
    </div>}
    {status==='ready'&&<form onSubmit={activate} className="space-y-4">
     <p className="text-sm leading-relaxed text-mute">Sua conta foi confirmada. Defina uma senha pessoal para acessar aulas, materiais e relatórios do estudante.</p>
     <p className="rounded-xl border border-white/10 p-3 text-sm">Conta: <b>{email}</b></p>
     <label className="block text-sm">Nova senha (mínimo 10 caracteres)
      <input type="password" autoComplete="new-password" required minLength={10} maxLength={128} className={field}
       value={password} onChange={e=>setPassword(e.target.value)}/>
     </label>
     <label className="block text-sm">Confirme a senha
      <input type="password" autoComplete="new-password" required minLength={10} maxLength={128} className={field}
       value={confirm} onChange={e=>setConfirm(e.target.value)}/>
     </label>
     {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}
     <button disabled={busy} className={btn+' w-full'}>{busy?'Configurando…':'Ativar meu acesso'}</button>
    </form>}
    {status==='completed'&&<div className="space-y-4">
     <p className="text-emerald-200">Acesso ativado. Agora você pode consultar seu acompanhamento educacional.</p>
     <a href="/responsavel" className={btn+' w-full'}>Entrar na área do responsável</a>
    </div>}
    <a className={btnGhost+' w-full'} href="/">Voltar ao site</a>
   </section>
   <p className="text-center text-xs text-mute">A Aégis não solicita sua senha por WhatsApp, telefone ou e-mail.</p>
  </div>
 </main>
}
