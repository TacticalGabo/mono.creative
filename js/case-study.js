/* mono.creative — JS común de los case studies (casestudy_*.html). Se carga con defer.
   Cada init espera a la página montada por el runtime (fuera de <x-dc>). */

/* case study: entrada por bloques y barras de acento de Before / After.
   (La clase .js la pone cada página en su <head>, síncrona, antes de pintar.) */
(function(){
  if(window.__csBase)return; window.__csBase=1;
  function init(){
    /* el runtime corre este script primero sobre la plantilla cruda (oculta dentro de
       <x-dc>) y luego la reemplaza por la página montada: esperar a la montada */
    var blocks=[].filter.call(document.querySelectorAll('.fx'),function(el){return !el.closest('x-dc')});
    if(!blocks.length)return setTimeout(init,120);
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* bloques */
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target)}})},{threshold:0,rootMargin:'0px 0px -10% 0px'});   /* por el borde, no por % del bloque: en secciones altas el 10 % eran cientos de px en blanco */
      blocks.forEach(function(b){io.observe(b)});
    } else blocks.forEach(function(b){b.classList.add('is-in')});
    /* barras de acento B09: la de la derecha con 150 ms de relevo; en mobile entran de dos en dos.
       (Las líneas del hero van con su columna: ver "hero por partes" más abajo.) */
    function live(q){return [].filter.call(document.querySelectorAll(q),function(el){return !el.closest('x-dc')})}
    var bars=live('.ba__bar'), els=bars;
    bars.forEach(function(el){
      var row=el.closest('.ba'), i=[].indexOf.call(row.parentElement.children,row);
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

/* avatares del team (hero): tap / clic abre la tarjeta de ese miembro (.is-open), otro tap la
   cierra, igual que tocar fuera o Escape. Delegado en document: un solo listener, vale para la
   página montada sin esperarla. Al cerrar se quita el foco, si no :focus-within la dejaría
   abierta (ver el CSS "avatares → tarjeta mínima"). */
(function(){
  if(window.__csTeam)return; window.__csTeam=1;
  function close(){
    [].forEach.call(document.querySelectorAll('.cs-hero .is-open'),function(el){el.classList.remove('is-open')});
    var f=document.activeElement; if(f&&f.closest&&f.closest('.cs-hero .avatars'))f.blur();
  }
  document.addEventListener('click',function(e){
    var t=e.target, a=t.closest&&t.closest('.cs-hero .avatar');
    if(a&&t.closest('.pcard'))return;   /* enlaces de la tarjeta: abrir sin cerrarla */
    if(!a){if(document.querySelector('.cs-hero .avatars.is-open, .cs-hero .avatars:focus-within'))close();return}
    var was=a.classList.contains('is-open');
    close();
    if(!was){a.classList.add('is-open');a.parentNode.classList.add('is-open')}
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
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
    /* la curva solo escucha el scroll cerca de su sección (antes leía su posición en todo el scroll de la página) */
    var near=true;

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
      function scroll(){if(!near)return; calc(); if(!raf)raf=requestAnimationFrame(tick)}
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
      function scroll(){if(!near)return; calc(); if(!raf)raf=requestAnimationFrame(tick)}
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
    if('IntersectionObserver' in window)new IntersectionObserver(function(es){near=es[0].isIntersecting;if(near&&ctl)ctl.resize()},{rootMargin:'100% 0px'}).observe(sec);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* header: html.logo-ok cuando el logo (path dibujado por JS en el slot visible: .nav-anim
   desktop / .nav-anim-m mobile) ya tiene trazo, con tope de 1,2 s desde que aparece el header
   MONTADO (no el de la plantilla cruda dentro de <x-dc>); html.logo-drawn solo con trazo
   (fade propio del logo). Ver el CSS "ENTRADA DE IMÁGENES … LOGO DEL HEADER". */
(function(){
  if(window.__csLogo)return; window.__csLogo=1;
  var h=document.documentElement, t_nav=0;
  function drawn(){
    var slots=document.querySelectorAll('.page .nav .nav-anim, .page .nav .nav-anim-m');
    for(var i=0;i<slots.length;i++){
      if(!slots[i].offsetWidth)continue;   /* slot oculto en este ancho */
      /* trazo fuera de <defs>: header-logo-hover lo tiene suelto, brandmark-fusion dentro de un <g> */
      var ps=slots[i].querySelectorAll('svg path');
      for(var k=0;k<ps.length;k++){if(!ps[k].closest('defs')&&ps[k].getAttribute('d'))return true}
      return false;
    }
    return false;
  }
  (function chk(){
    if(!t_nav&&[].some.call(document.querySelectorAll('.page .nav'),function(n){return !n.closest('x-dc')}))t_nav=Date.now();
    if(t_nav){
      var is_drawn=drawn(), late=Date.now()-t_nav;
      if(is_drawn||late>1200)h.classList.add('logo-ok');                 /* header: entra (tope 1,2 s) */
      if(is_drawn||late>15000){h.classList.add('logo-drawn');return}     /* logo: fade propio al tener trazo */
    }
    setTimeout(chk,40);
  })();
})();

/* imágenes: carga diferida + entrada, y hero por partes. Ver el CSS del mismo nombre. */
(function(){
  if(window.__csImg)return; window.__csImg=1;
  var WAIT=2500;   /* ms máx. esperando la decodificación antes de animar igualmente (con 500 en móvil el
                      fade corría sobre el hueco vacío y la imagen llegaba después, de golpe) */
  function live(q){return [].filter.call(document.querySelectorAll(q),function(el){return !el.closest('x-dc')})}
  var tries=0;
  function init(){
    var main=live('main[data-case]')[0];
    if(!main){if(++tries<250)setTimeout(init,120);return}   /* tope 30 s: contact.html carga este JS y no tiene main[data-case] */
    var io_ok='IntersectionObserver' in window;
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- hero por partes: lo visible al iniciar entra en el acto (sin esperar al observer);
       el resto al entrar en pantalla con el scroll ---- */
    var hr_els=[].slice.call(main.querySelectorAll('.cs-hero .cs-hero__meta,.cs-hero .cs-hero__lead,.cs-hero .cs-hero__intro,.cs-hero .cs-hero__col'));
    var hr_k=0, vh=window.innerHeight||800;
    function hr_show(el){if(!el.classList.contains('hr-in')){el.style.setProperty('--hr-d',(hr_k++*.12)+'s');el.classList.add('hr-in')}}
    if(io_ok){
      var hro=new IntersectionObserver(function(es){hr_k=0;es.forEach(function(e){if(e.isIntersecting){hr_show(e.target);hro.unobserve(e.target)}})},{threshold:.15});
      hr_els.forEach(function(el){if(el.getBoundingClientRect().top<vh*.95)hr_show(el);else hro.observe(el)});
    } else hr_els.forEach(hr_show);
    hr_k=0;

    /* ---- radio de la imagen del hero: arranca cuando la página queda libre (mín. 550 ms),
       para que se vea animado y no salte de golpe con el hilo ocupado tras montar ---- */
    setTimeout(function(){document.documentElement.classList.add('hero-ok')},2500);   /* red de seguridad del aviso del <head> */
    var hero_img=main.querySelector('.cs-hero .media'), fired=0, h=document.documentElement;
    function go_round(){
      if(fired||!hero_img)return;
      /* el radio se anima con la imagen ya decodificada (html.hero-ok): si arranca antes, su repintado
         compite con la decodificación y se pierden los fotogramas (salta de cuadrada a redonda) */
      if(!h.classList.contains('hero-ok'))return setTimeout(go_round,50);
      fired=1;
      hero_img.classList.add('ir-r');   /* quita el radio 0: el destino es el radio de diseño */
      if(hero_img.animate&&!reduce)hero_img.animate([{borderRadius:'0px'},{}],{duration:1000,easing:'cubic-bezier(.8,0,.1,1)'});
    }
    if(hero_img){
      var t_min=Date.now()+550;
      (function when_idle(){
        var w=t_min-Date.now(); if(w>0)return setTimeout(when_idle,w);
        if(window.requestIdleCallback)requestIdleCallback(go_round,{timeout:1500});
        else requestAnimationFrame(function(){requestAnimationFrame(go_round)});
      })();
      setTimeout(go_round,4000);   /* red de seguridad */
    }

    /* ---- carga diferida: cada [data-asset] pide su archivo a ~1,2 pantallas (.ld); las
       internas (pantallas dentro de un fondo) cargan con su fondo; hero y avatares, ya ---- */
    var lazy=[].slice.call(main.querySelectorAll('[data-asset]:not([data-asset="hero"]):not(.avatar)'))
      .filter(function(el){return !el.parentElement.closest('[data-asset]')});
    function urls(el){
      var out=[];[el].concat([].slice.call(el.querySelectorAll('[data-asset]'))).forEach(function(n){
        var m=/url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(n).backgroundImage||'');if(m)out.push(m[1])});
      return out;
    }
    /* tiras con scroll horizontal (mobile, .hs): la pieza se puede recorrer entera y arranca desplazada
       como en Figma (su margin-left negativo pasa a scrollLeft) */
    [].forEach.call(main.querySelectorAll('.hs'),function(h){var m=h.firstElementChild,x=m?-parseFloat(getComputedStyle(m).marginLeft):0;
      if(x>0){h.classList.add('hs-on');h.scrollLeft=x}});
    /* vídeos con buffer acotado: src (preload metadata) a <=3 pantallas; play solo visibles (+25 %),
       pausa fuera; a más de 3 pantallas se suelta el src (libera descarga, decodificador y memoria) y
       se vuelve a pedir al acercarse (caché HTTP). El poster es el fondo del hueco: nunca queda vacío */
    function vplay(v){var p=v.play();if(p&&p.catch)p.catch(function(){})}
    function vattach(v){if(!v.getAttribute('src')){v.preload='metadata';v.src=v.__src}}
    function vdetach(v){if(v.getAttribute('src')){v.pause();v.removeAttribute('src');v.load()}}
    var vo=io_ok?new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting){vattach(v);vplay(v)}else v.pause()})},{rootMargin:'25% 0px'}):null;
    var vf=io_ok?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)vattach(e.target);else vdetach(e.target)})},{rootMargin:'300% 0px'}):null;
    function load(el){
      if(el.__ready)return el.__ready;
      el.classList.add('ld');[].forEach.call(el.querySelectorAll('[data-asset]'),function(n){n.classList.add('ld')});
      /* vídeos (<video data-src>): src al cargar su hueco; el poster es el fondo del [data-asset].
         muted/loop/playsinline van por JS: el runtime de la plantilla no conserva esos atributos */
      [].forEach.call(el.querySelectorAll('video[data-src]'),function(v){
        v.muted=true;v.loop=true;v.playsInline=true;v.setAttribute('playsinline','');
        v.__src=v.getAttribute('data-src');v.removeAttribute('data-src');
        if(vo){vf.observe(v);vo.observe(v)}else{vattach(v);vplay(v)}
      });
      el.__ready=Promise.all(urls(el).map(function(u){var i=new Image();i.src=u;
        return (i.decode?i.decode():new Promise(function(r){i.onload=i.onerror=r})).catch(function(){})}));
      return el.__ready;
    }
    if(io_ok){
      /* carrusel ([data-marquee]): sus cards fuera de la tira (recortadas en horizontal) nunca cruzan el
         observer; cargan junto con la primera de la tira que lo haga */
      var lo=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){
        var m=e.target.closest('[data-marquee]');
        (m?[].slice.call(m.querySelectorAll('[data-asset]')).filter(function(n){return lazy.indexOf(n)>-1}):[e.target]).forEach(function(n){load(n);lo.unobserve(n)});
      }})},{rootMargin:'300% 0px'});   /* 3 pantallas: con 1,5 un scroll rápido en el móvil llegaba antes que la descarga */
      lazy.forEach(function(el){lo.observe(el)});
      /* tras la carga, en tiempo libre y de una en una, se piden las que quedan: al llegar a ellas
         ya están en caché y decodificadas (los vídeos solo registran su hueco, su src sigue a 3 pantallas) */
      var ric=window.requestIdleCallback?function(f){requestIdleCallback(f,{timeout:3000})}:function(f){setTimeout(f,200)};
      var rest=function(){
        var next=lazy.filter(function(n){return !n.__ready})[0];
        if(!next)return;
        lo.unobserve(next);
        load(next).then(function(){ric(rest)});
      };
      var idle=function(){setTimeout(function(){ric(rest)},1500)};
      if(document.readyState==='complete')idle(); else addEventListener('load',idle,{once:true});
    } else lazy.forEach(load);

    /* ---- entrada de imágenes (menos Before / After y la del hero, que va por CSS) ---- */
    var imgs=[].slice.call(main.querySelectorAll('.media:not(.ba__img)')).filter(function(el){return !el.closest('.cs-hero')});
    function done(el){el.classList.add('ir-done')}
    if(!io_ok||reduce){imgs.forEach(done);return}
    imgs.forEach(function(el){el.addEventListener('animationend',function(e){if(e.target===el&&e.animationName==='ir-round')done(el)})});
    function start(el,d){
      var go=function(){if(go){go=null;el.style.setProperty('--ir-d',d+'s');el.classList.add('ir-in')}};
      load(el).then(function(){go&&go()}); setTimeout(function(){go&&go()},WAIT);
    }
    /* las que entran a la vez se escalonan arriba→abajo, izq→der (e.boundingClientRect:
       ya calculado por el observer, no fuerza layout) */
    var io=new IntersectionObserver(function(es){
      es.filter(function(e){return e.isIntersecting})
        .sort(function(a,b){var d=a.boundingClientRect.top-b.boundingClientRect.top;return Math.abs(d)>40?d:a.boundingClientRect.left-b.boundingClientRect.left})
        .forEach(function(e,i){io.unobserve(e.target);start(e.target,Math.min(i,4)*.15);
          /* carrusel: las cards aún fuera de la tira entran ya visibles (su entrada pasa fuera de vista) */
          var m=e.target.closest('[data-marquee]');
          if(m)[].forEach.call(m.querySelectorAll('.media'),function(n){if(imgs.indexOf(n)>-1&&!n.classList.contains('ir-in')){io.unobserve(n);start(n,0)}});
        });   /* escalonado con tope (.6 s): en grillas largas no se hace esperar */
    },{threshold:0,rootMargin:'0px 0px -8% 0px'});
    imgs.forEach(function(el){io.observe(el)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* salida al home (logo, Work/About/Services, menú mobile): igual que el home al abrir una entry,
   primero se funde .page al fondo (.28 s) y al terminar se navega. Así se ve desaparecer el
   contenido y después el home entra sobre su propio fondo. Clics con modificador, otra pestaña
   o un .btn[data-href] (los gestiona JS-BTN) siguen su camino normal. */
(function(){
  var leaving=0, h=document.documentElement;
  document.addEventListener('click',function(e){
    if(leaving||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a||a.target==='_blank'||a.hasAttribute('download')||a.matches('.btn[data-href]'))return;
    var u=new URL(a.href,location.href);
    if(u.origin!==location.origin||!/\/(index\.html)?$/.test(u.pathname))return;
    e.preventDefault(); leaving=1;
    h.classList.add('mc-leaving');
    setTimeout(function(){ location.href=u.href; },300);   /* = duración del fundido */
  });
  /* al volver con "atrás" (bfcache) la página no debe seguir fundida */
  addEventListener('pageshow',function(){ leaving=0; h.classList.remove('mc-leaving'); });
})();
