import { db } from './supabase-client.js';
import { authState, profileState, currentUser, requireUser, canAccessPersonalization, updateAuthUI } from './auth.js';
import { $, openModal, closeModal, toast, setBusy } from './ui.js';
import { renderFeedbacks } from './feedback.js';
import { renderReports } from './bug-reports.js';

const AVATARS = [
  { label: 'Robô azul', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=PlumpBlue' },
  { label: 'Robô roxo', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=PlumpPurple' },
  { label: 'Aventureiro', url: 'https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=PlumpHero' },
  { label: 'Pixel gamer', url: 'https://api.dicebear.com/9.x/pixel-art-neutral/svg?seed=PlumpPlayer' },
];
let usernameTimer;
let selectedAvatar = null;
let usernameAvailable = false;

function validAvatarUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const localDevelopment = url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    return url.protocol === 'https:' || localDevelopment ? url.href : null;
  } catch { return null; }
}

async function checkUsername(username) {
  const status = $('#username-status');
  usernameAvailable = false;
  if (!/^[a-z0-9._-]{3,24}$/.test(username)) { status.textContent = 'Use de 3 a 24 letras, números, ponto, hífen ou underline.'; return; }
  status.textContent = 'Verificando disponibilidade…';
  const { data, error } = await db.rpc('is_username_available', { candidate: username });
  if (error) { status.textContent = 'Não foi possível verificar agora.'; return; }
  usernameAvailable = data === true || profileState.profile?.username === username;
  status.textContent = usernameAvailable ? 'Nome de usuário disponível.' : 'Este nome de usuário já está em uso.';
  status.dataset.available = String(usernameAvailable);
}

function renderAvatarOptions(user) {
  const providerAvatar = validAvatarUrl(user?.user_metadata?.avatar_url || user?.user_metadata?.picture);
  const options = [{ label: 'Sem foto', value: '' }];
  if (providerAvatar) options.unshift({ label: 'Foto da conta', value: providerAvatar });
  AVATARS.forEach((avatar) => options.push({ label: avatar.label, value: avatar.url }));
  $('#avatar-options').replaceChildren(...options.map(({ label, value }) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'avatar-choice'; button.textContent = label;
    button.setAttribute('aria-pressed', String(value === (providerAvatar || '')));
    button.addEventListener('click', () => { selectedAvatar = value; document.querySelectorAll('.avatar-choice').forEach((item) => item.setAttribute('aria-pressed', String(item === button))); });
    return button;
  }));
  selectedAvatar = providerAvatar || '';
}

function openOnboarding({ user, profile }) {
  const form = $('#onboarding-form');
  form.display_name.value = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || '';
  form.username.value = profile?.username || '';
  form.bio.value = profile?.bio || '';
  form.visibility.value = profile?.is_public === false ? 'private' : 'public';
  $('#bio-counter').textContent = `${form.bio.value.length}/160`;
  renderAvatarOptions(user);
  openModal($('#profile-onboarding'));
  if (form.username.value) checkUsername(form.username.value);
}

async function saveOnboarding(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const displayName = form.display_name.value.trim();
  const username = form.username.value.trim().toLowerCase();
  const customAvatar = form.avatar_url.value.trim();
  const errorBox = $('[data-profile-error]'); errorBox.textContent = '';
  if (displayName.length < 2 || displayName.length > 40) return void (errorBox.textContent = 'O nome de exibição deve ter entre 2 e 40 caracteres.');
  await checkUsername(username);
  if (!usernameAvailable) return void (errorBox.textContent = 'Escolha um nome de usuário disponível.');
  if (customAvatar && !validAvatarUrl(customAvatar)) return void (errorBox.textContent = 'Informe uma URL de avatar HTTP ou HTTPS válida.');
  let avatarUrl = customAvatar ? validAvatarUrl(customAvatar) : selectedAvatar;
  const payload = { id: currentUser().id, display_name: displayName, username, avatar_url: avatarUrl || null, bio: form.bio.value.trim() || null, is_public: form.visibility.value === 'public', onboarding_completed: true };
  setBusy(form, true);
  const { data, error } = await db.from('profiles').upsert(payload, { onConflict: 'id' }).select().single();
  setBusy(form, false);
  if (error) return void (errorBox.textContent = error.code === '23505' ? 'Este nome de usuário acabou de ser escolhido. Tente outro.' : 'Não foi possível salvar o perfil. Tente novamente.');
  profileState.profile = data; profileState.onboardingCompleted = data.onboarding_completed === true;
  closeModal($('#profile-onboarding')); updateAuthUI();
  window.dispatchEvent(new CustomEvent('plump:profile-complete', { detail: { profile: data } }));
  toast('Perfil salvo. Personalização liberada!', 'success');
}

async function render(section) {
  const root = $('#panel-content'); root.replaceChildren();
  if (section === 'feedbacks') return renderFeedbacks(root);
  if (section === 'reports') return renderReports(root);
  if (section === 'profile') {
    const title = document.createElement('h3'); title.textContent = profileState.profile?.display_name || 'Meu perfil';
    const username = document.createElement('p'); username.textContent = `@${profileState.profile?.username || ''}`;
    const bio = document.createElement('p'); bio.textContent = profileState.profile?.bio || 'Sem biografia.';
    root.append(title, username, bio); return;
  }
}

export function initProfile() {
  window.addEventListener('plump:onboarding-required', (event) => openOnboarding(event.detail));
  $('#profile-username').addEventListener('input', (event) => { event.target.value = event.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''); clearTimeout(usernameTimer); usernameTimer = setTimeout(() => checkUsername(event.target.value), 350); });
  $('#profile-bio').addEventListener('input', (event) => { $('#bio-counter').textContent = `${event.target.value.length}/160`; });
  $('#onboarding-form').addEventListener('submit', saveOnboarding);
  document.addEventListener('click', (event) => {
    const section = event.target.closest('[data-panel-section]')?.dataset.panelSection || event.target.closest('[data-panel-tab]')?.dataset.panelTab;
    if (!section || !requireUser()) return;
    openModal($('#user-panel')); render(section);
  });
}

export { validAvatarUrl };
