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

    // ---------- building helpers ----------
  function windows(x,y,w,h,cols,rows,lit,o={}){
    const gw=(w-(cols+1)*(o.gap||8))/cols, gh=(h-(rows+1)*(o.gapY||o.gap||8))/rows,sk=o.sky||'#8fc0ec';
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
      const wx=x+(o.gap||8)+i*(gw+(o.gap||8)),wy=y+(o.gapY||o.gap||8)+j*(gh+(o.gapY||o.gap||8)),on=lit>0&&(((i*5+j*3+(o.seed||0))%3)===0);
      const gr=c.createLinearGradient(0,wy,0,wy+gh);
      if(on){gr.addColorStop(0,'#ffe9a8');gr.addColorStop(1,'#ffc062')}else{gr.addColorStop(0,mix(sk,'#ffffff',.25));gr.addColorStop(1,mix(sk,'#2a3b5a',.35))}
      c.fillStyle=gr;if(o.round){rr(c,wx,wy,gw,gh,gw/2);c.fill()}else{c.fillRect(wx,wy,gw,gh)}
      if(on){c.fillStyle=`rgba(255,200,100,${.25*lit})`;c.fillRect(wx-3,wy-3,gw+6,gh+6)}
      if(o.frame){c.strokeStyle=o.frame;c.lineWidth=2;if(o.round){rr(c,wx,wy,gw,gh,gw/2);c.stroke()}else c.strokeRect(wx,wy,gw,gh)}
    }
  }
  function sign(x,y,w,h,t,bg,fg,size){rr(c,x-w/2,y-h/2,w,h,h*.25);c.fillStyle=bg;c.fill();c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=2;c.stroke();text(c,t,x,y+1,size||h*.5,fg,700)}
  function steps(cx,y,w,n,col){for(let i=0;i<n;i++){const ww=w+i*26;c.fillStyle=shade(col,-i*.05);c.fillRect(cx-ww/2,y+i*9,ww,9)}}
  function bunting(x1,x2,y,sag,t){const n=Math.floor((x2-x1)/44);c.strokeStyle='#3a3340';c.lineWidth=2;c.beginPath();c.moveTo(x1,y);c.quadraticCurveTo((x1+x2)/2,y+sag,x2,y);c.stroke();
    for(let i=1;i<n;i++){const k=i/n,x=lerp(x1,x2,k),yy=y+sag*2*k*(1-k)+1;c.fillStyle=['#ff6b6b','#ffd166','#7cf0d6','#9c8cff'][i%4];c.beginPath();c.moveTo(x-9,yy);c.lineTo(x+9,yy);c.lineTo(x+Math.sin(t*2+i)*2,yy+20);c.fill()}}
  function lamp(x,g){const lit=clamp(1-g.tod*2.6,0,1);c.fillStyle='#2e3340';c.fillRect(x-3,GY-150,6,150);c.fillRect(x-3,GY-152,30,5);rr(c,x+16,GY-150,22,9,4);c.fill();
    if(lit>0){const gr=c.createRadialGradient(x+28,GY-140,0,x+28,GY-140,120);gr.addColorStop(0,`rgba(255,220,140,${.7*lit})`);gr.addColorStop(1,'rgba(255,220,140,0)');c.fillStyle=gr;c.fillRect(x-100,GY-260,260,260)}}
  function tree(x,h,k,t,f,tod){c.save();c.translate(x,GY+10);const sway=Math.sin(t*.8+x*.01)*3;c.fillStyle='#4b3524';c.fillRect(-6,-h*.5,12,h*.5);
    const gcol=mix('#2f7a45','#69b85a',k*.7);c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(0,0,h*.4,9,0,0,6.283);c.fill();
    for(const [a,b,r,d] of [[0,-h*.78,h*.34,0],[-h*.24,-h*.58,h*.28,-.1],[h*.24,-h*.6,h*.28,.08],[0,-h*.55,h*.3,-.18]]){c.fillStyle=shade(gcol,d);c.beginPath();c.arc(a+sway*(1-(-b/h)),b,r,0,6.283);c.fill()}
    c.restore()}
  function bench(x){c.fillStyle='#5b4330';c.fillRect(x-34,GY+28,68,7);c.fillRect(x-32,GY+14,64,5);c.fillRect(x-30,GY+35,5,16);c.fillRect(x+25,GY+35,5,16);c.fillStyle='rgba(0,0,0,.2)';c.fillRect(x-36,GY+52,72,5)}
  function bush(x,w,h,k){c.fillStyle=mix('#256c3d','#4ea25a',k);c.beginPath();c.ellipse(x,GY+18,w/2,h,0,Math.PI,0);c.fill();c.fillStyle='rgba(255,255,255,.08)';c.beginPath();c.ellipse(x-w*.1,GY+8,w*.25,h*.35,0,Math.PI,0);c.fill()}
  function pole(x,y,h,col){c.fillStyle=col;c.fillRect(x-4,y,8,h)}

  // ---------- the buildings ----------
  function building(id,g,cx){
    const t=g.t,lit=clamp(1-g.tod*2.4,0,1),sk=skyAt(g.tod).bot,sw=(w,h)=>0;
    const ground=GY+16;
    c.save();
    switch(id){
    case 0:{ // BTECH – modern glass block
      const w=760,h=380,x=cx-w/2,y=ground-h;
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x+12,ground-2,w,12);
      c.fillStyle=vgrad(c,y,ground,'#d6dbe6','#a3adc0');c.fillRect(x,y,w,h);
      c.fillStyle='#e9edf4';c.fillRect(x-14,y-16,w+28,18);
      const gx=x+70,gw=w-140;c.fillStyle=vgrad(c,y+20,ground,mix('#5aa8e8',sk,.4),'#1d3c68');c.fillRect(gx,y+24,gw,h-70);
      c.fillStyle='rgba(255,255,255,.14)';c.beginPath();c.moveTo(gx,y+24);c.lineTo(gx+gw*.5,y+24);c.lineTo(gx+gw*.2,ground-46);c.lineTo(gx,ground-46);c.fill();
      for(let i=0;i<=12;i++){c.fillStyle='#f1f4f9';c.fillRect(gx+i*gw/12-3,y+24,6,h-70)}
      for(let j=1;j<5;j++){c.fillStyle='rgba(255,255,255,.55)';c.fillRect(gx,y+24+j*(h-70)/5,gw,3)}
      windows(gx,y+30,gw,h-78,12,5,lit*.6,{gap:6,sky:sk,seed:3});
      for(let i=0;i<3;i++){c.fillStyle='#bdc6d6';c.fillRect(x+10+i*0,y+30,0,0)}
      sign(cx,y-44,330,50,'BTECH BLOCK','#12203a','#ffd36b',24);
      c.fillStyle='#e9edf4';c.fillRect(cx-150,ground-120,300,12);c.fillStyle='#2a3350';c.fillRect(cx-142,ground-108,8,108);c.fillRect(cx+134,ground-108,8,108);
      c.fillStyle=vgrad(c,ground-108,ground,'#1b2742','#0e1426');c.fillRect(cx-60,ground-100,120,100);c.fillStyle='rgba(255,230,150,.35)';c.fillRect(cx-56,ground-96,52,92);
      steps(cx,ground-2,300,3,'#c9c3b4');break;}
    case 1:{ // CSIT – brick + basement stair
      const w=560,h=330,x=cx-w/2,y=ground-h;
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x+10,ground-2,w,12);
      c.fillStyle=vgrad(c,y,ground,'#7a4b43','#5c3631');c.fillRect(x,y,w,h);
      c.strokeStyle='rgba(0,0,0,.14)';c.lineWidth=1;for(let j=y;j<ground;j+=13){c.beginPath();c.moveTo(x,j);c.lineTo(x+w,j);c.stroke()}
      c.fillStyle='#2e3a4d';c.fillRect(x-12,y-18,w+24,20);
      windows(x+20,y+28,w-40,h-110,6,3,lit*.5+.35,{gap:12,sky:sk,frame:'#d9cdbb',seed:1});
      sign(cx,y-48,250,44,'CSIT BLOCK','#162036','#7cf0d6',22);
      c.fillStyle='#10131c';c.fillRect(cx-44,ground-86,88,86);c.fillStyle='rgba(124,240,214,.22)';c.fillRect(cx-40,ground-82,80,78);
      if(!g.practice){
      // basement stairs down on the left
      c.fillStyle='#161a24';c.beginPath();c.moveTo(x-150,ground+6);c.lineTo(x-20,ground+6);c.lineTo(x-20,ground+66);c.lineTo(x-150,ground+66);c.fill();
      for(let i=0;i<6;i++){c.fillStyle=shade('#8a8578',-.08*i);c.fillRect(x-150+i*21,ground+6+i*9,21,9)}
      pill(c,'↓ BASEMENT · EXAM CELL',x-86,ground-12,11,'rgba(0,0,0,.6)','#ffb4ae');
      }
      // server glow
      c.fillStyle='rgba(124,240,214,.55)';for(let i=0;i<6;i++){const f=(Math.sin(t*3+i*1.7)+1)/2;c.globalAlpha=.3+.7*f;c.fillRect(x+w-80,y+60+i*14,6,6)}c.globalAlpha=1;break;}
    case 2:{ // Petroleum – red brick with clock tower
      const w=620,h=290,x=cx-w/2,y=ground-h;
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x+10,ground-2,w,12);
      c.fillStyle=vgrad(c,y,ground,'#a24a3a','#7a3328');c.fillRect(x,y,w,h);
      c.strokeStyle='rgba(0,0,0,.14)';for(let j=y;j<ground;j+=12){c.beginPath();c.moveTo(x,j);c.lineTo(x+w,j);c.stroke()}
      c.fillStyle='#e7ddc6';c.fillRect(x-10,y-10,w+20,14);c.fillRect(x-10,y+h*.45,w+20,6);
      // tower
      const tw=130,th=170;c.fillStyle=vgrad(c,y-th,y,'#b0523f','#8a3a2e');c.fillRect(cx-tw/2,y-th,tw,th);
      c.fillStyle='#e7ddc6';c.fillRect(cx-tw/2-8,y-th-8,tw+16,12);c.fillStyle='#3a3f58';c.beginPath();c.moveTo(cx-tw/2-4,y-th-8);c.lineTo(cx,y-th-70);c.lineTo(cx+tw/2+4,y-th-8);c.fill();
      c.fillStyle='#f4efe0';c.beginPath();c.arc(cx,y-th+50,34,0,6.283);c.fill();c.strokeStyle='#3a2f27';c.lineWidth=4;c.stroke();
      const m=(g.minutesTotal-g.minutesLeft)||0;const hh=(7+m/60)*30*Math.PI/180,mm=(m%60)*6*Math.PI/180;c.lineCap='round';c.lineWidth=4;c.beginPath();c.moveTo(cx,y-th+50);c.lineTo(cx+Math.sin(hh)*17,y-th+50-Math.cos(hh)*17);c.stroke();c.lineWidth=2.5;c.beginPath();c.moveTo(cx,y-th+50);c.lineTo(cx+Math.sin(mm)*27,y-th+50-Math.cos(mm)*27);c.stroke();
      for(const sx of [-1,1])windows(cx+sx*(tw/2+30)+(sx<0?-190:0),y+34,190,h-110,4,2,lit*.5+.2,{gap:12,round:true,sky:sk,frame:'#e7ddc6',seed:2});
      sign(cx,y+h*.45-34,240,40,'PETROLEUM BLOCK','#2b1a16','#ffd9a0',19);
      c.fillStyle='#1b1213';rr(c,cx-34,ground-92,68,92,34);c.fill();c.fillStyle='rgba(255,210,140,.25)';rr(c,cx-30,ground-88,60,88,30);c.fill();break;}
    case 3:{ // Ravi Canteen – shed + steam
      const w=560,h=190,x=cx-w/2,y=ground-h;
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x+10,ground-2,w,12);
      c.fillStyle=vgrad(c,y,ground,'#e9d9b4','#cdbb92');c.fillRect(x,y+28,w,h-28);
      c.fillStyle='#8a4a3a';c.beginPath();c.moveTo(x-30,y+34);c.lineTo(x+w+30,y+34);c.lineTo(x+w-10,y-20);c.lineTo(x+10,y-20);c.fill();
      c.strokeStyle='rgba(255,255,255,.22)';c.lineWidth=3;for(let i=0;i<14;i++){c.beginPath();c.moveTo(x+i*40-20,y+34);c.lineTo(x+i*40-8+(i-7)*0,y-20);c.stroke()}
      c.fillStyle='#7d7f86';c.fillRect(x+w-120,y-70,26,56);
      for(let i=0;i<5;i++){const p=(t*.6+i*.2)%1;c.fillStyle=`rgba(255,255,255,${.35*(1-p)})`;c.beginPath();c.arc(x+w-107+Math.sin(p*5+i)*10,y-72-p*70,10+p*18,0,6.283);c.fill()}
      c.fillStyle='#2b1d17';c.fillRect(x+30,y+60,w-60,h-82);c.fillStyle='rgba(255,196,110,.5)';c.fillRect(x+36,y+66,w-72,40);
      sign(cx,y+10,290,44,'RAVI CANTEEN','#fff4d6','#8a2c1e',22);
      for(let i=0;i<5;i++){c.fillStyle='#f2e5c0';c.fillRect(x+54+i*96,y+104,60,10)}
      for(const bx of [x+80,x+w-80]){c.fillStyle='#d9534f';c.fillRect(bx-34,ground-38,68,8);c.fillStyle='#4a4f5c';c.fillRect(bx-30,ground-30,5,32);c.fillRect(bx+25,ground-30,5,32)}break;}
    case 4:{ // Quick Bite Cafe – neon + striped awning
      const w=400,h=230,x=cx-w/2,y=ground-h;
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x+10,ground-2,w,12);
      c.fillStyle=vgrad(c,y,ground,'#2f3b5c','#1d2640');c.fillRect(x,y,w,h);
      c.fillStyle='#10192e';c.fillRect(x-8,y-12,w+16,16);
      const glow=.7+.3*Math.sin(t*5);sign(cx,y+30,290,52,'QUICK BITE','#150a1e',`rgba(255,${120+glow*60|0},190,1)`,26);c.shadowColor='#ff79c6';c.shadowBlur=18*glow;sign(cx,y+30,290,52,'QUICK BITE','rgba(0,0,0,0)','#ff9ad5',26);c.shadowBlur=0;
      for(let i=0;i<10;i++){c.fillStyle=i%2?'#fff':'#e84b5b';c.beginPath();c.moveTo(x+i*40-6,y+66);c.lineTo(x+i*40+34,y+66);c.lineTo(x+i*40+40,y+100);c.lineTo(x+i*40,y+100);c.fill()}
      c.fillStyle='#ffdf9f';c.fillRect(x+30,y+110,w-60,86);c.fillStyle='rgba(255,255,255,.3)';c.fillRect(x+30,y+110,w-60,10);
      for(let i=0;i<4;i++){c.fillStyle=['#e84b5b','#ffd166','#7cf0d6','#9c8cff'][i];rr(c,x+54+i*80,y+136,44,36,8);c.fill()}
      c.fillStyle='#d9d3c4';c.fillRect(x+30,y+190,w-60,10);break;}
    case 5:{ // Library – classical columns & dome
      const w=680,h=300,x=cx-w/2,y=ground-h;
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x+10,ground-2,w,12);
      c.fillStyle=vgrad(c,y,ground,'#ece3cc','#cbbf9f');c.fillRect(x,y+30,w,h-30);
      // dome
      c.fillStyle='#6f8f9c';c.beginPath();c.arc(cx,y-4,70,Math.PI,0);c.fill();c.fillStyle='rgba(255,255,255,.2)';c.beginPath();c.arc(cx-16,y-12,50,Math.PI*1.05,Math.PI*1.6);c.lineTo(cx-16,y-12);c.fill();c.fillStyle='#d9ceb0';c.fillRect(cx-6,y-86,12,18);
      c.fillStyle='#f3ecd8';c.beginPath();c.moveTo(x-16,y+34);c.lineTo(cx,y-34);c.lineTo(x+w+16,y+34);c.fill();c.strokeStyle='#c5b893';c.lineWidth=4;c.stroke();
      c.fillStyle='#d8ccae';c.fillRect(x-16,y+34,w+32,16);
      text(c,'CENTRAL LIBRARY',cx,y+10,18,'#6b5a35',700,SERIF);
      for(let i=0;i<7;i++){const px=x+30+i*(w-90)/6;c.fillStyle=vgrad(c,y+50,ground,'#fbf6e8','#cfc4a6');c.fillRect(px,y+50,26,h-62);c.fillStyle='rgba(0,0,0,.08)';c.fillRect(px+18,y+50,8,h-62)}
      windows(x+50,y+78,w-100,110,6,1,lit*.4+.55,{gap:30,round:true,sky:sk,frame:'#bdb08a'});
      c.fillStyle='#2b2018';c.fillRect(cx-36,ground-104,72,104);c.fillStyle='rgba(255,210,130,.35)';c.fillRect(cx-32,ground-100,64,96);
      steps(cx,ground-2,w-60,3,'#d6cdb4');break;}
    case 7:{ // Happiness Cafe – colourful with parasols
      const w=420,h=220,x=cx-w/2,y=ground-h;
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x+10,ground-2,w,12);
      c.fillStyle=vgrad(c,y,ground,'#ffd1dc','#f3a9be');c.fillRect(x,y,w,h);
      c.fillStyle='#fff3b0';c.fillRect(x-8,y-12,w+16,16);
      sign(cx,y+30,270,48,'☺ HAPPINESS CAFE','#fffbe8','#e0476e',20);
      for(let i=0;i<9;i++){c.fillStyle=i%2?'#7cf0d6':'#ffd166';c.beginPath();c.arc(x+i*(w/8),y+68,26,0,Math.PI);c.fill()}
      c.fillStyle='#fff7e0';c.fillRect(x+30,y+96,w-60,92);c.fillStyle='rgba(255,196,120,.55)';c.fillRect(x+36,y+102,w-72,66);
      for(let i=0;i<5;i++){c.fillStyle=['#ff6b81','#ffd166','#7cf0d6','#9c8cff','#ff9a56'][i];c.beginPath();c.arc(x+58+i*(w-116)/4,y+130+Math.sin(t*2+i)*2,9,0,6.283);c.fill()}
      bunting(x-90,x+w+90,y-60,28,t);
      for(const px of [x-60,x+w+60]){c.fillStyle='#d4cfc0';c.fillRect(px-2,ground-110,4,110);c.fillStyle=px<cx?'#ff6b81':'#ffd166';c.beginPath();c.moveTo(px-56,ground-100);c.quadraticCurveTo(px,ground-150,px+56,ground-100);c.fill();c.fillStyle='rgba(0,0,0,.2)';c.fillRect(px-26,ground-4,52,4)}break;}
    case 8:{ // Civil Block – concrete + scaffold
      const w=600,h=310,x=cx-w/2,y=ground-h;
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x+10,ground-2,w,12);
      c.fillStyle=vgrad(c,y,ground,'#b8bcc2','#8d9299');c.fillRect(x,y,w,h);
      for(let j=0;j<4;j++){c.fillStyle='#d6d9de';c.fillRect(x-10,y+j*(h/4),w+20,10)}
      windows(x+20,y+22,w-40,h-60,8,3,lit*.4,{gap:10,sky:sk,seed:5,frame:'#6f747c'});
      sign(cx,y-40,260,46,'CIVIL BLOCK','#232a33','#ffb347',22);
      c.strokeStyle='#d98f2a';c.lineWidth=4;for(let i=0;i<6;i++){c.strokeRect(x+w-150,y+i*0+30,0,0)}
      const sx=x+w-130;c.strokeStyle='#e6a238';for(let i=0;i<=4;i++){c.beginPath();c.moveTo(sx+i*32,y+30);c.lineTo(sx+i*32,ground);c.stroke()}for(let j=0;j<5;j++){c.beginPath();c.moveTo(sx,y+30+j*60);c.lineTo(sx+128,y+30+j*60);c.stroke()}
      c.beginPath();c.moveTo(sx,y+30);c.lineTo(sx+128,y+90);c.moveTo(sx+128,y+30);c.lineTo(sx,y+90);c.stroke();
      c.fillStyle='#1f262e';c.fillRect(cx-90,ground-88,80,88);c.fillStyle='rgba(255,230,150,.3)';c.fillRect(cx-86,ground-84,72,80);
      c.fillStyle='#f0ebe0';c.fillRect(x+30,ground-110,70,50);c.strokeStyle='#5a7fb8';c.lineWidth=2;c.strokeRect(x+34,ground-106,62,42);c.beginPath();c.moveTo(x+40,ground-96);c.lineTo(x+90,ground-96);c.moveTo(x+40,ground-84);c.lineTo(x+80,ground-84);c.stroke();break;}
    case 9:{ // Silver Jubilee Convention Centre – grand fest hall
      const w=1100,h=330,x=cx-w/2,y=ground-h;
      c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x+14,ground-2,w,14);
      c.fillStyle=vgrad(c,y,ground,'#d5d9e4','#8f98ae');c.fillRect(x,y+50,w,h-50);
      c.fillStyle=vgrad(c,y-20,y+80,mix('#8bb6e6',sk,.4),'#365a8c');c.beginPath();c.moveTo(x-20,y+60);c.quadraticCurveTo(cx,y-110,x+w+20,y+60);c.lineTo(x+w+20,y+90);c.lineTo(x-20,y+90);c.fill();
      c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=3;for(let i=1;i<10;i++){c.beginPath();c.moveTo(x+i*w/10,y+80-Math.sin(i/10*Math.PI)*120+20);c.lineTo(x+i*w/10,y+90);c.stroke()}
      sign(cx,y+8,430,58,'SILVER JUBILEE','#101a30','#e6ecff',30);text(c,'CONVENTION CENTRE',cx,y+52,13,'#9fb2d8',700);
      windows(x+40,y+112,w-80,130,14,2,lit*.5+.5,{gap:10,sky:sk,seed:9,frame:'#6a7590'});
      for(let i=0;i<8;i++){c.fillStyle='#eef1f8';c.fillRect(x+30+i*(w-90)/7,y+100,16,h-112)}
      // fest banner
      c.fillStyle='#ff5d8f';rr(c,cx-210,y+250-110,420,0,0);
      c.fillStyle=vgrad(c,y+256,y+320,'#7b4bd8','#e04b8a');rr(c,cx-240,y+250,480,64,10);c.fill();text(c,'COLLEGE FEST · AFTER-PARTY',cx,y+282,22,'#fff',800);
      bunting(x+30,cx-260,y+240,24,t);bunting(cx+260,x+w-30,y+240,24,t);
      // spotlights
      for(let i=0;i<3;i++){const a=Math.sin(t*1.3+i*2)*.5,px=x+120+i*(w-240)/2;c.save();c.globalCompositeOperation='lighter';const gr=c.createLinearGradient(px,y+60,px+Math.sin(a)*120,y-300);gr.addColorStop(0,'rgba(255,240,200,.22)');gr.addColorStop(1,'rgba(255,240,200,0)');c.fillStyle=gr;c.beginPath();c.moveTo(px-10,y+60);c.lineTo(px+10,y+60);c.lineTo(px+Math.sin(a)*220+70,y-300);c.lineTo(px+Math.sin(a)*220-70,y-300);c.fill();c.restore()}
      c.fillStyle='#14182a';c.fillRect(cx-70,ground-100,140,100);c.fillStyle='rgba(255,220,140,.35)';c.fillRect(cx-64,ground-94,60,88);c.fillRect(cx+4,ground-94,60,88);
      steps(cx,ground-2,300,3,'#c9c3b4');break;}
    case 10:{ // Gate 1 – grand arch, guard cabin, boundary wall
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(cx-480,ground-2,960,12);
      for(const sx of [-1,1]){c.fillStyle=vgrad(c,ground-110,ground,'#c8b79a','#a9987a');c.fillRect(cx+sx*190-(sx<0?420:0),ground-110,420,110);c.fillStyle='#8f7f62';c.fillRect(cx+sx*190-(sx<0?420:0),ground-118,420,10);
        for(let i=0;i<10;i++){c.fillStyle='rgba(0,0,0,.1)';c.fillRect(cx+sx*190-(sx<0?420:0)+i*42,ground-110,3,110)}}
      for(const sx of [-1,1]){const px=cx+sx*150;c.fillStyle=vgrad(c,ground-300,ground,'#e8dcc0','#bfae8c');c.fillRect(px-34,ground-300,68,300);c.fillStyle='#b4a27c';c.fillRect(px-42,ground-312,84,16);c.fillRect(px-42,ground-12,84,12);
        c.fillStyle='#ffd36b';c.beginPath();c.arc(px,ground-322,13,0,6.283);c.fill();c.fillStyle='rgba(255,230,150,.35)';c.beginPath();c.arc(px,ground-322,34,0,6.283);c.fill()}
      c.fillStyle='#d8caa8';c.beginPath();c.moveTo(cx-150,ground-250);c.quadraticCurveTo(cx,ground-410,cx+150,ground-250);c.lineTo(cx+150,ground-300);c.quadraticCurveTo(cx,ground-460,cx-150,ground-300);c.fill();
      sign(cx,ground-342,300,48,'GRAPHIC ERA · GATE 1','#14203a','#ffd36b',17);
      c.strokeStyle='#2a2f3f';c.lineWidth=5;for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(cx+i*34,ground-238);c.lineTo(cx+i*34,ground);c.stroke()}
      c.fillStyle='#e8e4d4';rr(c,cx+300,ground-130,110,130,6);c.fill();c.fillStyle='#4a6a8c';c.fillRect(cx+310,ground-112,90,50);c.fillStyle='#a33';c.fillRect(cx+300,ground-136,110,10);text(c,'SECURITY',cx+355,ground-30,12,'#334',800);
      const ang=-.15;c.save();c.translate(cx-280,ground-60);c.rotate(ang);c.fillStyle='#fff';c.fillRect(0,-6,180,12);for(let i=0;i<5;i++){c.fillStyle='#d33';c.fillRect(i*36+18,-6,18,12)}c.restore();c.fillStyle='#555';c.fillRect(cx-290,ground-70,16,70);break;}
    case 11:{ // Gate 2 – smaller sliding gate
      for(const sx of [-1,1]){c.fillStyle=vgrad(c,ground-100,ground,'#a8aab3','#7f828c');c.fillRect(cx+sx*160-(sx<0?500:0),ground-100,500,100);c.fillStyle='#6a6d77';c.fillRect(cx+sx*160-(sx<0?500:0),ground-108,500,10)}
      for(const sx of [-1,1]){const px=cx+sx*130;c.fillStyle=vgrad(c,ground-220,ground,'#b8bcc8','#868a98');c.fillRect(px-26,ground-220,52,220);c.fillStyle='#6e7280';c.fillRect(px-32,ground-230,64,14)}
      c.fillStyle='#c9ccd6';c.fillRect(cx-130,ground-250,260,34);sign(cx,ground-232,250,30,'GATE 2 · EXIT','#222836','#e8ecf8',17);
      c.fillStyle='#2f3340';c.fillRect(cx-104,ground-190,208,190);c.strokeStyle='#585e72';c.lineWidth=4;for(let i=0;i<=8;i++){c.beginPath();c.moveTo(cx-104+i*26,ground-190);c.lineTo(cx-104+i*26,ground);c.stroke()}
      c.fillStyle='#e8e4d4';rr(c,cx-330,ground-120,90,120,6);c.fill();c.fillStyle='#4a6a8c';c.fillRect(cx-322,ground-104,74,44);c.fillStyle='#363c4c';c.fillRect(cx-330,ground-126,90,10);
      c.save();c.translate(cx+270,ground-56);c.rotate(-.05);c.fillStyle='#fff';c.fillRect(0,-5,150,10);for(let i=0;i<4;i++){c.fillStyle='#e0a030';c.fillRect(i*38+10,-5,19,10)}c.restore();break;}
    }
    c.restore();
  }

  
  // ---------- the Exam Cell interior ----------
  function drawRoom(g){
    c.fillStyle=vgrad(c,0,GY,'#2a2f3d','#1a1e2a');c.fillRect(0,0,vw,GY+20);
    c.fillStyle=vgrad(c,GY,H,'#3a3a40','#202024');c.fillRect(0,GY+14,vw,H);
    c.save();c.translate(-g.camX,0);
    c.fillStyle='rgba(255,255,255,.05)';for(let x=0;x<W;x+=120){c.fillRect(x,40,3,GY-40)}
    c.fillStyle='#d7d2c2';c.globalAlpha=.1;for(let i=0;i<8;i++)c.fillRect(120+i*320,60,180,6);c.globalAlpha=1;
    for(let i=0;i<5;i++){const x=300+i*170;c.fillStyle='#4a5266';c.fillRect(x,GY-260,130,260);c.fillStyle='#394055';for(let r=0;r<5;r++){c.fillRect(x+8,GY-250+r*50,114,42)}for(let r=0;r<5;r++){c.fillStyle='#c9b98a';c.fillRect(x+16,GY-244+r*50,98,5)}}
    // open empty cabinet
    const cx=1260;c.fillStyle='#69707f';c.fillRect(cx-70,GY-300,140,300);c.fillStyle='#4b5160';c.fillRect(cx-60,GY-290,120,280);
    c.save();c.translate(cx+70,GY-300);c.fillStyle='#7a8291';c.beginPath();c.moveTo(0,0);c.lineTo(70,12);c.lineTo(70,280);c.lineTo(0,300);c.fill();c.restore();
    c.fillStyle='#d8d3c5';c.fillRect(cx-40,GY-120,80,5);text(c,'SEALED PAPER — MISSING',cx,GY-320,15,'#ff8f88',800);
    c.setLineDash([6,5]);c.strokeStyle='rgba(255,120,110,.7)';c.lineWidth=2;c.strokeRect(cx-44,GY-210,88,70);c.setLineDash([]);
    // desk + safe
    c.fillStyle='#5a4632';c.fillRect(1700,GY-90,260,16);c.fillRect(1710,GY-74,12,74);c.fillRect(1936,GY-74,12,74);c.fillStyle='#e8e2cf';c.fillRect(1740,GY-100,60,10);
    c.fillStyle='#2f3541';c.fillRect(2080,GY-170,150,170);c.fillStyle='#5a6174';c.beginPath();c.arc(2155,GY-90,28,0,6.283);c.fill();c.fillStyle='#2a2e3a';c.beginPath();c.arc(2155,GY-90,18,0,6.283);c.fill();
    // cctv
    c.fillStyle='#1e2230';c.fillRect(520,70,44,22);c.fillStyle=Math.sin(g.t*4)>0?'#ff4a4a':'#4a1a1a';c.beginPath();c.arc(556,81,4,0,6.283);c.fill();
    c.restore();
  }

  // ---------- characters ----------
  function leg(hx,hy,ang,col,shoe){const fx=hx+Math.sin(ang)*58,fy=hy+Math.cos(ang)*58;c.strokeStyle=col;c.lineWidth=12;c.lineCap='round';c.beginPath();c.moveTo(hx,hy);c.lineTo(fx,fy);c.stroke();c.fillStyle=shoe;c.beginPath();c.ellipse(fx+4,fy+2,12,5,0,0,6.283);c.fill()}
  function person(o){
    const {x,y,dir=1,phase=0,spd=0,look,t=0,act=null,det=false,name=null,sc=1,alpha=1}=o;
    c.save();c.globalAlpha=alpha;c.translate(x,y);
    c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(0,0,28*sc,7*sc,0,0,6.283);c.fill();
    c.scale(dir*sc,sc);
    const bob=Math.abs(Math.sin(phase))*3.5*spd+Math.sin(t*2+(o.seed||0))*.9*(1-spd);
    const sw=Math.sin(phase)*spd;
    const skin=det?'#e0ac84':look.skin, coat=det?'#b78d52':look.top, pants=det?'#2c3248':look.pants;
    leg(-4,-62-bob,-sw*.65+(spd?0:0),pants,'#161a24');leg(4,-62-bob,sw*.65,pants,'#161a24');
    // back arm
    const arm=(sx,ang,hand)=>{const ex=sx+Math.sin(ang)*40,ey=-112-bob+Math.cos(ang)*40;c.strokeStyle=shade(coat,-.12);c.lineWidth=11;c.lineCap='round';c.beginPath();c.moveTo(sx,-112-bob);c.lineTo(ex,ey);c.stroke();c.fillStyle=skin;c.beginPath();c.arc(ex,ey+2,5.5,0,6.283);c.fill();return[ex,ey]};
    if(act!=='search')arm(-12,sw*.7,0);
    // torso
    const flare=Math.sin(phase)*5*spd;
    c.fillStyle=det?vgrad(c,-120,-50,'#c9a064','#9a7440'):vgrad(c,-120,-50,shade(coat,.08),shade(coat,-.12));
    c.beginPath();c.moveTo(-19,-116-bob);c.quadraticCurveTo(0,-124-bob,19,-116-bob);c.lineTo(24+flare,-50-bob);c.lineTo(-24+flare,-50-bob);c.closePath();c.fill();
    if(det){c.fillStyle='#7a5a30';c.fillRect(-21,-86-bob,42,6);c.fillStyle='#e8c070';c.fillRect(-3,-87-bob,6,8);c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=2;c.beginPath();c.moveTo(0,-116-bob);c.lineTo(0,-50-bob);c.stroke();
      c.fillStyle='#8e6a3a';c.beginPath();c.moveTo(-19,-116-bob);c.lineTo(-4,-100-bob);c.lineTo(-14,-92-bob);c.fill();c.beginPath();c.moveTo(19,-116-bob);c.lineTo(4,-100-bob);c.lineTo(14,-92-bob);c.fill();
      c.fillStyle='#d6453d';c.beginPath();c.roundRect?c.roundRect(-14,-124-bob,28,11,5):c.rect(-14,-124-bob,28,11);c.fill();c.fillRect(6,-118-bob,8,26+Math.sin(t*5+phase)*2);}
    else{ if(look.acc.includes('tie')){c.fillStyle='#a52a3a';c.fillRect(-2,-112-bob,5,28)} if(look.acc.includes('lanyard')){c.fillStyle='#ffd36b';c.fillRect(-1,-114-bob,2,30);c.fillStyle='#fff';c.fillRect(-5,-86-bob,10,8)} if(look.tag==='lab coat'){c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=2;c.beginPath();c.moveTo(0,-116-bob);c.lineTo(0,-50-bob);c.stroke()} }
    // head
    const hy=-136-bob;c.fillStyle=skin;c.beginPath();c.arc(2,hy,17,0,6.283);c.fill();
    if(!det){const st=look.style,hc=look.hair;c.fillStyle=hc;
      if(st==='long'||st==='bob'){c.beginPath();c.arc(0,hy-2,19,Math.PI*.95,Math.PI*2.05);c.fill();c.fillRect(-19,hy-2,10,st==='long'?44:26);}
      else if(st==='cap'){c.fillStyle=look.cap;c.beginPath();c.arc(2,hy-4,18.5,Math.PI,0);c.fill();c.fillRect(2,hy-6,26,5)}
      else if(st==='bun'){c.beginPath();c.arc(0,hy-4,18,Math.PI*.95,Math.PI*2.05);c.fill();c.beginPath();c.arc(-6,hy-22,8,0,6.283);c.fill()}
      else if(st==='pony'){c.beginPath();c.arc(0,hy-3,18,Math.PI*.95,Math.PI*2.05);c.fill();c.beginPath();c.ellipse(-20,hy+4+Math.sin(t*3+phase)*2,7,16,.3,0,6.283);c.fill()}
      else{c.beginPath();c.arc(0,hy-3,18,Math.PI*.98,Math.PI*2.02);c.fill();if(st==='messy'||st==='quiff')c.fillRect(-6,hy-24,20,8)}
      if(look.acc.includes('glasses')){c.strokeStyle='#161620';c.lineWidth=2;c.strokeRect(5,hy-5,10,8)}
      if(look.acc.includes('mustache')){c.fillStyle=hc;c.fillRect(8,hy+6,10,3)}
      if(look.acc.includes('stubble')){c.fillStyle='rgba(20,20,20,.3)';c.fillRect(0,hy+5,18,10)}}
    // eye
    c.fillStyle='#161210';c.beginPath();c.ellipse(11,hy-1,1.8,2.4,0,0,6.283);c.fill();
    if(det){c.fillStyle='#3a2f27';c.beginPath();c.ellipse(2,hy-12,27,6,0,0,6.283);c.fill();c.fillStyle='#4e3f33';c.beginPath();c.moveTo(-14,hy-12);c.quadraticCurveTo(-12,hy-30,2,hy-30);c.quadraticCurveTo(16,hy-30,18,hy-12);c.fill();c.fillStyle='#231a14';c.fillRect(-14,hy-17,32,5)}
    // front arm (+ tools)
    if(act==='search'){const sp=Math.sin(t*6)*.3;const[hx,hy2]=arm(14,1.3+sp,0);c.strokeStyle='#5a4632';c.lineWidth=4;c.beginPath();c.moveTo(hx,hy2);c.lineTo(hx+14,hy2+10);c.stroke();c.fillStyle='rgba(170,225,255,.35)';c.strokeStyle='#d9b45a';c.lineWidth=4;c.beginPath();c.arc(hx+24,hy2+18,16,0,6.283);c.fill();c.stroke()}
    else if(act==='talk'){arm(14,1.0+Math.sin(t*7)*.25,0)}
    else arm(14,-sw*.7,0);
    c.restore();
    if(name){pill(c,name,x,y-196*sc-(det?8:0),12,'rgba(10,14,26,.72)','#f3eee2')}
  }


