const cacheKey='plumpgames-preferences-v3';
const gate=document.querySelector('#auth-gate');
const app=document.querySelector('#app-shell');
const status=gate.querySelector('[data-auth-status]');
let loaded=false;

function csrfHeaders(){return {'Content-Type':'application/json','X-PlumpGames-Request':'same-origin'};}
async function api(path,options={}){
  const response=await fetch(path,{credentials:'include',cache:'no-store',...options});
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
  const temporary=new Map();
  window.PlumpStorage=user.isGuest?{getItem:key=>temporary.has(key)?temporary.get(key):null,setItem:(key,value)=>temporary.set(key,String(value)),removeItem:key=>temporary.delete(key)}:localStorage;
  for(const [src,type] of [['play-utils.js',''],['components/library/game-library-view.js',''],['script.js','']]){
    const script=document.createElement('script');script.src=src;if(type)script.type=type;document.head.append(script);
  }
  const loadSecondary=()=>{
    for(const [src,type] of [['catalog-playtime.js','module']]){
      const script=document.createElement('script');script.src=src;if(type)script.type=type;document.head.append(script);
    }
  };
  if('requestIdleCallback' in window)requestIdleCallback(loadSecondary,{timeout:2500});else setTimeout(loadSecondary,1200);
  window.dispatchEvent(new CustomEvent('plumpgames:authenticated',{detail:user}));
}
function enterGuest(){
  const suffix=String(Math.floor(Math.random()*10000)).padStart(4,'0');
  const guest={id:`guest-${crypto.randomUUID?.()||Date.now()}`,username:'visitante',displayName:`Visitante ${suffix}`,avatar:'controller',bio:'',isPublic:false,role:'guest',isGuest:true};
  window.__PLUMPGAMES_GUEST__=guest;
  loadApp(guest);
}
function showForm(name){gate.querySelectorAll('[data-auth-form]').forEach(form=>form.hidden=form.dataset.authForm!==name);status.textContent='';}
gate.querySelectorAll('[data-show-auth]').forEach(button=>button.onclick=()=>showForm(button.dataset.showAuth));
gate.querySelectorAll('[data-auth-back]').forEach(button=>button.onclick=()=>showForm('choice'));
gate.querySelector('[data-guest-login]').addEventListener('click',enterGuest);
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
let authBootstrapPromise;
async function restoreSession(){
  if(authBootstrapPromise)return authBootstrapPromise;
  status.textContent='Verificando sua sessão…';
  authBootstrapPromise=api('/api/auth/me').then(result=>{
    if(result.preferences)localStorage.setItem(cacheKey,JSON.stringify({...JSON.parse(localStorage.getItem(cacheKey)||'{}'),view:result.preferences.libraryView,wallpaper:result.preferences.liveWallpaper,theme:result.preferences.theme}));
    window.__PLUMPGAMES_AUTH_BOOTSTRAP__={authenticated:true,preferences:true};
    document.dispatchEvent(new CustomEvent('plumpgames:auth-checked',{detail:window.__PLUMPGAMES_AUTH_BOOTSTRAP__}));
    loadApp(result.user);
  }).catch(error=>{
    gate.hidden=false;
    const connectionFailure=error.status>=500||!error.status;
    if(connectionFailure){
      status.replaceChildren('Não foi possível verificar sua sessão. ');
      const retry=document.createElement('button');retry.type='button';retry.textContent='Tentar novamente';
      retry.onclick=()=>{authBootstrapPromise=null;restoreSession();};status.append(retry);
    }else if(error.status===401){status.textContent='';}
    else{status.textContent=error.message;}
    window.__PLUMPGAMES_AUTH_BOOTSTRAP__={authenticated:false,degraded:connectionFailure};
    document.dispatchEvent(new CustomEvent('plumpgames:auth-checked',{detail:window.__PLUMPGAMES_AUTH_BOOTSTRAP__}));
  });
  return authBootstrapPromise;
}
restoreSession();

if(new URL(location.href).searchParams.has('register'))showForm('register');

window.PlumpAuth={api,csrfHeaders,isGuest:()=>Boolean(window.plumpUser?.isGuest),logout:async()=>{if(!window.plumpUser?.isGuest)await api('/api/auth/logout',{method:'POST',headers:csrfHeaders(),body:'{}'});location.href='/';}};
