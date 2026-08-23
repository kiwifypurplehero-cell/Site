export const TROPHIES = Object.freeze([
  {id:'first-play',name:'Primeiro jogo',description:'Iniciou seu primeiro jogo.',icon:'🎮'},
  {id:'one-hour',name:'Primeira hora',description:'Jogou por 1 hora no total.',icon:'⏱️'},
  {id:'five-games',name:'Explorador',description:'Iniciou 5 jogos diferentes.',icon:'🧭'},
  {id:'ten-hours',name:'Veterano',description:'Jogou por 10 horas no total.',icon:'🏆'},
  {id:'first-favorite',name:'Guardado com carinho',description:'Favoritou seu primeiro jogo.',icon:'⭐'},
  {id:'three-platforms',name:'Multiplataforma',description:'Jogou em 3 plataformas diferentes.',icon:'🌐'}
]);

export function earnedTrophyIds({gamesPlayed=0,totalSeconds=0,platforms=0,favorites=0}={}) {
  return [gamesPlayed>=1&&'first-play',totalSeconds>=3600&&'one-hour',gamesPlayed>=5&&'five-games',totalSeconds>=36000&&'ten-hours',favorites>=1&&'first-favorite',platforms>=3&&'three-platforms'].filter(Boolean);
}
