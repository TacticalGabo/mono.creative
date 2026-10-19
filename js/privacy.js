/* mono.creative — Privacy & Cookies. Se carga con defer.
   Espera a la página montada por el runtime (fuera de <x-dc>), como js/case-study.js.
   · Índice: marca la sección que cruza la línea de lectura (30 % del alto). Con IntersectionObserver
     (sin medir layout en cada scroll) y solo escribe cuando cambia la sección.
   · Mancha del hero: .idle fuera de pantalla pausa su animación, como el home (__mcGlowIO, margen 120px). */
(function(){
  if(window.__pvToc)return; window.__pvToc=1;
  function live(q){return [].filter.call(document.querySelectorAll(q),function(el){return !el.closest('x-dc')})}
  var tries=0;
  function init(){
    var links=live('.pv-toc a'), secs=live('.pv-block'), hero=live('.pv-hero')[0];
    if(!links.length||!secs.length){if(++tries<750)setTimeout(init,40);return}
    if(!('IntersectionObserver' in window))return;
    var map={}, on=null, above={};
    links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a});
    function mark(a){if(a===on)return;if(on)on.classList.remove('on');if(a)a.classList.add('on');on=a}
    /* franja de 0 a 30 % del alto: una sección "pasó" la línea si su borde superior está por encima */
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){above[e.target.id]=e.isIntersecting||e.boundingClientRect.top<e.rootBounds.top})
      var cur=secs[0];
      secs.forEach(function(s){if(above[s.id])cur=s});
      mark(map[cur.id]);
    },{rootMargin:'0px 0px -70% 0px'});
    secs.forEach(function(s){io.observe(s)});
    mark(map[secs[0].id]);
    if(hero)new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('idle',!e.isIntersecting)})},{rootMargin:'120px'}).observe(hero);
  }
  init();
})();
