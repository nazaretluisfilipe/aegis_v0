# Plano de implantação — Aégis Educational

Data: 12/10/2026. Fonte: ZIP recebido e relatório de continuidade.
Objetivo: operação real de acompanhamento acadêmico, preservando React/Vite, Vercel, marca e preços.

## Sequência e critérios para avançar

| Etapa | Entrega prática | Critério de conclusão |
|---|---|---|
| 1. Acesso | Supabase Auth, perfis, administrador autorizado | Login, logout, conta comum bloqueada e API protegida testados no Supabase real |
| 2. Contatos | Lista, detalhes, status e notas de atendimento no painel | Contato enviado pelo formulário aparece uma vez, com consentimento, e só equipe autorizada pode ler |
| 3. Famílias | Responsáveis, estudantes, vínculos e professores | Cadastrar, editar, pesquisar e vincular sem duplicações ou acesso indevido |
| 4. Contratação | Plano contratado, pagamentos manuais e saldo de aulas | Valores conferidos, pagamento registrado antes de confirmar a aula e histórico preservado |
| 5. Aulas | Agenda, disciplina, professor, link e status | Aula de 50 minutos, conflito identificado e cancelamento sem descontar saldo incorretamente |
| 6. Acompanhamento | Relatório por aula e materiais privados | Rascunho não publicado fica restrito; somente a família correta recebe o relatório publicado |
| 7. Produção | Vercel, domínio, fluxo completo, rotina de recuperação | Simulação de atendimento até relatório concluída, permissões verificadas e HTTPS confirmado |

## Primeira etapa preparada nesta revisão
Código e instalação mínima revisados; build e 16 testes locais aprovados.
Pendente: aplicar SQL, criar conta real, promover administrador e validar em Preview.
O Table Editor vazio informado pelo usuário não confirma outros ajustes de Auth, e-mail ou Data API.

## Decisões para reduzir complexidade inicial
- Manter atendimento humano por WhatsApp e escolha assistida de professor.
- Começar com registros manuais de pagamento. Gateway e cobrança recorrente vêm depois.
- Manter Apps Script funcionando até o novo fluxo de contatos passar no teste completo. Não operar dois destinos sem estratégia contra duplicação.
- Para contatos no Supabase, preferir endpoint com validação e proteção contra abuso; navegador não deve receber permissão de leitura de contatos.
- Começar com painel exclusivo da equipe. Portais de famílias e professores exigem regras próprias e entram depois.
- Criar migrations pequenas conforme cada fluxo. O SQL completo antigo permanece arquivado e precisa de revisão.
- Conferir permissão no banco em cada operação; proteção visual da rota é complementar.
- Evitar apagar registros financeiros/histórico: prever cancelamento e arquivamento.
- Valores monetários em centavos ou decimal exato; duração padrão de 50 minutos.
- Datas armazenadas com fuso e exibidas em America/Sao_Paulo.
- Os preços são R$ 135,50; R$ 259,99; R$ 509,99; R$ 719,99; R$ 864,90.
- Disciplinas: Matemática, Física, Química e Biologia.
- Não implementar repasse automático de 60–70% sem decisão comercial específica.
- Não presumir capacidade de atendimento a partir de número de professores ainda não cadastrados.

## O que depende da conta/decisões reais
Projeto e repositório conectados à Vercel; deploy atual; domínio e DNS; WhatsApp e e-mail de atendimento; endpoint Apps Script ativo; professores disponíveis; forma de recebimento; condições de cancelamento; dados jurídicos para privacidade.
Esses pontos serão pedidos no momento em que bloquearem a etapa correspondente, sem um questionário inicial longo.

## Verificação antes de divulgar
Cadastro e pagamento de teste identificados como fictícios; permissões e consentimento conferidos; formulário validado no destino real; mobile e desktop; nenhuma promessa de funcionalidade inexistente; contatos reais funcionando; procedimento de backup/recuperação documentado; revisão das condições comerciais e da política de privacidade com os dados reais da empresa.

## Limites da revisão atual
Não houve acesso autenticado às contas Supabase, GitHub, Vercel ou Hostinger.
Nenhum deploy, alteração de DNS ou operação com dados reais foi executado.
Não houve teste visual de navegador. Testes locais de SQL não equivalem a certificação de segurança ou conformidade.
