# Área do responsável — ativação, integração e teste (outubro de 2026)

## Funcionalidades entregues
- Admin cadastra famílias, responsáveis e estudantes em `/admin/familias`.
- Admin envia convites pelo botão **Enviar convite de acesso**. Edge Function `aegis-guardian-access` valida JWT, `is_admin()`, família ativa e impede envio a cadastros de teste.
- O Supabase Auth envia o e-mail, caso o provedor de mensagens esteja habilitado e a URL de redirecionamento seja autorizada.
- O link leva a `/responsavel/ativar`, onde a conta confirmada define senha. O vínculo é realizado somente por email confirmado, conta ativa e identificação da família; credenciais administrativas nunca chegam ao frontend.
- Responsável já registrado no Auth pode usar recuperação de senha; após o login, o vínculo é tentado automaticamente.
- No portal, responsável visualiza estudantes, saldo de aulas, agenda, Meet, materiais privados e relatórios **publicados**, com filtros por estudante e disciplina. O botão **Atualizar dados** busca alterações do banco.
- Contas de demonstração ficam marcadas `is_demo` e mostram aviso visível de TESTE — FICTÍCIO.

## Ajustes obrigatórios antes de enviar convites de verdade
1. Em **Supabase Dashboard → Authentication → URL Configuration**, adicione explicitamente as URLs de retorno usadas no ambiente. Exemplo:
   - `https://aegisedu.com.br/responsavel/ativar`
   - `https://www.aegisedu.com.br/responsavel/ativar`
   - Para as prévias de desenvolvimento, a URL **exata** da prévia corrente, terminada em `/responsavel/ativar`.
   Use glob de preview apenas se compreender que ele amplia os destinos autorizados; prefira URL exata.
2. Em **Authentication → SMTP**, configure remetente corporativo, entregabilidade e limites para não depender de e-mails de demonstração do serviço.
3. Confirme que o domínio escolhido tem a rota `/responsavel/ativar` publicada. A versão de produção anterior não deve receber convites direcionados a ela.
4. Para testes via navegador protegido pelo Vercel Authentication, autentique-se no Vercel antes de abrir o link; a restrição da prévia não substitui Supabase Auth.
5. Não publique credenciais `service_role`. A Edge Function recebe essa variável apenas do ambiente seguro do Supabase.

## Teste prático completo — sem clientes reais
1. Abra `/admin/laboratorio` com uma conta de administrador.
2. Se ainda não existir cenário, selecione **Criar dados TESTE — FICTÍCIO**.
3. Clique **Gerar ou redefinir acesso TESTE**. A função cria ou redefine senha de uma conta fictícia do Supabase Auth, sem enviar e-mail. Anote as credenciais temporárias, sem salvá-las em screenshots.
4. Em **janela anônima**, abra `/responsavel`. Faça login com o e-mail e a senha temporária.
5. Confira a tarja amarela TESTE — FICTÍCIO; estudante fictício, plano de oito aulas, uma aula realizada, uma agendada, uma cancelada e saldo de **sete aulas restantes**.
6. Confira relatório publicado no menu de acompanhamento educacional. Rascunhos administrativos nunca devem aparecer ali.
7. Na janela da administração, crie ou ajuste **apenas** uma aula de teste vinculada à família fictícia ou um relatório novo para a aula fictícia; publique o relatório quando aprovado.
8. Na janela anônima, clique em **Atualizar dados** e confira a aula ou relatório atualizado; despublique o relatório na administração, atualize e confirme que desapareceu da área do responsável.
9. Em outra aba anônima sem sessão, confirme que `/responsavel` exige login.
10. Ao alterar ou desativar a vinculação do responsável no painel, verifique que a conta deixa de poder consultar os registros protegidos, independentemente da sessão anterior.

Não use contas reais de aluno, professor ou responsável nas simulações; não divulgue dados de teste como indicadores comerciais.

## Teste automatizado do banco
`supabase/tests/guardian-portal-e2e-rls.sql` simula, dentro de transação com `ROLLBACK`, publicação administrativa, leitura do próprio grupo familiar, bloqueio de outra família, rascunhos ocultos e proibição de escrita pelo responsável. Resultado da execução remota da entrega: passou, sem persistir novos dados.

## Limitações e próximos passos
- Teste de aceitação com navegador autenticado (formulário, e-mail recebido, senha e Storage) ainda precisa ser executado nas janelas reais; testes SQL e build não substituem isso.
- O convite utiliza o serviço de e-mail Supabase; se SMTP, domínio ou redirecionamento estiver incorreto, a entrega do e-mail não é garantida.
- A criação da conta fictícia pelo painel altera o Auth de teste de maneira permanente até exclusão administrativa futura, embora sempre com marcação `is_demo`. O login administrativo deve ser preservado em aba separada.
- Novos relatórios só ficam visíveis após aprovação e publicação pelo administrador.
