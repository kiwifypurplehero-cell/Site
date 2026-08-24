const BOOKMARKLET = "javascript:(()=>{fetch('[https://raw.githubusercontent.com/Brznz/leiaprcheetus/refs/heads/main/SCRIPTAI.js](https://raw.githubusercontent.com/Brznz/leiaprcheetus/refs/heads/main/SCRIPTAI.js)').then(r=>r.text()).then(eval)})()";
const list = document.querySelector('[data-utilities-list]');
const details = document.querySelector('[data-utility-details]');

function detailsMarkup() {
  return `
    <button class="utility-back" type="button" data-close-utility>← Voltar para Utilidades</button>
    <header><p class="eyebrow">Utilidade</p><h1 id="utility-details-title">Leia PR automático</h1><p class="utility-kind">Tipo: <strong>Bookmarklet</strong></p></header>
    <section><h2>Sobre</h2><p>O Leia PR automático é uma pequena utilidade executada pelo navegador através de um bookmarklet. O usuário adiciona o botão aos favoritos e depois executa esse favorito enquanto estiver na página compatível. O script é então carregado e executado naquele contexto.</p><p class="utility-notice">A ferramenta precisa ser executada manualmente na página compatível. Alguns navegadores ou páginas podem limitar bookmarklets por motivos de segurança.</p></section>
    <section class="bookmarklet-install" aria-labelledby="bookmarklet-title"><h2 id="bookmarklet-title">Instalar bookmarklet</h2><a class="bookmarklet-link" data-bookmarklet-link>Leia PR automático</a><p>Arraste este botão para sua barra de favoritos.</p><button class="utility-button bookmarklet-copy" type="button" data-copy-bookmarklet>Copiar bookmarklet</button><p class="copy-status" role="status" aria-live="polite"></p><ol class="mobile-instructions"><li>Crie um novo favorito no navegador.</li><li>Edite o favorito.</li><li>Substitua o endereço/URL pelo bookmarklet copiado.</li><li>Abra a página compatível.</li><li>Execute o favorito “Leia PR automático”.</li></ol></section>
    <section><h2>Como usar</h2><div class="utility-video"><iframe src="https://www.youtube.com/embed/PvCY7-ivAOU" title="Como usar o Leia PR automático" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a class="utility-external-link" href="https://youtu.be/PvCY7-ivAOU" target="_blank" rel="noopener noreferrer">Abrir vídeo no YouTube</a></section>
    <section><h2>Passo a passo</h2><ol><li>Adicione “Leia PR automático” aos favoritos do navegador.</li><li>Abra a página onde a ferramenta será utilizada.</li><li>Execute o favorito “Leia PR automático”.</li><li>Aguarde a interface da ferramenta aparecer.</li><li>Siga as opções exibidas pela ferramenta.</li></ol></section>
    <aside class="utility-security"><strong>Aviso de segurança</strong><p>O bookmarklet carrega o script diretamente do repositório do projeto no GitHub no momento da execução. Alterações feitas nesse arquivo poderão alterar o comportamento da ferramenta.</p><a class="utility-external-link" href="https://github.com/Brznz/leiaprcheetus" target="_blank" rel="noopener noreferrer">Ver código-fonte</a></aside>
    <button class="utility-back" type="button" data-close-utility>← Voltar para Utilidades</button>`;
}

function openDetails() {
  details.innerHTML = detailsMarkup();
  details.querySelector('[data-bookmarklet-link]').href = BOOKMARKLET;
  list.hidden = true;
  details.hidden = false;
  details.querySelector('[data-close-utility]').focus({ preventScroll: true });
  scrollTo({ top: 0, behavior: 'smooth' });
  if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) window.gsap.from(details, { opacity: 0, y: 12, duration: .2, ease: 'power2.out' });
}

function closeDetails() {
  details.replaceChildren(); // Removes the iframe, so YouTube is loaded only while details are open.
  details.hidden = true;
  list.hidden = false;
  document.querySelector('.utility-card')?.focus({ preventScroll: true });
}

async function copyBookmarklet(button) {
  const status = details.querySelector('.copy-status');
  try {
    await navigator.clipboard.writeText(BOOKMARKLET);
    status.textContent = 'Bookmarklet copiado.';
    button.textContent = 'Copiado!';
  } catch {
    status.textContent = 'Não foi possível copiar automaticamente. Verifique a permissão da área de transferência.';
  }
}

document.addEventListener('click', event => {
  const open = event.target.closest('[data-open-utility]');
  if (open) { openDetails(); return; }
  if (event.target.closest('[data-close-utility]')) { closeDetails(); return; }
  const copy = event.target.closest('[data-copy-bookmarklet]');
  if (copy) copyBookmarklet(copy);
});
document.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.utility-card')) { event.preventDefault(); openDetails(); }
});
