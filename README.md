# PlumpGames

Site oficial: <https://site.kiwifypurplehero.workers.dev/>. O Cloudflare Worker serve os assets e implementa autenticação real com Cloudflare D1, PBKDF2 e sessões HttpOnly.

## Criar e configurar o D1

```bash
npx wrangler d1 create plumpgames-auth
```

Copie o `database_id` retornado para `wrangler.jsonc`, mantendo o binding com o nome **DB**. Aplique a migration localmente e no banco de produção:

```bash
npx wrangler d1 migrations apply plumpgames-auth --local
npx wrangler d1 migrations apply plumpgames-auth --remote
```

No Dashboard, confirme em **Workers & Pages → site → Settings → Bindings** que o binding D1 `DB` aponta para `plumpgames-auth`. O deploy automático precisa usar o diretório raiz, `worker.js` como entrypoint e a configuração `wrangler.jsonc`. Não é necessário cadastrar username, senha ou segredo administrativo no Worker.

## Autenticação e segurança

- `POST /api/auth/register` cria somente contas `user` e persiste perfil e preferências no D1.
- `POST /api/auth/login` identifica `user` ou `admin` pelo banco.
- `GET /api/auth/session` restaura exclusivamente dados públicos.
- `POST /api/auth/logout` revoga a sessão no D1 e remove o cookie.
- Rotas `/api/admin/*` usam `requireAdminSession`: sem sessão retornam 401 e contas comuns recebem 403.
- Senhas recebem PBKDF2-SHA-256 com salt aleatório e 210.000 iterações. Tokens aleatórios são enviados apenas em cookie HttpOnly; somente seu SHA-256 fica no D1.

Sem **Salvar meu login**, o cookie não tem `Max-Age` (cookie de navegador), embora a sessão do servidor tenha limite de 12 horas. Com a opção marcada, o cookie e a sessão expiram em cerca de 30 dias. Ambos usam `Secure`, `HttpOnly`, `SameSite=Strict` e `Path=/`.

Consulte [ADMIN_SETUP.md](ADMIN_SETUP.md) para promover a primeira conta com um comando administrativo seguro.
