import{$,$$,openModal,closeModal,installDialogControls,toast}from'./ui.js';import{initAuth,requireUser,canAccessPersonalization}from'./auth.js';import{initWallpapers}from'./wallpapers.js';import{initPreferences}from'./preferences.js';import{initFeedback}from'./feedback.js';import{initBugReports}from'./bug-reports.js';import{initProfile}from'./profile.js';
const SITE_URL='https://site.kiwifypurplehero.workers.dev/';
const canonical=document.querySelector('link[rel="canonical"]');if(canonical)canonical.href=SITE_URL;const ogUrl=document.querySelector('meta[property="og:url"]');if(ogUrl)ogUrl.content=SITE_URL;const schema=document.querySelector('script[type="application/ld+json"]');if(schema){try{const data=JSON.parse(schema.textContent);data.url=SITE_URL;schema.textContent=JSON.stringify(data)}catch(error){console.warn('Não foi possível atualizar o JSON-LD.',error)}}
async function safeInit(name,initializer){try{await initializer()}catch(error){console.error(`Falha ao inicializar ${name}:`,error)}}
async function main(){
  installDialogControls();
  await safeInit('autenticação',initAuth);
  await safeInit('perfil',initProfile);
  await safeInit('wallpapers',initWallpapers);
  await safeInit('preferências',initPreferences);
  await safeInit('feedback',initFeedback);
  await safeInit('relatórios de bugs',initBugReports);
}
main().catch(error=>console.error('Falha geral ao iniciar o site:',error));
document.addEventListener('click',e=>{if(e.target.closest('[data-open-terms]'))legal('Termos de Uso','Ao usar a Plump Jogos, você concorda em utilizar a plataforma de forma lícita e respeitosa. Não envie conteúdo ofensivo, scripts, dados de terceiros ou relatórios falsos. Contas e funcionalidades podem mudar durante a evolução do projeto.');if(e.target.closest('[data-open-privacy]'))legal('Política de Privacidade','Armazenamos e-mail, nome de exibição, preferências, feedbacks, relatórios de bugs e dados técnicos básicos revisados no envio. Senhas são processadas pelo Supabase Auth e não são guardadas diretamente pelo site. Não coletamos localização precisa, dados bancários ou endereço residencial. Nenhum sistema pode ser declarado totalmente inviolável.');const settings=e.target.closest('[data-open-settings]');if(settings&&!canAccessPersonalization()){e.preventDefault();e.stopImmediatePropagation();requireUser();toast('Complete seu perfil para liberar a personalização.','error')}} ,true);
function legal(title,text){$('#data-title').textContent=title;const p=document.createElement('p');p.textContent=text;$('#data-modal-content').replaceChildren(p);openModal($('#data-modal'))}
window.addEventListener('offline',()=>toast('Você está offline. Conteúdo já carregado continua disponível.','error'));window.addEventListener('online',()=>toast('Conexão restaurada.','success'));
