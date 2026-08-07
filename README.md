# PlumpGames

Site estático oficial da PlumpGames: <https://site.kiwifypurplehero.workers.dev/>.

O Cloudflare Worker serve somente os assets do site, sem banco de dados, autenticação, contas, cookies de sessão ou secrets. As opções de aparência, acessibilidade, visualização e live wallpaper são armazenadas localmente no navegador com `localStorage`.

## Desenvolvimento

Sirva a raiz com qualquer servidor estático ou execute `npx wrangler dev`. Para publicar no Cloudflare Workers, execute `npx wrangler deploy`.
