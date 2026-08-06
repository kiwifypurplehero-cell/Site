# Configuração segura do administrador da PlumpGames

A função da conta é armazenada no D1 e nunca é escolhida pelo formulário. Não use a senha administrativa antiga: se ela já foi divulgada, crie uma senha nova, longa e exclusiva.

## 1. Criar a conta

Acesse <https://site.kiwifypurplehero.workers.dev/>, use **Criar conta** e conclua as quatro etapas. O servidor normaliza o username para minúsculas e cria toda conta nova com `role = 'user'`.

## 2. Localizar e promover no D1

No diretório do projeto, confirme primeiro a conta (troque `minha-conta` pelo username normalizado):

```bash
npx wrangler d1 execute plumpgames-auth --remote --command "SELECT id, username, role FROM users WHERE username = 'minha-conta';"
```

Promova somente a conta conferida:

```bash
npx wrangler d1 execute plumpgames-auth --remote --command "UPDATE users SET role = 'admin', updated_at = datetime('now') WHERE username = 'minha-conta';"
```

Confirme o resultado:

```bash
npx wrangler d1 execute plumpgames-auth --remote --command "SELECT id, username, role FROM users WHERE username = 'minha-conta';"
```

Faça logout e entre novamente pelo mesmo formulário. O Worker lê `role` diretamente do banco e a interface mostrará o selo **ADMIN** e o Modo editor. Não há endpoint ou botão público de promoção.

## 3. Cuidados

- Execute comandos `--remote` apenas em um terminal administrativo autenticado no Cloudflare.
- Não coloque SQL com um username real, senhas, hashes, tokens ou arquivos `.dev.vars` no Git.
- Não crie endpoint temporário de promoção. Se algum mecanismo temporário for usado fora deste projeto, remova-o imediatamente após a configuração.
- Para revogar acesso: `UPDATE users SET role = 'user' WHERE username = 'minha-conta';` e apague as sessões desse usuário.
