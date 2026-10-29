/** Aégis: endpoint serverless de diagnóstico.
 * Ativação: configure SUPABASE_URL, SUPABASE_SECRET_KEY (ou SUPABASE_SERVICE_ROLE_KEY legado) e TURNSTILE_SECRET_KEY
 * em variáveis privadas da Vercel; VITE_TURNSTILE_SITE_KEY é apenas pública.
 * NUNCA retorne a chave service_role ou a exponha ao bundle.
 */
const SUPABASE_TIMEOUT_MS = 9000
const MAX_BODY_BYTES = 12000
const ALLOWED_ORIGINS = new Set(['https://aegisedu.com.br', 'https://www.aegisedu.com.br'])
const SUBJECTS = new Set(['Matemática','Física','Química'])
const GOALS = new Set(['Recuperar a base','Acompanhar o conteúdo da escola','Preparar para provas e vestibulares','Aprofundar o conhecimento'])
const FREQUENCIES = new Set(['','1 aula por semana','2 aulas por semana','Aula avulsa','Ainda não sei'])

const result = (status, body) => new Response(JSON.stringify(body),{
  status,
  headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'}
})
const clean = (value, limit) => typeof value === 'string' && value.length <= limit
  ? value.trim().replace(/\u0000/g,'')
  : null

/** Exportação explícita para testes; não depende do ambiente da Vercel. */
export async function handleRequest(request, options={}) {
  const env=options.env??process.env
  const send=options.fetchImpl??fetch
  if(request.method!=='POST') return result(405,{ok:false,code:'method'})
  if(!/application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??'')) return result(415,{ok:false,code:'content_type'})
  const origin=request.headers.get('origin')??''
  const extra=(env.AEGIS_ALLOWED_ORIGINS??'').split(',').map(x=>x.trim()).filter(Boolean)
  if(!ALLOWED_ORIGINS.has(origin)&&!extra.includes(origin))return result(403,{ok:false,code:'origin'})
  const serverKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
  if(!env.SUPABASE_URL||!serverKey||!env.TURNSTILE_SECRET_KEY) {
    return result(503,{ok:false,code:'not_configured'})
  }
  const size=Number(request.headers.get('content-length')??'0')
  if(!Number.isFinite(size)||size>MAX_BODY_BYTES)return result(413,{ok:false,code:'size'})
  let body
  try{
    const raw=await request.text()
    if(new TextEncoder().encode(raw).byteLength>MAX_BODY_BYTES)return result(413,{ok:false,code:'size'})
    body=JSON.parse(raw)
  }catch{return result(400,{ok:false,code:'json'})}
  if(!body||typeof body!=='object'||Array.isArray(body))return result(400,{ok:false,code:'payload'})
  // Não confirme recebimento, nem grave nada se o campo isca tiver sido preenchido.
  if(body.website)return result(200,{ok:true})
  const token=clean(body.turnstileToken,2048)
  if(!token)return result(400,{ok:false,code:'challenge'})
  const guardian=clean(body.guardianName,120)
  const student=clean(body.studentName,120)
  const grade=clean(body.grade,120)
  const email=clean(body.email,254)
  const phone=clean(body.whatsapp,30)
  const age=clean(body.age??'',3)
  const school=clean(body.school??'',120)
  const difficulties=clean(body.difficulties??'',1500)
  const availability=clean(body.availability??'',200)
  const frequency=clean(body.frequency??'',60)
  const notes=clean(body.notes??'',1500)
  const goal=clean(body.goal,120)
  const subjects=body.subjects
  const digits=phone?.replace(/\D/g,'')??''
  const number=digits.startsWith('55') && [12,13].includes(digits.length)?digits.slice(2):digits
  const validPhone=[10,11].includes(number.length)&&/^[1-9][1-9]/.test(number)&&!/^(\d)\1+$/.test(number)
  const validAge=age===''||(age!==null&&/^\d{1,3}$/.test(age)&&Number(age)>=1&&Number(age)<=100)
  if(!guardian||guardian.length<3||!student||student.length<2||!grade||!email||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!validPhone||
    !validAge||school===null||difficulties===null||availability===null||
    frequency===null||!FREQUENCIES.has(frequency)||notes===null||
    !goal||!GOALS.has(goal)||body.consent!==true||
    !Array.isArray(subjects)||subjects.length<1||subjects.length>3||
    new Set(subjects).size!==subjects.length||!subjects.every(s=>SUBJECTS.has(s))) {
      return result(422,{ok:false,code:'validation'})
  }
  let valid
  try{
    const verify=await send('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token}),
      signal:AbortSignal.timeout(SUPABASE_TIMEOUT_MS)
    })
    if(!verify.ok)return result(502,{ok:false,code:'challenge_unavailable'})
    valid=await verify.json()
  }catch{return result(502,{ok:false,code:'challenge_unavailable'})}
  const hostname=new URL(origin).hostname
  if(valid?.success!==true || valid.hostname!==hostname || valid.action!=='diagnostico'){
    return result(403,{ok:false,code:'challenge'})
  }
  const url=env.SUPABASE_URL.replace(/\/+$/,'')
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))return result(503,{ok:false,code:'configuration'})
  const payload={
    guardian_name:guardian,email:email.toLowerCase(),phone:digits,
    student_name:student,school_grade:grade,subjects:subjects.join(', '),goal,
    student_age:age===''?null:Number(age),school,difficulties,
    availability,frequency,notes,consent:true
  }
  try{
    const saved=await send(url+'/rest/v1/lead_requests',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':serverKey,
        ...(serverKey.startsWith('sb_secret_')?{}:{'Authorization':'Bearer '+serverKey}),
        'Prefer':'return=minimal'},
      body:JSON.stringify(payload),signal:AbortSignal.timeout(SUPABASE_TIMEOUT_MS)
    })
    return saved.ok?result(201,{ok:true}):result(502,{ok:false,code:'database'})
  }catch{return result(502,{ok:false,code:'database'})}
}
export default {fetch(request){return handleRequest(request)}}
