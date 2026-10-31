(function(){
  'use strict';
  /* Chaque ouverture du site : Baki tracé en lumière rouge → logo nVB → notre vision (≈ 6 s) → création du compte.
     Baki et les cartes 3D flottantes restent en fond jusqu'à l'écran de création du compte, où le parcours s'arrête. */
  var $=function(id){return document.getElementById(id)};
  var reduced=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  var ember=$('ember'), skip=$('skip'), wide=window.innerWidth>=900&&window.innerWidth>window.innerHeight*1.15, bg=NEVBG.mount({trace:true,split:wide}), prog=$('prog');
  if(wide)document.documentElement.classList.add('split');
  var T={trace:reduced?400:5800, logo:reduced?1500:5400, vision:reduced?2500:6400};
  var timers=[], phase='trace', leaving=false;
  function later(fn,ms){var t=setTimeout(fn,ms); timers.push(t); return t}
  function clear(){timers.forEach(clearTimeout); timers=[]}
  function flash(){ember.classList.remove('flash'); void ember.offsetWidth; ember.classList.add('flash')}
  function on(id,v){$('s-'+id).classList.toggle('on',v)}

  function progress(f){ if(!prog)return; prog.style.transition='width '+(reduced?0:2.5)+'s ease'; prog.style.width=(f*100)+'%'; }
  progress(.12);
  function toLogo(){
    clear(); phase='logo'; NEVBG.finish(); flash(); on('logo',true); if(wide)NEVBG.side(true); else NEVBG.dim(true); progress(.4);
    later(NEVBG.showCards, reduced?0:3300);              // les cartes 3D surgissent avec le logo
    later(toVision,T.logo);
  }
  function toVision(){
    clear(); phase='vision'; progress(.75); NEVBG.showCards(); on('logo',false);
    later(function(){on('vision',true)},reduced?0:600);
    later(toAccount,T.vision+600);
  }
  function toAccount(){
    if(leaving)return; leaving=true; clear(); progress(1);
    document.documentElement.classList.add('nev-leaving');
    setTimeout(function(){location.href='connexion.html'},reduced?0:750);
  }
  skip.addEventListener('click',function(){ if(phase==='trace') toLogo(); else if(phase==='logo') toVision(); else toAccount(); });
  later(toLogo,T.trace);
})();
