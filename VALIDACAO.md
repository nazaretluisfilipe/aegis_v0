# Validação — 12/10/2026

- npm ci: concluído.
- npm run build: TypeScript e Vite aprovados.
- npm run test:admin: 16 testes aprovados em PostgreSQL embarcado (PGlite).
- Verificados: RLS, perfis preexistentes, rejeição de promoção por metadados, anônimo sem leitura/RPC, isolamento entre perfis, bloqueio de INSERT/UPDATE/DELETE, promoção explícita, desativação e revogação de admin, criação com nome longo.
- Site público: alterações limitadas a Biologia, descrição de duração/composição dos planos; preços mantidos.
- Não executados: testes visuais de navegador, Supabase Auth real, Data API real, aplicação do SQL no projeto, publicação Vercel, DNS, integração real Apps Script e pagamentos.

Não interpretar aprovação local como validação de produção.
