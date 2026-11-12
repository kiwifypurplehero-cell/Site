/**
 * PJ Assistant module
 * Handles the AI assistant chat interface
 */

const ASSISTANT_GREETING = 'Olá. Sou o assistente da PlumpGames. Como posso ajudar?';
const ASSISTANT_SUGGESTIONS = [
  'Como jogar?', 'Como baixar um jogo?', 'Por que um jogo não abre?',
  'Como usar tela cheia?', 'Quais jogos estão disponíveis?', 'Como funcionam os wallpapers?',
  'Como aumentar a letra?', 'Como parar as animações?', 'Como deixar os botões maiores?'
];
const ASSISTANT_MIN_INTERVAL = 1500;

const assistantState = { history: [], busy: false, lastSentAt: 0, opened: false };

function assistantTime() {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function addAssistantMessage(role, content, includeHistory = true) {
  const item = element('article', `assistant-message assistant-message--${role}`);
  item.append(element('p', '', content));
  const time = element('time', '', assistantTime());
  time.dateTime = new Date().toISOString();
  item.append(time);
  const messages = document.querySelector('#assistant-messages');
  if (messages) {
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
  }
  if (includeHistory) assistantState.history.push({ role, content: String(content).slice(0, 1000) });
  if (role === 'assistant' && document.querySelector('#plump-assistant-panel')?.hidden)
    document.querySelector('#plump-assistant-button')?.classList.add('has-update');
}

function resetAssistant() {
  assistantState.history = [];
  const messages = document.querySelector('#assistant-messages');
  if (messages) messages.replaceChildren();
  addAssistantMessage('assistant', ASSISTANT_GREETING, false);
  renderAssistantSuggestions();
}

function renderAssistantSuggestions() {
  const area = document.querySelector('#assistant-suggestions');
  if (!area) return;
  area.replaceChildren();
  ASSISTANT_SUGGESTIONS.forEach(question => {
    const chip = element('button', '', question);
    chip.type = 'button';
    chip.addEventListener('click', () => sendAssistantMessage(question));
    area.append(chip);
  });
}

function openAssistant() {
  const panel = document.querySelector('#plump-assistant-panel');
  const button = document.querySelector('#plump-assistant-button');
  if (!panel || !button) return;
  panel.hidden = false;
  assistantState.opened = true;
  button.setAttribute('aria-expanded', 'true');
  button.setAttribute('aria-label', 'Minimizar PJ Assistant');
  button.classList.add('is-open');
  button.classList.remove('has-update');
  requestAnimationFrame(() => document.querySelector('#assistant-input')?.focus());
}

function hideAssistant() {
  const panel = document.querySelector('#plump-assistant-panel');
  const button = document.querySelector('#plump-assistant-button');
  if (!panel || !button) return;
  panel.hidden = true;
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-label', 'Abrir PJ Assistant');
  button.classList.remove('is-open');
  button.focus();
}

function localAssistantFallback(message) {
  const text = message.toLocaleLowerCase('pt-BR');
  if (/letra|texto maior|fonte/.test(text)) return 'Abra Menu → Acessibilidade → Baixa visão e ajuste "Tamanho do texto", ou use o atalho "Texto maior".';
  if (/vermelho|verde|distinguir cor|daltoni/.test(text)) return 'Abra Menu → Acessibilidade → Daltonismo e escolha uma paleta. O site também pode usar símbolos junto com cores. Isso configura a interface sem fazer diagnóstico.';
  if (/anima|movimento|parar/.test(text)) return 'Abra Menu → Acessibilidade → Sensibilidade a movimento, ou use o atalho "Sem animações".';
  if (/bot(ão|ao|ões|oes)|controle maior|clicável|clicavel/.test(text)) return 'Abra Menu → Acessibilidade → Dificuldade motora e ative "Modo controles ampliados" para alvos de pelo menos 44 × 44 px.';
  if (/baix|download/.test(text)) return 'No card do jogo, selecione "Baixar" para obter o arquivo pelo GitHub. Se o botão não aparecer, consulte o repositório do projeto.';
  if (/tela cheia|fullscreen/.test(text)) return 'Na aba dedicada do jogo, use o botão "Tela cheia" na barra superior. Pressione Esc para sair.';
  if (/jog|abrir|trav/.test(text)) return 'Escolha um jogo no catálogo e use "Jogar agora". A página dedicada será aberta em uma nova aba; se o jogo falhar, use "Tentar novamente" ou "Abrir jogo diretamente".';
  if (/menu|três barr|tres barr/.test(text)) return 'Use o botão de três barras no topo para abrir aparência, wallpapers, visualização dos jogos e acessibilidade.';
  if (/wallpaper|papel de parede|cores?/.test(text)) return 'Abra o menu de três barras, entre em "Live wallpapers" e escolha um fundo. A opção "Usar cores do wallpaper" adapta as cores do site e do PJ Assistant.';
  return 'Não consegui acessar o suporte inteligente agora. Tente novamente em alguns instantes.';
}

async function sendAssistantMessage(rawMessage, getGamesContext) {
  const message = String(rawMessage || '').trim().slice(0, 1000);
  if (!message || assistantState.busy) return;
  const elapsed = Date.now() - assistantState.lastSentAt;
  if (elapsed < ASSISTANT_MIN_INTERVAL) {
    addAssistantMessage('assistant', 'Aguarde um instante antes de enviar outra mensagem.', false);
    return;
  }
  assistantState.lastSentAt = Date.now();
  assistantState.busy = true;

  const input = document.querySelector('#assistant-input');
  const sendBtn = document.querySelector('#assistant-send');
  const typing = document.querySelector('#assistant-typing');
  const button = document.querySelector('#plump-assistant-button');
  const suggestions = document.querySelector('#assistant-suggestions');

  if (input) input.value = '';
  if (sendBtn) sendBtn.disabled = true;
  if (typing) typing.hidden = false;
  if (button) button.classList.add('is-thinking');
  if (suggestions) suggestions.hidden = true;

  addAssistantMessage('user', message);

  const history = assistantState.history.slice(0, -1).slice(-10);

  try {
    const gamesContext = getGamesContext ? getGamesContext() : [];
    const response = await fetch('/api/support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, games: gamesContext })
    });
    if (!response.ok) throw new Error(`Support unavailable: ${response.status}`);
    const payload = await response.json();
    if (!payload || typeof payload.reply !== 'string' || !payload.reply.trim()) throw new Error('Invalid support response');
    addAssistantMessage('assistant', payload.reply.trim().slice(0, 4000));
  } catch (error) {
    console.warn('PJ Assistant usou o modo local.', error);
    addAssistantMessage('assistant', localAssistantFallback(message));
  } finally {
    assistantState.busy = false;
    if (sendBtn) sendBtn.disabled = false;
    if (typing) typing.hidden = true;
    if (button) button.classList.remove('is-thinking');
    if (!document.querySelector('#plump-assistant-panel')?.hidden) document.querySelector('#assistant-input')?.focus();
  }
}

function setupAssistant(getGamesContext) {
  const button = document.querySelector('#plump-assistant-button');
  const panel = document.querySelector('#plump-assistant-panel');
  const form = document.querySelector('#assistant-form');
  const input = document.querySelector('#assistant-input');
  const clearBtn = document.querySelector('#assistant-clear');
  const minimizeBtn = document.querySelector('#assistant-minimize');
  const closeBtn = document.querySelector('#assistant-close');

  if (button) button.addEventListener('click', () => panel?.hidden ? openAssistant() : hideAssistant());
  if (minimizeBtn) minimizeBtn.addEventListener('click', hideAssistant);
  if (closeBtn) closeBtn.addEventListener('click', hideAssistant);
  if (clearBtn) clearBtn.addEventListener('click', resetAssistant);
  if (form) form.addEventListener('submit', event => { event.preventDefault(); sendAssistantMessage(input?.value, getGamesContext); });
  if (input) input.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendAssistantMessage(event.currentTarget.value, getGamesContext); } });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel?.hidden) hideAssistant(); });

  resetAssistant();
}

export { setupAssistant, sendAssistantMessage, resetAssistant, openAssistant, hideAssistant, assistantState };
export { ASSISTANT_GREETING, ASSISTANT_SUGGESTIONS };