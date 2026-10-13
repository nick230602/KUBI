import * as THREE from './three.module.js';
import { APP } from './app.js';
window.THREE=THREE;
const $=s=>document.querySelector(s);
const welcome=$('#welcome'),experience=$('#experience'),dialog=$('#info-dialog');
let player,heroRenderer,heroScene,heroCamera,heroRoot,mindar,mode='home',muted=false,context,faceTracker,previewFrame,heroFrame,found=false,faceSession=false,faceGeneration=0;
const abortError=e=>e?.name==='AbortError';
const descriptions={
 product:`<span class="eyebrow">01 / PRODUCTO</span><h2>Un snack con personalidad.</h2><p>KUBI es una marca ficticia de gomitas frutales con forma de pequeñas criaturas. Cada figura convierte un sabor en un personaje: FRI, MAKO y UMI.</p><p>Es un dulce práctico para disfrutar y compartir. La tarjeta de la colección permite conocer a los personajes mediante una experiencia de realidad aumentada.</p><span class="pill">Producto ficticio · Proyecto académico</span>`,
 flavors:`<span class="eyebrow">02 / SABORES</span><h2>Tres sabores. Tres criaturas.</h2><div class="flavor"><strong style="color:#df4365">FRI · Fresa</strong><span>Cuerpo de fresa, semillas y corona de hojas. Su sabor es dulce y ligeramente ácido.</span></div><div class="flavor"><strong style="color:#b48218">MAKO · Mango</strong><span>Forma ovalada, panza suave y hoja lateral. Su sabor es tropical y dulce.</span></div><div class="flavor"><strong style="color:#8460c7">UMI · Uva</strong><span>Racimo, zarcillo y detalles lavanda. Su sabor es frutal e intenso.</span></div>`,
 experience:`<span class="eyebrow">03 / EXPERIENCIA</span><h2>Tu tarjeta abre su mundo.</h2><p>Muestra la tarjeta KUBI completa frente a la cámara. Al reconocerla, aparecen las tres criaturas en una pequeña isla botánica.</p><p>Los personajes se mueven suavemente. Usa “Girar escena” para verlos desde otro ángulo y los botones para conocer el producto y sus sabores.</p><p>También puedes probar un filtro facial con detalles frutales. Funciona aparte de la lectura de la tarjeta.</p>`
};
function sound(notes=[523,659,784]){
 if(muted)return;
 context??=new (window.AudioContext||window.webkitAudioContext)();
 context.resume().catch(()=>{});
 notes.forEach((freq,i)=>{const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+i*.09;o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.08,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+.19);o.connect(g).connect(context.destination);o.start(t);o.stop(t+.20);});
}
async function load(){
 if(player)return player;
 const response=await fetch('app.json');if(!response.ok)throw new Error('No se pudo cargar la escena KUBI.');
 const json=await response.json();player=new APP.Player({alpha:true});await player.load(json);player.renderer.setPixelRatio(Math.min(devicePixelRatio,2));player.play();return player;
}
async function hero(){
 const p=await load();heroScene=p.scene.clone(true);heroScene.background=new THREE.Color(0xeee4d7);heroRoot=heroScene.getObjectByName('ARContent');heroScene.getObjectByName('Tarjeta KUBI').visible=false;
 heroCamera=new THREE.PerspectiveCamera(39,1,.01,30);heroCamera.position.set(0,1.20,2.28);heroCamera.lookAt(0,.23,0);
 heroRenderer=new THREE.WebGLRenderer({antialias:true});heroRenderer.setPixelRatio(Math.min(devicePixelRatio,2));heroRenderer.toneMapping=THREE.ACESFilmicToneMapping;$('#hero-canvas').appendChild(heroRenderer.domElement);
 const resize=()=>{const host=$('.hero');heroRenderer.setSize(host.clientWidth,host.clientHeight);heroCamera.aspect=host.clientWidth/host.clientHeight;heroCamera.updateProjectionMatrix();};new ResizeObserver(resize).observe($('.hero'));resize();
 function animate(t){heroFrame=requestAnimationFrame(animate);if(mode!=='home')return;heroRoot.rotation.y=Math.sin(t*.00025)*.13;heroRoot.children.forEach(o=>{if(o.userData.kind!==undefined)o.position.y=.083+Math.sin(t*.0018+o.userData.kind)*.01;});heroRenderer.render(heroScene,heroCamera);}heroFrame=requestAnimationFrame(animate);
}
function showExperience(m){mode=m;welcome.hidden=true;experience.hidden=false;$('#preview-container').hidden=m!=='preview';$('#ar-container').hidden=m!=='ar';$('#scan-hint').hidden=m!=='ar';$('#info-buttons').hidden=m==='ar';$('.extras').hidden=m==='ar';$('#mode-label').textContent=m==='preview'?'Vista 3D · gira y conoce a las criaturas':'Enfoca tu tarjeta KUBI';$('#status').textContent=m==='preview'?'Vista 3D · sin cámara':'Buscando tarjeta KUBI…';}
$('#preview').onclick=async()=>{try{await load();showExperience('preview');player.setRenderEnabled(true);player.scene.background=new THREE.Color(0xf8f2e8);player.scene.getObjectByName('Tarjeta KUBI').visible=false;$('#preview-container').appendChild(player.dom);player.setSize(innerWidth,innerHeight);player.dom.style.display='block';}catch(e){$('#error').textContent=e.message;}};
async function startAR(){
 $('#start').disabled=true;$('#start').textContent='Preparando cámara…';$('#error').textContent='';sound([392,523]);
 try{
  if(!window.isSecureContext)throw new Error('La cámara necesita HTTPS o localhost. Abre el enlace publicado.');
  const p=await load();const {MindARController}=await import('./mindar/mindar_controller.js');
  p.scene.background=null;p.scene.getObjectByName('Tarjeta KUBI').visible=false;
  mindar=new MindARController($('#ar-container'),p,false);
  mindar.addListener('found',()=>{found=true;$('#scan-hint').hidden=true;$('#info-buttons').hidden=false;$('.extras').hidden=false;$('#mode-label').textContent='Tarjeta detectada · explora KUBI';$('#status').textContent='KUBI conectado';sound();});
  mindar.addListener('lost',()=>{found=false;$('#scan-hint').hidden=false;$('#info-buttons').hidden=true;$('.extras').hidden=true;$('#mode-label').textContent='Vuelve a mostrar la tarjeta';$('#status').textContent='Buscando tarjeta KUBI…';if(dialog.open)dialog.close();});
  showExperience('ar');p.dom.style.display='none';await mindar.start();
 }catch(e){console.error(e);await leave();$('#error').textContent=e.message.includes('fetch')?'No se pudo descargar el motor AR. Comprueba tu conexión a Internet.':e.message;}
 finally{$('#start').disabled=false;$('#start').innerHTML='Activar realidad aumentada <span>↗</span>';}
}
$('#start').onclick=startAR;
async function leave(){
 if(faceTracker){await faceTracker.stop();faceTracker=null;}if(mindar){mindar.stop();mindar=null;}
 if(player){player.setRenderEnabled(false);player.kubi.root.visible=true;player.kubi.root.rotation.set(0,0,0);player.kubi.root.scale.setScalar(1);player.kubi.angle=0;player.kubi.paused=false;player.dom.style.display='none';}
 mode='home';found=false;welcome.hidden=false;experience.hidden=true;document.body.classList.remove('face-open');
}
$('#exit').onclick=leave;
$('#sound').onclick=()=>{muted=!muted;$('#sound').textContent=muted?'Sonido: apagado':'Sonido: activo';$('#sound').setAttribute('aria-pressed',String(muted));if(!muted)sound([659]);};
$('#rotate').onclick=()=>{player.kubi.angle+=Math.PI/4;sound([440]);};
$('#info-buttons').onclick=e=>{const b=e.target.closest('[data-dialog]');if(!b)return;$('#dialog-content').innerHTML=descriptions[b.dataset.dialog];dialog.showModal();sound([523,659]);};
$('#close-dialog').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
dialog.addEventListener('close',async()=>{if(faceSession){faceSession=false;faceGeneration++;if(faceTracker){faceTracker.renderer.setAnimationLoop(null);await faceTracker.stop();faceTracker.renderer.dispose();faceTracker=null;}document.body.classList.remove('face-open');if(mode==='ar')await startAR();}});
$('#face').onclick=async()=>{
 faceSession=true;const generation=++faceGeneration;
 if(mindar){mindar.stop();mindar=null;}
 $('#dialog-content').innerHTML='<span class="eyebrow">EXTRA / FILTRO FACIAL</span><h2>Tu lado frutal.</h2><div id="face-canvas-wrap"></div><div class="face-choice"><button data-kind="0">Fresa</button><button data-kind="1">Mango</button><button data-kind="2">Uva</button></div><p id="face-message">Preparando cámara frontal…</p>';
 dialog.showModal();document.body.classList.add('face-open');
 try{
  const {MindARThree}=await import('./mindar/mindar-face-three.prod.js');
  faceTracker=new MindARThree({container:$('#face-canvas-wrap'),uiLoading:'no',uiScanning:'no',uiError:'no'});
  const {renderer,scene,camera}=faceTracker;renderer.setPixelRatio(Math.min(devicePixelRatio,2));scene.add(new THREE.HemisphereLight(0xffffff,0xaaaacc,3));const light=new THREE.DirectionalLight(0xffffff,2);scene.add(light);
  const left=faceTracker.addAnchor(127),right=faceTracker.addAnchor(356);
  let objects=[];
  function choose(kind){for(const a of [left,right])a.group.clear();objects=[];for(const [a,sign] of [[left,-1],[right,1]]){const obj=player.kubi.root.getObjectByName(['FRI - Fresa','MAKO - Mango','UMI - Uva'][kind]).clone(true);obj.scale.setScalar(.52);obj.position.set(sign*.11,-.1,.15);a.group.add(obj);objects.push(obj);}$('#face-message').textContent=['Filtro Fresa · FRI','Filtro Mango · MAKO','Filtro Uva · UMI'][kind]+' · mueve la cabeza.';sound([523+kind*110]);}
  $('#dialog-content').querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>choose(Number(b.dataset.kind)));
  const tracker=faceTracker;await tracker.start();if(generation!==faceGeneration){tracker.renderer.setAnimationLoop(null);await tracker.stop();tracker.renderer.dispose();return;}choose(0);renderer.setAnimationLoop(()=>{renderer.render(scene,camera);});
 }catch(e){console.error(e);$('#face-message').textContent='No se pudo iniciar el filtro. '+e.message;document.body.classList.remove('face-open');if(faceTracker){await faceTracker.stop();faceTracker=null;}}
};
window.addEventListener('resize',()=>{if(player&&mode==='preview')player.setSize(innerWidth,innerHeight);});
hero().catch(e=>{$('#error').textContent='Error al cargar el modelo: '+e.message;console.error(e);});
// Small diagnostic surface used to verify the artifact without faking camera tracking.
window.kubiApp={get player(){return player;},get mode(){return mode;},get tracker(){return mindar;}};
