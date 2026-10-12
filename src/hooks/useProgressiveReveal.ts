import {useEffect} from 'react'

/** Revela seções progressivamente sem esconder conteúdo sem JavaScript.
 * Desativado para movimento reduzido e navegadores sem IntersectionObserver.
 * Elementos já visíveis ou acima da tela nunca são ocultados.
 */
export function useProgressiveReveal(){
 useEffect(()=>{
  if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return
  const targets=Array.from(document.querySelectorAll<HTMLElement>('[data-aegis-reveal]'))
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)return
    entry.target.classList.remove('aegis-reveal-pending')
    observer.unobserve(entry.target)
   }
  },{threshold:0.08,rootMargin:'0px 0px -24px 0px'})
  for(const element of targets){
   const rect=element.getBoundingClientRect()
   if(rect.top>window.innerHeight-32){
    element.classList.add('aegis-reveal-pending')
    observer.observe(element)
   }
  }
  return()=>{observer.disconnect();for(const element of targets)element.classList.remove('aegis-reveal-pending')}
 },[])
}
