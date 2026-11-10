// Este mismo código está incluido en app.json como script de la escena.
player.imageTargets=[{arContent:this.getObjectByName('ARContent')}];
player.kubi={root:this.getObjectByName('ARContent'),angle:0,paused:false,selected:-1,reactionAt:-Infinity};

function init(){
  player.kubi.root.children.forEach(function(object){
    if(object.userData.kind===undefined)return;
    object.onClick=function(){window.dispatchEvent(new CustomEvent('kubi:character',{detail:{kind:object.userData.kind}}));};
  });
}

function update(event){
  if(player.kubi.paused)return;
  var time=event.time/1000,root=player.kubi.root;
  root.rotation.y=player.kubi.angle;
  var elapsed=(performance.now()-player.kubi.reactionAt)/1000;
  var age=Number.isFinite(elapsed)?elapsed:-1;
  root.children.forEach(function(object){
    if(object.userData.kind===undefined)return;
    var kind=object.userData.kind;
    var reaction=kind===player.kubi.selected&&age>=0&&age<1.3?Math.sin(age/1.3*Math.PI):0;
    object.position.y=object.userData.baseY+Math.sin(time*1.8+kind)*.012+reaction*.065;
    object.rotation.z=Math.sin(time*1.5+kind)*.025+reaction*Math.sin(age*16)*.04;
    object.scale.setScalar(1+reaction*.12);
    var arm=object.getObjectByName('Brazo derecho');
    if(arm)arm.rotation.z=-.18+Math.sin(time*2+kind)*.22+reaction*Math.sin(age*22)*.7;
  });
}
