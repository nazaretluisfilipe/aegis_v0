# Aégis — ativação protegida do formulário

> Estado em 28/10/2026: código preparado, **não ativado em produção**. O fluxo existente de CRM/Supabase continua funcionando enquanto o recurso não estiver configurado. Não inserir segredos em arquivos Git ou no frontend.

## Pré-requisitos e sequência de ativação

1. Criar widget Cloudflare Turnstile vinculado aos domínios `aegisedu.com.br` e `www.aegisedu.com.br`, com `action: diagnostico`. O Turnstile pode ser usado independentemente do DNS.
2. Criar chave de servidor restrita no Supabase (`sb_secret_...`) com privilégios administrativos necessários, armazenada **exclusivamente** nas variáveis protegidas da Vercel. Usar um único projeto e confirmar o ID correto (`aegis-educational`).
3. Configurar na Vercel **somente como variáveis de servidor**: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY` legado) e `TURNSTILE_SECRET_KEY`.
4. Configurar a variável pública **`VITE_TURNSTILE_SITE_KEY`** (é apenas a *site key*, nunca a *secret*). A build precisa ocorrer depois de configurar a variável pública, pois o Vite embute variáveis `VITE_*` na compilação.
5. Testar primeiro em prévia do Vercel com hostname autorizado. **A prévia precisa do seu próprio hostname Turnstile**, e a variável `AEGIS_ALLOWED_ORIGINS` pode conter a origem exata correspondente; nunca usar `*`.
6. Testar chamada ao endpoint `/api/diagnostico` com token válido (confirma inserção **uma vez**), token inválido (bloqueia), campos inválidos e falha de rede (preserva campos e oferece WhatsApp).
7. Apenas **depois** de confirmar que a produção envia via servidor: remover a capacidade de `anon` inserir diretamente em `public.lead_requests` (rever os `GRANT INSERT (colunas)` existentes e a policy `leads_public_insert`). Registrar isso como uma migração revisada e testada; não aplicar antes da ativação.
8. Verificar Logs da Vercel e Supabase, sem registrar nome, telefone, laudos ou segredos. Ter rollback pronto: restaurar a policy somente se estritamente necessário após análise.

## Segurança do endpoint

- Rejeita métodos não-POST, Content-Type inválido, origem diferente da permitida, payload acima de 12 KiB e campos fora dos limites.
- Confere token Turnstile **no servidor** por Siteverify; valida `success`, `hostname` e `action=diagnostico`. Tokens são descartáveis, com validade de cinco minutos.
- Usa chave privada do Supabase apenas na função Vercel, nunca no bundle. Dá suporte tanto a `sb_secret_...` (header `apikey`) quanto à chave `service_role` legada (JWT Bearer).
- Bloqueia escrita em caso de falha do desafio ou banco; responde com erro genérico, sem vazar detalhes internos.
- A ação de cadastro no CRM continua pendente de **verificação real de sucesso em produção** antes de encerrar a Fase 1.

## Limitações conhecidas

- Não há `Code.gs` versionado neste repositório, e a implementação pública atual usa o CRM Supabase, não uma integração comprovada com Google Sheets. Preservar eventual integração externa até reconciliar os fluxos.
- Consentimento específico para dados sensíveis ainda depende de decisão jurídica. O formulário instrui a **não inserir laudos ou diagnósticos**, minimizando a coleta, mas isso não substitui uma política de tratamento de dados sensíveis.
- Razão social, CNPJ, endereço, encarregado e regras comerciais precisam ser fornecidos e validados. Não usar dados fictícios no site oficial.
- As credenciais da Vercel não foram lidas nem exportadas. Somente o titular deve cadastrá-las.
- `noindex`, `no-store` e CSP Report-Only devem ser confirmados por cabeçalhos HTTP em cada rota publicada.

## Comandos de verificação

```bash
npm ci
npm run build
npm test
node --check api/diagnostico.js
node --check scripts/lead-api.test.mjs
npm run preview -- --host 127.0.0.1 --port 4173
# smoke no GitHub Actions com Playwright (nunca grava no Supabase de produção)
```

## Fontes técnicas
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/frameworks/frontend/vite
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
