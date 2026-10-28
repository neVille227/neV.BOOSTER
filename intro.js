(function(){
  'use strict';
  /* Début du site : logo → notre vision → l'histoire animée du jeune homme (histoire-anime.html) → connexion. */
  var order=['logo','vision'], cur=-1, timer=0, busy=false, leaving=false;
  var $=function(id){return document.getElementById(id)};
  var ember=$('ember'), skip=$('skip');
  var reduced=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);

  function flash(){ember.classList.remove('flash'); void ember.offsetWidth; ember.classList.add('flash')}
  function show(name){
    if(busy&&cur>=0)return; busy=true; clearTimeout(timer);
    flash();
    order.forEach(function(n){$('s-'+n).classList.remove('on')});
    setTimeout(function(){
      cur=order.indexOf(name); $('s-'+name).classList.add('on'); busy=false;
      if(name==='logo') timer=setTimeout(function(){show('vision')},6800);
      if(name==='vision') timer=setTimeout(goStory,30000);
    },cur<0?0:700);
  }
  function goStory(){
    if(leaving)return; leaving=true; clearTimeout(timer);
    flash(); document.documentElement.classList.add('nev-leaving');
    setTimeout(function(){location.href='histoire-anime.html'},reduced?0:900);
  }
  skip.addEventListener('click',function(){ if(cur<order.length-1) show(order[cur+1]); else goStory(); });
  $('visionNext').addEventListener('click',goStory);
  show('logo');
})();
