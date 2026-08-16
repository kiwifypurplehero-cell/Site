/** Catálogo declarativo compartilhado pelo frontend e pelo Worker. */
export const EMULATORS = Object.freeze([
  Object.freeze({
    id: 'ps1',
    name: 'PlayStation 1',
    shortName: 'PS1',
    description: 'Biblioteca PlayStation executada no navegador com EmulatorJS.',
    romExtensions: Object.freeze(['iso', 'bin', 'cue', 'chd', 'img', 'mdf', 'pbp', 'ccd', 'm3u']),
    // Candidate formats are passed to the core rather than used as a client-side gate.
    coreExtensions: Object.freeze(['iso', 'bin', 'cue', 'chd', 'img', 'mdf', 'pbp', 'ccd', 'm3u']),
    core: Object.freeze({status: 'experimental', id: 'psx', engine: 'pcsx_rearmed'})
  }),
  Object.freeze({
    id: 'ps2',
    name: 'PlayStation 2',
    shortName: 'PS2',
    description: 'Biblioteca de jogos PS2 armazenada de forma privada no Backblaze B2.',
    romExtensions: Object.freeze(['iso', 'bin', 'chd']),
    core: Object.freeze({status: 'pending', moduleUrl: '/cores/ps2/core.js', wasmUrl: '/cores/ps2/core.wasm'})
  })
]);

export function findEmulator(id) {
  return EMULATORS.find(emulator => emulator.id === String(id || '').toLowerCase());
}
