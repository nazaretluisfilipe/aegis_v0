# Deploy e recuperação

Projeto Vercel `aegis-v0`; produção usa `main`. Desenvolvimento entregue na branch `desenvolvimento-mvp-20261012` a partir de `2c30d37`. Não substituir a main sem revisão.

Execute `npm ci`, `npm test`, `npm run build`. Necessárias: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (publishable/anon, nunca service_role). `VITE_LEADS_ENDPOINT` é opcional; vazio usa Supabase. Contatos e planos públicos podem ser configurados no editor.

Banco conectado: `jliyhwlmdhmmqaamzrio`. Aplicadas as três migrações novas, incluindo 0004 que estava pendente. Consultar histórico real antes de qualquer reaplicação.

Push na branch de desenvolvimento deve criar prévia pela integração Git. Se não criar, usar deploy de preview do mesmo projeto/commit. Confirmar READY e abrir rotas públicas/privadas.

Produção anterior conhecida: `dpl_5NqmhMjMRPGdWy6USSnyWoG3WeR4`, commit `71a80a52e63ef873a9711fdb6b8b03e4431ac2ff`. Domínios: aegisedu.com.br, www.aegisedu.com.br e aegis-v0.vercel.app.

Antes de publicar: concluir testes autenticados, confirmar remetente/URLs Auth, configurar contatos e condições, testar versão construída com variáveis de produção. Caso falhe após release, promover o deployment de produção anterior. Não remover tabelas ou colunas para reverter o frontend: migrações são aditivas, com extensões de constraints compatíveis com registros anteriores.

A listagem de deployments com teamId explícito retornou 403 nesta sessão; consultas diretas por projeto e deployment funcionaram. Não alterar permissões do time para contornar esse erro.
