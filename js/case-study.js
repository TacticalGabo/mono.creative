/* mono.creative — JS común de los case studies (casestudy_*.html). Se carga con defer.
   Cada init espera a la página montada por el runtime (fuera de <x-dc>). */

/* (2026-10-21) página ya montada por el runtime (sin <x-dc> y con su .page): si lo que busca un
   init no está entonces, no va a llegar (contact, privacy, 404) y se deja de sondear. */
function cs_montada(){return !document.querySelector('x-dc')&&!!document.querySelector('.page')}

/* case study: entrada por bloques y barras de acento de Before / After.
   (La clase .js la pone cada página en su <head>, síncrona, antes de pintar.) */
(function(){
  if(window.__csBase)return; window.__csBase=1;
  function init(){
    /* el runtime corre este script primero sobre la plantilla cruda (oculta dentro de
       <x-dc>) y luego la reemplaza por la página montada: esperar a la montada */
    var blocks=[].filter.call(document.querySelectorAll('.fx'),function(el){return !el.closest('x-dc')});
    if(!blocks.length)return setTimeout(init,40);
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* bloques */
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){if(!document.documentElement.classList.contains('logo-ok'))e.target.classList.add('fx-w');e.target.classList.add('is-in');io.unobserve(e.target)}})},{threshold:0,rootMargin:'0px 0px -10% 0px'});   /* por el borde, no por % del bloque: en secciones altas el 10 % eran cientos de px en blanco */
      blocks.forEach(function(b){io.observe(b)});
    } else blocks.forEach(function(b){b.classList.add('is-in')});
    /* .fx-w: bloque visible antes de logo-ok = entra con el header (case-study.css: mismo .1s de retardo que .nav) */
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
  init.n=0;
  function init(){
    var sec=document.querySelector('.cs-constraints');
    if(!sec||sec.closest('x-dc')||!sec.querySelector('.curve--v path')){if(!sec&&cs_montada())return;if(++init.n<250)setTimeout(init,120);return}   /* tope 30 s (2026-10-19): sin .cs-constraints (contact, privacy) sondeaba para siempre */
    /* (2026-10-16) lo de abajo (700 muestras de la curva + medidas de layout forzadas) se hace al
       acercarse la sección (1,5 pantallas), no al montar la página: en el móvil tomaba el hilo
       justo cuando salían el header y el hero */
    if(!init.go&&'IntersectionObserver' in window){
      var wo=new IntersectionObserver(function(es){if(es[0].isIntersecting){wo.disconnect();init.go=1;init()}},{rootMargin:'150% 0px'});
      return wo.observe(sec);
    }
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
    if(!main){if(!cs_montada()&&++tries<750)setTimeout(init,40);return}   /* sondeo cada 40 ms (el hero y los bloques salen en cuanto la página está montada); tope 30 s: contact.html carga este JS y no tiene main[data-case] */
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
      if(!h.classList.contains('hero-ok')||!h.classList.contains('logo-ok'))return setTimeout(go_round,50);   /* logo-ok: el hero entra con el header (case-study.css) */
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

    /* ---- carga diferida: cada [data-asset] pide su archivo a ~3 pantallas (.ld); el resto, en tiempo libre tras la carga; las
       internas (pantallas dentro de un fondo) cargan con su fondo; hero y avatares, ya ---- */
    var lazy=[].slice.call(main.querySelectorAll('[data-asset]:not([data-asset="hero"]):not(.avatar)'))
      .filter(function(el){return !el.parentElement.closest('[data-asset]')});
    function urls(el){
      var out=[];[el].concat([].slice.call(el.querySelectorAll('[data-asset]'))).forEach(function(n){
        var m=/url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(n).backgroundImage||'');if(m)out.push(m[1])});
      return out;
    }
    /* barra de scroll de esas tiras (.hs-sb, CSS en case-study.css): se mide al iniciar y en resize con cambio de
       ancho (no con la barra del navegador); ancho del thumb = vista/pieza. Con scroll-timeline la posición va por
       CSS; sin él, por frame mientras se arrastra la tira: lee solo scrollLeft y escribe --hs-x */
    var hss=[].slice.call(main.querySelectorAll('.hs')), hsTl=!!(window.CSS&&CSS.supports&&CSS.supports('animation-timeline','scroll()')), hsW=0;
    function hsPos(h){if(h.__sbm)h.style.setProperty('--hs-x',(Math.min(1,Math.max(0,h.scrollLeft/h.__sbm))*(h.__sbc-h.__sbw)).toFixed(1)+'px')}
    function hsMeasure(){
      if(window.innerWidth===hsW)return; hsW=window.innerWidth;
      hss.forEach(function(h){var c=h.clientWidth,s=h.scrollWidth,on=c>0&&s>c+1;
        if(on){h.__sbc=c;h.__sbm=s-c;h.__sbw=Math.max(24,Math.round(c*c/s));h.style.setProperty('--hs-w',h.__sbw+'px');if(!hsTl)hsPos(h)}
        else h.__sbm=0;
        h.classList.toggle('hs-sb',on)});
    }
    if(hss.length){
      hsMeasure(); addEventListener('resize',hsMeasure);
      if(!hsTl)hss.forEach(function(h){var q=0;h.addEventListener('scroll',function(){if(!q){q=1;requestAnimationFrame(function(){q=0;hsPos(h)})}},{passive:true})});
    }
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
  /* (2026-10-16) vuelta al home sin esperar a la red, igual que el home con las entries (solo
     descarga, NO prerender: arrancar el home entero en segundo plano le roba CPU a esta página).
     1) Al apoyar el dedo / pasar el ratón por un enlace al home: prefetch de su HTML; corre
        durante el fundido de salida (.28 s).
     2) Con la página cargada y el hilo libre: su HTML y lo que el home pide para quitar su
        telón (componente del icono del hero, intro-loader y la fuente del hero). React,
        support.js y los logos ya están en caché desde esta página. */
  var home=new URL('./index.html',document.baseURI).href, warmed=0;   /* baseURI: en 404.html hay <base> (se sirve en cualquier URL) */
  function warm(e){
    if(warmed)return;
    var a=e.target.closest&&e.target.closest('a[href]'); if(!a)return;
    var u=new URL(a.href,location.href); if(u.origin!==location.origin||!/\/(index\.html)?$/.test(u.pathname))return;
    warmed=1;
    var sp=window.HTMLScriptElement&&HTMLScriptElement.supports&&HTMLScriptElement.supports('speculationrules');
    var el=document.createElement(sp?'script':'link');
    if(sp){el.type='speculationrules';el.textContent=JSON.stringify({prefetch:[{source:'list',urls:[home]}]})}
    else{el.rel='prefetch';el.href=home}
    document.head.appendChild(el);
  }
  document.addEventListener('pointerdown',warm,{passive:true});
  document.addEventListener('touchstart',warm,{passive:true});
  document.addEventListener('mouseover',warm,{passive:true});
  function pre(u,font){var l=document.createElement('link');l.rel='prefetch';l.href=u;if(font){l.as='font';l.crossOrigin='anonymous'}document.head.appendChild(l)}
  function idle_warm(){
    var ric=window.requestIdleCallback?function(f){requestIdleCallback(f,{timeout:5000})}:function(f){setTimeout(f,300)};
    ric(function(){
      pre(home);
      pre('./components/hero-icon-sequence.dc.html');
      pre('./js/intro-loader.js?v=9');
      pre('./fonts/google/plusjakartasans-v12-LDIoaomQNQcsA88c7O9yZ4KMCoOg4Ko20yygg_vb.woff2',1);
    });
  }
  if(document.readyState==='complete')setTimeout(idle_warm,3000); else addEventListener('load',function(){setTimeout(idle_warm,3000)},{once:true});
})();

/* (2026-10-19) MANCHAS PRE-DESENFOCADAS, igual que el home (script __mcGlowPx de index.html, mismo
   código): las .glow del CTA llevan filter:blur(84-100px) en vivo y la GPU las vuelve a desenfocar en
   cada frame que se pintan. Se hornea UNA vez el mismo desenfoque en un canvas (mismo blur gaussiano
   de Skia, misma forma y radios) y la imagen va DENTRO de la .glow: hereda su opacidad (--g*), su
   animación blot y su capa. El cambio se hace con la imagen ya decodificada. Sin soporte de
   ctx.filter/roundRect no se toca nada (sigue el blur CSS). CSS: .glow.pre en case-study.css. */
(function(){
  if(window.__mcGlowPx)return; window.__mcGlowPx=1;
  function soporta(){
    try{
      var c=document.createElement('canvas'); c.width=c.height=32;
      var x=c.getContext('2d'); if(!x||!('filter' in x)||!x.roundRect)return false;
      x.filter='blur(4px)'; x.fillStyle='#000'; x.fillRect(12,12,8,8);
      return x.getImageData(5,16,1,1).data[3]>0;   // fuera del cuadrado solo hay alfa si el blur se aplicó
    }catch(e){return false}
  }
  // radio calculado ("54% 56%" o "12px") -> {x,y} en px de la caja dada
  function radio(v,w,h){
    var p=String(v).split(' '); if(p.length<2)p[1]=p[0];
    function px(t,base){ return t.indexOf('%')>0 ? parseFloat(t)*base/100 : (parseFloat(t)||0); }
    return {x:px(p[0],w),y:px(p[1],h)};
  }
  function horno(el){
    if(el.querySelector('img.glow-px')||el.__horno)return;
    el.__horno=1;
    var w=parseFloat(el.style.width), h=parseFloat(el.style.height);
    var m=/blur\(\s*([\d.]+)px/.exec(el.style.filter||'');
    if(!(w>0)||!(h>0)||!m)return;
    var s=parseFloat(m[1]), pad=Math.ceil(s*3), tw=w+pad*2, th=h+pad*2;
    var k=Math.min(.5,320/Math.max(tw,th)), kw=w*k, kh=h*k;
    var cs=getComputedStyle(el), c=document.createElement('canvas');
    c.width=Math.ceil(tw*k); c.height=Math.ceil(th*k);
    var x=c.getContext('2d');
    x.filter='blur('+(s*k)+'px)';
    x.fillStyle=cs.backgroundColor;
    x.beginPath();
    x.roundRect(pad*k,pad*k,kw,kh,[radio(cs.borderTopLeftRadius,kw,kh),radio(cs.borderTopRightRadius,kw,kh),radio(cs.borderBottomRightRadius,kw,kh),radio(cs.borderBottomLeftRadius,kw,kh)]);
    x.fill();
    c.toBlob(function(b){
      if(!b)return;
      var img=new Image();
      img.className='glow-px'; img.alt=''; img.setAttribute('aria-hidden','true');
      img.style.cssText='left:'+(-pad)+'px;top:'+(-pad)+'px;width:'+(c.width/k)+'px;height:'+(c.height/k)+'px';
      img.src=URL.createObjectURL(b);
      (img.decode?img.decode():Promise.resolve()).then(function(){ el.appendChild(img); el.classList.add('pre'); },function(){});
    },'image/png');
  }
  var ok=null;
  function corre(){
    if(ok===null)ok=soporta();
    if(!ok)return;
    // solo las montadas (no la plantilla cruda dentro de <x-dc>) y del ancho visible (.g-d / .g-m)
    var cola=[].filter.call(document.querySelectorAll('.glow'),function(g){ return !g.closest('x-dc')&&getComputedStyle(g).display!=='none'; });
    var ric=window.requestIdleCallback?function(f){ return requestIdleCallback(f,{timeout:120}); }:function(f){ return setTimeout(f,40); };
    (function paso(){ var g=cola.shift(); if(!g)return; try{ horno(g); }catch(e){} ric(paso); })();
  }
  // (2026-10-19) .cta.idle fuera de pantalla: pausa el blot de sus manchas, como el home (__mcGlowIO,
  // mismo margen de 120px). Antes nadie ponía .idle en los case studies y la animación no paraba nunca.
  function pausa(cta){
    if(!('IntersectionObserver' in window))return;
    new IntersectionObserver(function(es){
      for(var i=0;es.length>i;i++)es[i].target.classList.toggle('idle',!es[i].isIntersecting);
    },{rootMargin:'120px'}).observe(cta);
  }
  (function montada(n){
    if(!n&&!document.querySelector('.cta, .glow'))return;   // solo en la 1.ª pasada (la plantilla aún está en el DOM): página sin CTA (contact.html carga este JS): nada que hacer
    var cta=[].filter.call(document.querySelectorAll('.page .cta'),function(c){ return !c.closest('x-dc'); })[0];
    if(cta){ pausa(cta); return corre(); }
    /* (2026-10-19) página sin CTA pero con manchas (404): hornearlas en cuanto están montadas */
    if(!document.querySelector('.cta')&&[].some.call(document.querySelectorAll('.page .glow'),function(g){ return !g.closest('x-dc'); }))return corre();
    if(n<300)setTimeout(function(){ montada(n+1); },100);
  })(0);
  // las manchas del otro ancho se hornean si ese ancho llega a verse
  if(window.matchMedia){
    var mq=matchMedia('(min-width:768px)');
    if(mq.addEventListener)mq.addEventListener('change',corre); else if(mq.addListener)mq.addListener(corre);
  }
})();

/* (2026-10-20) MANCHAS EN CANVAS (desktop), en TODAS las secciones con manchas. Causa del parpadeo en Chrome
   (aislada en TEST 2026-10-19): la animación CONTINUA blot de las manchas (transform animado); quietas no fallaba.
   Probado primero solo en el hero del home (__mcHeroCv, TEST 8bb771f); ahora general: cada grupo de manchas
   .g-d seguidas se pinta en UN canvas quieto (.glow-cv-c) en su mismo lugar del orden de pintado, que solo
   cambia de contenido. Mismo bitmap desenfocado (horneado de __mcGlowPx), misma caja, rotación, opacidad
   (--g*, --fade-p, tema), mismo blot (keyframes, ease-in-out, duración, retardo, reverse), mismo fundido
   fx-glow (ease) y mismo reloj (currentTime de las animaciones CSS al cambiar). Se pausa leyendo el
   animation-play-state del CSS (.idle, .espera, espera del logo...), así que para igual que antes.
   Originales ocultos y sin animación (html.glow-cv + .cv-on). Móvil (.g-m, quietas desde 2026-10-21) y reduced-motion siguen con el
   CSS de siempre. Sin canvas filter/roundRect no se toca nada.
   CSS: .glow-cv-c / .cv-on en case-study.css. Mismo código que el script __mcGlowCv de index.html. */
(function(){
  if(window.__mcGlowCv)return; window.__mcGlowCv=1;
  var Q=.25, SMAX=1.14;   // resolución 1/4 (las manchas ya son bitmaps de baja resolución muy desenfocados); SMAX = mayor scale de blot
  var KF=[[0,0,0,1],[.23,4,-7,1.14],[.47,-5,5,.92],[.72,6,3,1.09],[1,0,0,1]];   // = @keyframes blot (translate % de la caja, scale)
  function bez(x1,y1,x2,y2){
    return function(x){
      if(x<=0)return 0; if(x>=1)return 1;
      var t=x;
      for(var i=0;i<10;i++){
        var u=1-t, fx=3*x1*t*u*u+3*x2*t*t*u+t*t*t-x, d=3*x1*u*u+6*(x2-x1)*t*u+3*(1-x2)*t*t;
        if(Math.abs(fx)<1e-7||Math.abs(d)<1e-7)break;
        t=Math.min(1,Math.max(0,t-fx/d));
      }
      var v=1-t; return 3*y1*t*v*v+3*y2*t*t*v+t*t*t;
    };
  }
  var EIO=bez(.42,0,.58,1), EASE=bez(.25,.1,.25,1);
  function blot(p){
    for(var i=0;i<KF.length-1;i++){
      var a=KF[i], b=KF[i+1];
      if(p<=b[0]){ var e=EIO((p-a[0])/(b[0]-a[0])); return [a[1]+(b[1]-a[1])*e,a[2]+(b[2]-a[2])*e,a[3]+(b[3]-a[3])*e]; }
    }
    return [0,0,1];
  }
  function soporta(){
    try{
      var c=document.createElement('canvas'); c.width=c.height=32;
      var x=c.getContext('2d'); if(!x||!('filter' in x)||!x.roundRect)return false;
      x.filter='blur(4px)'; x.fillStyle='#000'; x.fillRect(12,12,8,8);
      return x.getImageData(5,16,1,1).data[3]>0;
    }catch(e){return false}
  }
  function radio(v,w,h){
    var p=String(v).split(' '); if(p.length<2)p[1]=p[0];
    function px(t,base){ return t.indexOf('%')>0 ? parseFloat(t)*base/100 : (parseFloat(t)||0); }
    return {x:px(p[0],w),y:px(p[1],h)};
  }
  // mismo horneado que __mcGlowPx: el desenfoque CSS de la mancha, una vez, en un bitmap
  function hornea(el){
    var w=parseFloat(el.style.width), h=parseFloat(el.style.height);
    var m=/blur\(\s*([\d.]+)px/.exec(el.style.filter||'');
    if(!(w>0)||!(h>0)||!m)return null;
    var s=parseFloat(m[1]), pad=Math.ceil(s*3), tw=w+pad*2, th=h+pad*2;
    var k=Math.min(.5,320/Math.max(tw,th)), kw=w*k, kh=h*k;
    var cs=getComputedStyle(el), c=document.createElement('canvas');
    c.width=Math.ceil(tw*k); c.height=Math.ceil(th*k);
    var x=c.getContext('2d');
    x.filter='blur('+(s*k)+'px)';
    // si __mcGlowPx ya la horneó (.pre = background:none) se usa el verde de .glow (--glow en los case studies)
    var bg=cs.backgroundColor;
    if(!bg||bg==='rgba(0, 0, 0, 0)')bg=cs.getPropertyValue('--glow').trim()||'#9de14a';
    x.fillStyle=bg;
    x.beginPath();
    x.roundRect(pad*k,pad*k,kw,kh,[radio(cs.borderTopLeftRadius,kw,kh),radio(cs.borderTopRightRadius,kw,kh),radio(cs.borderBottomRightRadius,kw,kh),radio(cs.borderBottomLeftRadius,kw,kh)]);
    x.fill();
    return {img:c,x:-pad,y:-pad,w:c.width/k,h:c.height/k};
  }
  function anim(el,n){ var a=el.getAnimations(); for(var i=0;i<a.length;i++)if(a[i].animationName===n)return a[i]; return null; }
  var GR=[], on=false, raf=0, poll=0, last=0, next=0, leerHasta=0, mo=null, mq, rm;
  // (2026-10-21) 30 fps: a 60 Hz la mancha avanza <0,1 px por frame, a 30 fps no se nota y se pinta la mitad
  // (un cuarto a 120 Hz). La cadencia se reparte sola en 75/90/144 Hz (next += INT, sin deriva).
  var INT=1000/30;
  // caja de cada mancha (offsetLeft/Top, matriz de transform) y la del canvas que las cubre a todas en cualquier fase de blot
  function geo(gr){
    var x0=1/0, y0=1/0, x1=-1/0, y1=-1/0;
    gr.G.forEach(function(g){
      var el=g.el, w=el.offsetWidth, h=el.offsetHeight;
      g.w=w; g.h=h; g.ox=el.offsetLeft+w/2; g.oy=el.offsetTop+h/2;
      var t=getComputedStyle(el).transform, mm=/matrix\(([^)]+)\)/.exec(t);
      g.M=mm?mm[1].split(',').map(parseFloat):[1,0,0,1,0,0];
      var sp=g.sp, M=g.M, k=g.bl?SMAX:1, dx=g.bl?.06*w:0, dy=g.bl?.07*h:0;
      [[sp.x,sp.y],[sp.x+sp.w,sp.y],[sp.x,sp.y+sp.h],[sp.x+sp.w,sp.y+sp.h]].forEach(function(p){
        var px=p[0]-w/2, py=p[1]-h/2, X=g.ox+k*(M[0]*px+M[2]*py), Y=g.oy+k*(M[1]*px+M[3]*py);
        x0=Math.min(x0,X-dx); x1=Math.max(x1,X+dx); y0=Math.min(y0,Y-dy); y1=Math.max(y1,Y+dy);
      });
    });
    if(!(x1>x0)||!(y1>y0))return;
    var L=Math.floor(x0)-2, T=Math.floor(y0)-2, W=Math.ceil(x1)+2-L, H=Math.ceil(y1)+2-T, cv=gr.cv;
    cv.style.left=L+'px'; cv.style.top=T+'px'; cv.style.width=W+'px'; cv.style.height=H+'px';
    var cw=Math.max(1,Math.ceil(W*Q)), ch=Math.max(1,Math.ceil(H*Q));
    if(cv.width!==cw)cv.width=cw; if(cv.height!==ch)cv.height=ch;
    gr.L=L; gr.T=T; gr.qx=cw/W; gr.qy=ch/H;
  }
  function pinta(gr){
    var ctx=gr.ctx, qx=gr.qx, qy=gr.qy; if(!qx)return;
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,gr.cv.width,gr.cv.height);
    gr.G.forEach(function(g){
      var sp=g.sp;
      if(g.lazy){ if(!(g.lazy.complete&&g.lazy.naturalWidth))return; }
      var t=g.t, f=1;
      if(g.fx){ var u=(t-g.fx.delay)/g.fx.dur; f=u<=0?0:(u>=1?1:EASE(u)); }
      var a=g.op*f; if(!(a>0))return;
      var tx=0, ty=0, s=1;
      if(g.bl&&t>=g.bl.delay){
        var p=((t-g.bl.delay)%g.bl.dur)/g.bl.dur; if(g.bl.rev)p=1-p;
        var v=blot(p); tx=v[0]/100*g.w; ty=v[1]/100*g.h; s=v[2];
      }
      var M=g.M, cx=g.w/2, cy=g.h/2;
      ctx.setTransform(qx*s*M[0],qy*s*M[1],qx*s*M[2],qy*s*M[3],
        qx*(g.ox-gr.L+tx-s*(M[0]*cx+M[2]*cy)), qy*(g.oy-gr.T+ty-s*(M[1]*cx+M[3]*cy)));
      ctx.globalAlpha=a;
      ctx.drawImage(sp.img,sp.x,sp.y,sp.w,sp.h);
    });
    ctx.globalAlpha=1;
  }
  // estado de cada mancha leído del CSS (animation-play-state sigue en cascada aunque el nombre sea none):
  // así se pausa exactamente cuando pausaba su animación (.idle, .espera, espera del logo...). Opacidad = --g*, --fade-p, tema.
  // (2026-10-21) Solo se lee (leer=true) tras un cambio de clase/estilo/tema en <html> o en los padres de las
  // manchas (mira()) y durante el cruce de --fade-p (.45 s); el resto del tiempo se usa lo último leído.
  function lee(dt,leer){
    var vivo=false;
    GR.forEach(function(gr){
      var sucio=gr.sucio; gr.sucio=false;
      gr.G.forEach(function(g){
        if(leer){
          var cs=getComputedStyle(g.el), op=parseFloat(cs.opacity)||0;
          g.vivo=cs.animationPlayState.indexOf('paused')<0;
          if(op!==g.op){ g.op=op; sucio=true; }
        }
        if(g.vivo){ vivo=true; if(dt){ g.t+=dt; sucio=true; } }
      });
      if(sucio)pinta(gr);
    });
    return vivo;
  }
  function mira(){ leerHasta=performance.now()+700; }   // 700 = cruce de tema .45 s + margen
  function frame(now){
    raf=0; if(!on)return;
    if(next&&now<next-1){ raf=requestAnimationFrame(frame); return; }
    next=(next&&now-next<INT)?next+INT:now+INT;
    var dt=last?Math.min(now-last,100):0; last=now;
    if(!lee(dt,now<leerHasta)||document.hidden){ last=0; next=0; if(!poll)poll=setTimeout(function(){ poll=0; if(on&&!raf)raf=requestAnimationFrame(frame); },150); return; }
    raf=requestAnimationFrame(frame);
  }
  function arranca(){
    if(on||!GR.length||!mq.matches||rm.matches)return;
    // reloj = el de las animaciones CSS en este instante (siguen exactamente donde iban)
    GR.forEach(function(gr){
      gr.G.forEach(function(g){
        var b=anim(g.el,'blot'), f=anim(g.el,'fx-glow');
        if(b){ var tb=b.effect.getTiming(); g.bl={delay:tb.delay,dur:tb.duration,rev:/reverse/.test(tb.direction)}; g.t=b.currentTime||0; }
        else { g.bl=null; g.t=f?(f.currentTime||0):0; }
        if(f){ var tf=f.effect.getTiming(); g.fx={delay:tf.delay,dur:tf.duration}; } else g.fx=null;
        g.op=-1;
      });
      geo(gr); gr.sucio=true;
    });
    if(!mo){
      mo=new MutationObserver(mira);
      var vistos=[];
      GR.forEach(function(gr){
        for(var n=gr.par;n&&n.nodeType===1;n=n.parentElement){
          if(vistos.indexOf(n)>=0)break; vistos.push(n);
          mo.observe(n,{attributes:true,attributeFilter:['class','style','data-theme']});
        }
      });
    }
    mira(); lee(0,true);
    document.documentElement.classList.add('glow-cv');
    on=true; last=0; next=0; raf=requestAnimationFrame(frame);
  }
  function para(){
    if(!on)return; on=false; if(raf)cancelAnimationFrame(raf); raf=0;
    document.documentElement.classList.remove('glow-cv');
  }
  function suelta(el){ return !el.closest('x-dc'); }
  function init(n){
    // página montada por el runtime (sin <x-dc>), como los demás init
    if(!document.querySelector('.glow'))return;   // página sin manchas (contact): nada que hacer
    if(document.querySelector('x-dc'))return n<250&&setTimeout(function(){ init(n+1); },120);
    if(!soporta())return;
    mq=matchMedia('(min-width:768px)'); rm=matchMedia('(prefers-reduced-motion:reduce)');
    function cambio(){ if(mq.matches&&!rm.matches){ monta(); arranca(); } else para(); }
    if(mq.addEventListener){ mq.addEventListener('change',cambio); rm.addEventListener('change',cambio); }
    cambio();
  }
  // se monta solo cuando hace falta (desktop sin reduced-motion): en móvil no se hornea ni se crea nada
  var hecho=false;
  function monta(){
    if(hecho)return; hecho=true;
    var cur=null;
    [].filter.call(document.querySelectorAll('.glow.g-d'),suelta).forEach(function(el){
      var g={el:el,t:0,op:-1};
      if(el.classList.contains('gl')){
        var im=el.querySelector('img'); if(!im)return;
        g.lazy=im; g.sp={img:im,x:0,y:0,get w(){return g.w},get h(){return g.h}};
      } else {
        g.sp=hornea(el); if(!g.sp)return;
      }
      // grupo = manchas seguidas del mismo padre (solo .glow entre ellas): un canvas en su lugar del orden de pintado
      var sigue=!!cur&&el.parentElement===cur.par, s=el.previousElementSibling;
      while(sigue&&s!==cur.fin){ if(!s||!s.classList.contains('glow'))sigue=false; else s=s.previousElementSibling; }
      if(!sigue){ cur={par:el.parentElement,G:[],ini:el}; GR.push(cur); }
      cur.fin=el; cur.G.push(g);
      el.classList.add('cv-on');
      if(g.lazy){ var gr=cur; g.lazy.addEventListener('load',function(){ gr.sucio=true; }); }
    });
    GR.forEach(function(gr){
      var cv=document.createElement('canvas'); cv.className='glow-cv-c'; cv.setAttribute('aria-hidden','true');
      gr.par.insertBefore(cv,gr.ini);
      gr.cv=cv; gr.ctx=cv.getContext('2d'); gr.ctx.imageSmoothingEnabled=true; gr.ctx.imageSmoothingQuality='high';
      new ResizeObserver(function(){ if(on){ geo(gr); gr.sucio=true; } }).observe(gr.par);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){ init(0); });else init(0);
})();

(function(){
  // ovalo del correo (seccion .cta): se dibuja al entrar en pantalla, una sola vez
  if(window.__mcOval)return; window.__mcOval=1;
  if(!('IntersectionObserver' in window)||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
  document.documentElement.classList.add('ov-arm');
  var tries=0;
  function init(){
    var o=[].filter.call(document.querySelectorAll('.oval'),function(e){ return !e.closest('x-dc'); })[0];
    // el footer puede montarse después (plantilla x-dc); sin óvalo tras ~6s (contact, 404...) se deja de buscar
    if(!o)return ++tries<50&&setTimeout(init,120);
    // (2026-10-21) .98 y no 1: en el móvil el óvalo es lo último de .cta (overflow:hidden) y su
    // alto (86.185px) asoma ~0,03px por debajo de la sección al redondear el layout. Recortado
    // así su ratio se queda en 0.9996, nunca llegaba a 1 y el óvalo no aparecía nunca.
    var io=new IntersectionObserver(function(es){
      for(var i=0;es.length>i;i++)if(es[i].isIntersecting&&es[i].intersectionRatio>=.98){es[i].target.classList.add('ov-in');io.unobserve(es[i].target);}
    },{threshold:.98,rootMargin:'0px 0px -8% 0px'});
    io.observe(o);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
