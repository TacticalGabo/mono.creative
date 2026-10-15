/* Intro de carga (reemplaza la barra de progreso). Fuente: entregables/lazyloading-intro/
   (Lazyloading_INTRO_desktop / _mobile). Mismo motor para los dos; solo cambia el tamaño
   del logo. Bucle de blobs que se fusionan hasta que la página avisa con 'mc:arranca'.
   API: window.MCIntro.minDone() -> true cuando ya se vio la secuencia base (swapAt+0.7 s). */
(function(){
  if(window.MCIntro)return;
  var BLOBS=[
    {cx:116,cy:148,rx:116,ry:148,delay:0.10},
    {cx:302,cy:148,rx:116,ry:148,delay:0.17},
    {cx:595.5,cy:148,rx:120.5,ry:148,delay:0.0}
  ];
  var TARGET={cx:358,cy:148,rx:120.5,ry:148};
  var GRID={x0:-200,y0:-120,x1:920,y1:416,cell:4};
  var K_BLEND=62, FPS=24, DETAIL=9, CYCLE=1.9, SWAP_AT=1.2, ZOOM=0.10;
  var CASES={1:[['l','b']],2:[['b','r']],3:[['l','r']],4:[['t','r']],
    5:[['l','t'],['b','r']],6:[['t','b']],7:[['l','t']],8:[['t','l']],
    9:[['t','b']],10:[['t','r'],['l','b']],11:[['t','r']],12:[['l','r']],
    13:[['b','r']],14:[['l','b']]};
  var NX=Math.round((GRID.x1-GRID.x0)/GRID.cell)+1, NY=Math.round((GRID.y1-GRID.y0)/GRID.cell)+1;
  var field=new Float32Array(NX*NY);
  var BG_LIGHT='#B8FF00', BG_DARK='#152B1D', FG_LIGHT='#264532', FG_DARK='#B8FF00';

  function clamp01(v){return v<0?0:v>1?1:v;}
  function toon(p){
    var c=1.4;
    if(p<0.5){var x=2*p;return (x*x*((c+1)*x-c))/2;}
    var y=2*p-1,a=0.85;
    return 0.5+0.5*(a*(1-Math.pow(1-y,5))+(1-a)*y);
  }
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
  function curvePath(p){
    var n=p.length;if(n<3)return '';
    var d='M'+p[0][0].toFixed(1)+' '+p[0][1].toFixed(1);
    for(var i=0;i<n;i++){
      var p0=p[(i-1+n)%n],p1=p[i],p2=p[(i+1)%n],p3=p[(i+2)%n];
      d+='C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+
        ' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+
        ' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1);
    }
    return d+'Z';
  }

  var raf=0,t0=null,lastFrame=-1,dark=false,leaving=false,stopped=false,swapped=0,minOk=false;
  var host,svg,group,blob;

  function frame(now){
    if(stopped)return;
    raf=requestAnimationFrame(frame);
    if(t0===null)t0=now;
    var elapsed=(now-t0)/1000;
    svg.style.transform='scale('+Math.max(0.4,1.1-ZOOM*elapsed).toFixed(4)+')';
    if(!dark&&elapsed>=SWAP_AT){
      dark=true;
      host.style.backgroundColor=BG_DARK;svg.style.color=FG_DARK;
    }
    if(elapsed>=SWAP_AT+0.7)minOk=true;
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
    var d='',lp=contours();
    for(var l=0;l<lp.length;l++)d+=curvePath(resample(lp[l],DETAIL));
    if(d)blob.setAttribute('d',d);
    var s=overshoot*0.9;
    group.setAttribute('transform','translate('+TARGET.cx+' '+TARGET.cy+') scale('+(1+s).toFixed(4)+' '+(1-s).toFixed(4)+') translate('+(-TARGET.cx)+' '+(-TARGET.cy)+')');
  }

  function mount(el){
    host=el;
    var w=window.innerWidth>=768?126.438:100, h=w*296/716;
    host.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;overflow:hidden;background-color:'+BG_LIGHT+';transition:background-color 700ms cubic-bezier(.65,0,.35,1),opacity 600ms ease;';
    host.innerHTML='<svg width="'+w+'" height="'+h.toFixed(3)+'" viewBox="0 0 716 296" shape-rendering="geometricPrecision" style="display:block;overflow:visible;transform-origin:50% 50%;color:'+FG_LIGHT+';transition:color 700ms cubic-bezier(.65,0,.35,1),opacity 700ms cubic-bezier(.4,0,.2,1);"><g><path d="" fill="currentColor"></path></g></svg>';
    svg=host.firstChild;group=svg.firstChild;blob=group.firstChild;
    raf=requestAnimationFrame(frame);
  }

  // Sale: el logo se desvanece, luego el fondo; después se quita y se para el bucle.
  function leave(){
    if(leaving||!host)return;leaving=true;
    svg.style.opacity='0';
    setTimeout(function(){host.style.opacity='0';host.style.pointerEvents='none';},350);
    setTimeout(function(){
      stopped=true;cancelAnimationFrame(raf);
      if(host.parentNode)host.parentNode.removeChild(host);
    },1100);
  }
  window.addEventListener('mc:arranca',leave);

  window.MCIntro={mount:mount,leave:leave,minDone:function(){return minOk;}};
})();
