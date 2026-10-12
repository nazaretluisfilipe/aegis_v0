# Comece aqui — Aégis

## Ação de agora: instalar a base administrativa

Você informou que não há tabelas no projeto Supabase. Este SQL foi preparado para essa condição.

1. Extraia este ZIP no Windows (botão direito → Extrair tudo).
2. Dentro de `aegis_site_v0_admin`, abra `supabase/migrations/0001_admin.sql` com o Bloco de Notas.
3. Pressione Ctrl+A e Ctrl+C para copiar todo o conteúdo.
4. Abra https://supabase.com/dashboard/project/jliyhwlmdhmmqaamzrio/sql/new
5. Cole o conteúdo no editor vazio e clique em **Run**.
6. O resultado esperado é uma linha com `profiles_com_rls = true` e `funcao_admin = is_admin()`.
7. Envie uma captura do resultado ao assistente. Não execute novamente se houver erro: envie a mensagem completa.

O script cria só a base de acesso. Não cria alunos, planos, cobranças ou aulas. Não cadastra uma senha nem escolhe um administrador.
Se o SQL já tiver sido executado com sucesso, uma segunda execução encontrará objetos existentes; não apague as tabelas para resolver isso.

## Etapas seguintes, após a validação acima

### Conta de administrador
Supabase → Authentication → Users → Add user → Create new user.
Use seu e-mail e uma senha forte criada por você. Marque a opção de confirmar o e-mail quando disponível.
Não envie a senha no chat. Depois abra `supabase/02_promover_admin.sql`, substitua SEU_EMAIL_AQUI pelo e-mail exato da conta criada e execute em uma nova consulta SQL.
O resultado precisa mostrar seu e-mail, role `admin` e active `true`.

### Vercel
Antes de publicar, confirmar qual projeto/repositório está conectado ao site atual.
Em Project → Settings → Environment Variables, manter as variáveis existentes de WhatsApp e Apps Script e adicionar as duas variáveis Supabase de `.env.example` (URL e chave publishable).
Não substitua variáveis comerciais existentes pelos campos vazios do exemplo.
Publicar primeiro em Preview; testar antes de promover a produção.

### Teste real
- `/admin` sem sessão exibe login, sem conteúdo administrativo.
- Senha incorreta produz mensagem e permite tentar de novo.
- Sua conta promovida abre o painel.
- Recarregar mantém a sessão; sair e recarregar volta ao login.
- Uma segunda conta comum não abre o painel nem lê o perfil alheio pela API.
- Desativar o admin no banco e voltar à aba bloqueia o painel.
- Site público, valores, formulário real/Sheets e WhatsApp continuam funcionando.

Ainda não foi publicado nem testado na sua conta. Vamos validar essas etapas juntos.
