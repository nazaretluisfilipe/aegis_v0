import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handleRequest } from '../api/diagnostico.js'

const env={
  SUPABASE_URL:'https://example-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:'PRIVATE_SERVER_KEY_TEST_ONLY',
  TURNSTILE_SECRET_KEY:'PRIVATE_TURNSTILE_KEY_TEST_ONLY'
}
const origin='https://aegisedu.com.br'
const lead={
  guardianName:'Responsável de Teste',email:'teste@example.invalid',
  whatsapp:'(41) 99999-9999',studentName:'Estudante Fictício',
  age:'14',grade:'9º ano',school:'',subjects:['Matemática'],
  goal:'Recuperar a base',difficulties:'Frações',availability:'Terças à tarde',
  frequency:'1 aula por semana',notes:'Observação',consent:true,
  website:'',turnstileToken:'valid-demo-token'
}
const request=(data=lead,headers={})=>new Request('https://aegisedu.com.br/api/diagnostico',{
 method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...headers},
 body:JSON.stringify(data)
})
const goodFetch=async(input,init)=>{
 if(input.includes('siteverify'))return new Response(JSON.stringify({
  success:true,hostname:'aegisedu.com.br',action:'diagnostico'
 }),{status:200})
 return new Response(null,{status:201})
}
const getStatus=async(request,options)=> (await handleRequest(request,options)).status

test('bloqueia quando faltam segredos de produção',async()=>{
 assert.equal(await getStatus(request(),{env:{},fetchImpl:goodFetch}),503)
})
test('recusa requisições sem Origin permitido, fora de POST ou não-JSON',async()=>{
 assert.equal(await getStatus(request(lead,{Origin:'https://site-malicioso.example'}),{env,fetchImpl:goodFetch}),403)
 assert.equal(await getStatus(new Request('https://aegisedu.com.br/api/diagnostico'),{env,fetchImpl:goodFetch}),405)
 assert.equal(await getStatus(new Request('https://aegisedu.com.br/api/diagnostico',{method:'POST',headers:{Origin:origin,'Content-Type':'text/plain'},body:'x'}),{env,fetchImpl:goodFetch}),415)
})
test('valida campos obrigatórios, tamanho, telefone e disciplinas',async()=>{
 for(const modified of [
  {guardianName:'x'},{studentName:''},{consent:false},{whatsapp:'999'},
  {subjects:[]},{subjects:['Física','Física']},{subjects:['Outra']},
  {goal:'injetar SQL'},{age:'999'},{frequency:'de hora em hora'}
 ]){
   assert.equal(await getStatus(request({...lead,...modified}),{env,fetchImpl:goodFetch}),422,JSON.stringify(modified))
 }
 const huge=await getStatus(request({...lead,notes:'x'.repeat(14000)}),{env,fetchImpl:goodFetch})
 assert.equal(huge,413)
})
test('não permite envio sem token ou com token inválido, hostname ou action incorretos',async()=>{
 assert.equal(await getStatus(request({...lead,turnstileToken:''}),{env,fetchImpl:goodFetch}),400)
 for(const patch of [{success:false},{hostname:'outro-dominio.com'},{action:'outro'}]){
  const verify=async(input)=>new Response(JSON.stringify({success:true,hostname:'aegisedu.com.br',action:'diagnostico',...patch}),{status:200})
  assert.equal(await getStatus(request(),{env,fetchImpl:verify}),403)
 }
})
test('grava exclusivamente colunas autorizadas quando o Turnstile confirma e não expõe segredo',async()=>{
 const calls=[]
 const mocked=async(input,init)=>{
  calls.push({input,init})
  return goodFetch(input,init)
 }
 const response=await handleRequest(request(),{env,fetchImpl:mocked})
 assert.equal(response.status,201)
 const body=await response.json()
 assert.equal(body.ok,true)
 assert.equal(calls.length,2)
 assert.equal(calls[0].input,'https://challenges.cloudflare.com/turnstile/v0/siteverify')
 assert.equal(JSON.parse(calls[0].init.body).secret,env.TURNSTILE_SECRET_KEY)
 assert.equal(calls[1].input,'https://example-project.supabase.co/rest/v1/lead_requests')
 const sent=JSON.parse(calls[1].init.body)
 assert.equal(sent.guardian_name,'Responsável de Teste')
 assert.equal(sent.school_grade,'9º ano')
 assert.equal(sent.student_age,14)
 assert.equal(sent.consent,true)
 assert.ok(!Object.hasOwn(sent,'status')&&!Object.hasOwn(sent,'is_demo')&&!Object.hasOwn(sent,'admin_notes'))
 const visible=JSON.stringify(body)
 assert.ok(!visible.includes(env.SUPABASE_SERVICE_ROLE_KEY))
 assert.ok(!visible.includes(env.TURNSTILE_SECRET_KEY))
})
test('não confirma envio se Turnstile ou Supabase falharem',async()=>{
 const challengeDown=async()=>new Response('unavailable',{status:500})
 assert.equal(await getStatus(request(),{env,fetchImpl:challengeDown}),502)
 const dbDown=async(input,init)=>input.includes('siteverify')?goodFetch(input,init):new Response('{}',{status:403})
 assert.equal(await getStatus(request(),{env,fetchImpl:dbDown}),502)
})
test('honeypot não gera requisição a nenhum backend',async()=>{
 let called=false
 const response=await handleRequest(request({...lead,website:'http://spam.example'}),{
   env,fetchImpl:async()=>{called=true;throw Error('não deveria chamar')}
 })
 assert.equal(response.status,200)
 assert.equal(called,false)
})

test('aceita as três representações brasileiras de telefone e rejeita texto inválido',async()=>{
 for (const whatsapp of ['(41) 99999-9999','41999999999','5541999999999']) {
   assert.equal(await getStatus(request({...lead,whatsapp}),{env,fetchImpl:goodFetch}),201,whatsapp)
 }
 for (const whatsapp of ['telefone','55555555555','00000000000','4199ABCD']) {
   assert.equal(await getStatus(request({...lead,whatsapp}),{env,fetchImpl:goodFetch}),422,whatsapp)
 }
})

test('aceita a chave secreta atual do Supabase sem usá-la como JWT Bearer',async()=>{
 const current={...env,SUPABASE_SERVICE_ROLE_KEY:undefined,SUPABASE_SECRET_KEY:'sb_secret_TEST_ONLY_NEVER_REAL'}
 const calls=[]
 const mock=async(input,init)=>{calls.push({input,init});return goodFetch(input,init)}
 const response=await handleRequest(request(),{env:current,fetchImpl:mock})
 assert.equal(response.status,201)
 assert.equal(calls.length,2)
 assert.equal(calls[1].init.headers.apikey,current.SUPABASE_SECRET_KEY)
 assert.ok(!Object.hasOwn(calls[1].init.headers,'Authorization'))
})
