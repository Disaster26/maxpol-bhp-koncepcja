(function(){
  var d=document;

  // menu mobilne
  var burger=d.getElementById('burger'), menu=d.getElementById('menu');
  function zamknij(){menu.classList.remove('otw');burger.setAttribute('aria-expanded','false');d.body.style.overflow=''}
  burger.addEventListener('click',function(){
    var otw=!menu.classList.contains('otw');
    menu.classList.toggle('otw',otw);burger.setAttribute('aria-expanded',String(otw));d.body.style.overflow=otw?'hidden':'';
  });
  menu.addEventListener('click',function(e){if(e.target.closest('a'))zamknij()});
  d.addEventListener('keydown',function(e){if(e.key==='Escape')zamknij()});
  window.addEventListener('resize',function(){if(innerWidth>1099)zamknij()});

  // aktywna pozycja menu = dokładnie bieżąca sekcja (ta, która przecina środek ekranu)
  var linki=[].slice.call(menu.querySelectorAll('a[href^="#"]'));
  var sekcje=['oferta','nadzor','szkolenia','pomoc','kursy','srodowisko','galeria','kontakt'].map(function(id){return d.getElementById(id)});
  var mapa={srodowisko:'oferta',galeria:'oferta'};
  var tik=false;
  function aktywna(){
    tik=false;var y=innerHeight*0.45,id=null;
    sekcje.forEach(function(s){var r=s.getBoundingClientRect();if(r.top<=y&&r.bottom>y)id=s.id});
    if(id&&mapa[id])id=null;
    linki.forEach(function(a){if(id&&a.getAttribute('href')==='#'+id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});
  }
  window.addEventListener('scroll',function(){if(!tik){tik=true;requestAnimationFrame(aktywna)}},{passive:true});
  aktywna();

  // paski kart i galerii: palec natywnie, mysz przeciąganiem, strzałki i klawiatura
  [].slice.call(d.querySelectorAll('.pas')).forEach(function(pas){
    var x0=0,s0=0,ciag=false,ruch=false;
    pas.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||e.button!==0)return;ciag=true;ruch=false;x0=e.clientX;s0=pas.scrollLeft});
    window.addEventListener('pointermove',function(e){if(!ciag)return;var dx=e.clientX-x0;if(!ruch&&Math.abs(dx)>5){ruch=true;pas.classList.add('ciag')}if(ruch){pas.scrollLeft=s0-dx;e.preventDefault()}});
    window.addEventListener('pointerup',function(){if(!ciag)return;ciag=false;
      if(ruch){var el=pas.firstElementChild,w=el?el.getBoundingClientRect().width+18:300;var cel=Math.round(pas.scrollLeft/w)*w;pas.classList.remove('ciag');pas.scrollTo({left:cel,behavior:'smooth'})}
      setTimeout(function(){ruch=false},0)});
    pas.addEventListener('click',function(e){if(ruch){e.preventDefault();e.stopPropagation()}},true);
    pas.addEventListener('dragstart',function(e){e.preventDefault()});
    pas.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();krok(pas,1)}if(e.key==='ArrowLeft'){e.preventDefault();krok(pas,-1)}});
  });
  function krok(pas,k){var el=pas.firstElementChild;pas.scrollBy({left:k*(el?el.getBoundingClientRect().width+18:320),behavior:'smooth'})}
  [].slice.call(d.querySelectorAll('[data-pas]')).forEach(function(b){b.addEventListener('click',function(){krok(d.getElementById(b.dataset.pas),+b.dataset.kier)})});

  // karta zgłoszenia pokazowa, bez wysyłki
  var f=d.getElementById('zgloszenie');
  if(f)f.addEventListener('submit',function(e){e.preventDefault();d.getElementById('formInfo').hidden=false});

  var rok=d.getElementById('rok');if(rok)rok.textContent=new Date().getFullYear();
})();
