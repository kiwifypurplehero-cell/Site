/** Catálogo declarativo compartilhado pelo frontend e pelo Worker. */
export const EMULATORS = Object.freeze([
  Object.freeze({
    id: 'ps2',
    name: 'PlayStation 2',
    shortName: 'PS2',
    description: 'Biblioteca de jogos PS2 armazenada de forma privada no Cloudflare R2.',
    objectPrefix: 'emulators/ps2/games/',
    romExtensions: Object.freeze(['iso', 'bin', 'chd']),
    core: Object.freeze({status: 'pending', moduleUrl: '/cores/ps2/core.js', wasmUrl: '/cores/ps2/core.wasm'})
  })
]);

export function findEmulator(id) {
  return EMULATORS.find(emulator => emulator.id === String(id || '').toLowerCase());
}
