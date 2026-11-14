/**
 * Format Utilities - Date, time, bytes, numbers, currency formatting
 */

// Time formatting (hours to human readable)
export function formatTime(hours) {
  if (hours == null || isNaN(hours)) return '—';
  if (hours < 1) return '< 1h';
  if (hours < 24) return `${Math.round(hours)}h`;

  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

// Bytes formatting
export function formatBytes(bytes, decimals = 1) {
  if (bytes == null || isNaN(bytes) || bytes === 0) return '0 B';
  if (typeof bytes === 'string') return bytes; // Already formatted

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// Date formatting
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';

  const defaultOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  };

  return date.toLocaleDateString('pt-BR', defaultOptions);
}

export function formatShortDate(dateStr) {
  return formatDate(dateStr, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'agora mesmo';
  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mes`;

  return formatShortDate(dateStr);
}

// Number formatting
export function formatNumber(num, options = {}) {
  if (num == null || isNaN(num)) return '—';
  return new Intl.NumberFormat('pt-BR', options).format(num);
}

export function formatCompactNumber(num) {
  if (num == null || isNaN(num)) return '—';
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(num);
}

// Currency formatting
export function formatPrice(price, currency = 'BRL', locale = 'pt-BR') {
  if (price === 0) return 'Grátis';
  if (price == null || isNaN(price)) return '—';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
}

export function formatPriceRange(min, max, currency = 'BRL') {
  if (min === max) return formatPrice(min, currency);
  return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
}

// Percentage
export function formatPercent(value, decimals = 0) {
  if (value == null || isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

// File size from string (e.g., "50 GB")
export function parseFileSize(str) {
  if (!str || typeof str !== 'string') return 0;
  const match = str.match(/([\d.]+)\s*(B|KB|MB|GB|TB)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 };
  return value * (multipliers[unit] || 1);
}

// Duration (milliseconds to human readable)
export function formatDuration(ms) {
  if (ms == null || isNaN(ms)) return '—';
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${secs % 60}s`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

// Gamerscore
export function formatGamerscore(score) {
  return formatNumber(score);
}

// Completion rate
export function formatCompletion(unlocked, total) {
  if (!total) return '0%';
  return `${Math.round((unlocked / total) * 100)}%`;
}

// Tier formatting
export function formatTier(tier) {
  const tiers = {
    Bronze: { label: 'Bronze', color: '#cd7f32', icon: '🥉' },
    Silver: { label: 'Prata', color: '#c0c0c0', icon: '🥈' },
    Gold: { label: 'Ouro', color: '#ffd700', icon: '🥇' },
    Platinum: { label: 'Platina', color: '#e5e4e2', icon: '💎' },
    Diamond: { label: 'Diamante', color: '#b9f2ff', icon: '💠' },
    Onyx: { label: 'Ônix', color: '#3d3d3d', icon: '⚫' },
    Champion: { label: 'Campeão', color: '#ff6b35', icon: '👑' },
  };
  return tiers[tier] || tiers.Bronze;
}

// Rating formatting (ESRB/PEGI)
export function formatRating(rating) {
  const ratings = {
    E: { label: 'Livre', desc: 'Todos', color: '#4ade80' },
    E10: { label: '10+', desc: '10 anos ou mais', color: '#84cc16' },
    T: { label: 'Teen', desc: '13 anos ou mais', color: '#fbbf24' },
    M: { label: 'Mature', desc: '17 anos ou mais', color: '#fb923c' },
    AO: { label: 'Adults Only', desc: 'Apenas adultos', color: '#ef4444' },
    RP: { label: 'Rating Pending', desc: 'Classificação pendente', color: '#7a7a9a' },
    '3': { label: '3+', desc: '3 anos ou mais', color: '#4ade80' },
    '7': { label: '7+', desc: '7 anos ou mais', color: '#84cc16' },
    '12': { label: '12+', desc: '12 anos ou mais', color: '#fbbf24' },
    '16': { label: '16+', desc: '16 anos ou mais', color: '#fb923c' },
    '18': { label: '18+', desc: '18 anos ou mais', color: '#ef4444' },
  };
  return ratings[rating] || { label: rating, desc: '', color: '#7a7a9a' };
}

// Platform icons/names
export function formatPlatforms(platforms) {
  if (!Array.isArray(platforms)) return '';
  return platforms.join(', ');
}

// Genre formatting
export function formatGenres(genres, max = 3) {
  if (!Array.isArray(genres)) return '';
  if (genres.length <= max) return genres.join(', ');
  return `${genres.slice(0, max).join(', ')} +${genres.length - max}`;
}

// Achievement rarity
export function formatRarity(percent) {
  if (percent == null) return '—';
  if (percent < 1) return 'Ultra Raro';
  if (percent < 5) return 'Muito Raro';
  if (percent < 15) return 'Raro';
  if (percent < 50) return 'Incomum';
  return 'Comum';
}

// Truncate text
export function truncate(text, maxLength = 100, suffix = '…') {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

// Capitalize first letter
export function capitalize(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Title case
export function titleCase(text) {
  if (!text) return '';
  return text.toLowerCase().split(' ').map(capitalize).join(' ');
}

// Slugify
export function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default {
  formatTime,
  formatBytes,
  formatDate,
  formatShortDate,
  formatRelativeTime,
  formatNumber,
  formatCompactNumber,
  formatPrice,
  formatPriceRange,
  formatPercent,
  parseFileSize,
  formatDuration,
  formatGamerscore,
  formatCompletion,
  formatTier,
  formatRating,
  formatPlatforms,
  formatGenres,
  formatRarity,
  truncate,
  capitalize,
  titleCase,
  slugify,
};