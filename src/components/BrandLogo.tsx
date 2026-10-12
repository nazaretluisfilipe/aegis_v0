/** Vector paths, no external font or bitmap dependency. */
export default function BrandLogo({compact=false,className=''}:{compact?:boolean;className?:string}){
 return <picture className={`inline-block max-w-full shrink-0 align-middle ${className}`}>
  {compact&&<source media="(max-width: 639px)" srcSet="/brand/aegis-wordmark.svg"/>}
  <img src="/brand/aegis-logo-dark.svg" alt="Aégis Educacional" width={1752} height={302}
   className={compact?'block h-auto w-[112px] sm:w-[238px]':'block h-auto w-[220px] max-w-full'} decoding="async"/>
 </picture>
}
