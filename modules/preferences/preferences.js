/**
 * Preferences management module
 * Handles user preferences: themes, wallpapers, colors, view modes, accessibility
 */

import { FIXED_RESOLUTIONS } from '../play-utils.js';

const STORAGE_KEY = 'plumpgames-preferences-v3';

const DEFAULT_COLORS = { primary: '#7c3aed', secondary: '#06b6d4', accent: '#f0abfc', glow: '#a855f7', menu: '#0b0c19', button: '#7c3aed' };

const themes = {
  original: DEFAULT_COLORS,
  blue: { primary:'#22d3ee', secondary:'#0ea5e9', accent:'#bae6fd', glow:'#67e8f9', menu:'#07131e', button:'#0284c7' },
  purple: { primary:'#8b5cf6', secondary:'#4f46e5', accent:'#c4b5fd', glow:'#a78bfa', menu:'#100b20', button:'#7c3aed' },
  red: { primary:'#ef4444', secondary:'#be123c', accent:'#fecdd3', glow:'#fb7185', menu:'#1b080d', button:'#e11d48' },
  green: { primary:'#22c55e', secondary:'#059669', accent:'#bbf7d0', glow:'#4ade80', menu:'#06170e', button:'#16a34a' },
  light: { primary:'#4f46e5', secondary:'#0284c7', accent:'#312e81', glow:'#818cf8', menu:'#e8eaf5', button:'#4f46e5' },
  dark: { primary:'#94a3b8', secondary:'#64748b', accent:'#f8fafc', glow:'#cbd5e1', menu:'#050611', button:'#475569' }
};

const wallpapers = [
  { id:'lantern', name:'Lantern Moths', performance:'Leve', url:'https://mylivewallpapers.com/wp-content/uploads/Lifestyle/PREVIEW-Lantern-Moths.mp4', colors:{ primary:'#f59e0b', secondary:'#f97316', accent:'#fde68a', glow:'#fbbf24', menu:'#160d04', button:'#f59e0b' } },
  { id:'cafe', name:'Cafe by the Beach', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Lifestyle/PREVIEW-Cafe-by-the-Beach.mp4', colors:{ primary:'#22d3ee', secondary:'#0ea5e9', accent:'#fef3c7', glow:'#67e8f9', menu:'#06151b', button:'#0891b2' } },
  { id:'miyabi', name:'Hoshimi Miyabi ZZZ', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Games/PREVIEW-Hoshimi-Miyabi-ZZZ-1.mp4', colors:{ primary:'#38bdf8', secondary:'#6366f1', accent:'#e0f2fe', glow:'#60a5fa', menu:'#080d20', button:'#4f46e5' } },
  { id:'minecraft', name:'Minecraft Mountain Cabin', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Games/PREVIEW-Minecraft-Mountain-Cabin.mp4', colors:{ primary:'#22c55e', secondary:'#65a30d', accent:'#d9f99d', glow:'#4ade80', menu:'#07160b', button:'#16a34a' } },
  { id:'sung', name:'Sung Jin Woo and Beru', performance:'Médio', url:'https://mylivewallpapers.com/wp-content/uploads/Anime/PREVIEW-Sung-Jin-Woo-and-Beru.mp4', colors:{ primary:'#8b5cf6', secondary:'#4f46e5', accent:'#c4b5fd', glow:'#a78bfa', menu:'#0e0920', button:'#7c3aed' } },
  { id:'none', name:'Sem animação', performance:'Muito leve', url:null, colors:DEFAULT_COLORS }
];

const defaults = {
  wallpaper:'none', wallpaperColors:true, theme:'original', custom:DEFAULT_COLORS,
  menuOpacity:.88, view:'detailed', reduceMotion:false, economy:false,
  highContrast:false, glow:1, opacity:.86, animation:1
};

function getStorage() {
  return window.PlumpStorage || localStorage;
}

export class PreferencesManager {
  constructor(storage = getStorage()) {
    this.storage = storage;
    this.preferences = { ...defaults };
    this.preferenceTimer = null;
    this.load();
  }

  load() {
    try {
      const stored = JSON.parse(this.storage.getItem(STORAGE_KEY) || '{}');
      this.preferences = {
        ...defaults,
        ...stored,
        custom: { ...DEFAULT_COLORS, ...(stored.custom || {}) }
      };
    } catch {
      this.storage.removeItem(STORAGE_KEY);
      this.preferences = { ...defaults };
    }
    return this.preferences;
  }

  getAll() {
    return { ...this.preferences };
  }

  get(key) {
    return this.preferences[key];
  }

  set(key, value) {
    this.preferences[key] = value;
    this.scheduleSave();
  }

  setMultiple(updates) {
    Object.assign(this.preferences, updates);
    if (updates.custom) {
      this.preferences.custom = { ...DEFAULT_COLORS, ...updates.custom };
    }
    this.scheduleSave();
  }

  scheduleSave() {
    clearTimeout(this.preferenceTimer);
    this.storage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));

    if (window.PlumpAuth?.isGuest()) return;

    this.preferenceTimer = setTimeout(() => {
      window.PlumpAuth?.api('/api/profile/preferences', {
        method: 'PUT',
        headers: window.PlumpAuth.csrfHeaders(),
        body: JSON.stringify({
          libraryView: this.preferences.view,
          liveWallpaper: this.preferences.wallpaper,
          settings: {
            theme: this.preferences.theme,
            economy: this.preferences.economy
          }
        })
      }).catch(() => {});
    }, 350);
  }

  reset() {
    this.preferences = { ...defaults, custom: { ...DEFAULT_COLORS } };
    this.scheduleSave();
    return this.preferences;
  }

  get themeColors() {
    if (this.preferences.wallpaperColors) return this.currentWallpaper.colors;
    return this.preferences.theme === 'custom' ? this.preferences.custom : (themes[this.preferences.theme] || DEFAULT_COLORS);
  }

  get currentWallpaper() {
    return wallpapers.find(item => item.id === this.preferences.wallpaper) || wallpapers.at(-1);
  }

  static get wallpapers() { return wallpapers; }
  static get themes() { return themes; }
  static get defaults() { return defaults; }
}

export const preferencesManager = new PreferencesManager();
export { themes, wallpapers, defaults, DEFAULT_COLORS };