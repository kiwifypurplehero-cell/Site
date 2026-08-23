export function viewportSize(target=window){const visual=target.visualViewport;return {width:Number(visual?.width)||target.innerWidth,height:Number(visual?.height)||target.innerHeight};}
export class GameViewportManager{
  constructor({shell,stage,aspectRatio=0}){this.shell=shell;this.stage=stage;this.aspectRatio=aspectRatio;this.fit=this.fit.bind(this)}
  start(){for(const type of ['resize','orientationchange'])addEventListener(type,this.fit,{passive:true});visualViewport?.addEventListener('resize',this.fit,{passive:true});document.addEventListener('fullscreenchange',this.fit);this.fit();return this}
  fit(){const {width,height}=viewportSize();this.shell?.style.setProperty('--game-viewport-width',`${width}px`);this.shell?.style.setProperty('--game-viewport-height',`${height}px`);if(!this.stage||!this.aspectRatio)return;let w=width,h=w/this.aspectRatio;if(h>height){h=height;w=h*this.aspectRatio}Object.assign(this.stage.style,{width:`${w}px`,height:`${h}px`,maxWidth:'100%',maxHeight:'100%',margin:'auto'})}
  async fullscreen(){try{await this.shell?.requestFullscreen?.();return true}catch{return false}}
  destroy(){for(const type of ['resize','orientationchange'])removeEventListener(type,this.fit);visualViewport?.removeEventListener('resize',this.fit);document.removeEventListener('fullscreenchange',this.fit)}
}
