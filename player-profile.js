const PLAYER_KEY='plumpgames_player_id';
const CREATED_KEY='plumpgames_player_created_at';

function uuid(){return crypto.randomUUID();}

export class PlayerProfileManager {
  constructor(storage=localStorage){this.storage=storage;this.profile=this.ensure();}
  ensure(){
    let id=this.storage.getItem(PLAYER_KEY),createdAt=this.storage.getItem(CREATED_KEY);
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id||'')){
      id=uuid();createdAt=new Date().toISOString();this.storage.setItem(PLAYER_KEY,id);this.storage.setItem(CREATED_KEY,createdAt);
    }
    return {guestPlayerId:id,displayName:'Jogador',avatar:'🎮',createdAt};
  }
  get(){return {...this.profile};}
  reset(){this.storage.removeItem(PLAYER_KEY);this.storage.removeItem(CREATED_KEY);this.profile=this.ensure();return this.get();}
}

export const playerProfile=new PlayerProfileManager();
export function formatPlaytime(value){const seconds=Math.max(0,Math.floor(Number(value)||0));if(seconds<60)return `${seconds}s`;const minutes=Math.floor(seconds/60);if(minutes<60)return `${minutes}min`;return `${Math.floor(minutes/60)}h ${String(minutes%60).padStart(2,'0')}min`;}
export function tierFor(index,total){if(total<3)return null;const percentile=index/total;return percentile<.15?'S':percentile<.35?'A':percentile<.6?'B':percentile<.82?'C':'D';}
