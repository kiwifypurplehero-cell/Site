(function(global){
  const modes=new Set(['detailed','list','icons']);
  function abbreviation(title){const words=String(title||'').trim().split(/[\s_-]+/).filter(Boolean);if(words.length===1)return words[0].replace(/[^\p{L}\p{N}]/gu,'').slice(0,3).toLocaleUpperCase('pt-BR')||'JOG';return words.map(word=>/^\d+(?:\.\d+)*$/.test(word)?word.replaceAll('.',''):word[0]).join('').slice(0,4).toLocaleUpperCase('pt-BR');}
  function normalize(game={}){return {id:String(game.id||''),title:String(game.title||game.name||'Jogo sem nome'),source:String(game.source||'web'),platform:String(game.platform||game.language||'Não informado'),releaseDate:game.releaseDate||game.createdAt||'',updatedAt:game.updatedAt||'',version:String(game.version||''),description:String(game.description||''),cover:String(game.cover||game.coverUrl||''),playUrl:String(game.playUrl||''),original:game};}
  class GameLibraryView{
    constructor(root,{mode='detailed',createItem,onModeChange}={}){this.root=root;this.createItem=createItem;this.onModeChange=onModeChange;this.mode=modes.has(mode)?mode:'detailed';this.games=[];this.apply();}
    setMode(mode){if(!modes.has(mode))return;this.mode=mode;this.apply();this.render();this.onModeChange?.(mode);}
    apply(){this.root.dataset.view=this.mode;document.querySelectorAll('[data-view-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.viewMode===this.mode)));}
    setGames(games){this.games=(games||[]).map(normalize);this.render();}
    render(){const fragment=document.createDocumentFragment();for(const game of this.games){const item=this.createItem(game.original,game);item.title=this.mode==='icons'?game.title:'';item.dataset.abbreviation=abbreviation(game.title);fragment.append(item);}this.root.replaceChildren(fragment);}
  }
  global.GameLibraryView=GameLibraryView;global.PlumpGameMetadata={normalize,abbreviation};
})(window);
