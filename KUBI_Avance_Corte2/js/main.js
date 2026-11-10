import * as THREE from './three.module.js';
import { APP } from './app.js';
import { SmileGate, smileScore } from './gesture.js';
window.THREE=THREE;
const $=s=>document.querySelector(s);
const welcome=$('#welcome'),experience=$('#experience'),dialog=$('#info-dialog');
const names=['FRI - Fresa','MAKO - Mango','UMI - Uva'],flavors=['FRI · Fresa','MAKO · Mango','UMI · Uva'];
const notes=[[523,659,784],[587,740,880],[659,784,988]];
let player,loadPromise,heroRenderer,heroScene,heroCamera,heroRoot,mindar,previewCamera;
let mode='home',muted=false,audioContext,found=false,busy=false,actionToken=0,reactionTimer;
let faceTracker=null,faceSession=null,faceToken=0,faceLoading=false;
const descriptions={
 product:'<span class="eyebrow">01 / PRODUCTO</span><h2>Un snack con personalidad.</h2><p>KUBI es una marca ficticia de gomitas frutales con forma de pequeñas criaturas. Cada figura convierte un sabor en un personaje: FRI, MAKO y UMI.</p><p>Es un dulce práctico para disfrutar y compartir. La tarjeta de la colección permite conocer a los personajes mediante una experiencia de realidad aumentada.</p><span class="pill">Producto ficticio · Proyecto académico</span>',
 flavors:'<span class="eyebrow">02 / SABORES</span><h2>Tres sabores. Tres criaturas.</h2><div class="flavor"><strong style="color:#df4365">FRI · Fresa</strong><span>Cuerpo de fresa, semillas y corona de hojas. Su sabor es dulce y ligeramente ácido.</span></div><div class="flavor"><strong style="color:#b48218">MAKO · Mango</strong><span>Forma ovalada, panza suave y hoja lateral. Su sabor es tropical y dulce.</span></div><div class="flavor"><strong style="color:#8460c7">UMI · Uva</strong><span>Racimo, zarcillo y detalles lavanda. Su sabor es frutal e intenso.</span></div>',
 experience:'<span class="eyebrow">03 / EXPERIENCIA</span><h2>Tu tarjeta abre su mundo.</h2><p>Muestra la tarjeta KUBI completa frente a la cámara. Al reconocerla, aparecen las tres criaturas en una pequeña isla botánica.</p><p>Toca una criatura para descubrir su sabor y activar su saludo. Usa “Girar escena” para verla desde otro ángulo y los botones para conocer el producto y sus sabores.</p><p>En el filtro facial, sonríe para descubrir un sabor y activar una celebración con sonido. Funciona aparte de la lectura de la tarjeta.</p>'
};
function sound(sequence=[523,659,784]){
 if(muted)return;
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  audioContext??=new Audio();audioContext.resume().catch(()=>{});
  sequence.forEach((frequency,i)=>{
   const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),time=audioContext.currentTime+i*.09;
   oscillator.type='sine';oscillator.frequency.value=frequency;
   gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.08,time+.015);gain.gain.exponentialRampToValueAtTime(.001,time+.19);
   oscillator.connect(gain).connect(audioContext.destination);oscillator.start(time);oscillator.stop(time+.20);
  });
 }catch(error){console.warn('Audio no disponible:',error.message);}
}
function cameraError(error){
 const n=error?.name||'',m=error?.message||'';
 if(n==='NotAllowedError'||/denied|permission/i.test(m))return 'Permite el acceso a la cámara en los ajustes de este sitio y vuelve a intentarlo.';
 if(n==='NotFoundError'||/device not found|no camera/i.test(m))return 'No se encontró una cámara. Puedes abrir KUBI en tu celular o explorar la vista 3D.';
 if(n==='NotReadableError'||/could not start video/i.test(m))return 'La cámara está ocupada. Cierra las otras aplicaciones que la estén usando y vuelve a intentarlo.';
 return m||'No se pudo iniciar la cámara. Revisa el permiso del navegador y vuelve a intentarlo.';
}
async function load(){
 if(player)return player;if(loadPromise)return loadPromise;
 loadPromise=(async()=>{
  const response=await fetch('app.json');if(!response.ok)throw new Error('No se pudo cargar la escena KUBI.');
  const p=new APP.Player({alpha:true});await p.load(await response.json());
  p.renderer.setPixelRatio(Math.min(devicePixelRatio,2));p.setSize(innerWidth,innerHeight);p.setRenderEnabled(false);p.play();player=p;return p;
 })().catch(error=>{loadPromise=null;throw error;});
 return loadPromise;
}
async function hero(){
 const p=await load();heroScene=p.scene.clone(true);heroScene.background=new THREE.Color(0xeee4d7);
 heroRoot=heroScene.getObjectByName('ARContent');heroScene.getObjectByName('Tarjeta KUBI').visible=false;
 heroCamera=new THREE.PerspectiveCamera(39,1,.01,30);heroCamera.position.set(0,1.20,2.28);heroCamera.lookAt(0,.23,0);
 heroRenderer=new THREE.WebGLRenderer({antialias:true});heroRenderer.setPixelRatio(Math.min(devicePixelRatio,2));heroRenderer.toneMapping=THREE.ACESFilmicToneMapping;
 $('#hero-canvas').appendChild(heroRenderer.domElement);
 const resize=()=>{const host=$('.hero');heroRenderer.setSize(host.clientWidth,host.clientHeight);heroCamera.aspect=host.clientWidth/host.clientHeight;heroCamera.updateProjectionMatrix();};
 new ResizeObserver(resize).observe($('.hero'));resize();
 function animate(time){
  requestAnimationFrame(animate);if(mode!=='home'||document.hidden)return;
  heroRoot.rotation.y=Math.sin(time*.00025)*.13;
  heroRoot.children.forEach(o=>{if(o.userData.kind!==undefined)o.position.y=.083+Math.sin(time*.0018+o.userData.kind)*.01;});
  heroRenderer.render(heroScene,heroCamera);
 }
 requestAnimationFrame(animate);
}
function showExperience(next){
 mode=next;welcome.hidden=true;experience.hidden=false;
 $('#preview-container').hidden=next!=='preview';$('#ar-container').hidden=next!=='ar';$('#scan-hint').hidden=next!=='ar';
 $('#info-buttons').hidden=next==='ar';$('.extras').hidden=next==='ar';
 $('#mode-label').textContent=next==='preview'?'Vista 3D · toca una criatura y descubre su sabor':'Enfoca tu tarjeta KUBI';
 $('#status').textContent=next==='preview'?'Vista 3D · sin cámara':'Buscando tarjeta KUBI…';
}
function resetRoot(){
 if(!player)return;const root=player.kubi.root;root.visible=true;root.rotation.set(0,0,0);root.scale.setScalar(1);
 Object.assign(player.kubi,{angle:0,paused:false,reactionAt:-Infinity});
 root.children.forEach(o=>{if(o.userData.kind!==undefined)o.scale.setScalar(1);});
 if(root.parent!==player.scene.getObjectByName('ImageTarget'))player.scene.getObjectByName('ImageTarget').add(root);
}
async function stopImage(){
 const tracker=mindar;mindar=null;found=false;if(tracker)tracker.stop();
 if(player){player.setRenderEnabled(false);player.dom.style.display='none';resetRoot();}
}
async function leave(){
 actionToken++;
 if(faceSession){faceSession=null;faceToken++;await stopFace();}
 await stopImage();mode='home';welcome.hidden=false;experience.hidden=true;$('#reaction').hidden=true;clearTimeout(reactionTimer);
}
function sizePreview(){
 if(!player||mode!=='preview')return;player.setSize(innerWidth,innerHeight);previewCamera.aspect=innerWidth/innerHeight;
 const distance=Math.max(2.55,1.65/previewCamera.aspect);
 previewCamera.position.set(0,distance*.58,distance);previewCamera.lookAt(0,.23,0);previewCamera.updateProjectionMatrix();
}
async function startPreview(){
 if(busy)return;
 try{
  await load();await stopImage();showExperience('preview');
  player.scene.background=new THREE.Color(0xf8f2e8);player.scene.getObjectByName('Tarjeta KUBI').visible=false;
  previewCamera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.01,50);player.setCamera(previewCamera);
  $('#preview-container').appendChild(player.dom);player.dom.style.display='block';sizePreview();player.setRenderEnabled(true);
 }catch(error){$('#error').textContent=error.message;}
}
async function startAR(){
 if(busy)return;busy=true;const token=++actionToken;$('#start').disabled=true;$('#error').textContent='';sound([392,523]);
 try{
  if(!window.isSecureContext)throw new Error('La cámara necesita HTTPS o localhost. Abre el enlace publicado.');
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Este navegador no tiene acceso a la cámara. Abre KUBI directamente en Safari o Chrome.');
  await load();await stopImage();if(token!==actionToken)return;
  const {MindARController}=await import('./mindar/mindar_controller.js');
  player.scene.background=null;player.scene.getObjectByName('Tarjeta KUBI').visible=false;
  const tracker=new MindARController($('#ar-container'),player,false);mindar=tracker;
  tracker.addListener('found',()=>{found=true;$('#scan-hint').hidden=true;$('#info-buttons').hidden=false;$('.extras').hidden=false;$('#mode-label').textContent='Tarjeta detectada · toca una criatura';$('#status').textContent='KUBI conectado';sound();});
  tracker.addListener('lost',()=>{found=false;$('#scan-hint').hidden=false;$('#info-buttons').hidden=true;$('.extras').hidden=true;$('#mode-label').textContent='Vuelve a mostrar la tarjeta';$('#status').textContent='Buscando tarjeta KUBI…';$('#reaction').hidden=true;if(dialog.open&&!faceSession)dialog.close();});
  showExperience('ar');player.dom.style.display='none';await tracker.start();
  if(token!==actionToken||mindar!==tracker){tracker.stop();return;}
 }catch(error){console.error(error);await leave();$('#error').textContent=cameraError(error);}
 finally{busy=false;$('#start').disabled=false;}
}
function reactToCreature(kind){
 if(!player||dialog.open||!(mode==='preview'||(mode==='ar'&&found)))return;
 player.kubi.selected=kind;player.kubi.reactionAt=performance.now();
 $('#reaction').textContent=flavors[kind]+' · ¡Hola!';$('#reaction').dataset.flavor=String(kind);$('#reaction').hidden=false;
 sound(notes[kind]);clearTimeout(reactionTimer);reactionTimer=setTimeout(()=>{$('#reaction').hidden=true;},2200);
}
window.addEventListener('kubi:character',event=>reactToCreature(event.detail.kind));
$('#preview-container').addEventListener('pointerup',event=>{
 if(mode!=='preview'||dialog.open)return;
 const rect=player.renderer.domElement.getBoundingClientRect(),pointer=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
 const ray=new THREE.Raycaster();ray.setFromCamera(pointer,previewCamera);
 for(const hit of ray.intersectObjects(player.kubi.root.children,true)){
  let o=hit.object;while(o){if(o.userData.kind!==undefined){reactToCreature(o.userData.kind);return;}o=o.parent;}
 }
});
async function stopFace(){
 const tracker=faceTracker;faceTracker=null;if(!tracker)return;
 tracker.renderer?.setAnimationLoop(null);try{tracker.dispose();}catch(error){console.warn('Cierre del filtro:',error.message);}
}
async function closeFace(){
 if(!faceSession)return;const previous=faceSession.previous;faceSession=null;faceToken++;faceLoading=false;
 await stopFace();document.body.classList.remove('face-open');
 if(previous==='ar')await startAR();else if(previous==='preview')await startPreview();
 else{mode='home';welcome.hidden=false;experience.hidden=true;}
}
async function startFace(){
 if(faceSession||busy)return;sound([659,784]);const token=++faceToken;
 faceSession={previous:mode,kind:0,smiles:0,pulseAt:-Infinity,score:0,hasFace:false};faceLoading=true;
 await stopImage();mode='face';
 $('#dialog-content').innerHTML='<span class="eyebrow">FILTRO FACIAL</span><h2>Tu lado frutal.</h2><div id="face-canvas-wrap"><span id="face-loading">Preparando cámara frontal…</span><span id="face-result" hidden></span></div><div class="face-choice" aria-label="Elegir sabor"><button data-kind="0" aria-pressed="true">Fresa</button><button data-kind="1" aria-pressed="false">Mango</button><button data-kind="2" aria-pressed="false">Uva</button></div><p id="face-message" role="status">Sonríe para descubrir tu sabor. Relaja la sonrisa antes de repetir.</p><p class="face-help">Tu rostro se muestra en vivo. Busca buena luz y mira de frente.</p><button id="face-retry" hidden>Reintentar cámara</button>';
 dialog.classList.add('face-dialog');dialog.showModal();document.body.classList.add('face-open');
 const gate=new SmileGate();let objects=[],lastFace=false,changedAt=performance.now();
 try{
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('Abre el enlace HTTPS en Safari o Chrome para utilizar la cámara.');
  await load();if(token!==faceToken||!faceSession)return;
  const {MindARThree}=await import('./mindar/mindar-face-three.prod.js');
  if(token!==faceToken||!faceSession)return;
  const tracker=new MindARThree({container:$('#face-canvas-wrap'),uiLoading:'no',uiScanning:'no',uiError:'no'});faceTracker=tracker;
  const {renderer,scene,camera}=tracker;renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;
  scene.add(new THREE.HemisphereLight(0xffffff,0xaaaacc,2.5));const light=new THREE.DirectionalLight(0xffffff,2.2);light.position.set(0,1,3);scene.add(light);
  const anchors=[tracker.addAnchor(234),tracker.addAnchor(454)];
  function choose(kind,gesture=false){
   if(token!==faceToken||!faceSession)return;anchors.forEach(a=>a.group.clear());objects=[];faceSession.kind=kind;
   for(const [index,a] of anchors.entries()){
    const sign=index===0?-1:1,o=player.kubi.root.getObjectByName(names[kind]).clone(true);
    o.scale.setScalar(.40);o.position.set(sign*.04,-.10,.14);o.rotation.set(0,0,sign*.10);a.group.add(o);objects.push(o);
   }
   $('#dialog-content').querySelectorAll('[data-kind]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.kind)===kind)));
   if(gesture){
    faceSession.smiles++;faceSession.pulseAt=performance.now();$('#face-result').textContent='TU SABOR: '+flavors[kind].toUpperCase();$('#face-result').hidden=false;
    $('#face-message').textContent='¡Sonrisa detectada! '+flavors[kind]+'. Relaja la sonrisa para volver a jugar.';sound(notes[kind]);
   }else{$('#face-result').textContent=flavors[kind];$('#face-result').hidden=false;sound([523+kind*110]);}
  }
  $('#dialog-content').querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>choose(Number(b.dataset.kind)));
  await tracker.start();
  if(token!==faceToken||!faceSession){tracker.dispose();return;}
  // Cámara en capa 0, canvas transparente en capa 1: el rostro nunca queda detrás del fondo.
  tracker.video.style.zIndex='0';tracker.video.muted=true;tracker.video.playsInline=true;
  renderer.domElement.style.zIndex='1';tracker.cssRenderer.domElement.style.zIndex='2';tracker.cssRenderer.domElement.style.pointerEvents='none';
  $('#face-loading').hidden=true;choose(0);faceLoading=false;
  renderer.setAnimationLoop(()=>{
   if(token!==faceToken||!faceSession)return;
   const now=performance.now(),estimate=tracker.getLatestEstimate(),hasFace=!!estimate;
   faceSession.hasFace=hasFace;faceSession.score=smileScore(estimate);
   if(hasFace!==lastFace){lastFace=hasFace;changedAt=now;if(hasFace)$('#face-message').textContent='Sonríe para descubrir tu sabor. Relaja la sonrisa antes de repetir.';}
   if(!hasFace&&now-changedAt>1800)$('#face-message').textContent='Coloca tu rostro de frente y busca buena iluminación.';
   if(gate.update(faceSession.score,now,hasFace))choose((faceSession.kind+1+Math.floor(Math.random()*2))%3,true);
   const age=(now-faceSession.pulseAt)/1000;
   objects.forEach((o,i)=>{
    const pulse=age>=0&&age<1.25?Math.sin(age/1.25*Math.PI):0;
    o.scale.setScalar(.40+pulse*.10);o.rotation.z=(i===0?-.10:.10)+Math.sin(now*.002+i)*.035+pulse*(i===0?-.14:.14);
    const arm=o.getObjectByName('Brazo derecho');if(arm)arm.rotation.z=Math.sin(now*.008)*.5*pulse;
   });
   renderer.render(scene,camera);
  });
 }catch(error){
  if(token!==faceToken||!faceSession)return;
  console.error(error);faceLoading=false;await stopFace();$('#face-loading').hidden=true;$('#face-message').textContent=cameraError(error);$('#face-retry').hidden=false;
  $('#face-retry').onclick=async()=>{const previous=faceSession.previous;faceSession=null;faceToken++;mode=previous;await startFace();};
 }
}
$('#start').onclick=startAR;$('#start-face').onclick=startFace;$('#preview').onclick=startPreview;$('#face').onclick=startFace;$('#exit').onclick=leave;
$('#sound').onclick=()=>{muted=!muted;$('#sound').textContent=muted?'Sonido: apagado':'Sonido: activo';$('#sound').setAttribute('aria-pressed',String(muted));if(!muted)sound([659]);};
$('#rotate').onclick=()=>{if(player){player.kubi.angle+=Math.PI/4;sound([440]);}};
$('#info-buttons').onclick=event=>{const b=event.target.closest('[data-dialog]');if(!b)return;dialog.classList.remove('face-dialog');$('#dialog-content').innerHTML=descriptions[b.dataset.dialog];dialog.showModal();sound([523,659]);};
$('#close-dialog').onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target===dialog&&!faceLoading)dialog.close();});
dialog.addEventListener('close',()=>{closeFace().catch(console.error);dialog.classList.remove('face-dialog');});
window.addEventListener('resize',sizePreview);document.addEventListener('visibilitychange',()=>{if(player)player.kubi.paused=document.hidden;});
hero().catch(error=>{$('#error').textContent='Error al cargar el modelo: '+error.message;console.error(error);});
window.kubiApp={get player(){return player;},get mode(){return mode;},get tracker(){return mindar;},get face(){return faceSession;},get faceTracker(){return faceTracker;}};
