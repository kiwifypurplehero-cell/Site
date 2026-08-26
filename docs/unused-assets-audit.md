# Auditoria de arquivos e dependências locais

Data da auditoria: 26 de agosto de 2026. A inspeção considerou a árvore completa do repositório, referências estáticas e dinâmicas em HTML/CSS/JavaScript, imports ES modules, rotas do Worker, configuração do Wrangler, testes, migrações e arquivos excluídos do pacote de assets.

## Seguro para remover

Nenhum arquivo foi removido. Não há candidato cujo abandono possa ser provado sem afetar publicação, testes, documentação operacional, rotas dinâmicas ou uma integração futura já reservada. Economia comprovadamente segura: **0 bytes**.

## Provavelmente não utilizado, precisa de confirmação

| Arquivo | Tamanho aproximado | Evidência e motivo para confirmar |
| --- | ---: | --- |
| `assets/js/vendor/pixi/pixi.min.js` | 799,1 KiB | Não é referenciado por HTML nem pelo JavaScript fora do próprio vendor. Pode estar reservado para wallpapers/jogos futuros; confirmar antes de excluir. |
| `assets/js/vendor/swiper/swiper-bundle.min.js` | 151,7 KiB | Nenhuma inicialização ou carregamento encontrado. Confirmar se integrações externas ou conteúdo futuro dependem dele. |
| `assets/js/vendor/howler/howler.min.js` | 35,3 KiB | Nenhum uso de `Howl`/`Howler` ou carregamento encontrado. Pode ser reserva para áudio de jogos. |
| `assets/js/vendor/swiper/swiper-bundle.min.css` | 14,3 KiB | Não está ligado por nenhum HTML atual e acompanha o JavaScript do Swiper. |
| `game-viewport-manager.js` | 1,3 KiB | Não há import atual; existe, porém, um gerenciador homônimo e ativo dentro de `Emuladores/shared/`, então é necessário confirmar se o arquivo raiz é compatibilidade legada. |

Economia potencial deste grupo: **aproximadamente 1.001,8 KiB (0,98 MiB)**.

## Deve permanecer

- `assets/js/vendor/gsap/gsap.min.js` (71,2 KiB): carregado por `index.html` e usado nas transições do router e das utilidades.
- `assets/css/responsive/` e `assets/js/responsive/device-layout.js` (5,9 KiB): carregados nas páginas principais e usados para os contratos mobile/tablet/desktop e atualização por viewport.
- `accessibility.js`, `catalog-playtime.js`, `playtime-tracker.js`, `player-profile.js`, `trophy-registry.js` e `plumpgames-input-bridge.js`: carregados ou importados dinamicamente pelos fluxos ativos.
- `Emuladores/**`, `api/emulators/index.js`, `worker.js` e `wrangler.jsonc`: conectados por registry, rotas explícitas, players, API/Worker ou configuração de armazenamento. `Emuladores/PS2.html` deve permanecer porque a rota e o backend PS2 ainda estão documentados, mesmo sem core WebAssembly final.
- `migrations/**`: histórico necessário do schema D1; não é asset público descartável.
- `test/**`, `README.md`, `docs/**` e READMEs de diretórios de conteúdo: validação e documentação operacional; os testes e metadados também são excluídos da publicação por `.assetsignore`, portanto removê-los não reduziria o bundle público.
- Avatares SVG: todos são selecionáveis no perfil e referenciados pelo sistema de perfil.

## Método e limite da conclusão

Foram cruzados nomes de arquivos, imports, `fetch`, caminhos de player, `data-view-src`, configuração `run_worker_first`, referências do registry e exclusões de assets. Uma ausência em busca textual não foi tratada isoladamente como prova: rotas, Workers, módulos e documentação de implantação foram verificados antes da classificação. Dependências sem referência foram mantidas porque a origem e a intenção de reserva não podem ser confirmadas apenas pelo repositório.
