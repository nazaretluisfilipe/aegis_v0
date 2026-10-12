# Estado em 12/10/2026

Base: `desenvolvimento-portal-responsavel`, commit `2c30d377af88d3027c9423674070227484e33b30`. Branch de entrega: `desenvolvimento-mvp-20261012`.

## Implementado e verificado em PostgreSQL
- Cadastro existente de famílias e estudantes preservado.
- Professores: cadastro, edição, disciplinas, contato, disponibilidade e desativação.
- Aulas: seleção de professor, disciplinas adicionais, ocorrência, falta sem consumo automático, materiais retirados do portal por arquivamento.
- Saldo por contagem de aulas concluídas, sem dupla dedução. Limite serializado por bloqueio do pacote. Ajustes justificados e registrados.
- Relatórios estruturados: rascunho, aprovação, publicação e retirada. Editar exige retornar ao rascunho.
- RLS: responsável consulta somente os relatórios publicados da sua família; sem acesso administrativo.
- Editor de site: título, descrição, contatos, planos, FAQ, visibilidade de planos/FAQ, versões e republicação.
- Formulário público grava contato básico no Supabase; painel de interessados permite acompanhar situação.
- Painel com indicadores consultados no banco e log mínimo de ações administrativas.
- Homepage oferece acesso à área do responsável no menu e rodapé.

## Banco remoto
Projeto confirmado pela variável do Vercel: `jliyhwlmdhmmqaamzrio` (`aegis-educational`). O outro projeto `ivkykwfnkxpfyiddoufq` não foi alterado.
Aplicadas nesta entrega: `material_integrity`, `operational_mvp`, `leads_and_package_adjustments`.
O teste `supabase/tests/remote-smoke.sql` passou no banco remoto: cadastro, conclusão repetida, bloqueio por saldo, rascunho invisível, publicado visível e isolamento de outra conta. Todos os dados de teste foram revertidos por ROLLBACK.

## Limitações e pendências de lançamento
- Ainda não validado o fluxo de login com uma conta real de responsável, e-mail de convite/recuperação e upload/download pelo Storage via navegador autenticado. O teste SQL não substitui esses fluxos.
- Convites continuam manuais no Supabase; o painel vincula uma conta já confirmada. Não foram enviados e-mails.
- Relatórios usam texto estruturado. PDF pode ser disponibilizado como material de aula, mas não integra o fluxo de aprovação de relatório: não anexar rascunhos como materiais.
- Não há portal de professores, pagamentos, gerador de IA nem automação externa de relatórios.
- Editor não altera todas as seções, imagens ou links arbitrários; escopo inicial cobre conteúdo principal, planos, contato e FAQ.
- Contato oficial, preços e condições precisam ser publicados pelo editor. Valores antigos de código não são apresentados como planos aprovados por padrão.
- Datas de vigência são informativas. Não há vencimento automático nem cobrança automática de faltas ou cancelamentos.
- O formulário público usa validações e consentimento; proteção contra abuso em volume (CAPTCHA/rate limiting) ainda precisa ser implementada antes de campanhas.
- A versão pública continua no commit `71a80a5` até validação de lançamento; prévia não equivale a produção.
- Avisos Supabase anteriores persistem: proteção de senhas vazadas desativada e três funções SECURITY DEFINER existentes, com verificações de autorização no corpo. Nenhum segredo foi incluído no frontend.
- Revisão jurídica de privacidade e dados institucionais continua pendente; não há afirmação de conformidade LGPD integral.

## Verificação
`npm test`: 49 verificações locais aprovadas. `npm run build`: TypeScript e Vite aprovados.
