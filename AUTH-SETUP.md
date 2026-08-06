# Configuração do Supabase Auth

O site usa somente a URL e a chave pública (`publishable` ou `anon`) no navegador. Nunca publique `service_role`, senhas de banco nem segredos OAuth.

## 1. Supabase

1. Crie um projeto e execute `supabase-schema.sql` no SQL Editor.
2. Em **Authentication > URL Configuration**, defina `https://site.kiwifypurplehero.workers.dev/` como Site URL e adicione a mesma URL à lista de Redirect URLs.
3. Copie a Project URL e a chave pública em `config.js`, nos campos `SUPABASE_URL` e `SUPABASE_PUBLIC_KEY`.
4. Em **Authentication > Providers**, habilite Google, Azure e Apple com os identificadores e segredos criados nos consoles de cada provedor. Esses segredos ficam apenas no painel do Supabase.
5. Use a callback exibida pelo Supabase para os três provedores: `https://<project-ref>.supabase.co/auth/v1/callback`.

## 2. Google Cloud

1. Configure a tela de consentimento OAuth e os escopos básicos `openid`, `email` e `profile`.
2. Crie credenciais **OAuth client ID** do tipo Web application.
3. Adicione a callback do Supabase como **Authorized redirect URI**.
4. Informe Client ID e Client Secret somente em **Supabase > Authentication > Providers > Google**.

## 3. Microsoft Entra ID

1. Registre um aplicativo e escolha os tipos de conta que poderão entrar.
2. Em **Authentication > Web**, adicione a callback do Supabase.
3. Conceda a permissão delegada `email` (além de `openid` e `profile` usados pelo OAuth/OIDC).
4. Crie um client secret e informe Application (client) ID e secret somente no provedor Azure do Supabase. O frontend usa o identificador `azure`, nunca `microsoft`.

## 4. Apple Developer

1. Ative **Sign in with Apple** para um App ID e crie um Services ID para o site.
2. Configure o domínio `<project-ref>.supabase.co` e a callback do Supabase como Return URL.
3. Crie uma chave Sign in with Apple e obtenha Team ID, Services ID e Key ID.
4. Gere o client secret conforme a documentação da Apple e cadastre os valores somente no provedor Apple do Supabase. Renove o secret antes do vencimento.

Depois de configurar, teste cada provedor em uma janela anônima. O retorno sempre vai para a página inicial; o site restaura a sessão e consulta `public.profiles`. Usuários sem perfil completo recebem o onboarding, enquanto perfis com `onboarding_completed = true` entram diretamente.
