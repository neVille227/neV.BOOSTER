(function(){
  'use strict';
  /* Chaque ouverture du site : Baki tracé en lumière rouge → logo nVB → notre vision (≈ 6 s) → création du compte.
     Baki et les cartes 3D flottantes restent en fond jusqu'à l'écran de création du compte, où le parcours s'arrête. */
  var $=function(id){return document.getElementById(id)};
  var reduced=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  var ember=$('ember'), skip=$('skip'), bg=NEVBG.mount({trace:true});
  var prog=$('prog'), stepEl=$('step'), LAB=['Le tracé','Le logo','Notre vision','Son histoire'];
  var T={trace:reduced?400:5800, logo:reduced?1500:5400, vision:reduced?2500:6400};
  var timers=[], phase='trace', leaving=false;
  function later(fn,ms){var t=setTimeout(fn,ms); timers.push(t); return t}
  function clear(){timers.forEach(clearTimeout); timers=[]}
  function flash(){ember.classList.remove('flash'); void ember.offsetWidth; ember.classList.add('flash')}
  function mark(n){ if(!prog)return; var sp=prog.children; for(var i=0;i<sp.length;i++){ sp[i].className=i<n?'done':(i===n?'now':''); } stepEl.textContent=(n+1)+' / 4 · '+LAB[n]; }
  function on(id,v){$('s-'+id).classList.toggle('on',v)}

  function toLogo(){
    clear(); phase='logo'; mark(1); NEVBG.finish(); flash(); on('logo',true);
    later(NEVBG.showCards, reduced?0:3300);              // les cartes 3D surgissent avec le logo
    later(toVision,T.logo);
  }
  function toVision(){
    clear(); phase='vision'; mark(2); NEVBG.showCards(); on('logo',false);
    later(function(){on('vision',true)},reduced?0:600);
    later(toStory,T.vision+600);
  }
  function toStory(){
    if(leaving)return; leaving=true; clear(); mark(3);
    document.documentElement.classList.add('nev-leaving');
    setTimeout(function(){location.href='histoire-anime.html?intro=1'},reduced?0:750);
  }
  function toAccount(){
    if(leaving)return; leaving=true; clear();
    document.documentElement.classList.add('nev-leaving');
    setTimeout(function(){location.href='connexion.html'},reduced?0:750);
  }
  skip.addEventListener('click',function(){ if(phase==='trace') toLogo(); else if(phase==='logo') toVision(); else toStory(); });
  var sl=$('storyLink'); if(sl) sl.addEventListener('click',function(){ leaving=true; clear(); });
  mark(0);
  later(toLogo,T.trace);
})();
