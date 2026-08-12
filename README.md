# PlumpGames

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

## Controles virtuais do launcher

O launcher oferece, de forma opcional, controles clássico, compacto e somente direcional. As preferências de layout, tamanho, opacidade, posição, botões visíveis e mapeamento são salvas localmente e separadamente para cada jogo. O navegador envia eventos de teclado ao documento do jogo quando o iframe é **same-origin**.

Em jogos hospedados em outro domínio (por exemplo, GitHub Pages), a política de mesma origem do navegador impede que o launcher injete eventos de teclado no documento do iframe. Nesse caso, o launcher apenas direciona o foco ao jogo; a Gamepad API da Web não fornece uma forma de sites registrarem um gamepad virtual real. Portanto, o overlay só controla jogos externos que ofereçam uma integração própria compatível, e a interface informa essa limitação sem simular suporte inexistente.
