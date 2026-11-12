/* ==========================================================
   neV.BOOSTER — avatar-illus.js
   Avatars d'évolution ILLUSTRÉS (SVG paramétrique, sans image ni dépendance).
   Homme : prise de muscle · Femme : silhouette qui s'affine et se tonifie.
   Tout est redessiné à partir d'un seul nombre m ∈ [0, 1] (progression) : la transformation est continue.
   API : NEV.Illus.body(sexe, m, uid) → balises SVG  ·  NEV.Illus.svg(sexe, m, uid, label) → <svg> complet
   ========================================================== */
(function (g) {
'use strict';
var NEV = (g.NEV = g.NEV || {});
/* ═════════ Personnages illustrés (SVG paramétrique) ═════════
   m ∈ [0,1] = progression. Tout est redessiné à partir de m : transformation continue d'un niveau à l'autre. */
function lp(a,b,t){return a+(b-a)*t}
function sstep(a,b,x){x=Math.max(0,Math.min(1,(x-a)/(b-a)));return x*x*(3-2*x)}
function fx(n){return Math.round(n*10)/10}
function pt(p){return fx(p[0])+' '+fx(p[1])}
/* Catmull-Rom → Bézier */
function crc(p,closed){
 var n=p.length,d='',cnt=closed?n:n-1;
 for(var i=0;i<cnt;i++){
  var p0=p[closed?(i-1+n)%n:Math.max(i-1,0)],p1=p[i],p2=p[(i+1)%n],p3=p[closed?(i+2)%n:Math.min(i+2,n-1)];
  d+='C'+pt([p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6])+' '+pt([p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6])+' '+pt(p2)}
 return d}
function cr(p,closed){return'M'+pt(p[0])+crc(p,closed)+(closed?'Z':'')}
function poly(p){return'M'+p.map(pt).join('L')+'Z'}
function mix(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}
/* membre : polyligne + demi‑largeurs */
function limb(pts,ws,edge){
 var n=pts.length,L=[],R=[],i;
 for(i=0;i<n;i++){
  var a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
  L.push([pts[i][0]-dy*ws[i],pts[i][1]+dx*ws[i]]);R.push([pts[i][0]+dy*ws[i],pts[i][1]-dx*ws[i]])}
 var e=pts[n-1],q=pts[n-2],dx=e[0]-q[0],dy=e[1]-q[1],l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
 var s0=pts[0],s1=pts[1],ex=s1[0]-s0[0],ey=s1[1]-s0[1],el=Math.hypot(ex,ey)||1;ex/=el;ey/=el;
 var cap=[e[0]+dx*ws[n-1]*1.05,e[1]+dy*ws[n-1]*1.05];
 if(edge){var Rr=R.slice().reverse();return cr(L.slice(1).concat([cap],Rr.slice(0,Rr.length-1)),false)}
 return cr(L.concat([cap],R.reverse(),[[s0[0]-ex*ws[0]*.9,s0[1]-ey*ws[0]*.9]]),true)}
function mp(pts,cx,s){return pts.map(function(p){return[cx+s*p[0],p[1]]})}
function ln(d,c,w,o,extra){return'<path d="'+d+'" fill="none" stroke="'+c+'" stroke-width="'+fx(w)+'" stroke-opacity="'+fx(o*100)/100+'" stroke-linecap="round" stroke-linejoin="round"'+(extra||'')+'/>'}
function fl(d,c,o,extra){return'<path d="'+d+'" fill="'+c+'" fill-opacity="'+fx(o*100)/100+'"'+(extra||'')+'/>'}
var INK='#2a1422';

/* ───────── HOMME : prise de muscle ───────── */
function male(m,u){
 var cx=150,o=[],S=function(s){o.push(s)};
 var sk={a:'#f8d6b8',b:'#efbd97',c:'#d79670',d:'#a95f45',m:'#f6cba8'},A=AV(),oc=['#2a2132','#17111d','#0c080f'],ac='#ff5fae',hc='#17101c',hl='#6a5aa8',ec=['#3b2230','#8a4f3f'];
 if(A.skin)sk=NEV.Avatar.skinSet(A.skin);if(A.outfit)oc=NEV.Avatar.outfitSet(A.outfit);if(A.accent)ac=A.accent;if(A.hair){hc=A.hair;hl=NEV.Avatar.shade(A.hair,.38)}if(A.eyes)ec=NEV.Avatar.eyeSet(A.eyes);
 var dw=lp(8,17.5,m),sw=lp(38,62,m),Sx=sw-dw,tw=lp(9.4,14.6,m),cw=lp(25,40,m),rw=lp(21,34.5,m),ww=lp(19.5,25.5,m),hw=lp(23,30,m);
 var op=function(a,b){return sstep(a,b,m)};
 var torsoR=[[tw+1,98],[tw+lp(7,17,m),106],[sw-dw*.6,115],[sw-.6,127],[sw-1.4,141],[cw+3,152],[rw+1,172],[ww+.5,200],[hw,228],[hw-1,244]];
 var torso=cr(mp(torsoR,cx,1).concat(mp(torsoR.slice().reverse(),cx,-1)),true);
 S('<defs><linearGradient id="t'+u+'" x1="0" x2="1"><stop offset="0" stop-color="'+sk.c+'"/><stop offset=".2" stop-color="'+sk.b+'"/><stop offset=".5" stop-color="'+sk.m+'"/><stop offset=".8" stop-color="'+sk.b+'"/><stop offset="1" stop-color="'+sk.c+'"/></linearGradient>'
  +'<linearGradient id="a'+u+'" x1="0" x2="1"><stop offset="0" stop-color="'+sk.m+'"/><stop offset=".55" stop-color="'+sk.b+'"/><stop offset="1" stop-color="'+sk.c+'"/></linearGradient>'
  +'<linearGradient id="p'+u+'" x1="0" x2="1"><stop offset="0" stop-color="'+oc[0]+'"/><stop offset=".45" stop-color="'+oc[1]+'"/><stop offset="1" stop-color="'+oc[2]+'"/></linearGradient>'
  +'<clipPath id="c'+u+'"><path d="'+torso+'"/></clipPath></defs>');
 /* ── baskets ── */
 [1,-1].forEach(function(s){
  var xc=cx+s*lp(17.5,19.5,m);
  var d='M'+pt([xc-s*10,347])+'L'+pt([xc+s*10,347])+'C'+pt([xc+s*13,360])+' '+pt([xc+s*24,368])+' '+pt([xc+s*26,378])+'C'+pt([xc+s*27,387])+' '+pt([xc+s*20,389])+' '+pt([xc+s*10,389])+'L'+pt([xc-s*8,389])+'C'+pt([xc-s*13,388])+' '+pt([xc-s*13,380])+' '+pt([xc-s*12,368])+'Z';
  S('<path d="'+d+'" fill="#f4f1f6" stroke="'+INK+'" stroke-width="1.6" stroke-linejoin="round"/>');
  S(fl('M'+pt([xc-s*12,380])+'L'+pt([xc+s*26,380])+'L'+pt([xc+s*26,388])+'Q'+pt([xc+s*10,391])+' '+pt([xc-s*8,389])+'Z','#d8d2e0',1));
  S(ln('M'+pt([xc-s*12,381.5])+'L'+pt([xc+s*26.5,381.5]),ac,1.4,.9));
  S(fl('M'+pt([xc-s*9,350])+'Q'+pt([xc+s*2,352])+' '+pt([xc+s*10,350])+'L'+pt([xc+s*12,362])+'Q'+pt([xc+s*3,358])+' '+pt([xc-s*10,362])+'Z','#dcd6e4',.9));
  for(var i=0;i<3;i++)S(ln('M'+pt([xc-s*3+s*i*2.4,356+i*5])+'L'+pt([xc+s*8+s*i*2.4,354.5+i*5]),'#8e86a0',1.1,.8))});
 /* ── cou ── */
 S('<path d="'+poly([[cx-tw,78],[cx+tw,78],[cx+tw+2,106],[cx-tw-2,106]])+'" fill="url(#t'+u+')" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>');
 S('<ellipse cx="'+cx+'" cy="87" rx="'+fx(tw*.95)+'" ry="6" fill="'+sk.d+'" fill-opacity=".38"/>');
 /* ── torse ── */
 S('<path d="'+torso+'" fill="url(#t'+u+')" stroke="'+INK+'" stroke-width="1.6" stroke-linejoin="round"/>');
 S('<g clip-path="url(#c'+u+')">');
 var py=lp(160,171,m),ax=lp(7.5,9.5,m);
 /* clavicules, trapèzes */
 [1,-1].forEach(function(s){
  S(ln(cr(mp([[3.5,110.5],[11,112.5],[21,114.2],[Sx-1,117.5]],cx,s)),sk.d,1.3,.5+.3*m));
  S(ln(cr(mp([[tw+1,92],[tw+7,100],[Sx-10,111]],cx,s)),sk.d,1.2,op(.25,.8)*.6));
  S(ln(cr(mp([[3,111],[4.5,106],[tw*.7,93]],cx,s)),sk.d,1.1,op(.2,.7)*.5));
  /* côtes (maigrichon) */
  for(var i=0;i<4;i++){var y0=153+i*8;S(ln(cr(mp([[rw-1.5,y0],[rw-7,y0+2.3],[rw-13,y0+6.5]],cx,s)),sk.d,1.2,(1-op(0,.42))*.6))}
  /* pectoraux */
  var pe=mp([[cw+1.5,148.5],[cw*.74,py-6],[cw*.42,py-.5],[3.5,py-3.5]],cx,s);
  S(fl(cr(pe)+'L'+pt([cx+s*3.5,py+3])+crc(pe.map(function(p,i){return[p[0]-s*(i==3?0:0),p[1]+5.5]}).reverse()).replace(/^/,'')+'Z',sk.d,op(.2,.8)*.3));
  S(ln(cr(pe),sk.d,lp(1,1.7,m),op(.1,.5)*.95));
  S('<ellipse cx="'+fx(cx+s*cw*.5)+'" cy="'+fx(py-14)+'" rx="'+fx(cw*.3)+'" ry="6" fill="#fde0c6" fill-opacity="'+fx(op(.35,.95)*.55)+'"/>');
  S('<ellipse cx="'+fx(cx+s*cw*.52)+'" cy="'+fx(py-3.5)+'" rx="1.7" ry="1.3" fill="'+sk.d+'" fill-opacity=".75"/>');
  /* abdos */
  [171,181.5,192].forEach(function(y,i){
   S(ln(cr(mp([[.6,y+1.2],[ax*.55,y+.2],[ax,y-1.3]],cx,s)),sk.d,1.3,op(.28+i*.04,.72+i*.04)*.9));
   S(fl(poly(mp([[1,y+1],[ax,y-1.3],[ax,y+3.4],[1,y+4.6]],cx,s)),sk.d,op(.4,.85)*.2))});
  S(ln(cr(mp([[ax+1.2,165],[ax+3,180],[ax+1.6,195],[ax-.8,204]],cx,s)),sk.d,1.2,op(.4,.9)*.7));
  /* dentelé + ligne iliaque */
  for(var j=0;j<4;j++)S(ln('M'+pt([cx+s*(rw-1),153+j*8])+'L'+pt([cx+s*(rw-11-j*.6),157.5+j*8]),sk.d,1.3,op(.5,.95)*.8));
  S(ln(cr(mp([[ww-2,192],[ww-9,200],[9,207]],cx,s)),sk.d,1.3,op(.5,.95)*.7));
  /* ombre sous les côtes */
  S('<ellipse cx="'+fx(cx+s*(rw-1))+'" cy="186" rx="5" ry="26" fill="'+sk.c+'" fill-opacity="'+fx(.15+.25*m)+'"/>')});
 S(ln('M'+pt([cx,124])+'L'+pt([cx,py-1.5]),sk.d,1.2,op(.1,.5)*.55));
 S(ln('M'+pt([cx,py+1.5])+'L'+pt([cx,206]),sk.d,1.3,op(.2,.55)*.85));
 S('<ellipse cx="'+cx+'" cy="199.5" rx="1.5" ry="2.3" fill="'+sk.d+'"/>');
 S('</g>');
 /* ── jogging ── */
 var pw=hw+3;
 [1,-1].forEach(function(s){
  var xc=lp(16.5,19.5,m);
  var outer=mp([[pw,201],[hw+6.5,230],[lp(30,38,m),262],[lp(27,33,m),300],[lp(25,29.5,m),326],[xc+9.5,346]],cx,s);
  var inner=mp([[xc-9.5,346],[lp(9,10.5,m),326],[lp(7,8,m),302],[4,278],[2.4,252]],cx,s);
  var d='M'+pt(outer[0])+crc(outer)+'L'+pt(inner[0])+crc(inner)+'L'+pt([cx,252])+'L'+pt([cx,201])+'Z';
  S('<path d="'+d+'" fill="url(#p'+u+')" stroke="'+INK+'" stroke-width="1.6" stroke-linejoin="round"/>');
  S(ln(cr(mp([[hw+2,214],[lp(24,31,m),256],[lp(21,26,m),300]],cx,s)),'#3a2f46',1.3,.6));
  S(ln(cr(mp([[lp(24,30,m),278],[lp(22,27.5,m),282],[lp(19,22,m),279]],cx,s)),'#05030a',1.2,.5));
  S(ln(cr(mp([[lp(22,27,m),300],[lp(15,18,m),304.5],[lp(9,10,m),302.5]],cx,s)),'#05030a',1.3,.6));
  /* revers élastique */
  S('<path d="'+poly(mp([[xc+10.5,339],[xc+10.5,350],[xc-10.5,350],[xc-10.5,339]],cx,s)).replace(/L/g,'L')+'" fill="'+oc[2]+'" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>');
  S(ln('M'+pt([cx+s*(xc-8),342.5])+'L'+pt([cx+s*(xc+8),342.5]),'#463a54',1.1,.8))});
 S(ln('M'+pt([cx,208])+'L'+pt([cx,251]),'#05030a',1.2,.5));
 /* ceinture */
 S('<path d="M'+pt([cx-pw-.5,200.5])+'Q'+pt([cx,208])+' '+pt([cx+pw+.5,200.5])+'L'+pt([cx+pw+1.5,211])+'Q'+pt([cx,218.5])+' '+pt([cx-pw-1.5,211])+'Z" fill="#1a1322" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>');
 S(ln('M'+pt([cx-pw+1,203.5])+'Q'+pt([cx,210.5])+' '+pt([cx+pw-1,203.5]),'#4a3b58',1.1,.8));
 S(ln('M'+pt([cx-2,211.5])+'Q'+pt([cx-6,222])+' '+pt([cx-5,232]),'#f1e7f4',1.5,.95)+ln('M'+pt([cx+2,211.5])+'Q'+pt([cx+7,221])+' '+pt([cx+6,230]),'#f1e7f4',1.5,.95));
 S('<circle cx="'+fx(cx-5)+'" cy="232.5" r="1.5" fill="'+ac+'"/><circle cx="'+fx(cx+6)+'" cy="230.5" r="1.5" fill="'+ac+'"/>');
 /* ── bras ── */
 [1,-1].forEach(function(s){
  var Sp=[cx+s*Sx,134],E=[cx+s*(Sx+lp(3,12,m)),201],W=[cx+s*(Sx+lp(4.5,14,m)),262];
  var p1=mix(Sp,E,.3),p2=mix(Sp,E,.62),p4=mix(E,W,.3),p5=mix(E,W,.7),H1=[W[0]+s*1.2,W[1]+8],H2=[W[0]+s*1.6,W[1]+17];
  var ws=[lp(7.4,16,m),lp(7.4,16,m),lp(6.8,15,m),lp(5.6,10,m),lp(6.2,11.8,m),lp(5,8.6,m),lp(4.4,6.4,m)];
  var pts=[Sp,p1,p2,E,p4,p5,W,H1,H2],wsx=ws.concat([lp(5.6,8.4,m),lp(4.2,6.2,m)]);
  var d=limb(pts,wsx),ed=limb(pts,wsx,1),id='k'+u+(s>0?'r':'l');
  S('<clipPath id="'+id+'"><path d="'+d+'"/></clipPath>');
  S('<path d="'+d+'" fill="url(#a'+u+')"/>');
  S('<g clip-path="url(#'+id+')">');
  S(ln(cr([[Sp[0]-s*dw*.1,Sp[1]-3],[p2[0]-s*ws[2]*.35,p2[1]-6],[E[0]-s*ws[3]*.55,E[1]-11]]),sk.d,1.3,op(.3,.85)*.65));
  S(ln(cr([[Sp[0]+s*dw*.4,Sp[1]+4],[p2[0]+s*ws[2]*.55,p2[1]],[E[0]+s*ws[3]*.5,E[1]-9]]),sk.d,1.2,op(.4,.9)*.5));
  S('<ellipse cx="'+fx(p2[0]-s*ws[2]*.15)+'" cy="'+fx(p2[1]-5)+'" rx="'+fx(ws[2]*.34)+'" ry="9" fill="#fde0c6" fill-opacity="'+fx(op(.3,.9)*.6)+'"/>');
  S(ln(cr([[E[0]+s*ws[3]*.3,E[1]-1],[E[0]-s*ws[3]*.5,E[1]+3]]),sk.d,1.1,.35+.2*m));
  S(ln(cr([[p4[0]+s*ws[4]*.45,p4[1]-5],[p5[0]+s*ws[5]*.5,p5[1]],[W[0]+s*ws[6]*.35,W[1]-3]]),sk.d,1.1,op(.45,1)*.55));
  S(ln(cr([[p4[0]-s*ws[4]*.1,p4[1]-6],[p4[0]+s*ws[4]*.15,p4[1]+3],[p5[0]-s*ws[5]*.15,p5[1]-2],[W[0]-s*ws[6]*.05,W[1]-4]]),sk.d,1.1,op(.62,1)*.8));
  S(ln(cr([[p2[0]+s*ws[2]*.05,p2[1]+9],[p2[0]-s*ws[2]*.25,p2[1]+17],[E[0]-s*ws[3]*.3,E[1]-6]]),sk.d,1,op(.7,1)*.7));
  S(ln('M'+pt([W[0]-s*1,W[1]+4])+'L'+pt([W[0]+s*1.5,W[1]+4]),sk.d,1,.5));
  for(var f=0;f<3;f++)S(ln('M'+pt([H1[0]+s*(-2.2+f*2.2),H1[1]+4.5])+'L'+pt([H1[0]+s*(-2.2+f*2.2),H1[1]+11.5]),sk.d,.9,.55));
  S('</g>');
  S(ln(ed,INK,1.6,1));
  /* deltoïde par‑dessus le haut du bras */
  var dl=cr([[cx+s*(Sx-dw*.9),126],[cx+s*(Sx+dw*.2),121],[cx+s*(Sx+dw*.95),130],[cx+s*(Sx+dw*.9),141],[cx+s*(Sx+dw*.1),148]]);
  S(ln(dl,sk.d,1.3,op(.25,.8)*.7));
  S('<ellipse cx="'+fx(cx+s*(Sx+dw*.15))+'" cy="130" rx="'+fx(dw*.42)+'" ry="8" fill="#fde0c6" fill-opacity="'+fx(op(.35,.95)*.26)+'"/>')});
 /* ── tête ── */
 S('<g transform="translate(150 94) scale(1.2) translate(-150 -94)">');
 var jaw=lp(18.5,21.6,m),chin=lp(91,93.5,m);
 var faceR=[[0,35],[17,38],[23.5,50],[24,64],[jaw,79],[lp(10,12.5,m),88.5],[0,chin]];
 var face=cr(mp(faceR,cx,1).concat(mp(faceR.slice(1,faceR.length-1).reverse(),cx,-1)),true);
 [1,-1].forEach(function(s){S('<ellipse cx="'+(cx+s*24.5)+'" cy="67" rx="3.8" ry="6.4" fill="'+sk.b+'" stroke="'+INK+'" stroke-width="1.4"/>')});
 S('<path d="'+face+'" fill="'+sk.b+'" stroke="'+INK+'" stroke-width="1.6" stroke-linejoin="round"/>');
 S('<clipPath id="f'+u+'"><path d="'+face+'"/></clipPath><g clip-path="url(#f'+u+')">');
 S('<path d="M'+pt([cx-30,60])+'L'+pt([cx+30,60])+'L'+pt([cx+30,100])+'L'+pt([cx-30,100])+'Z" fill="'+sk.c+'" fill-opacity="0"/>');
 S('<ellipse cx="'+(cx+16)+'" cy="74" rx="14" ry="22" fill="'+sk.c+'" fill-opacity=".3"/>');
 [1,-1].forEach(function(s){S('<ellipse cx="'+(cx+s*17)+'" cy="77" rx="4" ry="7" fill="'+sk.c+'" fill-opacity="'+fx((1-m)*.28)+'"/>')});
 S(ln(cr([[cx-jaw+3,80],[cx-lp(10,12,m),88],[cx,chin-.5],[cx+lp(10,12,m),88],[cx+jaw-3,80]]),sk.d,1.2,op(.3,1)*.5));
 S('</g>');
 [1,-1].forEach(function(s){
  var ex=cx+s*11.2,ey=66.5;
  S('<path d="M'+pt([ex-s*7,66])+'Q'+pt([ex,60.2])+' '+pt([ex+s*7,66.2])+'Q'+pt([ex,70.6])+' '+pt([ex-s*7,66])+'Z" fill="#fffaf8" stroke="'+INK+'" stroke-width=".8"/>');
  S('<ellipse cx="'+fx(ex+s*.4)+'" cy="'+fx(ey)+'" rx="3.9" ry="4.3" fill="'+ec[0]+'"/><ellipse cx="'+fx(ex+s*.4)+'" cy="'+fx(ey+1.4)+'" rx="2.7" ry="2.2" fill="'+ec[1]+'" fill-opacity=".85"/><circle cx="'+fx(ex+s*.4)+'" cy="'+fx(ey)+'" r="1.7" fill="#120810"/><circle cx="'+fx(ex-s*.9)+'" cy="'+fx(ey-1.6)+'" r="1.15" fill="#fff"/>');
  S(ln('M'+pt([ex-s*7.6,66.4])+'Q'+pt([ex-s*1,59.4])+' '+pt([ex+s*7.6,65.6]),INK,2.3,1));
  S(ln('M'+pt([ex-s*5,69.4])+'Q'+pt([ex,71.2])+' '+pt([ex+s*5.5,68.8]),INK,.8,.5));
  S(ln('M'+pt([cx+s*lp(4.5,5,m),lp(58.5,60.5,m)])+'Q'+pt([cx+s*11,lp(54.5,54.4,m)])+' '+pt([cx+s*18,lp(55.5,54.5,m)]),INK,lp(1.6,2.7,m),1))});
 S(ln('M'+pt([cx-1.6,74.5])+'Q'+pt([cx+.4,77.6])+' '+pt([cx+2.4,76.6]),sk.d,1.3,.9));
 S(ln('M'+pt([cx-5,84.4])+'Q'+pt([cx,lp(85.8,85.2,m)])+' '+pt([cx+5,lp(83.8,83.4,m)]),'#7a3a3a',1.5,.95));
 /* cheveux */
 var hd='M'+pt([cx-27,63])+'L'+pt([cx-28,50])+'L'+pt([cx-24,38])+'L'+pt([cx-19,29])+'L'+pt([cx-24,15.5])+'L'+pt([cx-12,23])+'L'+pt([cx-9,7])+'L'+pt([cx-1,21.5])+'L'+pt([cx+6,4])+'L'+pt([cx+10,20.5])+'L'+pt([cx+22,10])+'L'+pt([cx+19,25.5])+'L'+pt([cx+27,31])+'L'+pt([cx+28.5,46])+'L'+pt([cx+29,63])+'L'+pt([cx+25,61])+'L'+pt([cx+22,47])+'L'+pt([cx+17,57.5])+'L'+pt([cx+12.5,43.5])+'L'+pt([cx+6.5,57])+'L'+pt([cx+1.5,42])+'L'+pt([cx-4.5,57])+'L'+pt([cx-10.5,44])+'L'+pt([cx-15.5,57.5])+'L'+pt([cx-21,47.5])+'L'+pt([cx-25,61])+'Z';
 S('<path d="'+hd+'" fill="'+hc+'" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>');
 S(ln('M'+pt([cx-18,34])+'Q'+pt([cx-6,24])+' '+pt([cx+6,24]),hl,1.8,.55)+ln('M'+pt([cx+10,28])+'Q'+pt([cx+20,32])+' '+pt([cx+23,42]),hl,1.5,.45));
 S('</g>');
 return o.join('')}

/* ───────── FEMME : perte de graisse ───────── */
function female(m,u){
 var cx=150,o=[],S=function(s){o.push(s)};
 var sk={a:'#fde6d4',b:'#f6cdb6',c:'#e2a68f',d:'#bf7a68',m:'#fbd8c3'},A=AV(),oc=['#2b2234','#17111e','#0d0810'],ac='#ff6fb8',hc='#16101b',hl='#6c58b4',ec=['#4a2d6e','#b06ad6'];
 if(A.skin)sk=NEV.Avatar.skinSet(A.skin);if(A.outfit)oc=NEV.Avatar.outfitSet(A.outfit);if(A.accent)ac=A.accent;if(A.hair){hc=A.hair;hl=NEV.Avatar.shade(A.hair,.38)}if(A.eyes)ec=NEV.Avatar.eyeSet(A.eyes);
 var op=function(a,b){return sstep(a,b,m)};
 var dw=lp(8.2,5.6,m),sw=lp(42,35,m),Sx=sw-dw,tw=lp(10.8,7.8,m);
 var bw=lp(34,26.5,m),ubw=lp(31,22,m),ww=lp(33,18.6,m),hw=lp(53,34,m),dt=lp(139,135.5,m);
 var torsoR=[[tw+1,98],[sw-dw*.5,115],[sw-.5,126],[sw-1,139],[bw+1,153],[ubw,172],[ww,197],[hw-6,225],[hw-6,246]];
 var torso=cr(mp(torsoR,cx,1).concat(mp(torsoR.slice().reverse(),cx,-1)),true);
 var HAIR=hc;
 S('<defs><linearGradient id="t'+u+'" x1="0" x2="1"><stop offset="0" stop-color="'+sk.c+'"/><stop offset=".22" stop-color="'+sk.b+'"/><stop offset=".5" stop-color="'+sk.m+'"/><stop offset=".78" stop-color="'+sk.b+'"/><stop offset="1" stop-color="'+sk.c+'"/></linearGradient>'
  +'<linearGradient id="a'+u+'" x1="0" x2="1"><stop offset="0" stop-color="'+sk.m+'"/><stop offset=".55" stop-color="'+sk.b+'"/><stop offset="1" stop-color="'+sk.c+'"/></linearGradient>'
  +'<linearGradient id="d'+u+'" x1="0" x2="1"><stop offset="0" stop-color="'+oc[0]+'"/><stop offset=".5" stop-color="'+oc[1]+'"/><stop offset="1" stop-color="'+oc[2]+'"/></linearGradient></defs>');
 /* cheveux arrière */
 var hbR=[[28,44],[34,72],[39,104],[43,138],[38,170],[43,200],[37,228],[30,242]];
 S('<path d="'+cr(mp(hbR,cx,1).concat(mp(hbR.slice().reverse(),cx,-1)),true)+'" fill="'+HAIR+'" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>');
 S(ln(cr([[cx-36,110],[cx-40,150],[cx-36,190]]),'#5d4c9a',1.4,.35)+ln(cr([[cx+36,120],[cx+40,160],[cx+36,200]]),'#5d4c9a',1.4,.3));
 /* dos de la robe (fente) */
 var xr=lp(17,14.5,m);
 S('<path d="'+cr([[cx+hw-4,252],[cx+hw+3,300],[cx+hw+lp(9,7,m),351]])+'L'+pt([cx+8,351])+'L'+pt([cx+8,262])+'Z" fill="url(#d'+u+')" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>');
 /* chaussures */
 [[cx-xr+1,350],[cx+xr+8,350]].forEach(function(f,i){var xc=f[0];
  S('<path d="M'+pt([xc-6,347])+'L'+pt([xc+6,347])+'C'+pt([xc+8,360])+' '+pt([xc+11,369])+' '+pt([xc+9,380])+'C'+pt([xc+7,389])+' '+pt([xc-6,390])+' '+pt([xc-8,381])+'C'+pt([xc-9,370])+' '+pt([xc-7,358])+' '+pt([xc-6,347])+'Z" fill="#14101a" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>');
  S(ln('M'+pt([xc-3,356])+'Q'+pt([xc+2,366])+' '+pt([xc+3,378]),'#5d4c9a',1.2,.7))});
 /* jambe droite (fente) */
 var lg=[[cx+xr+1,262],[cx+xr+3.5,302],[cx+xr+5,326],[cx+xr+7,350]];
 var lw=[lp(18,11.2,m),lp(10.6,7.3,m),lp(9.6,6.9,m),4.2];
 S('<path d="'+limb(lg,lw)+'" fill="url(#a'+u+')" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>');
 S(ln(cr([[lg[0][0]+lw[0]*.55,268],[lg[1][0]+lw[1]*.4,292],[lg[1][0]+lw[1]*.15,303]]),sk.d,1.2,op(.45,.95)*.55));
 S(ln(cr([[lg[0][0]-lw[0]*.35,276],[lg[0][0]-lw[0]*.2,292],[lg[1][0]-lw[1]*.4,301]]),sk.d,1.1,op(.55,1)*.4));
 S(ln(cr([[lg[2][0]+lw[2]*.5,316],[lg[2][0]+lw[2]*.2,328],[lg[3][0]+1.5,346]]),sk.d,1.1,op(.5,1)*.5));
 S('<ellipse cx="'+fx(lg[1][0])+'" cy="304" rx="'+fx(lw[1]*.55)+'" ry="3" fill="'+sk.c+'" fill-opacity=".35"/>');
 /* cou + torse */
 S('<path d="'+poly([[cx-tw,78],[cx+tw,78],[cx+tw+1.5,106],[cx-tw-1.5,106]])+'" fill="url(#t'+u+')" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>');
 S('<ellipse cx="'+cx+'" cy="87.5" rx="'+fx(tw*.95)+'" ry="6" fill="'+sk.d+'" fill-opacity=".35"/>');
 S('<path d="'+torso+'" fill="url(#t'+u+')" stroke="'+INK+'" stroke-width="1.6" stroke-linejoin="round"/>');
 [1,-1].forEach(function(s){
  S(ln(cr(mp([[3,110.5],[11,112.2],[20,113.8],[Sx-1,116.5]],cx,s)),sk.d,1.2,.4+.4*m));
  S(ln(cr(mp([[tw+.5,92],[tw+6,100],[Sx-9,110]],cx,s)),sk.d,1.1,op(.4,1)*.45));
  S('<ellipse cx="'+fx(cx+s*bw*.46)+'" cy="'+fx(dt-5)+'" rx="9.5" ry="5" fill="'+sk.c+'" fill-opacity=".22"/>')});
 /* robe */
 var topE=[[cx-bw+2.5,dt-3.5],[cx-bw*.5,dt+3.5],[cx,dt+1.2],[cx+bw*.5,dt+3.5],[cx+bw-2.5,dt-3.5]];
 var rt=[[bw,152],[ubw,172],[ww,197],[hw-3,226],[hw,250]];
 var lt=[[hw+lp(8,6,m),351],[hw+lp(4,3,m),300],[hw,250],[hw-3,226],[ww,197],[ubw,172],[bw,152]];
 var dress='M'+pt(topE[0])+crc(topE)+crc([topE[4]].concat(mp(rt,cx,1)))+'L'+pt([cx+hw-1,258])+crc([[cx+hw-1,258],[cx+xr+4,277],[cx+xr-2,306],[cx+5,331],[cx+2,352]])+'C'+pt([cx-10,358])+' '+pt([cx-hw-4,356])+' '+pt([cx-hw-lp(8,6,m),351])+crc(mp(lt.slice(1),cx,-1).concat([[cx-bw,152],[cx-bw+2.5,dt-3.5]]).slice(0))+'Z';
 S('<path d="'+dress+'" fill="url(#d'+u+')" stroke="'+INK+'" stroke-width="1.6" stroke-linejoin="round"/>');
 S(ln(cr(topE),ac,1.5,.9));
 S(ln(cr([[cx-bw+4,152],[cx-ubw+2,172],[cx-ww+2,197]]),'#4a3b60',1.3,.7)+ln(cr([[cx+bw-6,154],[cx+ubw-3,173],[cx+ww-3,196]]),'#3a2d4c',1.2,.5));
 S(ln(cr([[cx-ww+3,203],[cx,209],[cx+ww-3,203]]),'#05030a',1.3,.55)+ln(cr([[cx-hw+8,236],[cx,246],[cx+hw-8,236]]),'#05030a',1.2,.4));
 S(ln(cr([[cx-hw+10,262],[cx-hw+14,305],[cx-hw+13,346]]),'#3a2d4c',1.4,.55)+ln(cr([[cx-6,268],[cx-9,310],[cx-8,346]]),'#05030a',1.3,.45));
 /* bras */
 [1,-1].forEach(function(s){
  var Sp=[cx+s*Sx,133],E=[cx+s*lp(46,36,m),198],W=[cx+s*lp(52,39,m),259];
  var ws=[lp(8,5.3,m),lp(8,5.3,m),lp(7.4,4.9,m),lp(6.4,4.2,m),lp(6.4,4.4,m),lp(5,3.5,m),lp(4,3,m)];
  var p1=mix(Sp,E,.3),p2=mix(Sp,E,.62),p4=mix(E,W,.3),p5=mix(E,W,.7),H1=[W[0]+s*1.4,W[1]+7],H2=[W[0]+s*2,W[1]+15];
  var pts=[Sp,p1,p2,E,p4,p5,W,H1,H2],wsx=ws.concat([lp(5,3.9,m),lp(3.4,2.7,m)]),d=limb(pts,wsx);
  S('<path d="'+d+'" fill="url(#a'+u+')"/>');
  S(ln(limb(pts,wsx,1),INK,1.5,1));
  S(ln(cr([[p1[0]-s*ws[1]*.3,p1[1]],[p2[0]-s*ws[2]*.2,p2[1]-2],[E[0]-s*ws[3]*.4,E[1]-9]]),sk.d,1.1,op(.45,1)*.5));
  S(ln(cr([[Sp[0]+s*dw*.4,Sp[1]+2],[p2[0]+s*ws[2]*.5,p2[1]],[E[0]+s*ws[3]*.4,E[1]-8]]),sk.d,1.1,op(.6,1)*.4));
  S(ln(cr([[Sp[0]-s*dw*.9,126],[Sp[0]+s*dw*.4,121],[Sp[0]+s*dw*.95,131]]),sk.d,1.1,op(.5,1)*.35));
  for(var f=0;f<3;f++)S(ln('M'+pt([H1[0]+s*(-1.5+f*1.6),H1[1]+4])+'L'+pt([H1[0]+s*(-1.5+f*1.6),H1[1]+9.5]),sk.d,.9,.5))});
 /* tête */
 S('<g transform="translate(150 94) scale(1.2) translate(-150 -94)">');
 var faceR=[[0,36],[17,39],[23.2,52],[lp(26,22,m),65],[lp(23.5,17,m),79],[lp(13,8.2,m),89],[0,lp(91.5,92.5,m)]];
 var face=cr(mp(faceR,cx,1).concat(mp(faceR.slice(1,faceR.length-1).reverse(),cx,-1)),true);
 S('<path d="'+face+'" fill="'+sk.b+'" stroke="'+INK+'" stroke-width="1.6" stroke-linejoin="round"/>');
 S('<clipPath id="f'+u+'"><path d="'+face+'"/></clipPath><g clip-path="url(#f'+u+')"><ellipse cx="'+(cx+17)+'" cy="74" rx="13" ry="22" fill="'+sk.c+'" fill-opacity=".26"/></g>');
 [1,-1].forEach(function(s){
  S('<ellipse cx="'+fx(cx+s*15.5)+'" cy="76" rx="5.4" ry="3" fill="#ff7aa6" fill-opacity="'+fx(lp(.38,.2,m))+'"/>');
  var ex=cx+s*11.2,ey=67;
  S('<path d="M'+pt([ex-s*7.4,66.4])+'Q'+pt([ex,59.2])+' '+pt([ex+s*7.4,66.2])+'Q'+pt([ex,72.4])+' '+pt([ex-s*7.4,66.4])+'Z" fill="#fffafa" stroke="'+INK+'" stroke-width=".8"/>');
  S('<ellipse cx="'+fx(ex+s*.3)+'" cy="'+fx(ey)+'" rx="4.5" ry="5.4" fill="'+ec[0]+'"/><ellipse cx="'+fx(ex+s*.3)+'" cy="'+fx(ey+2)+'" rx="3.4" ry="2.6" fill="'+ec[1]+'" fill-opacity=".9"/><circle cx="'+fx(ex+s*.3)+'" cy="'+fx(ey)+'" r="2" fill="#150a22"/><circle cx="'+fx(ex-s*1.2)+'" cy="'+fx(ey-2)+'" r="1.45" fill="#fff"/><circle cx="'+fx(ex+s*1.6)+'" cy="'+fx(ey+2.6)+'" r=".8" fill="#fff" fill-opacity=".85"/>');
  S(ln('M'+pt([ex-s*7.8,66.6])+'Q'+pt([ex-s*.5,58.4])+' '+pt([ex+s*7.6,65.2])+'L'+pt([ex+s*10,62.4]),INK,2.4,1));
  S(ln('M'+pt([ex-s*5.5,70.8])+'Q'+pt([ex,73])+' '+pt([ex+s*5.5,70.2]),INK,.8,.45));
  S(ln('M'+pt([cx+s*5.5,58])+'Q'+pt([cx+s*12,53.6])+' '+pt([cx+s*18.5,56.6]),INK,1.3,.95))});
 S(ln('M'+pt([cx-1.3,76.6])+'Q'+pt([cx+.3,78.6])+' '+pt([cx+2,77.8]),sk.d,1.2,.85));
 S('<path d="M'+pt([cx-5.4,84])+'Q'+pt([cx-2.6,81.4])+' '+pt([cx,82.5])+'Q'+pt([cx+2.6,81.4])+' '+pt([cx+5.4,84])+'Q'+pt([cx,88.4])+' '+pt([cx-5.4,84])+'Z" fill="#dd5f7f" stroke="#8a3050" stroke-width=".8"/>');
 S(fl('M'+pt([cx-2.5,85.2])+'Q'+pt([cx,86.6])+' '+pt([cx+2.5,85.2])+'Q'+pt([cx,86])+' '+pt([cx-2.5,85.2])+'Z','#fff',.6));
 /* cheveux avant : raie + mèches */
 S('<path d="M'+pt([cx-29.5,74])+'C'+pt([cx-34,40])+' '+pt([cx-16,22.5])+' '+pt([cx+2,22.5])+'C'+pt([cx+21,22.5])+' '+pt([cx+33,41])+' '+pt([cx+29.5,74])+'L'+pt([cx+25.5,70])+'C'+pt([cx+25,53])+' '+pt([cx+16,43])+' '+pt([cx+3,33.5])+'C'+pt([cx-6,44])+' '+pt([cx-19,53])+' '+pt([cx-23.5,70])+'Z" fill="'+HAIR+'" stroke="'+INK+'" stroke-width="1.5" stroke-linejoin="round"/>');
 S(ln('M'+pt([cx-18,38])+'Q'+pt([cx-6,27])+' '+pt([cx+8,26.5]),hl,1.8,.55)+ln('M'+pt([cx+14,31])+'Q'+pt([cx+24,40])+' '+pt([cx+26,56]),hl,1.5,.45));
 S('</g>');
 /* mèches devant les épaules */
 [1,-1].forEach(function(s){
  var o1=[[31,70],[35,98],[39,124],[35,150],[40,174],[37,198],[33,216]],o2=[[28,214],[30,196],[31,174],[28,150],[30,124],[28.5,98],[28.5,74]];
  S('<path d="'+cr(mp(o1.concat(o2),cx,s),true)+'" fill="'+HAIR+'" stroke="'+INK+'" stroke-width="1.4" stroke-linejoin="round"/>');
  S(ln(cr(mp([[30,100],[34,126],[31,150],[35,176]],cx,s)),hl,1.2,.45))});
 return o.join('')}


var VIEW = '-7 -18 314 418';
function AV(){ try { return (NEV.Avatar && NEV.Avatar.get()) || {}; } catch (e) { return {}; } }
function uidOf(){ return (uidOf.n = (uidOf.n || 0) + 1); }
NEV.Illus = {
  VIEW: VIEW,
  uid: function (p) { return (p || 'i') + uidOf(); },
  body: function (sex, m, u) { return (sex === 'f' ? female : male)(Math.max(0, Math.min(1, m)), u); },
  svg: function (sex, m, u, label) {
    return '<svg viewBox="' + VIEW + '" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (label || '') + '"><g class="ill-fig">' + NEV.Illus.body(sex, m, u) + '</g></svg>';
  }
};
})(window);
