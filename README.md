# PlumpGames

## Perfil anônimo e tempo jogado

O navegador cria `plumpgames_player_id` com `crypto.randomUUID()` na primeira visita. Esse identificador local existe apenas para representar o perfil na interface; a API usa um cookie first-party `HttpOnly`, sem aceitar `playerId` em URL ou payload. Não há login, e-mail, fingerprint, identificação por IP ou sincronização confiável entre dispositivos. Se os dados locais/cookies forem apagados, nasce outro perfil.

Todos os players usam `PlaytimeTracker` e descritores estáveis (`git:web:<repo>` ou `emulator:<sistema>:<id>`). O contador só começa no carregamento efetivo do iframe ou primeiro frame do emulador, mede intervalos com `performance.now()`, pausa ao perder foco/visibilidade e persiste a cada 45 segundos ativos. Pausas, fechamento e `pagehide` fazem flush; `sendBeacon` é usado no encerramento. Uma trava local por jogador+jogo evita contagem dupla entre abas, e uma fila local limitada a 100 atualizações tolera períodos offline.

O D1 mantém `players`, `games`, `play_sessions` (auditoria e períodos futuros) e `play_stats` (resumo materializado para consultas rápidas). UUIDs, IDs, sequência idempotente e duração máxima de 60 segundos por atualização são validados pelo Worker. O painel `/profile.html` oferece resumo, ranking por tempo, tiers relativos por percentil (somente com três ou mais jogos), exportação JSON e exclusão completa.

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

A navegação principal separa **Home** (catálogo de jogos web/comunidade) de **Emuladores**. A página `Emuladores/index.html` lê o registro declarativo em `Emuladores/emulator-registry.js`; portanto, um novo sistema entra na arquitetura como outra definição (identificador, formatos e URLs do núcleo), sem duplicar a interface. O mesmo registro é importado pelo Worker para validar rotas.

A biblioteca PS2 usa a API S3 privada do Backblaze B2. No bucket `plumpgames-storage-ps2`, publique cada ROM nesta convenção:

```text
ps2/jogos/<slug>/game.iso
ps2/jogos/<slug>/game.bin
ps2/jogos/<slug>/game.chd
```

O `<slug>` deve conter letras minúsculas, números e hífens. `GET /api/emulators/ps2/games` lista o prefixo e detecta esses objetos automaticamente; arquivos fora da convenção são ignorados. O nome inicial é derivado do slug. ROMs não fazem parte do Git e o bucket não deve ser público.

### Endpoints

| Método | Endpoint | Função |
| --- | --- | --- |
| `GET`/`HEAD` | `/api/emulators` | Sistemas suportados e estado do núcleo |
| `GET`/`HEAD` | `/api/emulators/:id/games` | Jogos detectados no Backblaze B2 |
| `GET`/`HEAD` | `/api/emulators/:id/games/:slug/rom` | Streaming privado da ROM |

O endpoint de ROM encaminha o cabeçalho HTTP `Range` ao Backblaze B2. O bucket devolve somente o intervalo solicitado e o Worker responde `206 Partial Content`, `Accept-Ranges: bytes`, `Content-Range` e `Content-Length`. Isso permite que um núcleo WebAssembly leia setores sob demanda, sem baixar a imagem inteira antes de iniciar. Sem `Range`, a resposta é `200`; `HEAD` retorna apenas metadados.

### Configuração do Backblaze B2 e secrets

O endpoint S3, o nome do bucket e o prefixo são configurações não secretas declaradas em `wrangler.jsonc`. `api/emulators/index.js` assina no Worker as operações privadas de listagem, consulta e transmissão com AWS Signature Version 4.

Configure as credenciais somente como secrets do Worker, nunca no frontend ou em arquivos versionados:

```sh
npx wrangler secret put B2_ACCESS_KEY_ID
npx wrangler secret put B2_SECRET_ACCESS_KEY
```

O binding `AI` continua sendo usado em `worker.js` pelo PJ Assistant e `DB` pelo catálogo comunitário.

### Pendente: núcleo PS2 WebAssembly real

O catálogo e o transporte das ROMs estão prontos, mas o botão **Preparar** informa que o núcleo ainda está pendente. Para emulação real ainda é necessário:

1. escolher/licenciar um núcleo PS2 compatível com WebAssembly e compilar `core.js`/`core.wasm`;
2. implementar no núcleo um leitor assíncrono de blocos que faça Range Requests ao endpoint da ROM;
3. conectar canvas/WebGL ou WebGPU, WebAudio, Gamepad/teclado e o bridge de controles;
4. definir o fluxo legal e local de BIOS (preferencialmente selecionada pelo usuário e mantida no navegador, nunca versionada ou enviada ao servidor);
5. adicionar isolamento `COOP`/`COEP` se o núcleo usar `SharedArrayBuffer`, persistência de saves e testes de desempenho/compatibilidade;
6. trocar `core.status` para `ready` somente depois que carregamento, pausa, save e encerramento estiverem implementados.

### PlayStation 1 e EmulatorJS

O botão **Jogar** da biblioteca PS1 abre `/play/ps1/?game=<id>` em uma aba normal, por chamada direta a `window.open`. Essa rota entrega apenas o player, controles essenciais e diagnóstico opcional (`&debug=1`); catálogo, wallpapers, assistente e scripts gerais não são carregados durante a emulação. O perfil mobile pede resolução nativa, enhanced resolution desligada, frame duping e frameskip adaptativo em janelas de três segundos. As preferências ficam em `ps1PerformanceProfile`, sem ROMs ou URLs assinadas.

O player mede somente o FPS **renderizado pelo navegador**, frame time e frames atrasados. A build estável do EmulatorJS não expõe FPS emulado, underruns de áudio nem confirmação do dynarec ao integrador, portanto esses campos são identificados como indisponíveis em vez de estimados. `pcsx_rearmed_drc=enabled` é solicitado, mas não é apresentado como confirmado. Da mesma forma, GPU threaded rendering permanece desligado: não há benchmark reproduzível de `async` nessa build/CDN.

`EJS_threads` permanece deliberadamente `false`. O Worker aplica COOP à rota dedicada, mas o `stable/data` atual vem do CDN do EmulatorJS; aplicar COEP `require-corp` agora bloquearia assets que não estão sob controle desta origem. Threads só devem ser habilitadas depois de fixar/self-hostar a build, servir todos os assets com CORS/CORP e comparar PS1 ON/OFF em aparelhos reais. Não há resultados de FPS inventados no repositório: o baseline Android informado é ~20 FPS, e antes/depois deve ser registrado no diagnóstico em hardware real.

O player `/Emuladores/PS1/player` usa o **EmulatorJS estável** como frontend de emulação, carregado explicitamente de `https://cdn.emulatorjs.org/stable/data/`. O core fixo é `psx` (pcsx_rearmed). Esta dependência é distribuída sob a [GPL-3.0](https://github.com/EmulatorJS/EmulatorJS/blob/main/LICENSE). Nenhum arquivo de BIOS protegido é incluído: o visitante pode selecionar uma BIOS legalmente obtida, mantida somente como URL de objeto local durante a sessão.

O PS1 é completamente separado do PS2. O Worker lista automaticamente `.iso`, `.bin`, `.cue`, `.chd`, `.img`, `.mdf`, `.pbp`, `.ccd` e `.m3u` sob o prefixo configurado (por padrão `Jogos/`) do bucket `plumpgames-storage-ps1`. `GET /api/emulators/ps1/games` tem cache público de 60 segundos e `GET`/`HEAD /api/emulators/ps1/file/<key>` preserva `Range`, `206`, `Content-Range`, `Content-Length` e `Content-Type`. Respostas completas e ranges não elegíveis continuam em streaming; somente um bloco elegível de no máximo 4 MiB é materializado para recortar a resposta do cache, nunca o ISO inteiro.

Configure os segredos apenas no Cloudflare (nunca em `wrangler.jsonc`):

```sh
npx wrangler secret put B2_PS1_ACCESS_KEY_ID
npx wrangler secret put B2_PS1_SECRET_ACCESS_KEY
```

Use uma Application Key restrita à leitura/listagem do bucket PS1. As variáveis não secretas `B2_PS1_ENDPOINT`, `B2_PS1_BUCKET` e `B2_PS1_PREFIX` já estão declaradas e apontam exclusivamente para `https://s3.us-east-005.backblazeb2.com`, `plumpgames-storage-ps1` e `Jogos/`. `PS1_DIAGNOSTIC_MODE=true` inclui uma causa técnica curta na resposta administrativa; deixe-a ausente em produção normal.

O padrão **Automático/HLE** inicia `psx` (pcsx_rearmed) sem definir `EJS_biosUrl`. Uma BIOS local continua opcional e nunca é enviada ao servidor. ISO e os demais formatos do catálogo são entregues ao core sem bloqueio preventivo por extensão; somente uma falha real de acesso ou a ausência do callback de início produz erro recuperável.

Ranges de até 16 MiB contidos em um único bloco usam cache edge segmentado de 4 MiB. A chave interna contém a key validada do jogo e o offset alinhado; ela não é uma rota pública atendida pelo Worker. Um acesso perto do fim do bloco agenda somente o bloco seguinte com `waitUntil`. O Worker nunca armazena o ISO inteiro nem aplica gzip/Brotli a imagens de disco. Defina `PS1_STREAM_DEBUG=true` temporariamente para emitir logs estruturados `[PS1-STREAM]` com método, Range, status, bytes, duração e HIT/MISS, sem headers de autorização ou secrets.

`GET /api/emulators/ps1/signed-url?game=Jogos%2FGran%20Turismo.iso` gera uma URL S3 SigV4 limitada ao objeto e a GET, com expiração de 10 minutos e resposta `no-store`. Ela é experimental e não é escolhida automaticamente: compare proxy e URL direta no mesmo dispositivo antes de alterar o loader. O bucket precisa permitir a origem exata `https://site.kiwifypurplehero.workers.dev`, métodos `GET`/`HEAD`, request header `Range` e expor `Content-Length`, `Content-Range`, `Accept-Ranges` e `Content-Type`. Não use `*` quando a origem exata for suficiente.

O diagnóstico do loader fica em **Configurações → Desempenho → Diagnóstico PS1**, habilitado por `/Emuladores/PS1/player?game=<id>&debug=1`. Ele usa Resource Timing somente para o endpoint do jogo (sem monkey-patch global) e mostra requests/bytes observáveis, velocidade média e tempo até o callback de início do core. Alguns navegadores omitem bytes em Resource Timing; nesse caso os logs do Worker são a fonte completa para ranges, sobreposições e paralelismo. O tamanho ISO conhecido de Gran Turismo é 679.619.808 bytes; CHD permanece uma opção futura, sem conversão automática.

Antes de carregar o core, a view faz somente um `HEAD` no endpoint seguro para exibir disponibilidade e metadados no diagnóstico (`/Emuladores/PS1/player?game=<id>&debug=1`). O endpoint suporta Range, mas o loader do EmulatorJS controla a leitura do jogo: esta integração não afirma que o pcsx_rearmed inicia progressivamente. Ele pode baixar o arquivo completo diretamente para a memória WebAssembly e exibe o progresso nativo, sem um `arrayBuffer()` ou uma segunda cópia criada pelo código da PlumpGames.

Para produção totalmente reproduzível, os arquivos `stable/data` do EmulatorJS podem ser hospedados como assets próprios, desde que a GPL-3.0 e os avisos do projeto sejam preservados; o estado atual usa CDN e portanto requer conexão com esse host.
