# PlumpGames

## Bridge de controles para jogos incorporados

Jogos publicados na mesma origem da PlumpGames recebem os eventos virtuais
diretamente. Para um jogo controlado pela equipe, mas hospedado em outra origem,
copie `plumpgames-input-bridge.js` para o projeto do jogo e carregue-o antes do
script principal:

```html
<script src="/plumpgames-input-bridge.js"></script>
<script src="/game.js"></script>
```

O bridge aceita mensagens somente de
`https://site.kiwifypurplehero.workers.dev`, responde à detecção automática e
transforma `keydown`/`keyup` em `KeyboardEvent` dentro do jogo. Ele também evita
eventos duplicados e solta teclas em `blur`, `pagehide` e `beforeunload`.

Jogos externos cross-origin que não incluam o bridge não podem receber teclado
sintético por causa do isolamento de origem do navegador. Nesse caso, a
indisponibilidade aparece somente nas configurações de Loadouts.

Site estático oficial da PlumpGames: <https://site.kiwifypurplehero.workers.dev/>.

O Cloudflare Worker serve os assets do site e o endpoint `POST /api/support` do PJ Assistant, sem banco de dados, autenticação, contas, cookies de sessão ou secrets. As opções de aparência, acessibilidade, visualização e live wallpaper são armazenadas localmente no navegador com `localStorage`.

O assistente usa o binding `AI` do Workers AI, configurado em `wrangler.jsonc`, e o modelo `@cf/meta/llama-3.1-8b-instruct-fast`. Nenhum token é enviado ou armazenado no navegador. Em desenvolvimento, `npx wrangler dev` disponibiliza tanto os assets quanto o binding; se a IA estiver indisponível, o frontend responde localmente a dúvidas básicas sobre jogos, downloads, menu, wallpapers e tela cheia.

## Desenvolvimento

Sirva a raiz com qualquer servidor estático ou execute `npx wrangler dev`. Para publicar no Cloudflare Workers, execute `npx wrangler deploy`.

## Jogos automáticos

A PlumpGames lista automaticamente todos os repositórios públicos válidos da conta GitHub `kiwifypurplehero-cell`. Para adicionar um novo jogo:

1. Crie um novo repositório público.
2. Coloque o jogo nele.
3. Pronto.

Não é necessário editar o site, cadastrar um tópico, adicionar um arquivo de configuração ou fazer um novo deploy. Na próxima visita (ou ao usar **Atualizar jogos**), o navegador consulta a API pública do GitHub e cria os cards dinamicamente.

Forks, repositórios arquivados e o repositório `Site` são ignorados. A lista interna `IGNORED_REPOSITORIES`, em `script.js`, permite excluir outros repositórios no futuro. Para reduzir consultas à API, os dados são mantidos no `localStorage` por cinco minutos; se o GitHub estiver indisponível ou limitar as requisições, a última cópia salva continua visível.

## Página dedicada do jogo

**Jogar agora** abre `play.html` em uma nova aba. A página resolve o repositório para o domínio GitHub Pages autorizado e reúne tela cheia, resoluções proporcionais, reinício, loadouts locais e fechamento no menu da engrenagem. Loadouts PC e PS5 são salvos por jogo e enviam eventos pelo bridge `postMessage` quando o jogo incorporado confirma compatibilidade.

As regras compartilhadas de URL segura e escala proporcional ficam em `play-utils.js`. Para executar os testes automatizados dessas regras e a auditoria contra código legado do launcher, use `npm test`.

## Catálogo da comunidade (Cloudflare D1)

Os jogos enviados usam o binding D1 `DB` no Worker; preferências locais continuam separadas e não são usadas como banco do catálogo. O projeto reutiliza com segurança o D1 já provisionado, criando somente a tabela independente `community_games` (nenhuma tabela de autenticação é consultada).

Antes do primeiro deploy desta versão, autentique o Wrangler e aplique a migration remota:

```sh
npx wrangler d1 migrations apply plumpgames-auth --remote
npx wrangler deploy
```

Para desenvolvimento local, use `npx wrangler d1 migrations apply plumpgames-auth --local` e `npx wrangler dev`. Se outro banco for preferido, crie-o com `npx wrangler d1 create plumpgames-community` e substitua apenas `database_name` e `database_id` no binding `DB` de `wrangler.jsonc`.

## Home, Emuladores e biblioteca PS2

A navegação principal separa **Home** (catálogo de jogos web/comunidade) de **Emuladores**. A página `emulators.html` lê o registro declarativo em `emulator-registry.js`; portanto, um novo sistema entra na arquitetura como outra definição (identificador, formatos, prefixo R2 e URLs do núcleo), sem duplicar a interface. O mesmo registro é importado pelo Worker para validar rotas e nunca aceitar um prefixo fornecido pelo visitante.

A biblioteca PS2 usa o binding privado R2 `GAME_ROMS`. Crie o bucket indicado em `wrangler.jsonc` e publique cada ROM nesta convenção:

```text
emulators/ps2/games/<slug>/game.iso
emulators/ps2/games/<slug>/game.bin
emulators/ps2/games/<slug>/game.chd
```

O `<slug>` deve conter letras minúsculas, números e hífens. `GET /api/emulators/ps2/games` lista o prefixo e detecta esses objetos automaticamente; arquivos fora da convenção são ignorados. O nome inicial é derivado do slug. ROMs não fazem parte do Git e o bucket não deve ser público.

### Endpoints

| Método | Endpoint | Função |
| --- | --- | --- |
| `GET`/`HEAD` | `/api/emulators` | Sistemas suportados e estado do núcleo |
| `GET`/`HEAD` | `/api/emulators/:id/games` | Jogos detectados no R2 |
| `GET`/`HEAD` | `/api/emulators/:id/games/:slug/rom` | Streaming privado da ROM |

O endpoint de ROM encaminha o cabeçalho HTTP `Range` ao R2. O bucket devolve somente o intervalo solicitado e o Worker responde `206 Partial Content`, `Accept-Ranges: bytes`, `Content-Range` e `Content-Length`. Isso permite que um núcleo WebAssembly leia setores sob demanda, sem baixar a imagem inteira antes de iniciar. Sem `Range`, a resposta é `200`; `HEAD` retorna apenas metadados.

### Configuração Cloudflare e secrets

O R2 é um **binding**, não um secret. Crie manualmente o bucket `plumpgames-roms` (`npx wrangler r2 bucket create plumpgames-roms`) e envie ROMs autorizadas pelo painel ou Wrangler. O binding `GAME_ROMS` já está declarado em `wrangler.jsonc` e é usado exclusivamente em `emulator-api.js` para listar, consultar e transmitir objetos.

Esta implementação **não requer nenhum secret novo**. Não configure chaves R2 no frontend: Workers acessam R2 pelo binding. O binding `AI` continua sendo usado em `worker.js` pelo PJ Assistant e `DB` pelo catálogo comunitário. Se futuramente houver upload administrativo por API, crie um secret (por exemplo, `ROM_ADMIN_TOKEN` via `wrangler secret put`) e use-o somente no Worker; esse endpoint deliberadamente não existe nesta versão.

### Pendente: núcleo PS2 WebAssembly real

O catálogo e o transporte das ROMs estão prontos, mas o botão **Preparar** informa que o núcleo ainda está pendente. Para emulação real ainda é necessário:

1. escolher/licenciar um núcleo PS2 compatível com WebAssembly e compilar `core.js`/`core.wasm`;
2. implementar no núcleo um leitor assíncrono de blocos que faça Range Requests ao endpoint da ROM;
3. conectar canvas/WebGL ou WebGPU, WebAudio, Gamepad/teclado e o bridge de controles;
4. definir o fluxo legal e local de BIOS (preferencialmente selecionada pelo usuário e mantida no navegador, nunca versionada ou enviada ao servidor);
5. adicionar isolamento `COOP`/`COEP` se o núcleo usar `SharedArrayBuffer`, persistência de saves e testes de desempenho/compatibilidade;
6. trocar `core.status` para `ready` somente depois que carregamento, pausa, save e encerramento estiverem implementados.
