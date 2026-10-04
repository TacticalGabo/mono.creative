/* mono.creative — JS común de los case studies (casestudy_*.html). Se carga con defer.
   Cada init espera a la página montada por el runtime (fuera de <x-dc>). */

/* case study: clase .js, tema, entrada por bloques y líneas de acento */
(function(){
  document.documentElement.classList.add('js');
  if(window.__csBase)return; window.__csBase=1;
  function init(){
    /* el runtime corre este script primero sobre la plantilla cruda (oculta dentro de
       <x-dc>) y luego la reemplaza por la página montada: esperar a la montada */
    var blocks=[].filter.call(document.querySelectorAll('.fx'),function(el){return !el.closest('x-dc')});
    if(!blocks.length)return setTimeout(init,120);
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* bloques */
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}})},{threshold:.1});
      blocks.forEach(function(b){io.observe(b)});
    } else blocks.forEach(function(b){b.classList.add('is-in')});
    /* líneas de acento: la de la derecha con 150 ms de relevo; en mobile las barras B09 entran de dos en dos */
    function live(q){return [].filter.call(document.querySelectorAll(q),function(el){return !el.closest('x-dc')})}
    var els=live('.cs-hero__col,.ba__bar');
    var bars=live('.ba__bar');
    els.forEach(function(el){
      var row=el.classList.contains('ba__bar')?el.closest('.ba'):el;
      var i=[].indexOf.call(row.parentElement.children,row);
      el.style.setProperty('--ld',(.2+(i%2)*.15)+'s');
    });
    if(!('IntersectionObserver' in window)||reduce){els.forEach(function(e){e.classList.add('ln-in')});return}
    function group(el){
      var i=bars.indexOf(el);
      if(i<0||window.innerWidth>=768)return [el];
      return bars.slice(i-i%2,i-i%2+2);
    }
    var lo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)group(e.target).forEach(function(x){x.classList.add('ln-in');lo.unobserve(x)})})},{rootMargin:'0px 0px -12% 0px'});
    els.forEach(function(e){lo.observe(e)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* 5.3 Constraints — curva + items.
   Dos modos según el layout que pinte el CSS:
   · 'h' (≥ 1100): curva horizontal, revelado ligado al scroll + borrado con desfase,
     parallax suave por item.
   · 'v' (< 1100): curva vertical; la punta sigue la línea de lectura (78 % del alto)
     y cada punto se coloca SOBRE la curva a la altura real de su item, así cuadra
     en cualquier ancho (360, 420, tablet...). */
(function(){
  if(window.__csCons)return; window.__csCons=1;
  function init(){
    var sec=document.querySelector('.cs-constraints');
    if(!sec||sec.closest('x-dc')||!sec.querySelector('.curve--v path'))return setTimeout(init,120);
    var items=[].slice.call(sec.querySelectorAll('.ci'));
    var svgh=sec.querySelector('.curve--h'), svgv=sec.querySelector('.curve--v');
    var ph=svgh.querySelector('path'), pv=svgv.querySelector('path');
    ph.setAttribute('pathLength','1'); pv.setAttribute('pathLength','1');
    items.forEach(function(it){it.__tx=parseFloat(getComputedStyle(it).getPropertyValue('--tx'))||40});
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* coloca los puntos sobre la curva vertical */
    var vpts=[];
    (function(){var tot=pv.getTotalLength();for(var k=0;k<=400;k++){var p=pv.getPointAtLength(tot*k/400);vpts.push([p.x,p.y,k/400])}})();
    function place(){
      if(getComputedStyle(svgv).display==='none')return;
      for(var pass=0;pass<2;pass++){
        var sr=svgv.getBoundingClientRect(), kx=sr.width/61, ky=sr.height/601;
        items.forEach(function(it){
          var r=it.getBoundingClientRect(), yv=(r.top+12-sr.top)/ky, x=vpts[vpts.length-1][0];
          for(var i=0;i<vpts.length;i++){if(vpts[i][1]>=yv){x=vpts[i][0];break}}
          var dx=Math.round((sr.left+x*kx-r.left-5)*10)/10;
          it.style.setProperty('--dx',dx+'px');
          it.style.setProperty('--tx',Math.max(it.__tx,Math.ceil(dx+36))+'px');
        });
      }
    }
    if(reduce){place();items.forEach(function(i){i.classList.add('is-on')});addEventListener('resize',place);return}

    function horiz(){
      var START=.65, SPAN=.66, OFF=.89, STOP_PX=12, path=ph, svg=svgh;
      var total=path.getTotalLength(), marks=[], stop=0, cur=0, target=0, tail=0, extra=0, raf=0, dead=0;
      var par=items.map(function(it,i){return {el:it,c:0,t:0,amp:[22,30,18,26][i]}});
      function measure(){
        var sr=svg.getBoundingClientRect(), sx=1057/sr.width, sy=416/sr.height, pts=[];
        for(var k=0;k<=300;k++){var p=path.getPointAtLength(total*k/300);pts.push([p.x,p.y,k/300])}
        marks=items.map(function(it){var d=it.querySelector('.ci__dot').getBoundingClientRect(),cx=(d.left+d.width/2-sr.left)*sx,cy=(d.top+d.height/2-sr.top)*sy,best=1e9,f=0;
          pts.forEach(function(p){var dd=(p[0]-cx)*(p[0]-cx)+(p[1]-cy)*(p[1]-cy);if(dd<best){best=dd;f=p[2]}});return f});
        stop=Math.max(0,marks[0]*total-STOP_PX)/total;
      }
      function calc(){
        var r=sec.getBoundingClientRect(), vh=innerHeight, x=(vh*START-r.top)/((vh*.65+r.height*.35)*SPAN);
        x=Math.max(0,Math.min(1,x)); target=1-Math.pow(1-x,2.4);
        par.forEach(function(p){var b=p.el.getBoundingClientRect(),d=(b.top+b.height/2-vh/2)/vh;p.t=-Math.max(-1,Math.min(1,d))*p.amp});
      }
      function tick(){
        if(dead)return;
        cur+=(target-cur)*.075; if(Math.abs(target-cur)<.0005)cur=target;
        if(cur>=.999)extra=Math.min(OFF,extra+.006); else if(target<.999)extra=0;
        var tr=stop>0?Math.max(0,cur+extra-OFF)/stop:1, tgt=stop*(tr>=1?1:1-(1-tr)*(1-tr));
        tail+=(tgt-tail)*.09; if(Math.abs(tgt-tail)<.0003)tail=tgt;
        path.style.strokeDasharray='0 '+tail.toFixed(5)+' '+Math.max(0,cur-tail).toFixed(5)+' 2';
        items.forEach(function(it,i){if(cur>=marks[i]-.01)it.classList.add('is-on')});
        var moving=cur!==target||tail!==tgt||(cur>=.999&&extra<OFF&&tail<stop);
        par.forEach(function(p){p.c+=(p.t-p.c)*.06; if(Math.abs(p.t-p.c)<.05)p.c=p.t; else moving=true;
          var s=p.el.style; s.setProperty('--py-num',p.c.toFixed(2)+'px'); s.setProperty('--py-title',(p.c*.65).toFixed(2)+'px'); s.setProperty('--py-text',(p.c*.4).toFixed(2)+'px')});
        raf=moving?requestAnimationFrame(tick):0;
      }
      function scroll(){calc(); if(!raf)raf=requestAnimationFrame(tick)}
      addEventListener('scroll',scroll,{passive:true});
      measure(); scroll();
      return {
        resize:function(){measure();scroll()},
        stop:function(){dead=1;cancelAnimationFrame(raf);removeEventListener('scroll',scroll);path.style.strokeDasharray='';
          par.forEach(function(p){var s=p.el.style;s.removeProperty('--py-num');s.removeProperty('--py-title');s.removeProperty('--py-text')})}
      };
    }

    function vert(){
      var READ=.78, OFF=.14, STOP_PX=12, path=pv, svg=svgv;
      var total=path.getTotalLength(), marks=[], stop=0, cur=0, target=0, tail=0, raf=0, dead=0;
      function measure(){
        place();
        var sr=svg.getBoundingClientRect(), sx=61/sr.width, sy=601/sr.height;
        marks=items.map(function(it){var d=it.querySelector('.ci__dot').getBoundingClientRect(),cx=(d.left+d.width/2-sr.left)*sx,cy=(d.top+d.height/2-sr.top)*sy,best=1e9,f=0;
          vpts.forEach(function(p){var dd=(p[0]-cx)*(p[0]-cx)+(p[1]-cy)*(p[1]-cy);if(dd<best){best=dd;f=p[2]}});return f});
        stop=Math.max(0,marks[0]*total-STOP_PX)/total;
      }
      /* la curva es monótona en y: la punta = primer punto cuya y alcanza la línea de lectura */
      function frac(y){for(var i=0;i<vpts.length;i++){if(vpts[i][1]>=y)return vpts[i][2]}return 1}
      function calc(){var sr=svg.getBoundingClientRect();target=frac((innerHeight*READ-sr.top)*(601/sr.height))}
      function tick(){
        if(dead)return;
        cur+=(target-cur)*.12; if(Math.abs(target-cur)<.0005)cur=target;
        var tr=stop>0?Math.max(0,cur-OFF)/stop:1, tgt=stop*(tr>=1?1:1-(1-tr)*(1-tr));
        tail+=(tgt-tail)*.09; if(Math.abs(tgt-tail)<.0003)tail=tgt;
        path.style.strokeDasharray='0 '+tail.toFixed(5)+' '+Math.max(0,cur-tail).toFixed(5)+' 2';
        items.forEach(function(it,i){if(cur>=marks[i]-.005)it.classList.add('is-on')});
        raf=(cur!==target||tail!==tgt)?requestAnimationFrame(tick):0;
      }
      function scroll(){calc(); if(!raf)raf=requestAnimationFrame(tick)}
      addEventListener('scroll',scroll,{passive:true});
      measure(); scroll();
      return {
        resize:function(){measure();scroll()},
        stop:function(){dead=1;cancelAnimationFrame(raf);removeEventListener('scroll',scroll);path.style.strokeDasharray=''}
      };
    }

    var mode=null, ctl=null;
    function pick(){
      var m=getComputedStyle(svgh).display!=='none'?'h':'v';
      if(m===mode){ctl.resize();return}
      if(ctl)ctl.stop();
      mode=m; ctl=m==='h'?horiz():vert();
    }
    addEventListener('resize',pick);
    addEventListener('load',pick);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(pick);
    pick();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
