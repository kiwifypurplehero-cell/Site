# Arquitetura de emuladores

Cada console vive em `Emuladores/<CONSOLE>/`; `shared/` contém apenas loading, input/remapeamento, viewport e biblioteca usados por mais de um sistema. `cores/`, `assets/` e `vendor/emulatorjs/` reservam binários e dependências pesadas self-hosted (nenhum segredo ou ROM deve ser colocado aqui).

## Adicionar um sistema

1. Crie `<CONSOLE>/index.html`, `<console>-player.js`, `<console>.css` e `player.html`.
2. Registre apenas metadados, extensões, core e `playerPath` em `emulator-registry.js`; não importe o runtime no registro.
3. Configure core, aspect ratio e controles dentro da pasta do console. Reutilize módulos de `shared/` somente quando a responsabilidade for realmente universal.
4. Adicione as rotas físicas de biblioteca/player ao mapa `cleanPages` do Worker e ao `run_worker_first` do Wrangler.
5. Faça o player buscar ROM pela API `/api/emulators/<id>/...`; credenciais e assinatura continuam exclusivamente no backend.

A Home aponta somente para `/Emuladores/`. A listagem importa o pequeno registro; cada core/EmulatorJS/WASM só pode ser carregado pelo player do console correspondente.
