/** Histéresis y espera evitan disparos por ruido o por cada fotograma. */
export class SmileGate {
  constructor({on=.52,off=.28,hold=180,cooldown=1700}={}){Object.assign(this,{on,off,hold,cooldown});this.reset();}
  reset(){this.since=null;this.latched=false;this.last=-Infinity;}
  update(score,now,hasFace=true){
    if(!hasFace){this.since=null;this.latched=false;return false;}
    if(score<this.off){this.since=null;this.latched=false;}
    if(this.latched||now-this.last<this.cooldown)return false;
    if(score<this.on){this.since=null;return false;}
    this.since??=now;if(now-this.since<this.hold)return false;
    this.latched=true;this.last=now;this.since=null;return true;
  }
}
export function smileScore(estimate){
  const raw=estimate?.blendshapes;const categories=Array.isArray(raw)?raw:(raw?.categories||[]);
  const scores=new Map(categories.map(c=>[c.categoryName||c.displayName||c.label,c.score||0]));
  return ((scores.get('mouthSmileLeft')||0)+(scores.get('mouthSmileRight')||0))/2;
}
