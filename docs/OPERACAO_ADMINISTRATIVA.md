# Operação do MVP

1. Acesse `/admin` com uma conta administrativa ativa.
2. Em Responsáveis e alunos, cadastre a família e o primeiro responsável; selecione a família e adicione os estudantes.
3. Crie professores em Professores. A desativação retira o professor da seleção para novos agendamentos.
4. Registre a contratação em Planos e saldos. Informe quantidade, valor e condições aprovadas. Não há cobrança automática. Ajustes de quantidade exigem justificativa e não podem ser inferiores ao realizado.
5. Prepare o acesso: no Supabase Authentication, crie/convide a conta do e-mail cadastrado. Configure retorno para `/responsavel/recuperar`. Após confirmação, use Vincular acesso confirmado no painel. O envio do convite é uma ação humana.
6. Em Aulas, escolha aluno, professor, disciplina, pacote, horário e Meet. Os horários seguem o fuso do navegador do operador; confirme que está em America/Sao_Paulo.
7. Materiais aceitam PDF/PNG/JPEG até 10 MB. Retirar do portal arquiva o material; links já emitidos podem continuar válidos por até 60 segundos. O arquivo é preservado para recuperação e retenção.
8. Marcar realizada consome uma unidade; repetir a operação não duplica. Cancelada ou falta não consome automaticamente. Reverter realizada libera a unidade.
9. Em Relatórios, escolha a aula (define aluno/família), cole o conteúdo externo, salve rascunho, revise, aprove e publique. Só o publicado aparece para a família. Editar exige nova aprovação. Não envie PDFs de rascunho como material, pois materiais não possuem revisão editorial.
10. Em Editor do site, carregue uma versão existente ou edite os campos. Salve nova versão e publique a versão desejada. Republicar uma versão anterior restaura seu conteúdo. Reabra a homepage para conferir.
11. Em Interessados, consulte os contatos recebidos e registre contatado/encerrado. Não há envio automático de mensagens.

Para desativar acesso de um responsável, use o botão na lista. A RLS interrompe consultas privadas assim que o registro fica inativo, independentemente do token ainda existente.
Não transfira um aluno ou uma contratação entre famílias com histórico existente sem procedimento de revisão dos vínculos.
