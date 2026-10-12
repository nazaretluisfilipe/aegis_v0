import {createContext,useContext,useEffect,useState,type ReactNode} from 'react'
import {supabaseAdmin as db} from './admin/supabaseAdmin'
export type PublicPlan={id:string;label:string;lessons:number;price:number;note:string;featured:boolean}
export type SiteContent={heroTitle:string;heroDescription:string;whatsapp:string;email:string;plansVisible:boolean;faqVisible:boolean;plans:PublicPlan[];faq:{question:string;answer:string}[]}
export const defaultContent:SiteContent={heroTitle:'O aluno não precisa de mais uma aula. Precisa de um acompanhamento.',heroDescription:'Aulas individuais, professores selecionados e acompanhamento da evolução do aluno em um único serviço.',whatsapp:'',email:'',plansVisible:false,faqVisible:true,plans:[],faq:[{question:'Como funciona o acompanhamento?',answer:'Conversamos com a família, organizamos as aulas e acompanhamos a evolução do aluno.'},{question:'As aulas são individuais?',answer:'Sim. As aulas são online e individuais.'}]}
export function validContent(value:unknown):value is SiteContent{
 if(!value||typeof value!=='object')return false
 const c=value as SiteContent
 return typeof c.heroTitle==='string'&&c.heroTitle.length>2&&c.heroTitle.length<=300&&typeof c.heroDescription==='string'&&c.heroDescription.length<=2000&&typeof c.whatsapp==='string'&&(!c.whatsapp||/^55\d{10,11}$/.test(c.whatsapp))&&typeof c.email==='string'&&(!c.email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email))&&typeof c.plansVisible==='boolean'&&typeof c.faqVisible==='boolean'&&Array.isArray(c.plans)&&c.plans.length<=20&&c.plans.every(p=>typeof p.id==='string'&&typeof p.label==='string'&&p.label.length>=3&&p.label.length<=120&&Number.isInteger(p.lessons)&&p.lessons>0&&Number.isFinite(p.price)&&p.price>=0&&typeof p.note==='string'&&p.note.length<=2000&&typeof p.featured==='boolean')&&Array.isArray(c.faq)&&c.faq.length<=30&&c.faq.every(f=>typeof f.question==='string'&&f.question.length>0&&f.question.length<=300&&typeof f.answer==='string'&&f.answer.length<=3000)
}
const Context=createContext<SiteContent>(defaultContent)
export const useSiteContent=()=>useContext(Context)
export function SiteContentProvider({children}:{children:ReactNode}){
 const [content,setContent]=useState(defaultContent)
 useEffect(()=>{let mounted=true;const refresh=async()=>{if(!db)return;const r=await db.from('site_versions').select('content').eq('published',true).maybeSingle();if(mounted&&!r.error&&validContent(r.data?.content))setContent(r.data.content)};void refresh();window.addEventListener('focus',refresh);return()=>{mounted=false;window.removeEventListener('focus',refresh)}},[])
 return <Context.Provider value={content}>{children}</Context.Provider>
}
