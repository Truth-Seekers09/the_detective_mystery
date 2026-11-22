'use strict';
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const MAPPOS = {0:[.42,.34],7:[.25,.50],3:[.08,.30],8:[.42,.08],5:[.62,.50],2:[.82,.30],4:[.70,.76],11:[.93,.90],10:[.18,.72],1:[.42,.82],6:[.64,.95],9:[.05,.94]};
const TMAP = {0:[.28,.45],1:[.74,.78],2:[.74,.18]};
const mpos = id => (G.S && G.S.tutorial ? TMAP : MAPPOS)[id];
const sname = id => G.S && G.S.tutorial ? G.S.locations[id].name.split(' ')[0] : SHORT[id];
const SHORT = {0:'BTECH',1:'CSIT',2:'Petroleum',3:'Canteen',4:'Quick Bite',5:'Library',6:'Exam Cell',7:'Happiness',8:'Civil',9:'Jubilee',10:'Gate 1',11:'Gate 2'};
// Background people who just walk about (students, staff, visitors). They are not suspects and cannot be questioned.
const CROWD_SIZE = {0:6,1:4,2:3,3:5,4:4,5:3,6:0,7:4,8:3,9:5,10:4,11:3};
const CROWD_LOOKS = {
  skin:['#c89b72','#e0ac84','#b98458','#d8a47e','#e5b693','#a8744c'],
  hair:['#1b1b1b','#2a1a14','#3a2a22','#4a2a1a','#222','#7a5a3a'],
  style:['short','long','messy','bun','pony','bob','quiff','cap'],
  top:['#3b6ea5','#c65b4a','#4a8f6a','#8a6fc4','#d9a441','#5a6b8c','#b0b8c8','#2f2f3a'],
  pants:['#2b3a55','#3a3a48','#40324a','#2c3248']
};
function makeCrowd(loc){
  const pick = a => a[(Math.random()*a.length)|0], list = [];
  for (let i = 0; i < (CROWD_SIZE[loc] ?? 3); i++){
    const st = pick(CROWD_LOOKS.style), x = 260 + Math.random()*(Scene.W-520), range = 120 + Math.random()*320;
    list.push({x, y:LANE_MIN + Math.random()*(LANE_MAX-LANE_MIN), dir:Math.random()<.5?-1:1, v:35 + Math.random()*45, spd:0, phase:Math.random()*6, seed:Math.random()*9,
      minX:Math.max(120, x-range), maxX:Math.min(Scene.W-120, x+range), wait:0, sc:.94 + Math.random()*.1,
      look:{skin:pick(CROWD_LOOKS.skin), hair:pick(CROWD_LOOKS.hair), style:st, cap:pick(CROWD_LOOKS.top), top:pick(CROWD_LOOKS.top), pants:pick(CROWD_LOOKS.pants), acc:Math.random()<.2?['glasses']:[]}});
  }
  return list;
}
function updateCrowd(dt){
  for (const c of G.crowd){
    if (c.wait > 0){ c.wait -= dt; c.spd += (0 - c.spd)*Math.min(1, dt*8); continue; }
    c.x += c.dir*c.v*dt; c.spd += (.5 - c.spd)*Math.min(1, dt*6); c.phase += dt*6;
    if (c.x < c.minX || c.x > c.maxX){ c.dir *= -1; c.x = Math.max(c.minX, Math.min(c.maxX, c.x)); if (Math.random() < .6) c.wait = 1 + Math.random()*3; }
    else if (Math.random() < dt*.05) c.wait = 1 + Math.random()*3;
  }
}
const SPEED = 270, RUN = 440, LANE_MIN = 622, LANE_MAX = 664;

const G = {
  S:null, mode:'menu', diff:'normal', name:'Detective', t:0, camX:0, loc:10, tod:.04,
  player:{x:1300,y:640,dir:1,phase:0,spd:0,act:null}, npcs:[], portals:[], spot:null, focus:null,
  crowd:[], keys:{}, busy:false, auto:null, prevLoc:null, dlg:null, modal:null, log:[], selected:[], talkId:null,
  routeCache:{}, hover:null, hoverRoute:null, shownTime:0, lastStepPhase:0, started:false
};

// ------------------------------------------------------------ server helpers
async function api(p){ const r = await fetch(p); return r.json(); }
async function cmd(c, input){
  const j = await api('/api/cmd?c=' + encodeURIComponent(c) + (input ? '&input=' + encodeURIComponent(input) : ''));
  G.S = j.state; return j.output || '';
}

// ------------------------------------------------------------ small UI helpers
function toast(html, kind){
  const d = document.createElement('div'); d.className = 'toast ' + (kind||''); d.innerHTML = html;
  $('toasts').appendChild(d); setTimeout(()=>d.remove(), 3800);
}
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function addLog(c, text){ G.log.push({c, text}); }

function showDialog({name, face, text, talk}){
  return new Promise(res => {
    text = (text||'').replace(/^\s+/, '').replace(/\s+$/, '');
    if (!text) { res(); return; }
    addLog(name || '', text);
    G.talkId = talk ?? null;
    const d = G.dlg = {res, full:text, i:0, done:false};
    $('dlg').classList.remove('hidden'); $('dlgName').textContent = name || ''; $('dlgFace').innerHTML = face || '';
    $('dlgText').textContent = ''; $('dlgNext').style.opacity = 0;
    d.timer = setInterval(() => {
      d.i = Math.min(d.full.length, d.i + 2); $('dlgText').textContent = d.full.slice(0, d.i); $('dlgText').scrollTop = 1e6;
      if (d.i % 8 === 0) Sfx.talk();
      if (d.i >= d.full.length) { clearInterval(d.timer); d.done = true; $('dlgNext').style.opacity = 1; }
    }, 20);
  });
}
function advanceDialog(){
  const d = G.dlg; if (!d) return false;
  if (!d.done) { clearInterval(d.timer); d.i = d.full.length; $('dlgText').textContent = d.full; d.done = true; $('dlgNext').style.opacity = 1; return true; }
  $('dlg').classList.add('hidden'); G.dlg = null; G.talkId = null; d.res(); return true;
}
function openModal(id){ closeModals(); G.modal = id; $(id).classList.add('open'); Sfx.open(); if (id==='journal'){ renderJournal(); Intro.tutEvent('journal'); } if (id==='suspects') renderSuspects(); if (id==='accuse') renderAccuse(); if (id==='logDrawer') renderLog(); }
function closeModals(){ if (G.modal) Sfx.close(); G.modal = null; ['journal','suspects','accuse','logDrawer','pause'].forEach(i => $(i).classList.remove('open')); }

// ------------------------------------------------------------ HUD
function updateHUD(){
  const S = G.S; if (!S) return;
  const L = S.locations[S.location];
  $('locName').textContent = L.name;
  $('locSub').textContent = (L.searched ? '✓ searched' : '● not searched yet') + ' · ' + S.difficulty;
  $('clockTime').textContent = S.time;
  $('leftTxt').textContent = S.minutesLeft + ' min left';
  const pct = clamp((S.minutesTotal - S.minutesLeft) / S.minutesTotal, 0, 1) * 100;
  $('sunfill').style.width = pct + '%'; $('sun').style.left = pct + '%';
  $('sunbar').classList.toggle('urgent', S.minutesLeft < 30);
  $('sMoves').textContent = S.moves; $('sClues').textContent = S.journal.length; $('sProof').textContent = S.proofsNeeded; $('sHints').textContent = S.hintsLeft;
  $('bBack').disabled = !S.running; $('bSearch').disabled = L.searched || !S.running; $('bHint').disabled = S.hintsLeft <= 0 || !S.running; $('bAccuse').disabled = !S.running;
  G.tod = clamp((S.minutesTotal - S.minutesLeft) / S.minutesTotal, 0, 1);
}

// ------------------------------------------------------------ world building
function enterLocation(loc, from){
  const S = G.S; G.loc = loc;
  const here = mpos(loc), exits = [];
  for (const [a,b,m] of S.edges){ if (a===loc) exits.push({to:b,m}); else if (b===loc) exits.push({to:a,m}); }
  const left = [], right = [];
  for (const e of exits){ const p = mpos(e.to); (p[0] < here[0] - .02 || (Math.abs(p[0]-here[0]) <= .02 && p[1] < here[1]) ? left : right).push(e); }
  const key = e => Math.atan2(mpos(e.to)[1]-here[1], Math.abs(mpos(e.to)[0]-here[0]));
  left.sort((a,b)=>key(a)-key(b)); right.sort((a,b)=>key(a)-key(b));
  G.portals = [];
  left.forEach((e,i) => G.portals.push({to:e.to, x:230+i*210, side:-1, m:e.m}));
  right.forEach((e,i) => G.portals.push({to:e.to, x:Scene.W-230-i*210, side:1, m:e.m}));
  for (const p of G.portals){ p.label = S.locations[p.to].name; p.sub = p.m + ' min walk'; p.locked = S.locations[p.to].locked; }
  const sx = 1300 + (((loc*37)%5)-2)*70;
  G.spot = {x:sx, searched:S.locations[loc].searched};
  G.crowd = makeCrowd(loc); G.npcs = []; let k = 0;
  for (const sus of S.suspects) if (sus.location === loc){
    let x = 880 + k*250; if (Math.abs(x - sx) < 130) x += 170; if (x > 2000) x -= 900;
    G.npcs.push({id:sus.id, name:sus.name, x, y:626 + (k%2)*22, dir:-1, seed:sus.id*1.7, spd:0}); k++;
  }
  const pr = from != null ? G.portals.find(p => p.to === from) : null;
  G.player.x = pr ? pr.x + (pr.side<0 ? 90 : -90) : 1300; G.player.y = 640; G.player.dir = pr ? (pr.side<0 ? 1 : -1) : 1; G.player.act = null; G.player.spd = 0;
  G.camX = clamp(G.player.x - Scene.viewW()/2, 0, Scene.W - Scene.viewW());
  G.auto = null; Scene.loadPhoto(loc); updateHUD();
}
function refreshFlags(){
  const S = G.S; if (!S) return;
  for (const p of G.portals) p.locked = S.locations[p.to].locked;
  if (G.spot) G.spot.searched = S.locations[S.location].searched;
  for (const n of G.npcs){ const s = S.suspects[n.id]; if (s.location !== S.location) n.gone = true; }
}

