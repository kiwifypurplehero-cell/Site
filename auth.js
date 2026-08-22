const cacheKey='plumpgames-preferences-v3';
const gate=document.querySelector('#auth-gate');
const app=document.querySelector('#app-shell');
const status=gate.querySelector('[data-auth-status]');
let loaded=false;

function csrfHeaders(){return {'Content-Type':'application/json','X-PlumpGames-Request':'same-origin'};}
async function api(path,options={}){
  const response=await fetch(path,{credentials:'same-origin',...options});
  const body=await response.json().catch(()=>({}));
  if(!response.ok){
    const messages={
      USERNAME_TAKEN:'Este nome de usuário já está em uso. Escolha outro nome.',
      INVALID_CREDENTIALS:'Usuário ou senha inválidos.',
      PASSWORD_TOO_SHORT:'A senha precisa ter pelo menos 8 caracteres.',
      AUTH_CONFIGURATION_ERROR:'O serviço de contas não está configurado. Tente novamente mais tarde.',
      AUTH_SERVICE_UNAVAILABLE:'O serviço de contas está temporariamente indisponível. Tente novamente em alguns minutos.'
    };
    const fallback=response.status>=500?'O servidor está temporariamente indisponível. Tente novamente mais tarde.':'Não foi possível concluir a operação.';
    throw Object.assign(new Error(messages[body.code]||body.error||fallback),{status:response.status,code:body.code});
  }
  return body;
}
function loadApp(user){
  if(loaded)return; loaded=true;
  gate.hidden=true; app.hidden=false; document.body.classList.remove('auth-locked');
  window.plumpUser=user;
  for(const [src,type] of [['site-loader.js','module'],['play-utils.js',''],['components/library/game-library-view.js',''],['script.js',''],['catalog-playtime.js','module'],['accessibility.js','']]){
    const script=document.createElement('script');script.src=src;if(type)script.type=type;document.head.append(script);
  }
  window.dispatchEvent(new CustomEvent('plumpgames:authenticated',{detail:user}));
}
function showForm(name){gate.querySelectorAll('[data-auth-form]').forEach(form=>form.hidden=form.dataset.authForm!==name);status.textContent='';}
gate.querySelectorAll('[data-show-auth]').forEach(button=>button.onclick=()=>showForm(button.dataset.showAuth));
gate.querySelectorAll('[data-auth-back]').forEach(button=>button.onclick=()=>showForm('choice'));
gate.addEventListener('submit',async event=>{
  event.preventDefault(); const form=event.target; const submit=form.querySelector('[type=submit]');
  status.textContent='';submit.disabled=true;
  try{
    const values=Object.fromEntries(new FormData(form));
    const registering=form.dataset.authForm==='register';
    if(registering&&values.password!==values.confirmPassword)throw new Error('As senhas não coincidem.');
    const endpoint=registering?'/api/auth/register':'/api/auth/login';
    const result=await api(endpoint,{method:'POST',headers:csrfHeaders(),body:JSON.stringify({username:values.username,password:values.password})});
    if(result.preferences)localStorage.setItem(cacheKey,JSON.stringify({...JSON.parse(localStorage.getItem(cacheKey)||'{}'),view:result.preferences.libraryView,wallpaper:result.preferences.liveWallpaper}));
    loadApp(result.user);
  }catch(error){status.textContent=error.message;}finally{submit.disabled=false;}
});
api('/api/auth/me').then(result=>{if(result.preferences)localStorage.setItem(cacheKey,JSON.stringify({...JSON.parse(localStorage.getItem(cacheKey)||'{}'),view:result.preferences.libraryView,wallpaper:result.preferences.liveWallpaper}));loadApp(result.user);}).catch(()=>{gate.hidden=false;});

window.PlumpAuth={api,csrfHeaders,logout:async()=>{await api('/api/auth/logout',{method:'POST',headers:csrfHeaders(),body:'{}'});location.href='/';}};
