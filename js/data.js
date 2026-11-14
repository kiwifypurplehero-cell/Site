/**
 * Data Layer - Mock game data and user profile
 * Loaded as ES Module from JSON
 */

// Import mock data
import gamesData from '../data/games.json';

// Export raw data
export const games = gamesData.games;
export const user = gamesData.user;

// Game helpers
export function getGame(id) {
  return games.find(g => g.id === id);
}

export function getGames(ids) {
  return ids.map(id => getGame(id)).filter(Boolean);
}

export function filterGames(opts = {}) {
  let result = [...games];

  if (opts.inLibrary !== undefined) {
    result = result.filter(g => g.inLibrary === opts.inLibrary);
  }
  if (opts.installed !== undefined) {
    result = result.filter(g => g.installed === opts.installed);
  }
  if (opts.wishlisted !== undefined) {
    result = result.filter(g => g.wishlisted === opts.wishlisted);
  }
  if (opts.featured !== undefined) {
    result = result.filter(g => g.featured === opts.featured);
  }
  if (opts.genres?.length) {
    result = result.filter(g => opts.genres.some(genre => g.genres.includes(genre)));
  }
  if (opts.platforms?.length) {
    result = result.filter(g => opts.platforms.some(p => g.platforms.includes(p)));
  }
  if (opts.search) {
    const term = opts.search.toLowerCase();
    result = result.filter(g =>
      g.title.toLowerCase().includes(term) ||
      g.developer.toLowerCase().includes(term) ||
      g.genres.some(genre => genre.toLowerCase().includes(term))
    );
  }
  if (opts.onSale !== undefined) {
    result = result.filter(g => g.onSale === opts.onSale);
  }

  return result;
}

export function sortGames(games, sortBy = 'recent') {
  const sorted = [...games];
  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => new Date(b.lastPlayed || 0) - new Date(a.lastPlayed || 0));
    case 'az':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'za':
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case 'playtime':
      return sorted.sort((a, b) => (b.playtime || 0) - (a.playtime || 0));
    case 'size':
      return sorted.sort((a, b) => parseSize(b.fileSize) - parseSize(a.fileSize));
    case 'rating':
      return sorted.sort((a, b) => (b.metacritic || 0) - (a.metacritic || 0));
    case 'release':
      return sorted.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    case 'completion':
      return sorted.sort((a, b) => (b.completion || 0) - (a.completion || 0));
    default:
      return sorted;
  }
}

function parseSize(str) {
  if (!str) return 0;
  const match = str.match(/([\d.]+)\s*(GB|MB|TB)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  return value * (unit === 'TB' ? 1024 * 1024 : unit === 'GB' ? 1024 : 1);
}

export function getLibraryGames() {
  return filterGames({ inLibrary: true });
}

export function getInstalledGames() {
  return filterGames({ inLibrary: true, installed: true });
}

export function getWishlistGames() {
  return filterGames({ wishlisted: true });
}

export function getFeaturedGames() {
  return filterGames({ featured: true });
}

export function getOnSaleGames() {
  return filterGames({ onSale: true });
}

export function getRecentGames(limit = 5) {
  return sortGames(getLibraryGames(), 'recent').slice(0, limit);
}

export function getRecommendedGames(limit = 8) {
  // Simple recommendation: games not in library, on sale, high metacritic
  return sortGames(filterGames({ inLibrary: false, onSale: true }), 'rating').slice(0, limit);
}

export function getGamesByGenre(genre, limit = 10) {
  return filterGames({ genres: [genre] }).slice(0, limit);
}

export function getGamesByPlatform(platform, limit = 10) {
  return filterGames({ platforms: [platform] }).slice(0, limit);
}

export function searchGames(query, limit = 20) {
  return filterGames({ search: query }).slice(0, limit);
}

// User helpers
export function getUserAchievements(gameId = null) {
  if (gameId) return user.achievements.filter(a => a.gameId === gameId);
  return user.achievements;
}

export function getUserStats() {
  return { ...user.stats };
}

export function getFriends() {
  return user.friends;
}

export function getActivity(limit = 10) {
  return user.activity.slice(0, limit);
}

export function getSettings() {
  return { ...user.settings };
}

export function updateSettings(partial) {
  Object.assign(user.settings, partial);
  return user.settings;
}

// Format helpers (also exported from format.js)
export function formatPrice(price, currency = 'BRL') {
  if (price === 0) return 'Grátis';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(price);
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatTime(hours) {
  if (hours < 1) return '< 1h';
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function formatBytes(bytesStr) {
  return bytesStr; // Already formatted in data
}

export function formatNumber(num) {
  return new Intl.NumberFormat('pt-BR').format(num);
}

export function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora mesmo';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return formatShortDate(dateStr);
}

export function getTierColor(tier) {
  const colors = {
    Bronze: '#cd7f32',
    Silver: '#c0c0c0',
    Gold: '#ffd700',
    Platinum: '#e5e4e2',
    Diamond: '#b9f2ff',
    Onyx: '#3d3d3d',
    Champion: '#ff6b35',
  };
  return colors[tier] || colors.Bronze;
}

export function getTierIcon(tier) {
  const icons = {
    Bronze: '🥉',
    Silver: '🥈',
    Gold: '🥇',
    Platinum: '💎',
    Diamond: '💠',
    Onyx: '⚫',
    Champion: '👑',
  };
  return icons[tier] || icons.Bronze;
}

// Export data object for convenience
export const data = {
  games,
  user,
  getGame,
  getGames,
  filterGames,
  sortGames,
  getLibraryGames,
  getInstalledGames,
  getWishlistGames,
  getFeaturedGames,
  getOnSaleGames,
  getRecentGames,
  getRecommendedGames,
  getGamesByGenre,
  getGamesByPlatform,
  searchGames,
  getUserAchievements,
  getUserStats,
  getFriends,
  getActivity,
  getSettings,
  updateSettings,
  formatPrice,
  formatDate,
  formatShortDate,
  formatTime,
  formatBytes,
  formatNumber,
  formatRelativeTime,
  getTierColor,
  getTierIcon,
};

export default data;