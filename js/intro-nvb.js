/* neV.BOOSTER — introduction racontée : 7 séquences illustrées, voix off grave, sous-titres mot à mot.
   Source : intro de l'équipe, fusionnée avec la voix de la vidéo « voix grave » (timeline recalée sur la voix). */
(() => {
  /* Minutage (s) de chaque séquence, aligné sur la voix off. Dernier = fin. Ajustable. */
  const T = [0, 13.3, 25.5, 37.9, 49.9, 60.7, 73.1, 80];
  /* Fenêtres de parole réelles (s) de chaque séquence : les sous-titres s'allument mot à mot dans cette fenêtre. */
  const SPEECH = [[1.4,12.5],[14.0,24.6],[26.4,37.5],[38.4,49.3],[50.6,60.0],[61.3,72.5],[73.8,78.2]];
  const SCRIPT = [
    "Nous avons tous déjà voulu changer quelque chose dans notre quotidien. Mais entre vouloir commencer et passer à l’action, il existe parfois un obstacle : savoir par où commencer.",
    "Et si, au lieu de passer du temps à choisir ses exercices, on laissait le hasard nous proposer notre défi du jour ? C’est ainsi qu’est née une idée : neV.BOOSTER.",
    "Pourquoi une carte au hasard ? Parce que le plus difficile est parfois de décider quoi faire. Le hasard choisit à ta place : moins d’hésitation, plus d’action. Et chaque tirage apporte une nouvelle surprise.",
    "Pourquoi revenir chaque jour ? Parce que les progrès ne reposent pas sur une seule séance, mais sur la régularité. Chaque journée est une nouvelle occasion de relever un défi.",
    "Pourquoi plusieurs exercices et niveaux ? Parce que chacun commence à son propre rythme. L’objectif n’est pas de se comparer aux autres, mais de progresser à son échelle.",
    "neV.BOOSTER, ce n’est pas simplement un site d’exercices. C’est une invitation à bouger, à découvrir, à développer sa régularité et à faire de chaque journée une nouvelle opportunité.",
    "À toi de tirer ta carte."
  ];
  const LEVELS = ["Maigrichon","Éveillé","Athlète","Costaud","Colosse","Légende"], XP_MAX = 2600;
  const DAYS = "LMMJVSD";

  const $ = id => document.getElementById(id), nv = $('nv'), audio = $('voice');
  const sc = [...nv.querySelectorAll('.sc')], cap = $('cap'), END = T[T.length-1], N = sc.length;

  /* ====== Illustrations originales (silhouettes d'encre, style manga) ====== */
  document.body.insertAdjacentHTML('beforeend',`<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="bgA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171a26"/><stop offset="1" stop-color="#050205"/></linearGradient>
    <linearGradient id="bgB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a0c18"/><stop offset="1" stop-color="#050204"/></linearGradient>
    <linearGradient id="bgC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d0d14"/><stop offset="1" stop-color="#060205"/></linearGradient>
    <linearGradient id="bgD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10131f"/><stop offset=".7" stop-color="#05030a"/><stop offset="1" stop-color="#2a0b15"/></linearGradient>
    <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="bodyg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1b0c13"/><stop offset="1" stop-color="#040104"/></linearGradient>
    <linearGradient id="flareg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".2" stop-color="#fff"/><stop offset=".5" stop-color="#ffd6dc"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#ff6b83" stop-opacity=".75"/><stop offset="1" stop-color="#ff6b83" stop-opacity="0"/></radialGradient>
    <radialGradient id="haloG"><stop offset="0" stop-color="#f0b24a" stop-opacity=".8"/><stop offset="1" stop-color="#f0b24a" stop-opacity="0"/></radialGradient>
    <pattern id="ht" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r="1.1" fill="#e8455f" opacity=".55"/></pattern>
  </defs></svg>`);

  const RIM='#ff8aa0';
  // personnage de face / de dos. k = 0 (maigre) → 1 (légende)
  function fig(k,o={}){
    const sw=30+k*24, aw=9+k*7, ww=20+k*6, hw=24+k*6, lw=16+k*7;
    const L=[[-10,86],[-sw*.55,93],[-sw,105],[-sw-aw*.5,128],[-sw-aw*.5-3,178],[-sw-aw*.5-6,238],[-sw-aw*.5-3,254],[-sw+aw*.5-2,254],[-sw+aw*.5-3,238],[-sw+aw*.75,182],[-sw+aw*.9,132],[-ww-3,160],[-ww,202],[-hw,234],[-hw-2,300],[-hw+3,384],[-hw-6,394],[-hw+lw*.95,394],[-hw+lw*.9,384],[-hw+lw*1.2,300],[-3,246]];
    const R=L.map(([x,y])=>[-x,y]).reverse();
    const d='M'+L.concat(R).map(([x,y])=>(100+x).toFixed(1)+' '+y).join(' L')+'Z';
    let hair=[]; const n=9;
    for(let i=0;i<=n*2;i++){const a=Math.PI*(1.06+i/(n*2)*.88), r=(i%2?20:34+(i%4===0?7:0)); hair.push((100+Math.cos(a)*r).toFixed(1)+','+(54+Math.sin(a)*r*1.05).toFixed(1));}
    const col=o.gold?'#f0b24a':RIM;
    let m='';
    if(k>.3&&!o.back){const q=Math.min(1,(k-.3)*1.6);
      m=`<g stroke="${col}" stroke-width="1.2" fill="none" opacity="${(.2+q*.45).toFixed(2)}" stroke-linecap="round">
        <path d="M100 108V200"/><path d="M${100-ww-1} 134Q${100-ww*.4} 150 100 142Q${100+ww*.4} 150 ${100+ww+1} 134"/>
        <path d="M${100-ww*.55} 164H${100-4}M${100+4} 164H${100+ww*.55}M${100-ww*.5} 180H${100-4}M${100+4} 180H${100+ww*.5}"/></g>`;}
    const eyes=(!o.back&&o.eyes!==false)?`<path d="M91 54l9 3M109 54l-9 3" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round" style="filter:drop-shadow(0 0 4px #ff2d55)"/>`:'';
    return `<g class="rim" stroke-linejoin="round"><polygon points="${hair.join(' ')}" fill="#06020a" stroke="${col}" stroke-width="1.4"/><path d="${d}" fill="url(#bodyg)" stroke="${col}" stroke-width="1.6"/>
      <ellipse cx="100" cy="54" rx="16" ry="20" fill="#0d0509" stroke="${col}" stroke-width="1.2"/><rect x="92" y="70" width="16" height="20" fill="#0a0408"/>${m}${eyes}</g>`;
  }
  const papers=[[34,362,-14],[250,370,10],[84,380,6],[210,384,-8],[276,352,18]].map(([x,y,r])=>`<rect x="${x}" y="${y}" width="26" height="18" fill="#cfd2dc" opacity=".5" transform="rotate(${r} ${x+13} ${y+9})"/>`).join('');
  const qs=[[40,110,'0s'],[252,150,'1.3s'],[58,260,'2.2s']].map(([x,y,d])=>`<text class="qm" x="${x}" y="${y}" style="animation-delay:${d}">?</text>`).join('');
  const card=(x,y,w,r,o=1)=>`<g transform="translate(${x} ${y}) rotate(${r})" opacity="${o}"><rect x="${-w/2}" y="${-w*.73}" width="${w}" height="${w*1.46}" rx="${w*.1}" fill="#14060c" stroke="#ff6b83" stroke-width="1.6" style="filter:drop-shadow(0 0 8px #e8455f)"/><rect x="${-w*.14}" y="${-w*.14}" width="${w*.28}" height="${w*.28}" rx="2" fill="#ff4d6d" transform="rotate(45)"/></g>`;
  const ART={
    a1:()=>`<svg class="art" viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice"><rect width="320" height="400" fill="url(#bgA)"/><polygon points="135,0 185,0 305,400 15,400" fill="url(#cone)"/><ellipse cx="160" cy="380" rx="125" ry="15" fill="#fff" opacity=".12"/>${papers}<g transform="translate(66,62) scale(.94)">${fig(0)}</g><rect y="290" width="320" height="110" fill="url(#ht)" opacity=".45"/>${qs}</svg>`,
    a1b:()=>`<svg class="art" viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice"><rect width="320" height="400" fill="url(#bgA)"/><polygon points="135,0 185,0 305,400 15,400" fill="url(#cone)"/><ellipse cx="160" cy="380" rx="125" ry="15" fill="#fff" opacity=".12"/>${papers}<g transform="translate(66,62) scale(.94)">${fig(0)}</g><g class="dropc"><circle cx="160" cy="62" r="46" fill="url(#halo)"/>${card(160,62,40,6)}</g><rect y="290" width="320" height="110" fill="url(#ht)" opacity=".45"/></svg>`,
    a2:()=>`<svg class="art" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice"><rect width="400" height="320" fill="url(#bgB)"/><circle cx="280" cy="150" r="150" fill="url(#halo)" opacity=".55"/>${Array.from({length:18},(_,i)=>{const a=i*20*Math.PI/180;return `<line x1="${280+Math.cos(a)*50}" y1="${150+Math.sin(a)*50}" x2="${280+Math.cos(a)*210}" y2="${150+Math.sin(a)*210}" stroke="#ff6b83" stroke-width="1.2" opacity=".28"/>`}).join('')}<ellipse cx="200" cy="296" rx="190" ry="14" fill="#fff" opacity=".08"/><g transform="translate(30,100) scale(.55)">${fig(.25,{back:true})}</g><g class="fcard">${card(226,150,40,-14,.8)}</g><g class="fcard" style="animation-delay:-1s">${card(262,142,44,-6,.9)}</g><g class="fcard" style="animation-delay:-2s">${card(304,134,52,0)}</g><g class="fcard" style="animation-delay:-3s">${card(346,142,44,7,.9)}</g><rect y="230" width="400" height="90" fill="url(#ht)" opacity=".4"/></svg>`,
    a4:()=>`<svg class="art" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice"><rect width="400" height="320" fill="url(#bgC)"/><polygon points="60,0 130,0 330,260 20,260" fill="url(#cone)" opacity=".7"/><rect y="252" width="400" height="68" fill="#0a0408"/><line x1="0" y1="252" x2="400" y2="252" stroke="${RIM}" stroke-width="1.2" opacity=".6"/>
      ${[40,70,100,130,160].map((y,i)=>`<line class="sl" x1="${200+i*10}" y1="${y+60}" x2="${260+i*10}" y2="${y+60}" stroke="#fff" stroke-width="1.5" style="animation-delay:${i*.18}s"/>`).join('')}
      <g class="pu">
        <path d="M122 176L116 246" stroke="${RIM}" stroke-width="18" stroke-linecap="round"/><path d="M122 176L116 246" stroke="#05020a" stroke-width="15" stroke-linecap="round"/>
        <rect x="102" y="244" width="26" height="8" rx="3" fill="#05020a" stroke="${RIM}" stroke-width="1.2"/>
        <polygon points="104,166 128,152 190,168 252,190 336,222 348,246 326,250 252,226 196,214 132,204 108,190" fill="url(#bodyg)" stroke="${RIM}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M150 176Q170 190 190 184M178 196Q196 206 214 200" stroke="${RIM}" stroke-width="1.1" fill="none" opacity=".4" stroke-linecap="round"/>
        <polygon points="58,150 64,124 74,142 84,118 92,140 106,122 106,150" fill="#05020a" stroke="${RIM}" stroke-width="1.2" stroke-linejoin="round"/>
        <ellipse cx="86" cy="162" rx="17" ry="18" fill="#0d0509" stroke="${RIM}" stroke-width="1.3"/>
        <path d="M76 160l11 3" stroke="#ff4d6d" stroke-width="2.6" stroke-linecap="round" style="filter:drop-shadow(0 0 4px #ff2d55)"/>
        <path class="sweat" d="M68 160q-4 8 0 11q4-3 0-11z" fill="#bfe3ff"/><path class="sweat" style="animation-delay:.6s" d="M100 172q-4 8 0 11q4-3 0-11z" fill="#bfe3ff"/></g>
      <g class="cal" id="calg"><rect x="282" y="20" width="98" height="120" rx="7" fill="#f4eef0"/><rect x="282" y="20" width="98" height="28" rx="7" fill="#e8455f"/><rect x="282" y="38" width="98" height="10" fill="#e8455f"/><text x="331" y="40" text-anchor="middle" fill="#fff" font-family="Montserrat,sans-serif" font-weight="800" font-size="15" letter-spacing="3">JOUR</text><text id="calnum" x="331" y="115" text-anchor="middle" fill="#14060c" font-family="Montserrat,sans-serif" font-weight="800" font-size="62">1</text><circle cx="302" cy="20" r="4" fill="#14060c"/><circle cx="360" cy="20" r="4" fill="#14060c"/></g>
      <rect y="255" width="400" height="65" fill="url(#ht)" opacity=".4"/></svg>`,
    a5:()=>{const s=i=>.40+.014*i; return `<svg class="art" viewBox="0 0 400 320" preserveAspectRatio="xMidYMid slice"><rect width="400" height="320" fill="url(#bgD)"/><circle class="aura" id="aura" cx="340" cy="190" r="120" fill="url(#haloG)"/><rect y="296" width="400" height="24" fill="#0a0408"/><line x1="0" y1="296" x2="400" y2="296" stroke="${RIM}" stroke-width="1" opacity=".5"/>
      ${[0,1,2,3,4,5].map(i=>`<g class="lv${i===5?' leg':''}" data-i="${i}" transform="translate(${(58+i*57-100*s(i)).toFixed(1)} ${(296-394*s(i)).toFixed(1)}) scale(${s(i).toFixed(3)})">${fig(i/5,{gold:i===5})}</g>`).join('')}
      <rect y="240" width="400" height="80" fill="url(#ht)" opacity=".35"/></svg>`;},
    a6:()=>`<svg class="art" viewBox="0 0 320 400" preserveAspectRatio="xMidYMid slice"><rect width="320" height="400" fill="url(#bgD)"/><circle cx="160" cy="170" r="150" fill="url(#halo)" opacity=".55"/>
      <rect x="0" y="183" width="320" height="3" fill="url(#flareg)" style="filter:drop-shadow(0 0 8px #e8455f)"/>
      ${[16,58,100,222,264,304].map((x,i)=>`<rect class="spk" x="${x}" y="150" width="2.4" height="70" fill="#fff" style="animation-delay:${i*.4}s;filter:drop-shadow(0 0 6px #e8455f)"/>`).join('')}
      <g transform="translate(73,52) scale(.87)">${fig(1,{back:true})}</g>
      <ellipse class="fogm" cx="160" cy="395" rx="230" ry="46" fill="#7a8bb0" opacity=".28" style="filter:blur(14px)"/></svg>`
  };
  $('bgs').innerHTML = Array.from({length:7},(_,i)=>`<div class="bg b${i}"></div>`).join('');
  const bgs = [...document.querySelectorAll('.bg')];
  document.querySelectorAll('.pic').forEach(p=>{
    const custom = window.NVB_IMAGES || {};   // optionnel : window.NVB_IMAGES = { a1:'img/boss1.webp', ... }
    p.innerHTML = p.dataset.art.split(',').map(k=>custom[k]?`<img class="art" alt="" src="${custom[k]}">`:ART[k]()).join('');
  });
  $('dots').innerHTML = Array.from({length:30},()=>`<i style="left:${Math.random()*100}%;top:${25+Math.random()*70}%;animation-duration:${6+Math.random()*8}s;animation-delay:-${Math.random()*10}s"></i>`).join('');
  $('row').innerHTML = [...DAYS].map(d=>`<div class="fl"><i><svg viewBox="0 0 24 24"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/></svg></i>${d}</div>`).join('');
  $('list').innerHTML = LEVELS.map((l,i)=>`<div class="it${i===5?' leg':''}"><small>NIV ${i+1}</small>${l}${i===5?`<em>${XP_MAX} XP</em>`:''}<span></span></div>`).join('');
  const segs = sc.map((_,i)=>{const b=document.createElement('button');b.className='seg';b.setAttribute('aria-label',i===N-1?'Final':'Séquence '+(i+1));b.innerHTML='<b></b>';b.onclick=()=>seek(T[i]+.01);$('bar').appendChild(b);return b.firstChild;});

  const capSpans = SCRIPT.map(s=>s.split(' ').filter(Boolean)); let capIdx=-1;
  /* Poids d'un mot : sa longueur, plus une pause après la ponctuation (virgule, point, deux-points, point d'interrogation). */
  const capW = capSpans.map(ws=>{ let c=0; return ws.map(w=>{ c += w.length + (/[,.:?!]$/.test(w)?3:0) + 1; return c; }); });
  function setCaption(i, lt){
    if(i!==capIdx){ capIdx=i; const w=capSpans[i]||[]; cap.innerHTML = w.length ? '« '+w.map(x=>`<span>${x}</span>`).join(' ')+' »' : ''; }
    const w=capSpans[i]||[]; if(!w.length) return;
    const a=SPEECH[i][0]-T[i], b=SPEECH[i][1]-T[i], cw=capW[i], tot=cw[cw.length-1];
    const p=(lt-a)/(b-a)*tot; let k=0; while(k<cw.length && cw[k]-(w[k].length+1)*0.5 <= p) k++;
    if(lt<a) k=0;
    cap.querySelectorAll('span').forEach((s,j)=>s.classList.toggle('v', j<k));
  }
  const showImg = (pic,k)=>pic.querySelectorAll('.art').forEach((im,j)=>im.classList.toggle('on',j===k));

  /* Après l'intro : création du compte (parcours d'ouverture du site) ou accueil (joueuse, ou page ouverte seule). */
  const QS=new URLSearchParams(location.search); let female=QS.get('sex')==='f'; try{ if(localStorage.getItem('nev.sex')==='f') female=true; }catch(e){}
  /* parcours féminin : même introduction sur fond clair (thème clair + logo rose) */
  if(female){ if(window.NEV&&NEV.previewSex&&NEV.sex!=='f') NEV.previewSex('f'); document.querySelectorAll('img[src="img/logo-nvb.webp"]').forEach(function(i){ i.src='img/logo-nvb-f.webp'; }); }
  const NEXT = (QS.has('intro') && !female) ? 'connexion.html' : 'accueil.html';
  let t=0, cur=-1, playing=false, voice=false, last=0;
  const idxAt = x => { let i=0; while(i<N-1 && x>=T[i+1]) i++; return i; };
  const set = (el,c,on)=>el.classList.toggle(c,on);

  let lastDay=0, lastLv=-1;
  function scene(i, lt){
    const s=sc[i], pic=s.querySelector('.pic');
    if(i===0) showImg(pic, lt>6.5?1:0);
    if(i===1){ set(s,'wm', lt>3.6); showImg(pic,0); }
    if(i===2){ set(s,'show', lt>.5); set(s,'pick', lt>5.2); set($('sel'),'flip', lt>7.2); }
    if(i===3){
      set(s,'show', lt>.4); set(s,'reg', lt>10); showImg(pic,0);
      const d=Math.max(1,Math.min(7, Math.floor((lt-1)/1.25)+1));
      $('dn').textContent=d; $('calnum').textContent=d;
      if(d!==lastDay){ lastDay=d; const c=$('calg'); c.classList.remove('tick'); void c.getBoundingClientRect(); c.classList.add('tick'); }
      s.querySelectorAll('.fl').forEach((f,k)=>f.classList.toggle('lit', lt>1 && k<d));
    }
    if(i===4){
      set(s,'show', lt>.4); showImg(pic,0);
      const a=Math.max(0,Math.min(5, Math.floor((lt-1.0)/1.5)));
      s.querySelectorAll('.it').forEach((el,k)=>{
        el.classList.toggle('act',k===a); el.classList.toggle('done',k<a);
        el.style.setProperty('--p', k<=a && lt>1 ? (k<a?1:.6) : 0);
      });
      pic.querySelectorAll('.lv').forEach((g,k)=>{ g.classList.toggle('act',lt>1&&k===a); g.classList.toggle('done',lt>1&&k<a); });
      $('aura').classList.toggle('on', lt>1 && a===5);
    }
    if(i===5) showImg(pic,0);
  }
  function paint(){
    const i=idxAt(t), lt=t-T[i];
    if(i!==cur){
      sc.forEach((s,k)=>{ if(k===i){ s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); } else { s.classList.remove('on'); ['show','pick','wm','reg'].forEach(c=>s.classList.remove(c)); } });
      bgs.forEach((b,k)=>b.classList.toggle('on',k===i));
      $('sel').classList.remove('flip'); cur=i;
    }
    scene(i,lt); setCaption(i,lt);
    segs.forEach((f,k)=>f.style.transform=`scaleX(${Math.min(1,Math.max(0,(t-T[k])/(T[k+1]-T[k])))})`);
  }
  function tick(now){
    if(!playing) return;
    const dt=Math.min(.1,(now-last)/1000); last=now;
    if(voice && !audio.paused && audio.readyState>2) t=audio.currentTime; else t+=dt;
    if(t>=END-.05){ t=END-.05; paint(); setPlay(false); return; }
    paint(); requestAnimationFrame(tick);
  }
  function setPlay(v){
    playing=v;
    $('ppI').innerHTML = v?'<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>':'<path d="M7 4v16l13-8z"/>';
    $('pp').setAttribute('aria-label', v?'Pause':'Lecture');
    if(voice){ v ? audio.play().catch(()=>{}) : audio.pause(); }
    if(v){ last=performance.now(); requestAnimationFrame(tick); }
  }
  function seek(x){ t=Math.max(0,Math.min(END-.06,x)); if(voice) audio.currentTime=t; cur=-1; paint(); if(!playing) setPlay(true); }
  function setVoice(on){
    voice=on; $('mute').setAttribute('aria-pressed', !on);
    $('muteI').innerHTML = on?'<path d="M3 9v6h4l5 4V5L7 9zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"/>':'<path d="M3 9v6h4l5 4V5L7 9zm11.6 1.4L16 12l-1.4 1.6 1 1 1.4-1.6 1.4 1.6 1-1L18 12l1.4-1.6-1-1-1.4 1.6z"/>';
    if(on){ audio.currentTime=t; if(playing) audio.play().catch(()=>{}); } else audio.pause();
  }
  function begin(withSound){ $('start').classList.add('hide'); voice=false; setVoice(withSound); t=0; cur=-1; seek(0); }
  function finish(){
    nv.dispatchEvent(new CustomEvent('nvb:intro-end',{bubbles:true}));
    try{ parent!==window && parent.postMessage({type:'nvb:intro-end'},'*'); }catch(e){}
    location.href=NEXT;
  }
  $('play').onclick=()=>begin(true); $('nosound').onclick=()=>begin(false);
  $('pp').onclick=()=>{ if(t>=END-.1) seek(0); else setPlay(!playing); };
  $('mute').onclick=()=>setVoice(!voice);
  $('cc').onclick=()=>{ const on=$('cc').getAttribute('aria-pressed')!=='true'; $('cc').setAttribute('aria-pressed',on); cap.classList.toggle('off',!on); };
  $('skip').onclick=finish; $('go').onclick=finish;
  nv.tabIndex=0;
  nv.addEventListener('keydown',e=>{ if(e.key===' '&&e.target===nv){e.preventDefault();$('pp').click();} if(e.key==='ArrowRight')seek(T[Math.min(N-1,idxAt(t)+1)]+.01); if(e.key==='ArrowLeft')seek(T[Math.max(0,idxAt(t)-1)]+.01); if(e.key==='Escape')finish(); });
  new ResizeObserver(([e])=>nv.classList.toggle('narrow', e.contentRect.width<700 || e.contentRect.width<e.contentRect.height)).observe(nv);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden&&playing) setPlay(false); });
  paint();
})();
