# Aegis Educational — site

Estado atual: **Fase 1 pronta** (site público, formulário, WhatsApp configurável, Google Sheets preparado, SEO, deploy).
**Painel administrativo: etapa 1** (apenas estrutura em `/admin`, veja a seção abaixo). **Ainda não existem** áreas do responsável/aluno nem gestão funcional de famílias, pagamentos, aulas e CMS (Fases 2 a 4 abaixo). Nada disso aparece no site público como se existisse.

## Tecnologia
Vite + React 18 + TypeScript + Tailwind 3 (a mesma stack do site original). Site estático: sem servidor para manter.

## Rodar localmente
1. Instale o Node 20+. 2. `npm install` 3. copie `.env.example` para `.env.local` e preencha 4. `npm run dev` (abre em localhost:5173).

## Onde configurar
| O quê | Onde |
|---|---|
| Número do WhatsApp (todos os botões) | `VITE_WHATSAPP_NUMBER` (só dígitos, `55` + DDD + número). Vazio = botões levam ao formulário |
| Mensagens pré-preenchidas | `src/config.ts` → `messages` |
| Preços e planos | `src/config.ts` → `singleLesson` e `plans` (valor por aula e economia são calculados sozinhos) |
| Logo definitiva | ponha o arquivo em `public/` e preencha `LOGO_SRC` em `src/App.tsx` |
| Domínio nos metadados | `VITE_SITE_URL`, e troque `SEU-DOMINIO.com.br` em `public/robots.txt` e `public/sitemap.xml` |

## Google Sheets (único passo que falta: sua conta Google)
1. Crie uma planilha no Google Sheets e copie o ID da URL (trecho entre `/d/` e `/edit`).
2. Em script.google.com, crie um projeto e cole `apps-script/Code.gs`.
3. Configurações do projeto → Propriedades do script → `SHEET_ID` = o ID copiado.
4. Implantar → Nova implantação → App da Web → executar como **você**, acesso **Qualquer pessoa**. Copie a URL `.../exec`.
5. Cadastre a URL em `VITE_LEADS_ENDPOINT` (local e na hospedagem) e refaça o build.
6. Teste: envie o formulário e confira a nova linha. Para trocar de planilha, mude `SHEET_ID`.
Campos enviados: responsável (nome, WhatsApp, e-mail), aluno (nome, idade, série, escola, disciplinas, objetivo, dificuldades, disponibilidade, frequência, observações), consentimento e origem.
Sem a URL, o formulário **não finge sucesso**: oferece continuar pelo WhatsApp. Limitação: a URL do Apps Script é pública; por isso há honeypot, validação no script e limite de tamanho. Para volume alto, use o Supabase (Fase 2).

## Publicar
Recomendado: **Vercel** (grátis para começar, HTTPS automático, `vercel.json` já cuida de rotas e cabeçalhos de segurança).
1. Crie conta no GitHub e suba o projeto (o `.gitignore` já exclui `.env`). 2. Em vercel.com: Add New → Project → importe o repositório (Vite é detectado). 3. Settings → Environment Variables: cadastre as 4 variáveis do `.env.example`. 4. Deploy.
**Domínio .com.br:** registre em registro.br; na Vercel: Settings → Domains → adicione `seudominio.com.br` e `www`. Aplique no Registro.br os registros DNS que a Vercel mostrar (A para o domínio raiz, CNAME para `www`). O HTTPS é emitido automaticamente em minutos a horas.

## Pendências antes de divulgar
- Preencher o WhatsApp e o endpoint do Sheets.
- Revisão jurídica da Política de Privacidade (`/privacidade`): razão social, CNPJ e encarregado de dados.
- Professores: a seção explica a curadoria; só mostre nomes e fotos reais quando houver cadastro.
- Confirmar se há aulas presenciais (o site hoje diz só "online").

## Painel administrativo (`/admin`) — etapa 1: estrutura e proteção
Existe só a **estrutura**: navegação (Visão geral, Famílias e alunos, Planos e pagamentos, Aulas, Relatórios e materiais, Configurações) e telas marcadas como "Ainda não implementado". Não lê nem grava dados, não tem pagamento online e não altera o banco.
- **Sem Supabase configurado, o painel fica bloqueado** e mostra quais variáveis faltam. Não há login simulado nem acesso "de teste".
- **Com Supabase:** exige login real (Supabase Auth, e-mail e senha) e só abre se a função `is_admin()` do banco (a mesma usada nas políticas RLS) responder `true`. Qualquer falha na verificação nega o acesso.
- O código do painel é um arquivo separado, carregado só em `/admin`; o site público não o executa. A proteção dos **dados** (nas próximas etapas) continua sendo a RLS do banco, não a tela.
- `/admin` não é indexado (`noindex`, `robots.txt` e cabeçalho na Vercel). `public/_redirects` faz `/admin` e `/privacidade` funcionarem em acesso direto no Netlify.

**Ativar (você faz, nada disso foi executado por mim):**
1. Supabase → SQL Editor: rode `supabase/migrations/0001_schema.sql` (em projeto novo).
2. Cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings → API; só a chave **anon**) no `.env.local` e na hospedagem; refaça o build.
3. Supabase → Authentication → Users → Add user (e-mail e senha, já confirmado).
4. SQL Editor, trocando o e-mail (o gatilho só roda na criação do usuário, por isso o `update` no perfil):
```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'SEU-EMAIL');
update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'SEU-EMAIL';
```
5. Abra `/admin` e entre.

## Próximas fases (arquitetura decidida)
Supabase (Postgres + Auth + Storage) com **Row Level Security**: autorização no banco, não no front, contra IDOR. Fase 2: login, tabelas, áreas responsável/aluno. Fase 3: aulas (link do Meet manual), materiais (bucket privado com URLs assinadas), relatórios. Fase 4: admin e edição de conteúdo.
