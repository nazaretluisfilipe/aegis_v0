# Arquitetura

React 18 + TypeScript + Vite. `main.tsx` seleciona site, `/admin` ou `/responsavel`; áreas privadas são carregadas sob demanda. Supabase Auth autentica; RLS e funções verificam autorização no banco. O cliente usa somente a URL pública e chave publishable/anon.

Família possui responsáveis e alunos. Responsável vincula `auth_user_id` a uma conta confirmada. Pacotes pertencem à família; aulas referenciam aluno e pacote compatíveis. Professor pode ser um cadastro estruturado ou nome preservado do histórico.

Relatórios referenciam aula, herdando seu aluno e família. Estados draft → approved → published. Conteúdo alterado retorna a draft. Storage de materiais é privado, URLs duram 60 segundos. Materiais arquivados não são acessíveis por novas URLs do responsável.

O saldo deriva dos registros completed; nunca se mantém contador mutável independente. Trigger bloqueia o pacote antes de validar capacidade. Ajustes de quantidade são registrados em `package_adjustments`. Auditoria de ações contém entidade, ID, ator e operação, sem copiar textos de estudantes.

`site_versions` armazena versões JSON; índice permite somente uma publicação e função publica atomicamente. React escapa textos e valida estrutura antes de renderizar. Contatos de `lead_requests` só são consultáveis pela administração; visitantes têm INSERT limitado a campos públicos.

Migrações antigas possuem nomes 0001–0004 e histórico remoto anterior não uniforme. Não executar reset/push indiscriminadamente: conferir a lista remota e aplicar somente as faltantes revisadas.
