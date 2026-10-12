# Aégis Educational — base administrativa revisada

Comece por **COMECE_AQUI.md**. Planejamento completo: **PLANO_IMPLANTACAO.md**.

React 18 + Vite 5 + TypeScript + Tailwind. Hospedagem prevista: Vercel existente.
Esta revisão mantém o projeto, identidade visual, preços e integração Apps Script.

## O que está pronto no código
- Site público com Biologia, aulas de 50 minutos e combinação de disciplinas.
- `/admin` com autenticação Supabase e verificação `is_admin()` no banco.
- Instalação mínima: somente `profiles`, RLS, função de permissão e gatilho Auth.
- Falhas de rede no login retornam mensagem e liberam o botão para tentar novamente.
- Permissão revalidada nos eventos de sessão e ao voltar à janela.
- Chave publicável e URL fornecidas pelo usuário em `.env.example`. Não contém segredo.

## O que ainda não está pronto
- Gestão de famílias, professores, pagamentos, aulas e relatórios: telas de estrutura.
- Formulário ainda usa Google Apps Script, não grava no Supabase.
- Nenhuma alteração foi aplicada na conta Supabase, GitHub, Vercel ou DNS.
- Login real e comportamento visual no navegador ainda aguardam validação.
- SQL completo em `_arquivo` é referência futura, não uma migration executável.
- Os arquivos antigos em `src/pages`, `src/contexts`, `src/supabase.ts` e `ProtectedRoute` não estão ligados ao ponto de entrada ativo; não representam módulos entregues.

## Desenvolvimento
Node 22 ou superior recomendado (verificação realizada com Node 24).
```sh
npm ci
# Copiar .env.example para .env.local antes de rodar o app.
npm run dev
npm run build
npm run test:admin
```

O teste usa PostgreSQL embarcado PGlite, em memória, e não acessa dados reais.
Simula apenas a estrutura necessária de Auth. Não testa Supabase Auth, PostgREST,
Storage, envio de e-mail ou a interface do navegador de ponta a ponta.

## Configuração
- `VITE_SUPABASE_URL`: URL base sem `/rest/v1/`.
- `VITE_SUPABASE_ANON_KEY`: aceita a chave publishable fornecida, apesar do nome legado.
- `VITE_WHATSAPP_NUMBER`: número real completo, somente dígitos.
- `VITE_CONTACT_EMAIL`: e-mail real de atendimento.
- `VITE_SITE_URL`: endereço de produção validado.
- `VITE_LEADS_ENDPOINT`: implantação Apps Script atual, preservada na Vercel.

Nunca colocar chave secret/service_role em variável VITE_. A autorização depende do banco.

## Mudanças principais
- `supabase/migrations/0001_admin.sql`: substitui instalação monolítica por base mínima.
- `supabase/02_promover_admin.sql`: promoção explícita de conta confirmada pelo SQL Editor.
- `src/admin/AdminAuth.tsx`, `AdminApp.tsx`, `supabaseAdmin.ts`: tratamento de conexão e revalidação.
- `src/config.ts`, `src/App.tsx`, `index.html`: Biologia e duração comercial de 50 minutos.
- `supabase/tests/admin.test.mjs`: 16 verificações automáticas de permissão.

Referências técnicas consultadas em 12/10/2026:
https://supabase.com/docs/guides/getting-started/api-keys
https://supabase.com/docs/guides/database/postgres/row-level-security
