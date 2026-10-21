(function(){
  'use strict';
  var order=['logo','vision','film','go'], cur=-1, timer=0, busy=false;
  var $=function(id){return document.getElementById(id)};
  var ember=$('ember'), skip=$('skip'), film=null;
  var reduced=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);

  function show(name){
    if(busy&&cur>=0)return; busy=true; clearTimeout(timer);
    ember.classList.remove('flash'); void ember.offsetWidth; ember.classList.add('flash');
    order.forEach(function(n){$('s-'+n).classList.remove('on')});
    setTimeout(function(){
      cur=order.indexOf(name); $('s-'+name).classList.add('on'); busy=false;
      skip.style.display=name==='go'?'none':'';
      if(name==='logo') timer=setTimeout(function(){show('vision')},6800);
      if(name==='vision') timer=setTimeout(function(){show('film')},30000);
      if(name==='film') playFilm();
    },cur<0?0:700);
  }
  function playFilm(){
    var rot=$('rot');
    if(rot&&innerWidth<760&&innerHeight>innerWidth*1.15){rot.classList.add('show');setTimeout(function(){rot.classList.remove('show')},5200)}
    if(film){film.seek(0);film.play();return}
    film=NevReveil.mount($('film'),{autoplay:false,loop:false,controls:false,fit:'screen',onend:function(){setTimeout(function(){show('go')},1200)}});
    film.play();
  }
  skip.addEventListener('click',function(){
    if(film)film.pause();
    var n=order[Math.min(cur+1,order.length-1)];
    show(n==='film'?'film':n);
  });
  $('visionNext').addEventListener('click',function(){show('film')});
  $('goBtn').addEventListener('click',function(){
    ember.classList.remove('flash'); void ember.offsetWidth; ember.classList.add('flash');
    document.documentElement.classList.add('nev-leaving');
    setTimeout(function(){location.href='connexion.html'},reduced?0:900);
  });
  show('logo');
})();
