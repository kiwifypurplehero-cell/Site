# PlumpGames

Site estático oficial da PlumpGames: <https://site.kiwifypurplehero.workers.dev/>.

O Cloudflare Worker serve somente os assets do site, sem banco de dados, autenticação, contas, cookies de sessão ou secrets. As opções de aparência, acessibilidade, visualização e live wallpaper são armazenadas localmente no navegador com `localStorage`.

## Desenvolvimento

Sirva a raiz com qualquer servidor estático ou execute `npx wrangler dev`. Para publicar no Cloudflare Workers, execute `npx wrangler deploy`.

## Jogos automáticos

A PlumpGames lista automaticamente todos os repositórios públicos válidos da conta GitHub `kiwifypurplehero-cell`. Para adicionar um novo jogo:

1. Crie um novo repositório público.
2. Coloque o jogo nele.
3. Pronto.

Não é necessário editar o site, cadastrar um tópico, adicionar um arquivo de configuração ou fazer um novo deploy. Na próxima visita (ou ao usar **Atualizar jogos**), o navegador consulta a API pública do GitHub e cria os cards dinamicamente.

Forks, repositórios arquivados e o repositório `Site` são ignorados. A lista interna `IGNORED_REPOSITORIES`, em `script.js`, permite excluir outros repositórios no futuro. Para reduzir consultas à API, os dados são mantidos no `localStorage` por cinco minutos; se o GitHub estiver indisponível ou limitar as requisições, a última cópia salva continua visível.
