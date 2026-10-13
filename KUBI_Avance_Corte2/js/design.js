import * as THREE from './three.module.js';

const C = {night:0x11172a,red:0xff5277,yellow:0xffca55,purple:0x9670ef,leaf:0x4fc5a2,cream:0xfff3de};
const sphere = new THREE.SphereGeometry(1,24,18);
const mats={};
function material(color,roughness=.38){const k=color+':'+roughness;return mats[k]??=new THREE.MeshStandardMaterial({color,roughness,metalness:.04});}
function ball(parent,name,pos,scale,color,roughness=.38){const m=new THREE.Mesh(sphere,material(color,roughness));m.name=name;m.position.set(...pos);m.scale.set(...scale);parent.add(m);return m;}
function tube(parent,name,points,r,color){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(path,20,r,6,false),material(color));m.name=name;parent.add(m);return m;}
function leaf(parent,pos,scale,angle=0){const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.45,.28,-.25,.75,0,1);shape.bezierCurveTo(.32,.70,.40,.26,0,0);const geo=new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.02,bevelThickness:.015,bevelSegments:2,steps:1});const mesh=new THREE.Mesh(geo,material(C.leaf));mesh.name='Hoja modelada';mesh.position.set(...pos);mesh.scale.set(...scale);mesh.rotation.z=angle;parent.add(mesh);return mesh;}
function face(g,y,z){
  for(const s of [-1,1]){ball(g,'Ojo brillante',[s*.065,y,z],[.021,.031,.014],C.night,.14);ball(g,'Brillo del ojo',[s*.065-.006,y+.012,z+.013],[.007,.009,.004],0xffffff);ball(g,'Mejilla',[s*.108,y-.045,z-.006],[.026,.016,.009],0xffb0af);}
  tube(g,'Sonrisa',[[-.029,y-.036,z+.004],[0,y-.054,z+.008],[.029,y-.036,z+.004]],.0045,C.night);
}
function limbs(g,color){
  for(const s of [-1,1]){ball(g,'Pie',[s*.078,.026,.06],[.055,.031,.08],color);const arm=new THREE.Group();arm.name=s===-1?'Brazo izquierdo':'Brazo derecho';arm.position.set(s*.155,.205,.007);ball(arm,'Mano',[s*.034,-.055,.024],[.034,.066,.038],color);g.add(arm);}
}
function creature(kind){
  const g=new THREE.Group();g.name=['FRI - Fresa','MAKO - Mango','UMI - Uva'][kind];g.userData.kind=kind;
  const color=[C.red,C.yellow,C.purple][kind];
  if(kind===0){
    const points=[[0,0],[.065,.025],[.125,.11],[.17,.24],[.16,.32],[.12,.385],[.04,.408],[0,.41]].map(p=>new THREE.Vector2(...p));
    const body=new THREE.Mesh(new THREE.LatheGeometry(points,40),material(color,.32));body.name='Cuerpo de fresa torneado';body.position.y=.048;g.add(body);
    for(let row=0;row<4;row++){const y=.15+row*.065;const rad=[.128,.162,.164,.138][row];for(let j=0;j<10;j++){const a=j*Math.PI*2/10+(row%2)*.22;if(Math.cos(a)>.65&&y>.24&&y<.36)continue;const seed=ball(g,'Semilla',[Math.sin(a)*rad,y,Math.cos(a)*rad],[.009,.014,.004],0xffe3a0);seed.rotation.y=a;}}
    for(let i=0;i<5;i++){const l=leaf(g,[0,.432,0],[.10,.17,.10],(i-2)*.65);l.rotation.x=-.15+(i%2)*.25;}
    face(g,.315,.155);limbs(g,color);
  }else if(kind===1){
    ball(g,'Cuerpo curvo de mango',[.012,.253,0],[.171,.225,.14],color,.30);
    ball(g,'Panza cremosa',[.008,.186,.123],[.10,.108,.027],0xffe39a);
    ball(g,'Punta de mango',[-.025,.445,0],[.10,.066,.103],color);
    leaf(g,[-.025,.48,-.008],[.12,.19,.12],-.65);
    tube(g,'Tallo',[[-.022,.472,0],[-.033,.53,0],[-.07,.545,0]],.011,0x665642);
    face(g,.32,.13);limbs(g,color);
    for(let i=0;i<5;i++)ball(g,'Peca',[.093+i*.003,.225-i*.013,.12],[.005,.006,.004],0xef9867);
  }else{
    ball(g,'Cuerpo de uva',[0,.195,0],[.153,.17,.124],color,.29);
    for(const [x,y,z,r] of [[-.08,.35,0,.084],[.08,.35,0,.084],[0,.4,-.015,.085],[-.12,.27,-.055,.075],[.12,.27,-.055,.075]])ball(g,'Racimo',[x,y,z],[r,r,r],color,.26);
    ball(g,'Panza lavanda',[0,.15,.115],[.077,.072,.021],0xd1b9ff);
    face(g,.275,.133);limbs(g,color);leaf(g,[.015,.46,0],[.15,.16,.15],-.5);
    tube(g,'Zarcillo',[[0,.45,0],[.035,.515,0],[.092,.53,0],[.107,.5,0],[.07,.489,0]],.007,C.leaf);
  }
  return g;
}
function label(text,color){const cv=document.createElement('canvas');cv.width=512;cv.height=128;const ctx=cv.getContext('2d');ctx.fillStyle='#11172a';ctx.beginPath();ctx.roundRect(0,0,512,128,30);ctx.fill();ctx.fillStyle=color;ctx.font='bold 48px sans-serif';ctx.textAlign='center';ctx.fillText(text,256,81);const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(.33,.083),new THREE.MeshBasicMaterial({map:tex,transparent:true}));return m;}
export async function buildDesign(){
  const scene=new THREE.Scene();scene.name='KUBI - Criaturas frutales';scene.background=new THREE.Color(0xf8f2e8);
  const target=new THREE.Group();target.name='ImageTarget';scene.add(target);
  const gizmo=new THREE.Mesh(new THREE.PlaneGeometry(1.65,1),new THREE.MeshBasicMaterial({map:await new THREE.TextureLoader().loadAsync('assets/marker/target.png')}));gizmo.name='Tarjeta KUBI';gizmo.rotation.x=-Math.PI/2;gizmo.position.y=-.015;target.add(gizmo);
  const root=new THREE.Group();root.name='ARContent';target.add(root);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.79,.84,.055,64),material(C.night));base.name='Isla KUBI';base.position.y=.017;root.add(base);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.79,.012,8,64),material(C.leaf));rim.rotation.x=Math.PI/2;rim.position.y=.05;root.add(rim);
  const colors=[C.red,C.yellow,C.purple];
  for(let i=0;i<3;i++){
    const x=(i-1)*.52;
    const disk=new THREE.Mesh(new THREE.CylinderGeometry(.22,.23,.04,40),material(colors[i]));disk.name='Pedestal '+i;disk.position.set(x,.062,0);root.add(disk);
    const g=creature(i);g.position.set(x,.083,0);g.rotation.y=(1-i)*.16;g.userData.baseY=.083;root.add(g);
    const tag=label(['FRI / FRESA','MAKO / MANGO','UMI / UVA'][i],['#ff7190','#ffda7c','#c4a5ff'][i]);tag.position.set(x,.08,.24);tag.rotation.x=-.8;root.add(tag);
  }
  // Botanical details remain on the island, never float arbitrarily over text.
  for(let i=0;i<7;i++){const a=i*.78+.2,x=Math.cos(a)*.73,z=Math.sin(a)*.73;leaf(root,[x,.06,z],[.06,.12,.06],.5*Math.sin(a));if(i%2===0){ball(root,'Centro flor',[x,.105,z],[.013,.013,.013],C.yellow);for(let j=0;j<5;j++)ball(root,'Pétalo',[x+Math.cos(j*1.257)*.025,.105,z+Math.sin(j*1.257)*.025],[.018,.008,.018],C.cream);}}
  const amb=new THREE.HemisphereLight(0xfff6ea,0x7d8eaa,2.2);amb.name='Luz ambiente';scene.add(amb);
  const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(-2,4,3);scene.add(key);
  const fill=new THREE.DirectionalLight(0xc4dfff,1.5);fill.position.set(3,2,-2);scene.add(fill);
  const camera=new THREE.PerspectiveCamera(42,1.6,.01,50);camera.position.set(0,1.55,2.55);camera.lookAt(0,.23,0);
  const source=`player.imageTargets = [{arContent: this.getObjectByName('ARContent')}];
player.kubi = { root: this.getObjectByName('ARContent'), angle: 0, paused: false };
function update(event) {
  var t = event.time / 1000;
  if (player.kubi.paused) return;
  var root = player.kubi.root;
  root.rotation.y = player.kubi.angle;
  root.children.forEach(function(o) {
    if (o.userData.kind === undefined) return;
    var i = o.userData.kind;
    o.position.y = o.userData.baseY + Math.sin(t*1.8+i)*.012;
    o.rotation.z = Math.sin(t*1.5+i)*.025;
    var arm = o.getObjectByName('Brazo derecho');
    if (arm) arm.rotation.z = -.18 + Math.sin(t*2+i)*.22;
  });
}`;
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  return {scene,camera,json:{metadata:{type:'App',generator:'Three.js Editor'},project:{renderer:'WebGLRenderer',shadows:false,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1},camera:camera.toJSON(),controls:{center:[0,.23,0]},scene:scene.toJSON(),scripts:{[scene.uuid]:[{name:'KUBI - Registro AR y animación',source}]},history:{undos:[],redos:[]}}};
}
