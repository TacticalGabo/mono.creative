/* Pantalla de carga del home (#boot0). La arranca MCIntro.start() desde el primer <script>
   del <body> de index.html y se retira sola con 'mc:arranca'.
   · Primera carga de la web en la pestaña, o recarga del home: intro de blobs. Fuente:
     entregables/lazyloading-intro/ (Lazyloading_INTRO_desktop / _mobile; mismo motor, solo
     cambia el tamaño del logo). Bucle hasta que la página está lista.
   · Llegada desde otra página del sitio (o intro ya vista): telón liso del fondo del home,
     que se desvanece en cuanto el home está listo.
   MCIntro.minDone(): true cuando ya se vio lo mínimo (intro: swapAt+0.7 s; telón: siempre).

   (2026-10-15) La intro corre FUERA del hilo principal: mientras se ve, el hilo principal
   está ocupado bajando React y montando la página, y una animación dibujada ahí iba a
   tirones al principio. Ahora:
     · las formas las dibuja un Worker en un <canvas> (OffscreenCanvas): no le afecta que
       el hilo principal esté bloqueado. Sin soporte, el mismo motor corre en el hilo
       principal (como antes);
     · el zoom y el cambio de fondo son animaciones CSS con su retardo (compositor), así
       que tampoco esperan al hilo principal. */
(function(){
  if(window.MCIntro)return;

  /* Motor de la intro. Autocontenido: se serializa tal cual para el Worker.
     Devuelve draw(ctx, segundos, k) — k = px de canvas por unidad del viewBox (716x296). */
  function engine(){
    var BLOBS=[
      {cx:116,cy:148,rx:116,ry:148,delay:0.10},
      {cx:302,cy:148,rx:116,ry:148,delay:0.17},
      {cx:595.5,cy:148,rx:120.5,ry:148,delay:0.0}
    ];
    var TARGET={cx:358,cy:148,rx:120.5,ry:148};
    var GRID={x0:-200,y0:-120,x1:920,y1:416,cell:4};
    var K_BLEND=62, FPS=24, DETAIL=9, CYCLE=1.9, SWAP_AT=1.2, SWAP_DUR=0.7, PAD_X=72, PAD_Y=30;
    var FG_A=[0x26,0x45,0x32], FG_B=[0xB8,0xFF,0x00];   /* #264532 → #B8FF00 */
    var CASES={1:[['l','b']],2:[['b','r']],3:[['l','r']],4:[['t','r']],
      5:[['l','t'],['b','r']],6:[['t','b']],7:[['l','t']],8:[['t','l']],
      9:[['t','b']],10:[['t','r'],['l','b']],11:[['t','r']],12:[['l','r']],
      13:[['b','r']],14:[['l','b']]};
    var NX=Math.round((GRID.x1-GRID.x0)/GRID.cell)+1, NY=Math.round((GRID.y1-GRID.y0)/GRID.cell)+1;
    var field=new Float32Array(NX*NY), lastFrame=-1;

    function clamp01(v){return v<0?0:v>1?1:v;}
    function toon(p){
      var c=1.4;
      if(p<0.5){var x=2*p;return (x*x*((c+1)*x-c))/2;}
      var y=2*p-1,a=0.85;
      return 0.5+0.5*(a*(1-Math.pow(1-y,5))+(1-a)*y);
    }
    /* ≈ cubic-bezier(.65,0,.35,1), la curva del cambio de color del original */
    function inOut(p){return p<0.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;}
    function buildField(ovals,k){
      var cell=GRID.cell;
      for(var j=0;j<NY;j++){
        var y=GRID.y0+j*cell,row=j*NX;
        for(var i=0;i<NX;i++){
          var x=GRID.x0+i*cell,s=-1e9;
          for(var o=0;o<ovals.length;o++){
            var v=ovals[o];
            var dx=(x-v.cx)/v.rx,dy=(y-v.cy)/v.ry;
            var si=(1-Math.sqrt(dx*dx+dy*dy))*(v.rx<v.ry?v.rx:v.ry);
            if(k<=0.01){if(si>s)s=si;}
            else{var m=si>s?si:s;var h=Math.max(k-Math.abs(si-s),0)/k;s=m+h*h*k*0.25;}
          }
          field[row+i]=s;
        }
      }
    }
    function contours(){
      var f=field,cell=GRID.cell,pts=new Map(),adj=new Map(),HK=NX*NY;
      function ptOn(key,ax,ay,bx,by,va,vb){
        if(!pts.has(key)){var t=va/(va-vb);pts.set(key,[ax+(bx-ax)*t,ay+(by-ay)*t]);}
        return key;
      }
      function link(a,b){
        if(!adj.has(a))adj.set(a,[]);
        if(!adj.has(b))adj.set(b,[]);
        adj.get(a).push(b);adj.get(b).push(a);
      }
      for(var j=0;j<NY-1;j++){
        for(var i=0;i<NX-1;i++){
          var v00=f[j*NX+i],v10=f[j*NX+i+1],v11=f[(j+1)*NX+i+1],v01=f[(j+1)*NX+i];
          var idx=(v00>0?8:0)|(v10>0?4:0)|(v11>0?2:0)|(v01>0?1:0);
          if(idx===0||idx===15)continue;
          var x0=GRID.x0+i*cell,y0=GRID.y0+j*cell,x1=x0+cell,y1=y0+cell;
          var cs=CASES[idx];
          for(var q=0;q<cs.length;q++){
            var ends=[];
            for(var e=0;e<2;e++){
              var c=cs[q][e],key;
              if(c==='t')key=ptOn(j*NX+i,x0,y0,x1,y0,v00,v10);
              else if(c==='b')key=ptOn((j+1)*NX+i,x0,y1,x1,y1,v01,v11);
              else if(c==='l')key=ptOn(HK+j*NX+i,x0,y0,x0,y1,v00,v01);
              else key=ptOn(HK+j*NX+i+1,x1,y0,x1,y1,v10,v11);
              ends.push(key);
            }
            link(ends[0],ends[1]);
          }
        }
      }
      var seen=new Set(),loops=[];
      adj.forEach(function(_,start){
        if(seen.has(start))return;
        var loop=[],cur=start,prev=null;
        while(cur!==undefined&&!seen.has(cur)){
          seen.add(cur);loop.push(pts.get(cur));
          var next,nb=adj.get(cur)||[];
          for(var n=0;n<nb.length;n++){if(nb[n]!==prev&&!seen.has(nb[n])){next=nb[n];break;}}
          prev=cur;cur=next;
        }
        if(loop.length>8)loops.push(loop);
      });
      return loops;
    }
    function resample(loop,spacing){
      var n=loop.length,seg=[],total=0,i;
      for(i=0;i<n;i++){var a=loop[i],b=loop[(i+1)%n];var len=Math.hypot(b[0]-a[0],b[1]-a[1]);seg.push(len);total+=len;}
      var m=Math.max(24,Math.min(220,Math.round(total/spacing)));
      var out=[],si=0,sacc=0;
      for(i=0;i<m;i++){
        var target=(i/m)*total;
        while(sacc+seg[si]<target&&si<n-1){sacc+=seg[si];si++;}
        var p=loop[si],q=loop[(si+1)%n];var t=seg[si]>0?(target-sacc)/seg[si]:0;
        out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);
      }
      return out;
    }
    /* Catmull-Rom → Bézier, directo al contexto (el original lo escribía como 'd' de un path) */
    function curve(ctx,p){
      var n=p.length;if(n<3)return;
      ctx.moveTo(p[0][0],p[0][1]);
      for(var i=0;i<n;i++){
        var p0=p[(i-1+n)%n],p1=p[i],p2=p[(i+1)%n],p3=p[(i+2)%n];
        ctx.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,
          p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,p2[0],p2[1]);
      }
      ctx.closePath();
    }
    return function draw(ctx,elapsed,k){
      var fr=Math.floor(elapsed*FPS);
      if(fr===lastFrame)return;
      lastFrame=fr;
      var bt=fr/FPS,cyc=(bt%CYCLE)/CYCLE;
      var t=cyc<0.5?cyc*2:2-cyc*2;
      var overshoot=0,ovals=[];
      for(var i=0;i<BLOBS.length;i++){
        var b=BLOBS[i];
        var q=clamp01((t-b.delay)/(1-b.delay)),e=toon(q);
        var vel=(toon(Math.min(1,q+0.02))-toon(Math.max(0,q-0.02)))/0.04;
        var sq=Math.min(0.07,Math.abs(vel)*0.025)*(1-Math.abs(e-0.5)*0.6);
        overshoot=Math.max(overshoot,e-1);
        ovals.push({
          cx:b.cx+(TARGET.cx-b.cx)*e,cy:b.cy,
          rx:Math.max(8,(b.rx+(TARGET.rx-b.rx)*e)*(1+sq)),
          ry:Math.max(8,(b.ry+(TARGET.ry-b.ry)*e)*(1-sq*0.4))
        });
      }
      buildField(ovals,K_BLEND*Math.pow(1-clamp01(t),2));
      var lp=contours(),s=overshoot*0.9;
      var c=inOut(clamp01((elapsed-SWAP_AT)/SWAP_DUR)),rgb=[];
      for(var j=0;j<3;j++)rgb.push(Math.round(FG_A[j]+(FG_B[j]-FG_A[j])*c));
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
      /* viewBox → canvas (con margen: la forma se sale del viewBox al estirarse), y el
         estirón del rebote alrededor del centro de la forma final, como el <g> del original */
      ctx.setTransform(k*(1+s),0,0,k*(1-s),k*(PAD_X+TARGET.cx*-s),k*(PAD_Y+TARGET.cy*s));
      ctx.beginPath();
      for(var l=0;l<lp.length;l++)curve(ctx,resample(lp[l],DETAIL));
      ctx.fillStyle='rgb('+rgb.join(',')+')';
      ctx.fill();
    };
  }

  var BG_LIGHT='#9BD700', BG_DARK='#101913', SWAP_AT=1.2, PAD_X=72, PAD_Y=30;
  // (2026-10-21) mismo grano fijo que el fondo de la página (.grain-overlay): anclado a la pantalla igual,
  // así al salir la pantalla de carga el grano coincide sin salto. Estático: no cuesta por frame.
  var GR_DARK=' url(./assets/shared/texture-grain-dark.png) 0 0/153.6px 153.6px repeat',
      GR_LIGHT=' url(./assets/shared/texture-grain-light.png) 0 0/115.2px 115.2px repeat';
  var leaving=false, minOk=false, t0=0, host, cv, worker=null, raf=0;

  // tapa también los clics: debajo la página aún no está lista (se liberan al salir)
  var BASE='position:fixed;inset:0;z-index:99999;';
  function intro(){
    var w=window.innerWidth>=768?126.438:100;           /* ancho del logo: desktop / mobile */
    var dpr=Math.min(window.devicePixelRatio||1,3), k=w/716*dpr;
    var st=document.createElement('style');
    st.textContent='@keyframes mci-bg{to{background-color:'+BG_DARK+'}}'+
      '@keyframes mci-zoom{from{transform:scale(1.1)}to{transform:scale(.4)}}';
    document.head.appendChild(st);
    /* (2026-10-16) Cambio de fondo y zoom anclados al mismo reloj que las formas (t0).
       Antes eran animaciones CSS: arrancaban cuando el navegador estilaba #boot0 por
       primera vez (tarde si el hilo principal seguía parseando/bajando scripts), y
       background-color se pinta en el hilo principal (se frenaba al montar React) ->
       el fondo cambiaba después que el color de las formas. Ahora: una capa oscura que
       sube de opacidad (compositor; mismo color resultante que interpolar el fondo) y
       Web Animations con startTime = t0. Sin element.animate: las CSS de antes. */
    var waapi=!!host.animate;
    host.style.cssText=BASE+'display:flex;align-items:center;justify-content:center;overflow:hidden;background-color:'+BG_LIGHT+
      ';'+(waapi?'':'animation:mci-bg 700ms cubic-bezier(.65,0,.35,1) '+SWAP_AT+'s forwards;')+'transition:opacity 600ms ease;';
    var dk;
    if(waapi){
      dk=document.createElement('div');
      dk.style.cssText='position:absolute;inset:0;background:'+BG_DARK+GR_DARK+';opacity:0;';
      host.appendChild(dk);
    }
    cv=document.createElement('canvas');
    cv.width=Math.round((716+2*PAD_X)*k); cv.height=Math.round((296+2*PAD_Y)*k);
    /* zoom: -10 %/s desde 1.1 hasta el tope .4 (7 s), lineal como el original */
    cv.style.cssText='position:relative;display:block;flex:none;width:'+(cv.width/dpr)+'px;height:'+(cv.height/dpr)+'px;'+
      (waapi?'':'animation:mci-zoom 7s linear forwards;')+'transition:opacity 700ms cubic-bezier(.4,0,.2,1);';
    host.appendChild(cv);
    t0=Date.now();
    if(waapi){
      var p0=performance.now();
      try{
        dk.animate([{opacity:0},{opacity:1}],
          {duration:700,delay:SWAP_AT*1000,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'}).startTime=p0;
        cv.animate([{transform:'scale(1.1)'},{transform:'scale(.4)'}],
          {duration:7000,easing:'linear',fill:'forwards'}).startTime=p0;
      }catch(_){}
    }
    var src='var draw=('+engine.toString()+')(),ctx,k,t0,on=1,'+
      'tick=self.requestAnimationFrame?function(f){self.requestAnimationFrame(f)}:function(f){setTimeout(f,16)};'+
      'onmessage=function(e){if(e.data==="stop"){on=0;close();return;}'+
      'ctx=e.data.canvas.getContext("2d");k=e.data.k;t0=e.data.t0;(function loop(){if(!on)return;draw(ctx,(Date.now()-t0)/1000,k);tick(loop);})();};';
    try{
      if(!cv.transferControlToOffscreen||!window.Worker)throw 0;
      var url=URL.createObjectURL(new Blob([src],{type:'text/javascript'}));
      worker=new Worker(url); URL.revokeObjectURL(url);
      var off=cv.transferControlToOffscreen();
      worker.postMessage({canvas:off,k:k,t0:t0},[off]);
    }catch(_){
      /* sin OffscreenCanvas / Worker: el mismo motor en el hilo principal */
      worker=null;
      var draw=engine(), ctx=cv.getContext('2d');
      (function loop(){ draw(ctx,(Date.now()-t0)/1000,k); raf=requestAnimationFrame(loop); })();
    }
  }

  // Telón: el fondo del home (--bg-d / --bg-l del CSS) mientras monta, como una entry
  // al llegar, que pinta su fondo y luego entra el contenido. La página anterior ya
  // fundió su contenido antes de navegar (mc-leaving), así que aquí no hay que fundir color.
  function cover(){
    var claro=document.documentElement.getAttribute('data-theme')==='light';
    host.style.cssText=BASE+'background:'+(claro?'#f8fbf9'+GR_LIGHT:'#101913'+GR_DARK)+';transition:opacity 450ms ease;';
    minOk=true;
  }

  function start(){
    if(host)return;
    host=document.createElement('div');
    host.id='boot0';host.setAttribute('aria-hidden','true');
    var seen=false;
    try{ var r=document.referrer&&new URL(document.referrer); seen=!!r&&r.origin===location.origin; }catch(_){}
    try{ if(sessionStorage.getItem('mc-intro')==='1')seen=true; sessionStorage.setItem('mc-intro','1'); }catch(_){}
    // recargar el home (F5 / botón de recarga) vuelve a mostrar la intro
    try{ var nav=performance.getEntriesByType('navigation')[0]; if(nav&&nav.type==='reload')seen=false; }catch(_){}
    if(seen)cover(); else intro();
    // se inserta YA con su estilo: insertada antes, la transición arrancaría desde transparente
    document.body.appendChild(host);
  }

  // Salida. Intro: primero el logo, luego el fondo. Telón: directo. Después se quita y se para.
  function leave(){
    if(leaving||!host)return;leaving=true;
    host.style.pointerEvents='none';
    var wait=cv?350:0;
    if(cv)cv.style.opacity='0';
    setTimeout(function(){host.style.opacity='0';},wait);
    setTimeout(function(){
      if(worker)worker.postMessage('stop');
      cancelAnimationFrame(raf);
      if(host.parentNode)host.parentNode.removeChild(host);
    },wait+650);
  }
  window.addEventListener('mc:arranca',leave);

  window.MCIntro={start:start,minDone:function(){
    return minOk||(t0>0&&Date.now()-t0>=(SWAP_AT+0.7)*1000);
  }};
})();
