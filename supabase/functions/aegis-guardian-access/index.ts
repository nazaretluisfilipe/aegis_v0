import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.117.3"

const projectUrl = Deno.env.get("SUPABASE_URL") ?? ""
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const admin = createClient(projectUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

function allowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    if (url.origin !== origin) return false
    if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname) && ["5173", "4173"].includes(url.port)) return true
    if (url.protocol !== "https:") return false
    return ["aegisedu.com.br", "www.aegisedu.com.br", "aegis-v0.vercel.app"].includes(url.hostname)
      || /^aegis-v0-[a-z0-9-]+-aegiseducacional-8811\.vercel\.app$/.test(url.hostname)
  } catch { return false }
}
function response(body: Record<string, unknown>, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store",
      "Vary": "Origin", "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS" }
  })
}
function generatePassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return Array.from(bytes, b => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#"[b % 65]).join("")
}
type Guardian = { id:string;email:string;full_name:string;family_id:string;active:boolean;is_demo:boolean;auth_user_id:string|null }

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || ""
  if (!allowedOrigin(origin)) return new Response("Origem não autorizada", {status:403})
  if (req.method === "OPTIONS") return response({ok:true},200,origin)
  if (req.method !== "POST") return response({error:"Método não permitido"},405,origin)
  if (!projectUrl || !anonKey || !serviceKey) return response({error:"Serviço não configurado"},503,origin)
  const header = req.headers.get("Authorization") || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : ""
  if (!token || token.length>8192) return response({error:"Sessão necessária"},401,origin)
  const scoped = createClient(projectUrl, anonKey, {
    global:{headers:{Authorization:"Bearer "+token}},
    auth:{autoRefreshToken:false,persistSession:false}
  })
  const {data:{user},error:userError}=await scoped.auth.getUser(token)
  if (userError || !user) return response({error:"Sessão inválida"},401,origin)
  let body: {action?:string;guardian_id?:string}
  try {body=await req.json()}catch{return response({error:"Requisição inválida"},400,origin)}
  if (!body || typeof body.action !== "string")return response({error:"Operação não informada"},400,origin)

  if (body.action === "claim") {
    const email=user.email?.trim().toLowerCase()
    if (!email || !user.email_confirmed_at) return response({error:"Confirme seu endereço de e-mail antes de entrar"},403,origin)
    const {data:profile,error:profileErr}=await admin.from("profiles").select("active,role").eq("id",user.id).maybeSingle()
    if(profileErr||!profile?.active||profile.role!=="parent")return response({error:"Conta de responsável indisponível"},403,origin)
    const {data:guardians,error:guardianErr}=await admin.from("guardians")
      .select("id,email,family_id,active,is_demo,auth_user_id").eq("email",email).limit(2)
    if(guardianErr || !guardians || guardians.length!==1)return response({error:"Responsável não cadastrado ou não autorizado"},403,origin)
    const g=guardians[0] as Guardian
    const {data:family}=await admin.from("families").select("active").eq("id",g.family_id).maybeSingle()
    if(!family?.active || !g.active)return response({error:"Acesso ao grupo desativado"},403,origin)
    if(g.auth_user_id && g.auth_user_id!==user.id) return response({error:"O cadastro já está vinculado a outra conta"},409,origin)
    if(!g.auth_user_id){
      const {data:linked,error:linkErr}=await admin.from("guardians").update({auth_user_id:user.id})
        .eq("id",g.id).is("auth_user_id",null).select("id").maybeSingle()
      if(linkErr)return response({error:"Não foi possível concluir o vínculo"},500,origin)
      if(!linked){
        const {data:current}=await admin.from("guardians").select("auth_user_id").eq("id",g.id).single()
        if(current?.auth_user_id!==user.id)return response({error:"Vínculo concorrente; contate a equipe"},409,origin)
      }
    }
    return response({ok:true,linked:true,is_demo:g.is_demo},200,origin)
  }
  if (!["invite","demo_login"].includes(body.action))return response({error:"Operação desconhecida"},400,origin)
  const {data:isAdmin,error:roleErr}=await scoped.rpc("is_admin")
  if(roleErr||isAdmin!==true)return response({error:"Somente administradores podem executar esta operação"},403,origin)
  if(typeof body.guardian_id!=="string" || !/^[0-9a-f-]{36}$/i.test(body.guardian_id))
    return response({error:"Responsável inválido"},400,origin)
  const {data:g,error:gErr}=await scoped.from("guardians").select("id,email,full_name,family_id,active,is_demo,auth_user_id")
    .eq("id",body.guardian_id).maybeSingle()
  if(gErr||!g)return response({error:"Responsável não encontrado"},404,origin)
  const guardian=g as Guardian
  const {data:f}=await scoped.from("families").select("active,is_demo").eq("id",guardian.family_id).maybeSingle()
  if(!guardian.active||!f?.active)return response({error:"Cadastro desativado"},409,origin)

  if(body.action==="invite"){
    if(guardian.is_demo||f.is_demo)return response({error:"Convites reais são proibidos para dados TESTE — FICTÍCIO"},400,origin)
    if(guardian.auth_user_id)return response({ok:true,already_linked:true,message:"Este responsável já possui acesso vinculado."},200,origin)
    const since=new Date(Date.now()-15*60*1000).toISOString()
    const {data:recent,error:recentErr}=await admin.from("guardian_invitation_log")
      .select("id").eq("guardian_id",guardian.id).gte("sent_at",since).limit(1)
    if(recentErr)return response({error:"Não foi possível conferir a frequência de convites"},503,origin)
    if(recent?.length)return response({error:"Um convite foi enviado recentemente. Aguarde 15 minutos antes de reenviar."},429,origin)
    // O endereço de retorno nunca é escolhido livremente pelo navegador.
    // Configure a URL em Auth > URL Configuration para aceitar este domínio.
    const redirectTo=origin+"/responsavel/ativar"
    const {error:inviteErr}=await admin.auth.admin.inviteUserByEmail(guardian.email,{redirectTo,
      data:{full_name:guardian.full_name}})
    if(inviteErr) {
      const msg=inviteErr.message.toLowerCase()
      if(msg.includes("already")||msg.includes("registered")||msg.includes("exists"))
        return response({error:"O e-mail já existe no Auth. Solicite recuperação de senha e o vínculo ocorrerá após a entrada."},409,origin)
      return response({error:"Não foi possível enviar o convite. Confira o provedor de e-mail e as URLs de redirecionamento do Supabase."},502,origin)
    }
    const {error:logErr}=await admin.from("guardian_invitation_log")
      .insert({guardian_id:guardian.id,requested_by:user.id})
    return response({ok:true,message:logErr?
      "Convite enviado, mas o registro do envio não foi gravado.":"Convite enviado para o e-mail cadastrado. O vínculo será feito quando a conta confirmada entrar."},200,origin)
  }
  // Demonstração: credenciais criadas SEM enviar e-mail, somente ao administrador.
  if (!guardian.is_demo || !f.is_demo)return response({error:"Esta operação só é permitida para dados TESTE — FICTÍCIO"},403,origin)
  const {data:scenario,error:scenarioErr}=await scoped.from("demo_scenarios")
    .select("guardian_id").eq("guardian_id",guardian.id).maybeSingle()
  if(scenarioErr||!scenario)return response({error:"Cadastro não pertence ao laboratório de demonstração"},403,origin)
  const password=generatePassword()
  if(guardian.auth_user_id){
    const {error:resetErr}=await admin.auth.admin.updateUserById(guardian.auth_user_id,{password})
    if(resetErr)return response({error:"Não foi possível redefinir a senha fictícia"},500,origin)
    return response({ok:true,email:guardian.email,password,is_demo:true,reset:true},200,origin)
  }
  const {data:created,error:createErr}=await admin.auth.admin.createUser({
    email:guardian.email,password,email_confirm:true,user_metadata:{full_name:guardian.full_name}
  })
  if(createErr||!created.user)return response({error:"Não foi possível criar o acesso fictício. Verifique se o e-mail já existe no Auth."},409,origin)
  const {data:linked,error:linkErr}=await admin.from("guardians").update({auth_user_id:created.user.id})
    .eq("id",guardian.id).is("auth_user_id",null).select("id").maybeSingle()
  if(linkErr||!linked){
    await admin.auth.admin.deleteUser(created.user.id)
    return response({error:"Falha ao vincular a conta fictícia"},500,origin)
  }
  return response({ok:true,email:guardian.email,password,is_demo:true,reset:false},200,origin)
})
