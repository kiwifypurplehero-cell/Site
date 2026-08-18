/** Catálogo declarativo compartilhado pelo frontend e pelo Worker. */
import {LOADING_PROFILES} from './emulator-loading-manager.js';

export function registerEmulator(definition){return Object.freeze({...definition,loadingProfile:Object.freeze(definition.loadingProfile||LOADING_PROFILES[definition.id]||LOADING_PROFILES.default)});}

export const EMULATORS = Object.freeze([
  Object.freeze({
    id: 'ps1',
    name: 'PlayStation 1',
    shortName: 'PS1',
    description: 'Biblioteca PlayStation executada no navegador com EmulatorJS.',
    romExtensions: Object.freeze(['iso', 'bin', 'cue', 'chd', 'img', 'mdf', 'pbp', 'ccd', 'm3u']),
    // Candidate formats are passed to the core rather than used as a client-side gate.
    coreExtensions: Object.freeze(['iso', 'bin', 'cue', 'chd', 'img', 'mdf', 'pbp', 'ccd', 'm3u']),
    core: Object.freeze({status: 'experimental', id: 'psx', engine: 'pcsx_rearmed'}),
    storage: Object.freeze({prefix: 'Jogos/'}), loadingProfile:LOADING_PROFILES.ps1
  }),
  Object.freeze({
    id: 'gbc',
    name: 'Game Boy Color',
    shortName: 'GBC',
    description: 'Biblioteca Game Boy e Game Boy Color executada no navegador.',
    romExtensions: Object.freeze(['gbc', 'gb']),
    coreExtensions: Object.freeze(['gbc', 'gb']),
    core: Object.freeze({status: 'stable', id: 'gb', engine: 'gambatte'}),
    storage: Object.freeze({prefix: 'Jogos-GBC/'}), loadingProfile:LOADING_PROFILES.gbc
  }),
  Object.freeze({
    id: 'gba',
    name: 'Game Boy Advance',
    shortName: 'GBA',
    description: 'Biblioteca portátil de Game Boy Advance otimizada para celular.',
    romExtensions: Object.freeze(['gba']),
    coreExtensions: Object.freeze(['gba']),
    core: Object.freeze({status: 'experimental', id: 'gba', engine: 'mGBA'}),
    storage: Object.freeze({prefix: 'Jogos-GBA/'})
  })
]);

export function findEmulator(id) {
  return EMULATORS.find(emulator => emulator.id === String(id || '').toLowerCase());
}
