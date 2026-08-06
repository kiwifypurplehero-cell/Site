# PlumpGames

Site estático oficial da PlumpGames servido por um Cloudflare Worker, que também valida sessões administrativas. A URL canônica é <https://site.kiwifypurplehero.workers.dev/>.

## Secrets administrativos

Cadastre **Secrets**, nunca variáveis de texto comuns, em: **Cloudflare Dashboard → Workers & Pages → site → Settings → Variables and Secrets → Add → Type: Secret**.

- `ADMIN_USERNAME`: username administrativo em minúsculas, no formato `^[a-z0-9._-]{3,24}$`.
- `ADMIN_PASSWORD_HASH`: hash PBKDF2-SHA-256 no formato `pbkdf2-sha256$210000$SALT_BASE64$HASH_BASE64`.
- `SESSION_SECRET`: segredo aleatório longo usado exclusivamente para assinar cookies de sessão.

Gere localmente um hash e um segredo sem colocá-los no Git:

```bash
node -e "const c=require('crypto'),p=process.argv[1],s=c.randomBytes(16),n=210000; console.log('pbkdf2-sha256$'+n+'$'+s.toString('base64')+'$'+c.pbkdf2Sync(p,s,n,32,'sha256').toString('base64'))" 'SENHA_DE_TESTE'
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Crie um arquivo `.dev.vars` local (ele é ignorado pelo Git), preencha os três valores e execute `npx wrangler dev`. Nunca faça commit desse arquivo. A senha permanece sensível a maiúsculas e minúsculas.

## Arquitetura e limites

`worker.js` trata login, logout e consulta de sessão antes de encaminhar arquivos para o binding `ASSETS`. O cookie administrativo é HttpOnly, Secure, SameSite=Strict, assinado e expira em duas horas. Perfis comuns são apenas locais, sem senha, sincronização ou papel administrativo.

O modo editor atual oferece somente pré-visualizações demonstrativas. Edição de jogos, status, notícias, links, destaques e conteúdo futuro não é persistida após um novo deploy. Endpoints administrativos futuros devem sempre chamar `requireAdminSession(request, env)` antes de executar qualquer alteração permanente.
