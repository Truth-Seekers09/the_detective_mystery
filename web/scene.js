'use strict';
// Procedural, layered 2.5D campus scenes. Everything is drawn with canvas paths and gradients,
// so the game looks good with no image files. Real campus photos (assets/backgrounds/N.jpg)
// are picked up automatically and used as the backdrop instead.
const Scene = (function(){
  const W = 2600, GY = 600, H = 720;
  const SANS = '"Segoe UI Variable Display","Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif';
  const SERIF = '"Iowan Old Style","Palatino Linotype",Georgia,serif';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
  const hex=h=>{if(h[0]==='r'){const m=h.match(/[\d.]+/g).map(Number);return[m[0],m[1],m[2]]}h=h.replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
  const rgb=a=>`rgb(${a[0]|0},${a[1]|0},${a[2]|0})`;
  const mix=(a,b,t)=>{const x=hex(a),y=hex(b);return rgb([lerp(x[0],y[0],t),lerp(x[1],y[1],t),lerp(x[2],y[2],t)])};
  const shade=(col,amt)=>amt>=0?mix(col,'#ffffff',amt):mix(col,'#000000',-amt);
  function rng(seed){let a=seed*2654435761>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  const SKY=[{p:0,t:'#2c2860',b:'#ff9566'},{p:.18,t:'#4f68bd',b:'#ffc78f'},{p:.5,t:'#3f8fdc',b:'#bfe4ff'},{p:1,t:'#3a8be0',b:'#d6efff'}];
  function skyAt(p){for(let i=0;i<SKY.length-1;i++){const a=SKY[i],b=SKY[i+1];if(p<=b.p){const k=(p-a.p)/(b.p-a.p);return{top:mix(a.t,b.t,k),bot:mix(a.b,b.b,k)}}}return{top:SKY[3].t,bot:SKY[3].b}}
  function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  function vgrad(c,y0,y1,a,b){const g=c.createLinearGradient(0,y0,0,y1);g.addColorStop(0,a);g.addColorStop(1,b);return g}
  function text(c,t,x,y,size,col,weight=600,font=SANS,align='center'){c.font=`${weight} ${size}px ${font}`;c.textAlign=align;c.textBaseline='middle';c.fillStyle=col;c.fillText(t,x,y)}
  function pill(c,t,x,y,size,bg,fg){c.font=`600 ${size}px ${SANS}`;const w=c.measureText(t).width+size*1.4,h=size*1.9;rr(c,x-w/2,y-h/2,w,h,h/2);c.fillStyle=bg;c.fill();text(c,t,x,y+1,size,fg)}

  let cvs,c,dpr=1,s=1,vw=1280;
  const photos={};
  function loadPhoto(id){
    if(id in photos) return; photos[id]=null;
    const tryExt=['jpg','jpeg','png','webp'];
    (function next(i){ if(i>=tryExt.length) return; const im=new Image(); im.onload=()=>{photos[id]=im}; im.onerror=()=>next(i+1); im.src=`/assets/backgrounds/${id}.${tryExt[i]}`; })(0);
  }
  function resize(canvas){
    cvs=canvas||cvs; c=cvs.getContext('2d'); dpr=Math.min(window.devicePixelRatio||1,2);
    const w=Math.floor(innerWidth*dpr), h=Math.floor(innerHeight*dpr);
    if(cvs.width!==w||cvs.height!==h){cvs.width=w;cvs.height=h}
    s=cvs.height/H; vw=cvs.width/s;
  }

  // ---------- per-scene cached random layers ----------
  const cache={};
  function layers(id){
    if(cache[id]) return cache[id]; const r=rng(id*97+13), L={};
    L.sky=[];let x=0;while(x<W+200){const w=60+r()*120,h=80+r()*200;L.sky.push({x,w,h,win:r()});x+=w+r()*20}
    L.clouds=Array.from({length:7},()=>({x:r()*W,y:60+r()*190,s:.6+r()*1.1,v:4+r()*8}));
    L.trees=[];for(let i=0;i<22;i++)L.trees.push({x:r()*W,h:90+r()*90,k:r(),f:r()});
    L.mid=[];for(let i=0;i<18;i++)L.mid.push({x:i*150+r()*80,h:60+r()*110,k:r()});
    L.bushes=Array.from({length:16},()=>({x:r()*W*1.1,w:70+r()*110,h:30+r()*40,k:r()}));
    L.motes=Array.from({length:55},()=>({x:r(),y:r(),z:.3+r()*1.2,p:r()*6.28}));
    L.flowers=Array.from({length:60},()=>({x:r()*W,y:GY+6+r()*20,c:r()}));
    L.tiles=r();
    return cache[id]=L;
  }

  // ---------- sky, far layers ----------
  function drawSky(g,L){
    const sk=skyAt(g.tod); c.fillStyle=vgrad(c,0,GY+10,sk.top,sk.bot); c.fillRect(0,0,vw,H);
    // sun
    const sx=vw*(.14+.72*g.tod), sy=GY-40-Math.min(1,g.tod*1.7)*(GY-170);
    const glow=c.createRadialGradient(sx,sy,0,sx,sy,360);glow.addColorStop(0,'rgba(255,225,150,.75)');glow.addColorStop(.3,'rgba(255,190,110,.28)');glow.addColorStop(1,'rgba(255,170,90,0)');
    c.fillStyle=glow;c.fillRect(0,0,vw,H);
    c.fillStyle='#fff7d6';c.beginPath();c.arc(sx,sy,30,0,6.283);c.fill();
    // stars at very first light
    if(g.tod<.12){c.fillStyle=`rgba(255,255,255,${(.12-g.tod)*7})`;const r=rng(7);for(let i=0;i<70;i++){c.fillRect(r()*vw,r()*GY*.55,1.6,1.6)}}
    g._sun={x:sx,y:sy};
    // clouds
    for(const cl of L.clouds){const x=((cl.x+g.t*cl.v-g.camX*.05)%(W+400)+W+400)%(W+400)-200;cloud(x,cl.y,cl.s,g.tod)}
    // birds
    c.strokeStyle='rgba(20,25,40,.65)';c.lineWidth=2;
    for(let i=0;i<4;i++){const bx=((g.t*(40+i*9)+i*330)%(vw+300))-100,by=140+i*38+Math.sin(g.t*2+i)*10,fl=Math.sin(g.t*9+i)*6;
      c.beginPath();c.moveTo(bx-11,by-fl);c.quadraticCurveTo(bx-5,by-8,bx,by);c.quadraticCurveTo(bx+5,by-8,bx+11,by-fl);c.stroke()}
  }
  function cloud(x,y,k,tod){
    const warm=clamp(1-tod*3,0,1);c.save();c.translate(x,y);c.scale(k,k);
    const col=mix('#ffffff','#ffc9a0',warm*.8);c.fillStyle=col;c.globalAlpha=.88;
    c.beginPath();[[0,0,46],[44,-14,54],[96,0,44],[48,12,52],[-30,10,32],[130,10,30]].forEach(([a,b,r])=>{c.moveTo(a+r,b);c.arc(a,b,r,0,6.283)});c.fill();
    c.globalAlpha=.25;c.fillStyle=mix('#7a86b8','#e7a98a',warm);c.beginPath();c.ellipse(48,26,100,14,0,0,6.283);c.fill();c.restore();c.globalAlpha=1;
  }
  function drawFar(g,L){
    const sk=skyAt(g.tod),col=mix(sk.bot,'#2c3a5c',.42),lit=clamp(1-g.tod*3,0,1);
    c.save();c.translate(-g.camX*.12,0);
    for(const b of L.sky){const y=GY-b.h-20;c.fillStyle=col;c.fillRect(b.x,y,b.w,b.h+40);
      if(lit>0){c.fillStyle=`rgba(255,214,130,${lit*.55})`;for(let yy=y+14;yy<GY-30;yy+=26)for(let xx=b.x+8;xx<b.x+b.w-10;xx+=20)if(((xx*7+yy*3+b.win*100)|0)%5===0)c.fillRect(xx,yy,7,9)}}
    c.restore();
    // hills
    c.save();c.translate(-g.camX*.28,0);c.fillStyle=mix(sk.bot,'#2f6b4f',.5);c.beginPath();c.moveTo(0,GY);
    for(let x=0;x<=W;x+=40)c.lineTo(x,GY-58-Math.sin(x*.004+1)*34-Math.sin(x*.011)*14);c.lineTo(W,GY);c.fill();c.restore();
    c.save();c.translate(-g.camX*.42,0);
    for(const m of L.mid){const x=m.x,y=GY+4;c.fillStyle=mix('#2b6b45','#173a2c',m.k*.5+.1);c.beginPath();c.arc(x,y-m.h*.55,m.h*.5,0,6.283);c.arc(x+m.h*.35,y-m.h*.38,m.h*.38,0,6.283);c.arc(x-m.h*.3,y-m.h*.35,m.h*.34,0,6.283);c.fill();c.fillRect(x-4,y-m.h*.3,8,m.h*.3)}
    c.restore();
  }

  // ---------- ground ----------
  function drawGround(g,id){
    const road=(id===10||id===11||id===9);
    c.fillStyle=vgrad(c,GY-12,GY+22,'#4f9a58','#3c7d47');c.fillRect(0,GY-12,vw+W,34);
    c.save();c.translate(-g.camX,0);
    const L=layers(id);
    for(const f of L.flowers){c.fillStyle=['#ffd166','#fff','#ff8fab','#b69cff'][(f.c*4)|0];c.beginPath();c.arc(f.x,f.y,2.1,0,6.283);c.fill()}
    c.restore();
    c.fillStyle=road?vgrad(c,GY+18,H,'#4a4f5c','#2f333d'):vgrad(c,GY+18,H,'#c9c3b4','#9e988b');c.fillRect(0,GY+18,vw,H-GY);
    c.fillStyle='rgba(0,0,0,.18)';c.fillRect(0,GY+18,vw,4);
    c.save();c.translate(-g.camX,0);
    c.strokeStyle=road?'rgba(255,255,255,.14)':'rgba(0,0,0,.09)';c.lineWidth=2;
    for(let x=-200;x<W+200;x+=130){c.beginPath();c.moveTo(x,GY+22);c.lineTo(x-(x-W/2)*.5,H);c.stroke()}
    for(let y=GY+50;y<H;y+=36+(y-GY)*.12){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke()}
    if(road){c.fillStyle='rgba(255,255,255,.55)';for(let x=40;x<W;x+=150)c.fillRect(x,GY+86,80,6)}
    c.restore();
  }

