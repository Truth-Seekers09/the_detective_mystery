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

// ------------------------------------------------------------ movement
function walkTo(x){
  return new Promise(res => { x = clamp(x, 70, Scene.W-70); if (Math.abs(G.player.x - x) < 14) { res(); return; } G.auto = {x, res}; });
}
function update(dt){
  const P = G.player; updateCrowd(dt);
  if (G.mode === 'menu'){
    P.x = 1300 + Math.sin(G.t*.25)*260; P.dir = Math.cos(G.t*.25) > 0 ? 1 : -1; P.spd = .55; P.phase += dt*8; P.y = 640;
    G.camX = 900 + Math.sin(G.t*.12)*240; G.tod = .05 + (Math.sin(G.t*.05)+1)*.04; return;
  }
  const locked = G.busy || G.dlg || G.modal;
  let dx = 0, dy = 0, run = false;
  if (!locked && !G.auto){
    const K = G.keys; dx = (K.ArrowRight||K.d?1:0) - (K.ArrowLeft||K.a?1:0); dy = (K.ArrowDown||K.s?1:0) - (K.ArrowUp||K.w?1:0); run = K.Shift;
  } else if (G.auto && !G.dlg && !G.modal){
    const d = G.auto.x - P.x; if (Math.abs(d) < 10){ const r = G.auto.res; G.auto = null; r(); } else dx = Math.sign(d); run = Math.abs(d) > 500;
  }
  if (G.auto && (G.keys.ArrowLeft||G.keys.ArrowRight||G.keys.a||G.keys.d) && !G.busy){ const r = G.auto.res; G.auto = null; r(); }
  const sp = run ? RUN : SPEED;
  if (dx){ P.x = clamp(P.x + dx*sp*dt, 60, Scene.W-60); P.dir = dx; G.walked = (G.walked||0) + sp*dt; if (G.walked > 160) Intro.tutEvent('moved'); }
  if (dy){ P.y = clamp(P.y + dy*130*dt, LANE_MIN, LANE_MAX); }
  const moving = dx || dy;
  P.spd += ((moving ? (run ? 1 : .8) : 0) - P.spd) * Math.min(1, dt*12);
  if (P.spd > .02){ P.phase += dt * (run ? 13 : 9.5) * (dx||dy ? 1 : 0.5); const step = Math.floor(P.phase/Math.PI); if (step !== G.lastStepPhase){ G.lastStepPhase = step; if (P.spd > .3) Sfx.step(); } }
  // npcs turn towards the detective
  for (const n of G.npcs){ n.dir = P.x < n.x ? -1 : 1; n.act = (G.talkId === n.id) ? 'talk' : null; }
  // camera
  const vw = Scene.viewW(), target = clamp(P.x - vw/2 + P.dir*60, 0, Scene.W - vw);
  G.camX += (target - G.camX) * Math.min(1, dt*5);
  // focus
  G.focus = null;
  if (!locked && !G.auto){
    let best = 1e9; const consider = (kind, i, x, prompt, reach) => { const d = Math.abs(x - P.x); if (d < reach && d < best){ best = d; G.focus = {kind, i, x, prompt, key:'E'}; } };
    G.portals.forEach((p,i) => consider('portal', i, p.x, (p.locked ? 'Locked · try the door' : 'Go to ' + p.label + ' · ' + p.m + ' min'), 80));
    G.npcs.forEach((n,i) => consider('npc', i, n.x, 'Interrogate ' + n.name.split(' ').slice(-1)[0] + ' · 15 min', 95));
    if (G.spot && !G.spot.searched) consider('spot', 0, G.spot.x, 'Search here · 10 min', 80);
  }
}

// ------------------------------------------------------------ actions
async function afterCommand(){
  updateHUD(); refreshFlags();
  if (!G.S.running){ await endGame(); return true; }
  return false;
}
async function doSearch(){
  if (G.busy || !G.S.running) return; const S = G.S;
  if (S.locations[S.location].searched){ toast('Already searched here', 'info'); return; }
  G.busy = true; await walkTo(G.spot.x); G.player.act = 'search'; Sfx.click(); await sleep(1300);
  const out = await cmd('search'); G.player.act = null; Intro.tutEvent('searched');
  const finds = [...out.matchAll(/\[([A-Z ]+)\]\s+(.+?)\s+\(([CD]\d\d)\)/g)];
  if (finds.length){ Sfx.find(); finds.forEach((m,i) => setTimeout(() => toast(`🔎 <b>${esc(m[2])}</b><small>${esc(m[1].toLowerCase())} · ${m[3]} added to evidence board</small>`), i*450)); }
  else toast('Nothing new here', 'info');
  if (/unlocks/i.test(out)) setTimeout(() => { Sfx.open(); toast('🔓 A new place is now open', 'info'); }, 600);
  updateHUD(); refreshFlags();
  await showDialog({name:'You search the area', face:detectivePortraitSVG(), text:out});
  G.busy = false; await afterCommand();
}
async function doInterrogate(n){
  if (G.busy || !G.S.running) return; G.busy = true; await walkTo(n.x + (G.player.x < n.x ? -70 : 70)); G.player.dir = G.player.x < n.x ? 1 : -1;
  const out = await cmd('interrogate ' + n.id); Sfx.click(); Intro.tutEvent('talked');
  const sus = G.S.suspects[n.id]; updateHUD();
  await showDialog({name:sus.name, face:portraitSVG(n.id), text:out, talk:n.id});
  G.busy = false; await afterCommand();
}
async function doHint(){
  if (G.busy || !G.S.running) return; if (G.S.hintsLeft <= 0){ toast('No hints left', 'bad'); return; }
  G.busy = true; const out = await cmd('hint'); Sfx.find(); updateHUD();
  await showDialog({name:'Your instinct', face:detectivePortraitSVG(), text:out}); G.busy = false; await afterCommand();
}
// Cover the scene with black at once (no fade), so the menu's backdrop photo never shows between the menu and the game.
function blackNow(){ const f = $('fade'); f.style.transition = 'none'; f.style.opacity = 1; void f.offsetWidth; }
function blackDone(){ $('fade').style.transition = ''; }
async function fade(on){ $('fade').style.opacity = on ? 1 : 0; await sleep(380); }
async function travel(to, opts = {}){
  if (G.busy && !opts.inner) return false; G.busy = true;
  const S = G.S, from = S.location, p = G.portals.find(q => q.to === to);
  if (p && !opts.skipWalk) await walkTo(p.x);
  const before = S.time; Sfx.travel(); $('cine').classList.add('on'); await fade(true);
  const out = await cmd('go ' + to);
  if (G.S.location === from){          // blocked (locked door, not connected…)
    $('cine').classList.remove('on'); await fade(false); Sfx.lock();
    toast('🔒 ' + esc(out.trim().split('\n')[0] || 'You cannot go there'), 'bad'); G.busy = false; return false;
  }
  G.prevLoc = from; enterLocation(G.S.location, from); updateHUD();
  const L = G.S.locations[G.S.location];
  $('tcSmall').textContent = G.S.time; $('tcBig').textContent = L.name; $('tcSub').textContent = '+' + (p ? p.m : '') + ' min on foot';
  $('cine').classList.add('title'); await fade(false); await sleep(900); $('cine').classList.remove('title','on');
  Intro.tutEvent('traveled'); G.busy = false; return !(await afterCommand());
}
// Back: pops the movement history (a Stack in the C++ Player class).
async function doBack(){
  if (G.busy || G.dlg || G.modal || !G.S.running) return;
  const from = G.S.location; G.busy = true;
  const out = await cmd('back');
  if (G.S.location === from){ toast('↩ ' + esc(out.trim().split('\n')[0] || 'Nowhere to go back to yet'), 'info'); G.busy = false; return; }
  Sfx.travel(); $('cine').classList.add('on'); await fade(true);
  G.prevLoc = from; enterLocation(G.S.location, from); updateHUD();
  $('tcSmall').textContent = G.S.time; $('tcBig').textContent = G.S.locations[G.S.location].name; $('tcSub').textContent = 'Back the way you came';
  $('cine').classList.add('title'); await fade(false); await sleep(800); $('cine').classList.remove('title','on');
  G.busy = false; await afterCommand();
}
async function autoRoute(to){
  if (G.busy || !G.S.running) return; if (to === G.S.location) return;
  const r = await api('/api/route?to=' + to);
  if (!r.path.length){ toast('🔒 No open route there right now', 'bad'); return; }
  toast(`🧭 Fastest route: <b>${r.minutes} min</b><small>${r.path.map(i => sname(i)).join(' → ')}</small>`, 'info');
  for (let i = 1; i < r.path.length; i++){ const ok = await travel(r.path[i]); if (!ok) break; }
}

// ------------------------------------------------------------ journal / suspects / accuse
function renderJournal(){
  const S = G.S, box = $('cards'); box.innerHTML = ''; G.selected = [];
  if (!S.journal.length) box.innerHTML = '<div class="empty">Your board is empty. Search places and question people to pin evidence here.</div>';
  S.journal.forEach((c,i) => {
    const d = document.createElement('div'); d.className = 'card' + (c.id[0]==='D' ? ' ded' : ''); d.dataset.id = c.id; d.style.animationDelay = (i*40) + 'ms';
    d.innerHTML = `<span class="id">${c.id}</span><div class="t">${c.id[0]==='D' ? 'Deduction' : esc(c.type)}</div><h4>${esc(c.name)}</h4><div>${esc(c.description)}</div>`;
    d.onclick = () => { Sfx.click(); const k = G.selected.indexOf(c.id); if (k >= 0) G.selected.splice(k,1); else { if (G.selected.length === 2) G.selected.shift(); G.selected.push(c.id); } syncSelection(); };
    box.appendChild(d);
  });
  syncSelection();
}
function syncSelection(){
  document.querySelectorAll('#cards .card').forEach(c => c.classList.toggle('sel', G.selected.includes(c.dataset.id)));
  $('bDeduce').disabled = G.selected.length !== 2 || G.busy;
  const svg = $('strings'); svg.innerHTML = '';
  if (G.selected.length === 2){
    const b = $('board').getBoundingClientRect(), [x,y] = G.selected.map(id => { const r = document.querySelector(`#cards .card[data-id="${id}"]`).getBoundingClientRect(); return [r.left - b.left + r.width/2, r.top - b.top + 2]; }).reduce((a,c)=>[[...a[0],c[0]],[...a[1],c[1]]],[[],[]]);
    svg.innerHTML = `<path d="M${x[0]},${y[0]} Q${(x[0]+x[1])/2},${Math.max(y[0],y[1])+70} ${x[1]},${y[1]}" stroke="#ff4b44" stroke-width="3" fill="none" stroke-dasharray="1 0"/><circle cx="${x[0]}" cy="${y[0]}" r="5" fill="#ff4b44"/><circle cx="${x[1]}" cy="${y[1]}" r="5" fill="#ff4b44"/>`;
    $('deduceHint').textContent = 'Ready: ' + G.selected.join(' + ');
  } else $('deduceHint').textContent = 'Pick two clue cards.';
}
async function doDeduce(){
  if (G.selected.length !== 2 || G.busy) return; const [a,b] = G.selected;
  const out = await cmd(`deduce ${a} ${b}`); updateHUD();
  if (/click together/i.test(out)){ Intro.tutEvent('deduced'); Sfx.deduce(); toast('🧩 <b>New deduction!</b><small>Check the gold card</small>'); }
  else { Sfx.close(); toast(esc(out.trim().split('\n')[0]), 'info'); }
  addLog('Deduce ' + a + ' + ' + b, out.trim()); renderJournal(); await afterCommand();
}
function renderSuspects(){
  const S = G.S, grid = $('sgrid'); grid.innerHTML = '';
  S.suspects.forEach(s => {
    const here = s.location === S.location, d = document.createElement('div'); d.className = 'sus';
    d.innerHTML = `<div class="top">${portraitSVG(s.id)}<div><h4>${esc(s.name)}</h4><div class="role">${esc(s.role)}</div><div class="where">📍 ${esc(S.locations[s.location].name)}${here ? ' · here now' : ''}</div></div></div>
      <dl><dt>Motive</dt><dd>${esc(s.motive)}</dd><dt>Their alibi</dt><dd>${esc(s.alibi)}</dd><dt>First statement</dt><dd>${esc(s.statement)}</dd></dl>
      <div class="row"><button class="btn" data-a="go">${here ? 'Talk now' : 'Take me there'}</button><button class="btn danger" data-a="acc">Accuse</button></div>`;
    d.querySelector('[data-a=go]').onclick = () => { closeModals(); if (here) { const n = G.npcs.find(n => n.id === s.id); if (n) doInterrogate(n); } else autoRoute(s.location); };
    d.querySelector('[data-a=acc]').onclick = () => { openModal('accuse'); pickAccuse(s.id); };
    grid.appendChild(d);
  });
}
let accuseId = null;
function renderAccuse(){
  const S = G.S; accuseId = null;
  $('accuseText').innerHTML = `<p>Name the person who took the paper. You hold <b>${S.journal.length} clues</b>, and the case needs <b>${S.proofsNeeded}</b> pieces of solid proof against the right person. A wrong name — or the right name without enough proof — ends the investigation.</p>
   <div id="accGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;margin:14px 0"></div><p id="accPick" style="color:var(--muted)">Choose a suspect.</p>`;
  S.suspects.forEach(s => {
    const b = document.createElement('button'); b.className = 'btn'; b.dataset.id = s.id; b.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 6px;font-size:12px';
    b.innerHTML = `<span style="width:56px;height:56px;display:block;border-radius:12px;overflow:hidden">${portraitSVG(s.id)}</span>${esc(s.name)}`; b.onclick = () => pickAccuse(s.id); $('accGrid').appendChild(b);
  });
  $('accuseGo').disabled = true;
}
function pickAccuse(id){
  accuseId = id; Sfx.click(); document.querySelectorAll('#accGrid .btn').forEach(b => { b.style.outline = (+b.dataset.id === id) ? '2px solid var(--red)' : 'none'; });
  $('accPick').innerHTML = `You are about to accuse <b>${esc(G.S.suspects[id].name)}</b>. There is no undo.`; $('accuseGo').disabled = false;
}
async function doAccuse(){
  if (accuseId == null || G.busy) return; const id = accuseId; closeModals(); G.busy = true;
  Sfx.lock(); const out = await cmd('accuse ' + id, 'YES\n' + G.name + '\n'); addLog('Accusation', out.trim()); Intro.tutEvent('accused');
  G.busy = false; updateHUD(); G.lastOut = out; await endGame();
}

// ------------------------------------------------------------ log / map
function renderLog(){ $('logBody').innerHTML = G.log.length ? G.log.map(l => `<div class="lg"><span class="c">${esc(l.c)}</span>${esc(l.text)}</div>`).join('') : '<div class="empty">Nothing yet.</div>'; $('logBody').scrollTop = 1e6; }
const mapEl = $('map'), mctx = mapEl.getContext('2d');
function drawMap(){
  const S = G.S; if (!S) return; const dpr = Math.min(devicePixelRatio||1, 2), w = Math.floor(mapEl.clientWidth * dpr);
  if (!w) return; if (mapEl.width !== w){ mapEl.width = w; mapEl.height = Math.floor(w*440/560); }
  const W = mapEl.width, H = mapEl.height, c = mctx; c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,W,H);
  const g = c.createLinearGradient(0,0,0,H); g.addColorStop(0,'#142238'); g.addColorStop(1,'#0c1424'); c.fillStyle = g; c.beginPath(); c.roundRect ? c.roundRect(0,0,W,H,14*dpr) : c.rect(0,0,W,H); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; for (let x = 0; x < W; x += 28*dpr){ c.beginPath(); c.moveTo(x,0); c.lineTo(x,H); c.stroke(); } for (let y = 0; y < H; y += 28*dpr){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); }
  const P = id => [mpos(id)[0]*(W-70*dpr)+35*dpr, mpos(id)[1]*(H-62*dpr)+26*dpr], t = G.t, cur = S.location;
  c.font = `${600*1} ${10*dpr}px "Segoe UI",system-ui,sans-serif`; c.textAlign = 'center';
  const route = G.hoverRoute || [], onRoute = (a,b) => { const i = route.indexOf(a); return i >= 0 && (route[i+1] === b || route[i-1] === b); };
  for (const [a,b,m] of S.edges){
    const A = P(a), B = P(b), hl = onRoute(a,b), far = m >= 8;
    c.strokeStyle = hl ? '#ffd36b' : 'rgba(150,180,220,.35)'; c.lineWidth = (hl ? 4 : 2.2) * dpr; c.setLineDash(far ? [6*dpr,5*dpr] : []); c.beginPath(); c.moveTo(A[0],A[1]); c.lineTo(B[0],B[1]); c.stroke(); c.setLineDash([]);
    const mx = (A[0]+B[0])/2, my = (A[1]+B[1])/2; c.fillStyle = hl ? '#ffd36b' : 'rgba(12,20,36,.9)'; c.beginPath(); c.arc(mx,my,8*dpr,0,6.283); c.fill();
    c.fillStyle = hl ? '#2a1c04' : '#9fb4d8'; c.textBaseline = 'middle'; c.fillText(m, mx, my+.5*dpr);
  }
  for (const L of S.locations){
    const [x,y] = P(L.id), isCur = L.id === cur, hov = G.hover === L.id, r = (isCur ? 13 : 10) * dpr;
    if (isCur){ const pu = (Math.sin(t*3)+1)/2; c.fillStyle = `rgba(255,211,107,${.12+.18*pu})`; c.beginPath(); c.arc(x,y,r+8*dpr+pu*7*dpr,0,6.283); c.fill(); }
    c.fillStyle = L.locked ? '#4a2326' : isCur ? '#ffd36b' : hov ? '#9fe8ff' : '#2b4a74'; c.strokeStyle = L.locked ? '#ff6b64' : isCur ? '#fff2c0' : 'rgba(180,210,255,.6)'; c.lineWidth = 2*dpr;
    c.beginPath(); c.arc(x,y,r,0,6.283); c.fill(); c.stroke();
    c.textBaseline = 'middle'; c.font = `${12*dpr}px sans-serif`; c.fillStyle = '#fff';
    if (L.locked) c.fillText('🔒', x, y+1*dpr); else if (L.searched && !isCur){ c.fillStyle = '#6be6a0'; c.fillText('✓', x, y+1*dpr); } else if (isCur){ c.fillStyle = '#2a1c04'; c.fillText('★', x, y+1*dpr); }
    c.font = `600 ${10*dpr}px "Segoe UI",system-ui,sans-serif`; c.textBaseline = 'alphabetic'; c.fillStyle = isCur ? '#ffe9a8' : '#cfe0ff'; c.fillText(sname(L.id), x, y + r + 12*dpr);
  }
}
function mapHit(e){
  const S = G.S; if (!S) return null; const r = mapEl.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height, W = mapEl.width/ (Math.min(devicePixelRatio||1,2)), H = W*440/560;
  let best = null, bd = 1e9; for (const L of S.locations){ const px = (mpos(L.id)[0]*(W-70)+35)/W, py = (mpos(L.id)[1]*(H-62)+26)/H, d = Math.hypot((fx-px)*W, (fy-py)*H); if (d < 24 && d < bd){ bd = d; best = L.id; } } return best;
}
mapEl.addEventListener('mousemove', async e => {
  const id = mapHit(e); G.hover = id; mapEl.style.cursor = id != null && id !== G.S?.location ? 'pointer' : 'default';
  if (id == null || id === G.S.location){ G.hoverRoute = null; $('mapTip').textContent = ''; return; }
  const k = G.S.location + '>' + id + '#' + G.S.locations.map(l => l.locked ? 1 : 0).join('');
  if (!G.routeCache[k]) G.routeCache[k] = await api('/api/route?to=' + id);
  if (G.hover !== id) return; const r = G.routeCache[k]; G.hoverRoute = r.path;
  $('mapTip').textContent = r.path.length ? `${sname(id)}: ${r.minutes} min · click to travel` : `${sname(id)}: no open route (locked?)`;
});
mapEl.addEventListener('mouseleave', () => { G.hover = null; G.hoverRoute = null; $('mapTip').textContent = ''; });
mapEl.addEventListener('click', e => { const id = mapHit(e); if (id != null && !G.modal && !G.dlg) { Sfx.click(); autoRoute(id); } });

// ------------------------------------------------------------ end of game
async function endGame(){
  const S = G.S; G.busy = true; let out = G.lastOut || ''; G.lastOut = '';
  if (!out) out = S.outcome === 'lost_time' ? 'The clock strikes 10:00. The exam begins, and the paper is already out. The thief walks free.' : '';
  out = out.split('\n').filter(l => !/^You are about to accuse|^Type YES|Detective name|^High scores|^\s+\d+\.\s/.test(l)).join('\n').replace(/\n{3,}/g,'\n\n');
  const win = S.outcome === 'solved', prac = S.tutorial; await sleep(500);
  if (G.dlg) advanceDialog();
  closeModals();
  // celebration (or a sombre close) before the result screen
  $('tcSmall').textContent = win ? 'Congratulations, Detective' : S.outcome === 'lost_time' ? 'Time is up' : 'The culprit walks free';
  $('tcBig').textContent = prac ? (win ? 'Practice complete' : 'Practice over') : (win ? 'Case solved' : 'Case closed');
  $('tcSub').textContent = win ? 'The truth was hidden. Not anymore.' : 'Some truths stay hidden a little longer.';
  $('cine').classList.add('on', 'title'); win ? (Sfx.fanfare(), Intro.fxStart('win', 9)) : (Sfx.lose(), Intro.fxStart('lose', 8));
  await sleep(win ? 3200 : 2600); $('cine').classList.remove('title', 'on');
  $('verdict').textContent = $('tcBig').textContent; $('verdict').className = 'verdict ' + (win ? 'win' : 'lose');
  $('scoreline').innerHTML = prac ? '' : `<div><b>${S.score}</b><span>score</span></div><div><b>${S.moves}</b><span>moves</span></div><div><b>${S.journal.length}</b><span>clues</span></div><div><b>${S.minutesTotal - S.minutesLeft}</b><span>minutes used</span></div>`;
  $('endText').textContent = out.trim();
  $('fileBtn').classList.toggle('hidden', prac); $('realBtn').classList.toggle('hidden', !prac); $('againBtn').firstChild.textContent = prac ? 'Back to menu ' : 'Play again ';
  $('scoresTbl').innerHTML = '';
  if (!prac) try {
    const txt = await (await fetch('/api/scores')).text(), rows = txt.split('\n').filter(l => l.trim() && l[0] !== '#').slice(0,5);
    $('scoresTbl').innerHTML = rows.length ? '<tr><td colspan="2" style="color:var(--muted);font-size:10px;letter-spacing:2px;text-transform:uppercase">High scores</td></tr>' + rows.map(l => { const p = l.split('|'); return `<tr><td>${esc(p[0])}</td><td>${esc(p[1] || '')}</td></tr>`; }).join('') : '';
  } catch(e){}
  $('end').classList.add('open');
}

