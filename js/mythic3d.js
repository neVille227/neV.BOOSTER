/* ==========================================================
   neV.BOOSTER — mythic3d.js
   Les 7 CARTES MYTHIQUES : avatar 3D (homme ou femme) qui exécute un mouvement d'élite, aura rouge.
   Un seul moteur WebGL partagé (three.js r128 du site) ; une scène par mouvement ; le rendu est copié dans le canvas 2D de la carte.
   API : NEV.Mythic.mount(canvas, id, { card }) → { destroy }  ·  NEV.Mythic.supported()
   Les poses sont décrites par des os (IK) : voir les fonctions onearm, hspu, pseudo, pullup, dragon, muscleup, planche.
   ========================================================== */
(function (g) {
'use strict';
var NEV = (g.NEV = g.NEV || {}), doc = g.document;
var T = null, PI = Math.PI, R = null, failed = false, loading = null, API = null;
function webgl() { try { var c = doc.createElement('canvas'); return !!(g.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } }
function load() {
  if (g.THREE) return Promise.resolve(g.THREE);
  if (NEV.Fig3D && NEV.Fig3D.load) return NEV.Fig3D.load();
  if (!loading) loading = new Promise(function (ok, ko) {
    var s = doc.createElement('script'); s.src = 'vendor/three/three.min.js'; s.async = true;
    s.onload = function () { g.THREE ? ok(g.THREE) : ko(new Error('three')); }; s.onerror = function () { loading = null; ko(new Error('three')); };
    doc.head.appendChild(s);
  });
  return loading;
}
var reduced = function () { return !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); };

function setup() {
var K = function (hex) { return new T.Color(hex).convertSRGBToLinear(); };
K.hsl = function (h, s, l) { return new T.Color().setHSL(h, s, l).convertSRGBToLinear(); };
/* ───────── maths ───────── */
function V(x,y,z){return new T.Vector3(x,y,z)}
function ad(a,b,k){return a.clone().addScaledVector(b,k)}
function lp(a,b,t){return a.clone().lerp(b,t)}
function nm(a){return a.clone().normalize()}
function ease(t){return(1-Math.cos(2*PI*t))/2}
function sstep(a,b,x){x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)}
function ik(S,H,a,b,pole){
 var d=H.clone().sub(S),L=d.length(),u=d.clone().divideScalar(L),
  D=Math.min(L,a+b-.001),x=(a*a+D*D-b*b)/(2*D),h=Math.sqrt(Math.max(0,a*a-x*x)),
  p=pole.clone().addScaledVector(u,-pole.dot(u)).normalize();
 return S.clone().addScaledVector(u,x).addScaledVector(p,h)}
var X=V(1,0,0),Y=V(0,1,0),Z=V(0,0,1);

/* ───────── primitives décrivant le mannequin ─────────
   C : membre conique (capsule effilée avec renflement musculaire)
   E : ellipsoïde orienté (u = axe long, v = axe secondaire)
   g : groupe musculaire pouvant s'illuminer (rouge → vert)            */
function C(a,b,r1,r2,o){o=o||{};return{k:'c',a:a,b:b,r1:r1,r2:r2,bl:o.bl||0,bp:o.bp||.5,m:o.m||'sk',g:o.g||null}}
function E(c,u,v,r,o){o=o||{};return{k:'e',c:c,u:nm(u),v:nm(v),r:r,m:o.m||'sk',g:o.g||null}}
function SP(c,r,o){return E(c,X,Y,[r,r,r],o)}

/* ───────── profils corporels ─────────
   Même squelette / mêmes animations ; seules les proportions et la tenue changent. */
var PROFILES={
 male:{
  sw:.215,legz:.085,delt:[.118,.1,.1],ua:[.062,.045],fa:[.05,.03],pec:[.108,.06,.105],pecz:.092,lat:[.225,.098,.1],latz:.12,
  rib:[.24,.13,.185],trap:[.15,.07,.19],waist:[.15,.095,.13],pel:[.17,.115,.158],pel2:[.14,.118,.158],
  thigh:[.096,.066],calf:[.064,.036],short:[.118,.106],neck:[.074,.058],head:[.118,.087,.08],jaw:[.07,.047,.058],
  lrib:[.225,.135,.19],ltrap:[.15,.07,.19],lwaist:[.19,.1,.128],lpel:[.13,.118,.16],hand:1,bra:false,hair:false,
  quad:[.22,.07,.072],matx0:-1.15,
  skin:0xc3c7d6,border:'rgba(255,92,178,.28)',fill:0xff6fbd},
 female:{
  sw:.186,legz:.095,delt:[.092,.08,.082],ua:[.047,.036],fa:[.04,.025],pec:[.098,.052,.098],pecz:.082,lat:[.2,.08,.086],latz:.1,
  rib:[.22,.113,.158],trap:[.13,.055,.158],waist:[.14,.082,.107],pel:[.178,.122,.172],pel2:[.15,.128,.174],
  thigh:[.098,.064],calf:[.058,.031],short:[.113,.094],neck:[.054,.045],head:[.108,.08,.074],jaw:[.062,.042,.052],
  lrib:[.2,.12,.16],ltrap:[.13,.055,.158],lwaist:[.17,.088,.108],lpel:[.125,.122,.172],hand:.88,bra:true,hair:true,
  quad:[.22,.07,.074],matx0:-1.3,
  skin:0xcdcbdb,border:'rgba(176,130,255,.34)',fill:0xa070ff}};
var P=PROFILES.male;
function pickProfile(f){P=PROFILES[f?'female':'male'];P.border='rgba(255,70,50,.42)';P.fill=0xff2a1a}

/* ───────── matériaux ───────── */
var GROUPS=['chest','delts','triceps','biceps','abs','core','quads','lats'];
function makeMats(){
 var base=K(P.skin);
 function skin(){var m=new T.MeshPhysicalMaterial({color:base.clone(),roughness:.4,metalness:.02,clearcoat:.45,clearcoatRoughness:.34});
  m.onBeforeCompile=function(sh){sh.fragmentShader=sh.fragmentShader.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );','float nvRim=pow(1.0-saturate(dot(normalize(vNormal),normalize(vViewPosition))),2.6);outgoingLight+=vec3(1.,.3,.22)*nvRim*.62;\ngl_FragColor = vec4( outgoingLight, diffuseColor.a );')};
  return m}
 var M={base:base,sk:skin(),
  sh:new T.MeshStandardMaterial({color:K(0x121118),roughness:.8,metalness:0}),
  wb:new T.MeshStandardMaterial({color:K(0x2c2a37),roughness:.55,metalness:.1}),
  br:new T.MeshStandardMaterial({color:K(0x17161e),roughness:.7,metalness:0}),
  hr:new T.MeshStandardMaterial({color:K(0x1b1922),roughness:.42,metalness:.25}),g:{},h:{}};
 GROUPS.forEach(function(k){
  M.g[k]=skin();
  M.h[k]=new T.MeshBasicMaterial({color:K(0xff2d2d),transparent:true,opacity:.3,blending:T.AdditiveBlending,side:T.BackSide,depthWrite:false})});
 return M}

var UNIT=new T.SphereGeometry(1,32,20),_q=new T.Quaternion(),_m=new T.Matrix4(),_w=new T.Vector3(),_v=new T.Vector3(),_d=new T.Vector3();
function capGeo(r1,r2,L,bl,bp){
 var pts=[],K=8,N=16,k,i,t,r,ph,pw=Math.log(.5)/Math.log(bp);
 for(k=0;k<=K;k++){ph=-PI/2+k/K*PI/2;pts.push(new T.Vector2(Math.max(1e-4,r1*Math.cos(ph)),r1*Math.sin(ph)))}
 for(i=1;i<N;i++){t=i/N;r=(r1+(r2-r1)*t)*(1+bl*Math.sin(PI*Math.pow(t,pw)));pts.push(new T.Vector2(r,t*L))}
 for(k=0;k<=K;k++){ph=k/K*PI/2;pts.push(new T.Vector2(Math.max(1e-4,r2*Math.cos(ph)),L+r2*Math.sin(ph)))}
 return new T.LatheGeometry(pts,28)}
function build(d,M){
 var h=new T.Group(),geo,mat=d.g?M.g[d.g]:M[d.m],m,ho;
 if(d.k==='c'){var L=d.a.distanceTo(d.b);geo=capGeo(d.r1,d.r2,L,d.bl,d.bp);h.userData.L0=L}else geo=UNIT;
 m=new T.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;h.add(m);
 if(d.g){ho=new T.Mesh(geo,M.h[d.g]);if(d.k==='e')ho.scale.setScalar(1.08);else ho.scale.set(1.16,1,1.16);ho.renderOrder=2;h.add(ho)}
 return h}
function place(h,d){
 if(d.k==='c'){
  _d.subVectors(d.b,d.a);var L=_d.length();if(L<1e-5){h.visible=false;return}
  h.visible=true;h.position.copy(d.a);h.quaternion.setFromUnitVectors(Y,_d.multiplyScalar(1/L));h.scale.set(1,L/h.userData.L0,1)}
 else{
  h.position.copy(d.c);_w.crossVectors(d.u,d.v).normalize();_v.crossVectors(_w,d.u).normalize();
  _m.makeBasis(d.u,_v,_w);h.quaternion.setFromRotationMatrix(_m);h.scale.set(d.r[0],d.r[1],d.r[2])}}

/* ───────── tapis (texture générée) ───────── */
function matTexture(w,h){
 var px=420,c=document.createElement('canvas');c.width=Math.round(w*px);c.height=Math.round(h*px);
 var g=c.getContext('2d'),W=c.width,H=c.height;
 g.fillStyle='#0d0c13';g.fillRect(0,0,W,H);
 for(var i=0;i<9000;i++){g.fillStyle='rgba(255,255,255,'+(Math.random()*.035)+')';g.fillRect(Math.random()*W,Math.random()*H,1.4,1.4)}
 var gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(0,0,0,.25)');gr.addColorStop(.5,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.2)');g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.strokeStyle=P.border;g.lineWidth=3;g.strokeRect(px*.05,px*.05,W-px*.1,H-px*.1);
 g.strokeStyle='rgba(255,255,255,.07)';g.lineWidth=1.5;g.strokeRect(px*.085,px*.085,W-px*.17,H-px*.17);
 g.save();g.translate(W-px*.2,H/2);g.rotate(-PI/2);g.fillStyle='rgba(255,255,255,.2)';g.font='800 '+Math.round(px*.075)+'px Montserrat,system-ui,sans-serif';
 g.textAlign='center';if(g.letterSpacing!==undefined)g.letterSpacing='8px';g.fillText('NEV.BOOSTER',0,0);g.restore();
 var t=new T.CanvasTexture(c);t.anisotropy=8;t.encoding=T.sRGBEncoding;return t}
function roundedRect(x0,x1,z0,z1,r){
 var s=new T.Shape();s.moveTo(x0+r,z0);s.lineTo(x1-r,z0);s.quadraticCurveTo(x1,z0,x1,z0+r);s.lineTo(x1,z1-r);s.quadraticCurveTo(x1,z1,x1-r,z1);
 s.lineTo(x0+r,z1);s.quadraticCurveTo(x0,z1,x0,z1-r);s.lineTo(x0,z0+r);s.quadraticCurveTo(x0,z0,x0+r,z0);return s}
function makeMat(x0,x1,zh,parent){
 var shape=roundedRect(x0,x1,-zh,zh,.1),geo=new T.ShapeGeometry(shape,12),pos=geo.attributes.position,uv=geo.attributes.uv,w=x1-x0,h=2*zh;
 for(var i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)-x0)/w,(pos.getY(i)+zh)/h);
 var top=new T.Mesh(geo,new T.MeshLambertMaterial({map:matTexture(w,h)}));
 top.rotation.x=-PI/2;top.position.y=.003;top.receiveShadow=true;parent.add(top);
 var side=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.03,bevelEnabled:false,curveSegments:12}),new T.MeshLambertMaterial({color:K(0x0c0b10)}));
 side.rotation.x=-PI/2;side.position.y=-.036;parent.add(side)}

/* ───────── repères au sol ───────── */
var GREEN=0x3dff7a,ORANGE=0xff8a3d;
function basic(c,o){return new T.MeshBasicMaterial({color:K(c),transparent:true,opacity:o,depthWrite:false,toneMapped:false,blending:T.AdditiveBlending})}
function flat(geo,mat,x,y,z){var m=new T.Mesh(geo,mat);m.rotation.x=-PI/2;m.position.set(x,y,z);m.renderOrder=1;return m}
function arrowShape(len,w,head){var s=new T.Shape();s.moveTo(0,-w/2);s.lineTo(len-head,-w/2);s.lineTo(len-head,-w*1.7);s.lineTo(len,0);s.lineTo(len-head,w*1.7);s.lineTo(len-head,w/2);s.lineTo(0,w/2);s.closePath();return new T.ShapeGeometry(s)}

/* ═════════ CARTES MYTHIQUES : mannequin générique + 7 poses ═════════
   figure(o) : H = bassin, S = centre des épaules, n = normale du dos (⟂ colonne), z = d × n
   Tout vit dans le plan x–y (z = latéral). */
var D2R=PI/180;
function sd(s,a){return a[s<0?0:1]}
function bz(a,m,c,t){var k=2*m-.5*(a+c),u=1-t;return u*u*a+2*u*t*k+t*t*c}
function hand2(hd,s,out,fx){
 var k=P.hand;
 out.push(E(ad(hd,X,fx*.055*k),X,Y,[.062*k,.018*k,.048*k]));
 var off=[-.029,-.0095,.0095,.029],len=[.078,.086,.08,.062],i;
 for(i=0;i<4;i++){
  var z0=hd.z+s*off[i]*k,a=V(hd.x+fx*.1*k,.016,z0),b=V(hd.x+fx*(.1*k+len[i]*k),.012,hd.z+s*off[i]*1.45*k);
  out.push(C(a,b,.0105*k,.0075*k,{bl:.05}))}
 out.push(C(V(hd.x+fx*.035*k,.018,hd.z-s*.034*k),V(hd.x+fx*.095*k,.014,hd.z-s*.076*k),.014*k,.0095*k,{bl:.05}));
 out.push(SP(hd,.03*k))}
function fist(hd,s,out){out.push(E(hd,Z,Y,[.075,.046,.05]),SP(ad(hd,Y,-.025),.044))}
function limp(hd,s,out){out.push(E(ad(hd,Y,-.045),Y,X,[.075,.03,.045]),SP(hd,.034))}
function foot(an,fv,out){var p=ad(an,fv,.075);out.push(SP(an,.037),C(an,p,.036,.031,{bl:.08}),C(p,ad(an,fv,.14),.03,.022))}

function figure(o){
 var it=[],H=o.H,S0=o.S,d=nm(S0.clone().sub(H)),n=o.n.clone().addScaledVector(d,-o.n.dot(d)).normalize(),zz=new T.Vector3().crossVectors(d,n),G=o.g||{};
 function L(b,du,dn,dz){return b.clone().addScaledVector(d,du).addScaledVector(n,dn).addScaledVector(zz,dz)}
 var hf=o.hf||function(hd,s,out){hand2(hd,s,out,1)};
 [-1,1].forEach(function(s){
  /* jambes */
  var hp=L(H,0,0,s*P.legz),an=sd(s,o.an),kn=ik(hp,an,.48,.48,o.kp);
  it.push(C(hp,kn,P.thigh[0],P.thigh[1],{bl:.15,bp:.4,g:G.leg}),C(kn,an,P.calf[0],P.calf[1],{bl:.27,bp:.3}),SP(kn,P.calf[0]-.006));
  it.push(C(hp,lp(hp,kn,.58),P.short[0],P.short[1],{m:'sh'}));
  foot(an,sd(s,o.fv),it);
  /* bras */
  var sh=L(S0,0,-.02,s*P.sw),hd=sd(s,o.hd),el=ik(sh,hd,.32,.3,sd(s,o.pole)),ua=nm(el.clone().sub(sh));
  it.push(E(ad(lp(sh,el,.08),n,.012),ua,n,P.delt,{g:G.delts}));
  it.push(C(lp(sh,el,.16),el,P.ua[0],P.ua[1],{bl:.18,bp:.4,g:G.arm}),SP(el,P.ua[1]+.001));
  it.push(C(el,hd,P.fa[0],P.fa[1],{bl:.26,bp:.25,g:G.fore}));
  hf(hd,s,it);
  /* thorax */
  it.push(E(L(S0,-.1,-.115,s*P.pecz),d,n,P.pec,{g:G.chest}));
  it.push(E(L(S0,-.2,.015,s*P.latz),d,n,P.lat,{g:G.lat}));
  it.push(E(L(S0,-.12,.082,s*.095),d,n,[.075,.04,.075]));
  it.push(C(L(S0,-.05,.092,s*.04),L(S0,-.46,.07,s*.05),.034,.03,{bl:.1}));
  [-.3,-.37,-.44].forEach(function(du){it.push(E(L(S0,du,-.098,s*.036),d,n,[.032,.02,.033],{g:G.abs}))});
  if(P.bra)it.push(E(L(S0,-.12,-.128,s*P.pecz),d,n,[P.pec[0]*.82,P.pec[1]*.85,P.pec[2]*.86],{m:'br'}));
 });
 it.push(E(L(S0,-.17,-.04,0),d,n,P.rib));
 it.push(E(L(S0,.02,.05,0),d,n,P.trap));
 it.push(E(L(S0,-.37,-.035,0),d,n,P.waist,{g:G.core}));
 it.push(E(L(H,.16,0,0),d,n,P.pel,{m:'sh'}));
 it.push(E(L(H,.24,0,0),d,n,[.026,P.pel[1]-.003,P.pel[2]-.008],{m:'wb'}));
 it.push(E(L(H,-.02,0,0),d,n,P.pel2,{m:'sh'}));
 /* tête */
 var tl=o.tilt||0,hv=d.clone().applyAxisAngle(zz,tl),n2=n.clone().applyAxisAngle(zz,tl),nb=L(S0,.03,.03,0);
 it.push(C(nb,ad(ad(nb,hv,.17),n2,.018),P.neck[0],P.neck[1],{bl:.05}));
 var hc=ad(ad(S0,hv,.31),n2,.05);
 it.push(E(hc,hv,n2,P.head),E(ad(ad(hc,hv,-.02),n2,-.05),hv,n2,P.jaw));
 return it}

/* ── 1. pompes à un bras ── */
function onearm(e){
 var be=(24-17*e)*D2R,c=Math.cos(be),sn=Math.sin(be),d=V(c,sn,0),n=V(-sn,c,0),F=V(0,.07,0),S0=ad(F,d,1.45),H=ad(F,d,.95);
 var bk=ad(ad(S0,d,-.4),n,.11).add(V(0,0,-.05)),ff=nm(V(-1,-.33,0));
 return figure({H:H,S:S0,n:n,hd:[bk,V(1.38,.035,.14)],pole:[V(-.3,.5,-1),V(-.5,.15,.35)],
  an:[V(.06,.06,-.34),V(.06,.06,.34)],kp:V(0,1,0),fv:[ff,ff],tilt:.22,
  g:{chest:'chest',delts:'delts',arm:'triceps',abs:'abs',core:'core'},
  hf:function(hd,s,out){if(s>0)hand2(hd,s,out,1);else limp(hd,s,out)}})}

/* ── 2. pompes en équilibre sur les mains (mur) ── */
function hspu(e){
 var a=6*D2R,sa=Math.sin(a),ca=Math.cos(a),d=V(sa,-ca,0),n=V(ca,sa,0),S0=V(.02,.655-.255*e,0),H=ad(S0,d,-.5),an=ad(S0,d,-1.46),ff=V(-1,0,0);
 return figure({H:H,S:S0,n:n,hd:[V(0,.035,-.25),V(0,.035,.25)],pole:[V(.6,.3,-.6),V(.6,.3,.6)],
  an:[V(an.x,an.y,-.085),V(an.x,an.y,.085)],kp:V(-1,0,0),fv:[ff,ff],tilt:0,
  g:{delts:'delts',arm:'triceps',chest:'chest',core:'core',lat:'lats'},
  hf:function(hd,s,out){hand2(hd,s,out,-1)}})}

/* ── 3. pompes pseudo‑planche ── */
function pseudo(e){
 var be=(19-10*e)*D2R,c=Math.cos(be),sn=Math.sin(be),d=V(c,sn,0),n=V(-sn,c,0),F=V(0,.07,0),S0=ad(F,d,1.45),H=ad(F,d,.95),ff=nm(V(-1,-.33,0));
 return figure({H:H,S:S0,n:n,hd:[V(.99,.035,-.27),V(.99,.035,.27)],pole:[V(-1,.2,-.5),V(-1,.2,.5)],
  an:[V(0,.06,-.085),V(0,.06,.085)],kp:V(0,1,0),fv:[ff,ff],tilt:.3,
  g:{chest:'chest',delts:'delts',arm:'triceps',abs:'abs',core:'core'},
  hf:function(hd,s,out){hand2(hd,s,out,-1)}})}

/* ── 4. traction à un bras ── */
var BAR=2.0;
function pullup(e){
 var b=(5+9*e)*D2R,sa=Math.sin(b),ca=Math.cos(b),d=V(-sa,ca,0),n=V(-ca,-sa,0),zc=-.12;
 var S0=V(-.02-.06*e,1.40+.41*e,zc),H=ad(S0,d,-.5),ff=nm(V(-.2,-1,0));
 var shL=V(S0.x,S0.y,zc-P.sw);
 return figure({H:H,S:S0,n:n,hd:[V(S0.x+.04,S0.y-.56,zc-P.sw-.11),V(0,BAR,zc+P.sw)],pole:[V(-.1,-.3,-1),V(.3,-.4,.7)],
  an:[V(H.x-.28,H.y-.66,zc-.03),V(H.x-.28,H.y-.66,zc+.03)],kp:V(1,0,0),fv:[ff,ff],tilt:.3*e,
  g:{lat:'lats',arm:'biceps',fore:'biceps',delts:'delts',chest:'chest'},
  hf:function(hd,s,out){if(s>0)fist(hd,s,out);else limp(hd,s,out)}})}

/* ── 5. dragon flag ── */
function dragon(e){
 var ph=(90-62*e)*D2R,c=Math.cos(ph),sn=Math.sin(ph),f=V(c,sn,0),d=f.clone().multiplyScalar(-1),n=V(sn,-c,0),S0=V(0,.47,0),H=ad(S0,f,.5),an=ad(S0,f,1.46);
 return figure({H:H,S:S0,n:n,hd:[V(-.5,.4,-.25),V(-.5,.4,.25)],pole:[V(-.1,.8,-.6),V(-.1,.8,.6)],
  an:[V(an.x,an.y,-.085),V(an.x,an.y,.085)],kp:V(0,0,1),fv:[f,f],tilt:-ph+.1,
  g:{abs:'abs',core:'core',lat:'lats',chest:'chest',leg:'quads'},
  hf:function(hd,s,out){fist(hd,s,out)}})}

/* ── 6. muscle‑up strict ── */
function muscleup(e){
 var b=bz(8,30,0,e)*D2R,sy=bz(1.40,1.93,2.58,e),sx=bz(-.03,-.15,.01,e),sa=Math.sin(b),ca=Math.cos(b),d=V(-sa,ca,0),n=V(-ca,-sa,0),S0=V(sx,sy,0),H=ad(S0,d,-.5);
 var lx=bz(.1,.2,.42,e),ly=bz(.86,.8,.66,e),ff=nm(V(.15,-1,0));
 return figure({H:H,S:S0,n:n,hd:[V(0,BAR,-.22),V(0,BAR,.22)],pole:[V(-.6,.1,-.7),V(-.6,.1,.7)],
  an:[V(H.x+lx,H.y-ly,-.05),V(H.x+lx,H.y-ly,.05)],kp:V(1,0,0),fv:[ff,ff],tilt:.2*Math.sin(PI*e),
  g:{lat:'lats',arm:'biceps',fore:'biceps',delts:'delts',chest:'chest'},
  hf:function(hd,s,out){fist(hd,s,out)}})}

/* ── 7. planche complète ── */
function planche(e){
 var l=(44-22*e)*D2R,sh=V(.596*Math.sin(l),.035+.596*Math.cos(l),0),n=V(0,1,0),S0=ad(sh,n,.02),H=S0.clone().add(V(-.5,0,0)),an=S0.clone().add(V(-1.46,0,0)),ff=nm(V(-1,-.25,0));
 return figure({H:H,S:S0,n:n,hd:[V(0,.035,-.28),V(0,.035,.28)],pole:[V(-1,.2,-.5),V(-1,.2,.5)],
  an:[V(an.x,an.y,-.085),V(an.x,an.y,.085)],kp:V(0,1,0),fv:[ff,ff],tilt:.3,
  g:{chest:'chest',delts:'delts',arm:'triceps',abs:'abs',core:'core',lat:'lats'},
  hf:function(hd,s,out){hand2(hd,s,out,-1)}})}

/* ───────── décors ───────── */
function glowTex(){var c=document.createElement('canvas');c.width=c.height=256;var g=c.getContext('2d'),r=g.createRadialGradient(128,128,0,128,128,128);
 r.addColorStop(0,'rgba(255,70,40,.95)');r.addColorStop(.35,'rgba(255,30,20,.45)');r.addColorStop(1,'rgba(255,0,0,0)');g.fillStyle=r;g.fillRect(0,0,256,256);
 var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t}
function aura(st,cx,cz,rad){
 var s=st.scene,gl=new T.Mesh(new T.PlaneGeometry(rad*2,rad*2),new T.MeshBasicMaterial({map:glowTex(),transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,opacity:.8}));
 gl.rotation.x=-PI/2;gl.position.set(cx,.006,cz);gl.renderOrder=1;s.add(gl);
 var ring=new T.Mesh(new T.RingGeometry(rad*.62,rad*.645,90),basic(0xff2a1a,.8));ring.rotation.x=-PI/2;ring.position.set(cx,.007,cz);ring.renderOrder=1;s.add(ring);
 st.fx={gl:gl,ring:ring}}
function pulse(st,e,t){var f=st.fx;if(!f)return;var p=.5+.5*Math.sin(t*2.4);f.gl.material.opacity=.55+.35*p;f.ring.material.opacity=.45+.4*p}
function dk(c,r,m){return new T.MeshStandardMaterial({color:K(c),roughness:r==null?.6:r,metalness:m||0})}
function barDecor(half,cx,cz,rad){return function(st){
 var s=st.scene,m=dk(0x70747f,.28,.85),bar=new T.Mesh(new T.CylinderGeometry(.022,.022,half*2,24),m);
 bar.rotation.x=PI/2;bar.position.set(0,BAR,0);bar.castShadow=true;s.add(bar);
 [-1,1].forEach(function(k){
  var p=new T.Mesh(new T.CylinderGeometry(.034,.034,BAR+.25,20),m);p.position.set(0,(BAR+.25)/2,k*half);p.castShadow=true;s.add(p);
  var b=new T.Mesh(new T.CylinderGeometry(.16,.18,.03,28),dk(0x1b1a22,.6));b.position.set(0,.015,k*half);s.add(b)});
 aura(st,cx,cz,rad)}}
function wallDecor(st){
 var s=st.scene,w=new T.Mesh(new T.BoxGeometry(.05,2.7,2.6),dk(0x171119,.9));w.position.set(-.3,1.35,0);w.receiveShadow=true;s.add(w);
 var st1=new T.Mesh(new T.BoxGeometry(.012,.014,2.4),basic(0xff2a1a,.9));st1.position.set(-.272,.03,0);s.add(st1);
 var st2=new T.Mesh(new T.BoxGeometry(.012,.014,2.4),basic(0xff2a1a,.5));st2.position.set(-.272,2.5,0);s.add(st2);
 aura(st,0,0,1.15)}
function benchDecor(st){
 var s=st.scene,c=new T.Mesh(new T.BoxGeometry(1.0,.1,.4),dk(0x2a1014,.5));c.position.set(-.35,.33,0);c.castShadow=true;c.receiveShadow=true;s.add(c);
 [-.75,.05].forEach(function(x){var l=new T.Mesh(new T.BoxGeometry(.06,.28,.34),dk(0x15141b,.5,.4));l.position.set(x,.14,0);l.castShadow=true;s.add(l)});
 var tr=new T.Mesh(new T.BoxGeometry(1.0,.012,.012),basic(0xff2a1a,.9));tr.position.set(-.35,.285,.205);s.add(tr);
 aura(st,.35,0,1.45)}
function floorDecor(cx,cz,rad){return function(st){aura(st,cx,cz,rad)}}
function A(f){return function(st,e,t){pulse(st,e,t)}}

var CFG={
 c1:{mat:[-.55,2.15,.85],fov:27,model:onearm,decor:floorDecor(.95,0,1.5),anim:A(),act:function(e){return sstep(.1,.9,1-e)},
  cam:function(t){return{az:.7+.24*Math.sin(t*.42),el:.4+.04*Math.sin(t*.31),d:4.6,t:V(.92,.3,0)}}},
 c2:{mat:[-.9,.9,.9],fov:27,model:hspu,decor:wallDecor,anim:A(),act:function(e){return sstep(.1,.9,1-e)},
  cam:function(t){return{az:.8+.22*Math.sin(t*.42),el:.24+.03*Math.sin(t*.31),d:5.8,t:V(0,1.0,0)}}},
 c3:{mat:[-.55,2.15,.85],fov:27,model:pseudo,decor:floorDecor(.95,0,1.5),anim:A(),act:function(e){return sstep(.1,.9,1-e)},
  cam:function(t){return{az:.8+.24*Math.sin(t*.42),el:.38+.04*Math.sin(t*.31),d:4.8,t:V(.8,.3,0)}}},
 c4:{mat:[-.95,.95,.95],fov:27,model:pullup,decor:barDecor(.9,0,0,1.1),anim:A(),act:function(e){return sstep(.1,.9,e)},
  cam:function(t){return{az:.55+.22*Math.sin(t*.42),el:.16+.03*Math.sin(t*.31),d:6.1,t:V(0,1.2,0)}}},
 c5:{mat:[-1.35,1.75,.9],fov:27,model:dragon,decor:benchDecor,anim:A(),act:function(e){return sstep(.1,.9,e)},
  cam:function(t){return{az:-.8+.2*Math.sin(t*.42),el:.3+.03*Math.sin(t*.31),d:6.7,t:V(.05,.95,0)}}},
 c6:{mat:[-.95,.95,.95],fov:27,model:muscleup,decor:barDecor(.9,0,0,1.1),anim:A(),act:function(e){return sstep(.15,.9,e)},
  cam:function(t){return{az:.55+.2*Math.sin(t*.42),el:.14+.03*Math.sin(t*.31),d:7.7,t:V(0,1.55,0)}}},
 c7:{mat:[-1.9,1.0,.85],fov:27,model:planche,decor:floorDecor(-.5,0,1.6),anim:A(),act:function(e){return sstep(.1,.9,e)},
  cam:function(t){return{az:.85+.2*Math.sin(t*.42),el:.32+.03*Math.sin(t*.31),d:5.3,t:V(-.45,.5,0)}}}
};

function makeScene(id) {
  var cfg = CFG[id], sc = new T.Scene(), S = { id: id, cfg: cfg, scene: sc, cam: new T.PerspectiveCamera(cfg.fov || 27, .8, .5, 40), M: makeMats(), rig: null, group: new T.Group(), fx: null };
  sc.add(S.group); makeMat(cfg.mat[0], cfg.mat[1], cfg.mat[2], sc);
  sc.add(new T.HemisphereLight(K(0xa88a94), K(0x1a1014), .36));
  var key = S.key = new T.DirectionalLight(K(0xfff3ee), 1.05), rim1 = S.rim1 = new T.DirectionalLight(K(0xff5a3c), 1.9), rim2 = S.rim2 = new T.DirectionalLight(K(0xffb09a), .8), fill = S.fill = new T.DirectionalLight(K(P.fill), .35);
  var small = g.matchMedia && g.matchMedia('(pointer:coarse)').matches;
  key.castShadow = true; key.shadow.mapSize.set(small ? 512 : 1024, small ? 512 : 1024);
  var sh = key.shadow.camera; sh.left = -2.6; sh.right = 2.6; sh.top = 2.6; sh.bottom = -2.6; sh.near = .5; sh.far = 14; key.shadow.bias = -.0006; key.shadow.radius = 4;
  [key, rim1, rim2, fill].forEach(function (l) { sc.add(l); sc.add(l.target); });
  cfg.decor && cfg.decor(S);
  return S;
}
function setGroupColor(S, gr) {
  var c = K.hsl(gr * 135 / 360, .96, .5), M = S.M, base = M.base;
  GROUPS.forEach(function (k) { var m = M.g[k]; m.color.copy(base).lerp(c, .93); m.emissive.copy(c).multiplyScalar(.34); M.h[k].color.copy(c); });
}
function draw(S, e, time, w, h) {
  var cfg = S.cfg, list = cfg.model(e), i;
  if (!S.rig) S.rig = list.map(function (d) { var hh = build(d, S.M); S.group.add(hh); return hh; });
  for (i = 0; i < list.length; i++) place(S.rig[i], list[i]);
  setGroupColor(S, cfg.act(e));
  cfg.anim && cfg.anim(S, e, time);
  var c = cfg.cam(time), t = c.t, cam = S.cam, ce = Math.cos(c.el);
  cam.aspect = w / h; cam.updateProjectionMatrix();
  cam.position.set(t.x + c.d * ce * Math.sin(c.az), t.y + c.d * Math.sin(c.el), t.z + c.d * ce * Math.cos(c.az)); cam.lookAt(t); cam.updateMatrixWorld();
  var rt = V(1, 0, 0).applyQuaternion(cam.quaternion), up = V(0, 1, 0), fw = V(0, 0, -1).applyQuaternion(cam.quaternion); fw.y = 0; fw.normalize(); rt.y = 0; rt.normalize();
  function at(l, a, b, f) { l.position.copy(t).addScaledVector(rt, a).addScaledVector(up, b).addScaledVector(fw, f); l.target.position.copy(t); l.target.updateMatrixWorld(); }
  at(S.key, -2.2, 3.4, -2.4); at(S.rim1, 2.6, 1.7, 3.6); at(S.rim2, -2.8, 1.2, 3.2); at(S.fill, 2.2, .5, -2.8);
  R.render(S.scene, cam);
}
return { CFG: CFG, makeScene: makeScene, draw: draw, pickProfile: pickProfile, ease: ease, sstep: sstep };
}

/* ---------- cartes montées ---------- */
var entries = new Set(), scenes = {}, io = null, raf = 0, last = 0, T0 = 0;
function initGL() {
  if (R) return true;
  try { R = new T.WebGLRenderer({ canvas: doc.createElement('canvas'), antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { failed = true; return false; }
  R.setClearColor(0x000000, 0); R.outputEncoding = T.sRGBEncoding; R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = .92;
  R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
  API = setup(); API.pickProfile(NEV.sex === 'f'); T0 = performance.now();
  return true;
}
function hud(E, e, k, r) {
  var gv = E.S.cfg.act(e), css = 'hsl(' + Math.round(gv * 135) + ',96%,54%)', c = E.card;
  if (!c) return;
  c.style.setProperty('--hl', css);
  if (E.bar) E.bar.style.transform = 'scaleX(' + (.04 + .96 * gv).toFixed(3) + ')';
  var p = Math.round(gv * 100); if (p !== E.lp) { E.lp = p; if (E.pct) E.pct.textContent = p + '%'; }
  if (r !== E.last) { E.last = r; if (E.rep) E.rep.textContent = 'RÉP. ' + r + '/12'; if (E.ok && !reduced()) { E.ok.classList.remove('pulse'); void E.ok.offsetWidth; E.ok.classList.add('pulse'); } }
}
function renderEntry(E, now) {
  var cv = E.cv, r = cv.getBoundingClientRect(); if (r.width < 8) return;
  var dpr = Math.min(g.devicePixelRatio || 1, 1.6), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  if (R.domElement.width !== w || R.domElement.height !== h) R.setSize(w, h, false);
  var ms = reduced() ? 1800 : now - T0, k = ms / 3000, t = k % 1, e = reduced() ? .6 : API.ease(t), rep = Math.floor(k) % 12 + 1;
  API.draw(E.S, e, ms / 1000, w, h);
  E.ctx.clearRect(0, 0, w, h); E.ctx.drawImage(R.domElement, 0, 0, w, h);
  hud(E, e, k, rep);
  if (!E.shown) { E.shown = true; E.frame && E.frame.classList.add('on'); }
}
function loop(now) {
  raf = 0;
  if (doc.hidden || !entries.size) return;
  if (now - last >= 33) { last = now; var budget = 4; entries.forEach(function (E) { if (!E.cv.isConnected) { entries.delete(E); return; } if (E.vis && budget > 0) { budget--; renderEntry(E, now); } }); }
  if (!reduced()) raf = g.requestAnimationFrame(loop);
}
function kick() {
  if (raf) return;
  if (reduced()) { entries.forEach(function (E) { renderEntry(E, performance.now()); }); return; }
  raf = g.requestAnimationFrame(loop);
}
doc.addEventListener('visibilitychange', function () { if (!doc.hidden) kick(); });

function mount(cv, id, o) {
  o = o || {}; var card = o.card || cv.closest('.mc');
  var E = { cv: cv, ctx: cv.getContext('2d'), card: card, frame: cv.parentNode, vis: false, last: -1, lp: -1 };
  if (card) { E.rep = card.querySelector('.mc-rep'); E.ok = card.querySelector('.mc-ok'); E.bar = card.querySelector('.mc-gauge b'); E.pct = card.querySelector('.mc-pct'); }
  var ctl = { destroy: function () { entries.delete(E); if (io) io.unobserve(cv); } };
  if (!supported()) { cv.parentNode.classList.add('nogl'); return ctl; }
  load().then(function () {
    T = g.THREE; if (!initGL()) { cv.parentNode.classList.add('nogl'); return; }
    E.S = scenes[id] || (scenes[id] = API.makeScene(id)); entries.add(E);
    if (!io && g.IntersectionObserver) io = new g.IntersectionObserver(function (l) { l.forEach(function (it) { var e = it.target.__my; if (e) { e.vis = it.isIntersecting; if (e.vis) kick(); } }); }, { rootMargin: '100px' });
    cv.__my = E; if (io) io.observe(cv); else E.vis = true;
    kick();
  }).catch(function () { failed = true; cv.parentNode.classList.add('nogl'); });
  return ctl;
}
function supported() { return !failed && webgl(); }

NEV.Mythic = { mount: mount, supported: supported };
})(window);
