import { db, configured, REDIRECT_URL } from './supabase-client.js';
import { $, $$, toast, openModal, closeModal } from './ui.js';

export const authState = { user: null, session: null, isAuthenticated: false };
export const profileState = { profile: null, onboardingCompleted: false };
let authSubscription;

export function canAccessPersonalization() {
  return authState.isAuthenticated === true && profileState.onboardingCompleted === true;
}

function providerLabel(provider) {
  return ({ google: 'Google', azure: 'Microsoft', apple: 'Apple' })[provider];
}

function oauthOptions(provider) {
  return provider === 'azure'
    ? { scopes: 'email', redirectTo: REDIRECT_URL }
    : { redirectTo: REDIRECT_URL };
}

export async function signInWithProvider(provider, button) {
  const errorBox = $('[data-auth-error]');
  errorBox.textContent = '';
  if (!configured) {
    errorBox.textContent = 'Login temporariamente indisponível. A autenticação ainda não foi configurada.';
    return;
  }
  const label = providerLabel(provider);
  const original = button.querySelector('span').textContent;
  button.disabled = true;
  button.querySelector('span').textContent = `Redirecionando para ${label}…`;
  try {
    const { error } = await db.auth.signInWithOAuth({ provider, options: oauthOptions(provider) });
    if (error) throw error;
  } catch (error) {
    console.error(`Falha no OAuth ${provider}:`, error);
    errorBox.textContent = `Não foi possível entrar com ${label}. Verifique se o provedor está configurado.`;
    button.disabled = false;
    button.querySelector('span').textContent = original;
  }
}

export const signInWithGoogle = (button) => signInWithProvider('google', button);
export const signInWithMicrosoft = (button) => signInWithProvider('azure', button);
export const signInWithApple = (button) => signInWithProvider('apple', button);

export function openLoginModal() {
  const modal = $('#auth-modal');
  if (!modal) { console.error('Modal #auth-modal não encontrado.'); return false; }
  $('[data-auth-error]', modal).textContent = '';
  return openModal(modal);
}
export function closeLoginModal() { return closeModal($('#auth-modal')); }
export const openRegisterModal = openLoginModal;

async function loadProfile(user) {
  profileState.profile = null;
  profileState.onboardingCompleted = false;
  if (!user || !configured) return;
  const { data, error } = await db.from('profiles').select('id,display_name,username,avatar_url,bio,is_public,onboarding_completed').eq('id', user.id).maybeSingle();
  if (error) toast('Não foi possível carregar seu perfil.', 'error');
  profileState.profile = data || null;
  profileState.onboardingCompleted = data?.onboarding_completed === true;
}

async function applySession(session) {
  authState.session = session || null;
  authState.user = session?.user || null;
  authState.isAuthenticated = Boolean(session?.user);
  await loadProfile(authState.user);
  updateAuthUI();
  window.dispatchEvent(new CustomEvent('plump:auth', { detail: { user: authState.user, profile: profileState.profile } }));
  if (authState.isAuthenticated && !profileState.onboardingCompleted) {
    window.dispatchEvent(new CustomEvent('plump:onboarding-required', { detail: { user: authState.user, profile: profileState.profile } }));
  }
}

export function updateAuthUI() {
  $$('[data-guest-ui]').forEach((el) => { el.hidden = authState.isAuthenticated; });
  $$('[data-user-ui]').forEach((el) => { el.hidden = !authState.isAuthenticated; });
  $$('[data-open-settings], [data-open-wallpapers]').forEach((el) => {
    const allowed = canAccessPersonalization();
    el.hidden = !allowed;
    el.setAttribute('aria-hidden', String(!allowed));
  });
  $$('[data-auth-feature]').forEach((el) => {
    const allowed = canAccessPersonalization();
    el.hidden = !allowed;
    el.setAttribute('aria-hidden', String(!allowed));
  });
  const name = profileState.profile?.display_name || authState.user?.user_metadata?.full_name || authState.user?.user_metadata?.name || 'Jogador';
  $$('[data-display-name]').forEach((el) => { el.textContent = name; });
  $$('[data-avatar]').forEach((el) => {
    const url = profileState.profile?.avatar_url;
    el.textContent = name.charAt(0).toUpperCase();
    el.style.backgroundImage = url ? `url("${url.replace(/["\\]/g, '')}")` : '';
  });
}

export async function logoutUser() {
  if (configured) {
    const { error } = await db.auth.signOut();
    if (error) return toast('Não foi possível sair. Tente novamente.', 'error');
  }
  const userId = authState.user?.id;
  if (userId) localStorage.removeItem(`plumpAccountPreferences:${userId}`);
  authState.user = null; authState.session = null; authState.isAuthenticated = false;
  profileState.profile = null; profileState.onboardingCompleted = false;
  closeModal($('#profile-onboarding'));
  updateAuthUI();
  window.dispatchEvent(new CustomEvent('plump:logout', { detail: { userId } }));
  toast('Você saiu da conta.');
}

export function requireAuthentication() {
  if (authState.isAuthenticated) return true;
  toast('Entre ou crie uma conta para usar este recurso.', 'error');
  openLoginModal();
  return false;
}
export const requireUser = requireAuthentication;
export const currentUser = () => authState.user;

let authenticationUIInitialized = false;
export function initializeAuthenticationUI() {
  if (authenticationUIInitialized) return true;
  const authButton = $('#auth-button');
  const authModal = $('#auth-modal');
  if (!authButton) { console.error('Botão #auth-button não encontrado.'); return false; }
  if (!authModal) { console.error('Modal #auth-modal não encontrado.'); return false; }
  authButton.addEventListener('click', openLoginModal);
  $$('[data-open-auth]').forEach((el) => el.addEventListener('click', openLoginModal));
  $$('[data-oauth-provider]').forEach((button) => button.addEventListener('click', () => signInWithProvider(button.dataset.oauthProvider, button)));
  $$('[data-visitor]').forEach((button) => button.addEventListener('click', () => { closeModal(button.closest('.platform-modal')); toast('Você está navegando como visitante.'); }));
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-signout]')) logoutUser();
    const trigger = event.target.closest('[data-account-trigger]');
    const menu = $('[data-account-menu]');
    if (trigger) { menu.hidden = !menu.hidden; trigger.setAttribute('aria-expanded', String(!menu.hidden)); }
    else if (menu && !event.target.closest('[data-account-menu]')) { menu.hidden = true; $('[data-account-trigger]')?.setAttribute('aria-expanded', 'false'); }
  });
  authenticationUIInitialized = true;
  return true;
}

export async function initAuth() {
  initializeAuthenticationUI();
  if (!configured) { updateAuthUI(); return; }
  const { data, error } = await db.auth.getSession();
  if (error) toast('Não foi possível restaurar a sessão.', 'error');
  await applySession(data?.session || null);
  const listener = db.auth.onAuthStateChange((_event, session) => { setTimeout(() => applySession(session), 0); });
  authSubscription = listener.data.subscription;
}

window.addEventListener('beforeunload', () => authSubscription?.unsubscribe());
Object.assign(window, { authState, profileState, canAccessPersonalization, openLoginModal, closeLoginModal, initializeAuthenticationUI, logoutUser, signInWithGoogle, signInWithMicrosoft, signInWithApple });
