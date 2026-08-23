# EmulatorJS local runtime

The deployed artifact must contain the self-hosted EmulatorJS distribution in `data/`
(`loader.js`, cores, WASM, workers, CSS and runtime assets). Players intentionally resolve
only `/Emuladores/vendor/emulatorjs/data/`; there is no CDN fallback. Missing files now
produce the staged loader error instead of a blank player.
