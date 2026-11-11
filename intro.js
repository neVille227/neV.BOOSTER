(function(){
  'use strict';
  /* Appareil d'une joueuse : directement l'animation féminine, sans passer par l'intro homme. */
  try{ if(localStorage.getItem('nev.sex')==='f'){ location.replace('femme/intro.html'); return; } }catch(e){}
  /* Chaque ouverture du site : Baki tracé en lumière rouge → logo nVB → notre vision (≈ 6 s) → création du compte.
     Baki et les cartes 3D flottantes restent en fond jusqu'à l'écran de création du compte, où le parcours s'arrête. */
  var $=function(id){return document.getElementById(id)};
  var reduced=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  var ember=$('ember'), skip=$('skip'), bg=NEVBG.mount({trace:true});
  var scr=(window.NEVSCRATCH&&$('scr'))?NEVSCRATCH.mount($('scr'),{light:false}):null;
  var prog=$('prog'), stepEl=$('step'), LAB=['Le tracé','Le logo','Son histoire'];
  var T={trace:reduced?400:5800, logo:reduced?2000:6200};
  var timers=[], phase='trace', leaving=false;
  function later(fn,ms){var t=setTimeout(fn,ms); timers.push(t); return t}
  function clear(){timers.forEach(clearTimeout); timers=[]}
  function flash(){ember.classList.remove('flash'); void ember.offsetWidth; ember.classList.add('flash')}
  function mark(n){ if(!prog)return; var sp=prog.children; for(var i=0;i<sp.length;i++){ sp[i].className=i<n?'done':(i===n?'now':''); } stepEl.textContent=(n+1)+' / 3 · '+LAB[n]; }
  function on(id,v){$('s-'+id).classList.toggle('on',v)}

  function toLogo(){
    clear(); phase='logo'; mark(1); NEVBG.finish(); flash(); on('logo',true);
    if(scr) scr.play();                                   // la carte à gratter : neV.BOOSTER se révèle
    later(NEVBG.showCards, reduced?0:3700);               // les cartes 3D surgissent avec le logo
    later(toStory,T.logo);
  }
  function toStory(){
    if(leaving)return; leaving=true; clear(); mark(2);
    if(scr) scr.stop();
    document.documentElement.classList.add('nev-leaving');   // flou + éclat d'une seconde, puis l'histoire animée
    setTimeout(function(){location.href='histoire-anime.html?intro=1'},reduced?0:750);
  }
  function toAccount(){
    if(leaving)return; leaving=true; clear();
    document.documentElement.classList.add('nev-leaving');
    setTimeout(function(){location.href='connexion.html'},reduced?0:750);
  }
  skip.addEventListener('click',function(){ if(phase==='trace') toLogo(); else toStory(); });
  var sl=$('storyLink'); if(sl) sl.addEventListener('click',function(){ leaving=true; clear(); });
  mark(0);
  later(toLogo,T.trace);
})();
