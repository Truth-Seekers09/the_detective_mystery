'use strict';
// Presentation only: splash/team screen, guide, opening animation, win/lose effects, case file, tutorial coach.
const Intro = (function(){
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const clamp01 = v => Math.max(0, Math.min(1, v));

  // ---------------------------------------------------------------- splash with real loading information
  async function boot(){
    const S = G.S, fill = $('loadFill'), txt = $('loadTxt');
    const steps = S ? [
      `Reading data/locations.txt … ${S.locations.length} places`,
      `Reading data/connections.txt … ${S.edges.length} routes (graph edges)`,
      `Reading data/suspects.txt … ${S.suspects.length} suspects`,
      `Reading data/clues.txt … ${S.totalClues} clues into the hash table`,
      'Building the campus map (adjacency list) … ready',
      'Starting the detective … ready'
    ] : ['Could not reach the game server. Start hiddentruth_web first.'];
    for (let i = 0; i < steps.length; i++){ txt.textContent = steps[i]; fill.style.width = ((i+1)/steps.length*100) + '%'; await pause(S ? 560 : 100); }
    if (!S) return;
    $('pressKey').classList.add('on');
    await new Promise(res => { const go = () => { removeEventListener('keydown', go); removeEventListener('mousedown', go); res(); }; addEventListener('keydown', go); addEventListener('mousedown', go); });
    Sfx.unlock(); Sfx.startAmbient(); Sfx.click();
    $('splash').classList.remove('open'); G.mode = 'menu';
    let seen = false; try { seen = localStorage.getItem('ht_guide') === '1'; } catch(e){}
    if (!seen){ try { localStorage.setItem('ht_guide','1'); } catch(e){} openGuide(true); } else $('menu').classList.add('open');
  }

  // ---------------------------------------------------------------- guide
  const PAGES = [
    {t:'Your mission', h:() => `<p class="gp">On the morning of the Data Structures exam, the sealed question paper has vanished from the <b>Exam Cell</b> in the CSIT basement. You are the detective. Find the thief before the exam starts at <b>10:00 AM</b>.</p>
      <div class="gcards"><div class="gc"><b>12 places</b>Real campus blocks, cafes, gates and the convention centre.</div><div class="gc"><b>12 suspects</b>Everyone has a motive and an alibi. Not all of it is true.</div><div class="gc"><b>${G.S?G.S.totalClues:33} clues</b>Documents, objects and witness statements hidden around campus.</div><div class="gc"><b>1 accusation</b>One chance. A wrong name ends the case.</div></div>`},
    {t:'Move and act', h:() => `<p class="gp">You walk through the campus yourself, side-on, like a small game.</p>
      <div class="gcards"><div class="gc"><b>Walk</b><span class="keyrow"><span><kbd>A</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>→</kbd></span><span><kbd>Shift</kbd> run</span><span><kbd>W</kbd><kbd>S</kbd> closer / further</span></span></div>
      <div class="gc"><b>Interact</b>Press <kbd>E</kbd> at a glowing doorway to travel, or next to a person to interrogate them.</div>
      <div class="gc"><b>Search</b>Walk to the glowing ✦ and press <kbd>F</kbd>. Every place is searched once.</div>
      <div class="gc"><b>Menus</b><kbd>J</kbd> evidence · <kbd>U</kbd> suspects · <kbd>H</kbd> hint · <kbd>M</kbd> big map · <kbd>L</kbd> log · <kbd>X</kbd> accuse</div></div>`},
    {t:'Time and routes', h:() => `<p class="gp">Everything costs minutes on the exam clock. When it reaches 10:00, you lose.</p>
      <div class="gcards"><div class="gc"><b>Walking</b>Each route shows its real walking time. Gate 1 to Gate 2 is 10 minutes!</div><div class="gc"><b>Actions</b>Search 10 · interrogate 15 · hint 15 · combine clues 5 minutes.</div><div class="gc"><b>The map</b>Click any place on the small map to auto-walk there by the <b>fastest route</b>.</div><div class="gc"><b>Locked places</b>The Exam Cell and the Silver Jubilee Convention Centre open only when you hold the right clue.</div></div>`},
    {t:'Solve the case', h:() => `<p class="gp">Collect evidence, then think.</p>
      <div class="gcards"><div class="gc"><b>Evidence board</b>Every clue is pinned as a card. Select two and press Combine to deduce something new.</div><div class="gc"><b>Interrogate</b>Suspects say more when you show up with the right clue.</div><div class="gc"><b>Proof needed</b>Normal needs 6 pieces of solid proof against the right person. Easy 4, Detective 7.</div><div class="gc"><b>Your one accusation</b>Wrong person, or too little proof, ends the game. Take your time before pressing accuse.</div></div>`}
  ];
  let gi = 0, gFromBoot = false;
  function openGuide(fromBoot){ gi = 0; gFromBoot = !!fromBoot; $('menu').classList.remove('open'); $('guide').classList.add('open'); G.modal = 'guideModal'; renderGuide(); }
  function renderGuide(){
    const p = PAGES[gi]; $('gTitle').textContent = p.t; $('gStep').textContent = 'Step ' + (gi+1) + ' of ' + PAGES.length;
    $('gBody').innerHTML = p.h(); $('gBody').style.animation = 'none'; void $('gBody').offsetWidth; $('gBody').style.animation = '';
    $('gDots').innerHTML = PAGES.map((_, i) => `<i class="${i===gi?'on':''}"></i>`).join('');
    $('gBack').style.visibility = gi ? 'visible' : 'hidden'; $('gNext').textContent = gi === PAGES.length-1 ? "Let's play" : 'Next';
  }
  function closeGuide(){ $('guide').classList.remove('open'); if (G.modal === 'guideModal') G.modal = null; if (G.mode === 'menu') $('menu').classList.add('open'); }
  function wireGuide(){
    $('gNext').onclick = () => { Sfx.click(); if (gi < PAGES.length-1){ gi++; renderGuide(); } else closeGuide(); };
    $('gBack').onclick = () => { Sfx.click(); if (gi) { gi--; renderGuide(); } };
    document.querySelector('#guide [data-close]').onclick = closeGuide;
  }
  // ---------------------------------------------------------------- opening animation (canvas, ~14 s, skippable)
  function playOpening(){
    return new Promise(res => {
      const S = G.S, root = $('opening'), cv = $('openCv'), c = cv.getContext('2d'), dpr = Math.min(devicePixelRatio||1, 2);
      const W = innerWidth, H = innerHeight; cv.width = W*dpr; cv.height = H*dpr; c.setTransform(dpr,0,0,dpr,0,0); root.classList.add('on');
      const words = [];
      S.locations.forEach(l => words.push(l.name.toUpperCase())); S.suspects.forEach(s => words.push(s.name.toUpperCase()));
      for (let i = 1; i <= Math.min(28, S.totalClues); i++) words.push('C' + String(i).padStart(2,'0') + ' · EVIDENCE');
      const cols = Array.from({length: Math.ceil(W/120)}, (_, i) => ({x: i*120+20, y: Math.random()*H, v: 380 + Math.random()*620, off: (Math.random()*words.length)|0, hue: i%3}));
      const flashes = [[6.2,S.locations.length+' PLACES'],[6.9,S.suspects.length+' SUSPECTS'],[7.6,S.totalClues+' CLUES'],[8.3,'7:00 AM'],[8.9,'10:00 AM'],[9.6,'ONE ACCUSATION']];
      const DUR = 14.6, T0 = performance.now(); let raf = 0, done = false, hitDone = {};
      const finish = () => { if (done) return; done = true; cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('mousedown', finish); root.classList.remove('on'); res(); };
      const key = e => { if (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter'){ e.preventDefault(); finish(); } };
      addEventListener('keydown', key); addEventListener('mousedown', finish); Sfx.whoosh();
      const text = (t, x, y, size, col, a, font, sp) => { c.save(); c.globalAlpha = Math.max(0, Math.min(1, a)); c.font = `${font||'500'} ${size}px ${getComputedStyle(document.body).fontFamily}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; if (sp !== undefined && 'letterSpacing' in c) c.letterSpacing = sp + 'px'; c.fillText(t, x, y); c.restore(); };
      const serif = '"Iowan Old Style","Palatino Linotype",Georgia,serif';
      const serifText = (t, x, y, size, col, a, sp) => { c.save(); c.globalAlpha = Math.max(0, Math.min(1, a)); c.font = `500 ${size}px ${serif}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; if (sp !== undefined && 'letterSpacing' in c) c.letterSpacing = sp + 'px'; c.shadowColor = 'rgba(255,200,100,.5)'; c.shadowBlur = 30; c.fillText(t, x, y); c.restore(); };
      let last = T0;
      function frame(now){
        if (done) return; const t = (now - T0)/1000, dt = Math.min(.05, (now-last)/1000); last = now;
        const bg = c.createRadialGradient(W/2, H*.45, 0, W/2, H*.45, Math.max(W,H)*.8); bg.addColorStop(0,'#10162c'); bg.addColorStop(1,'#020308'); c.fillStyle = bg; c.fillRect(0,0,W,H);
        // phase 1: title
        if (t < 6){
          const a = clamp01(t/1.2) * clamp01((5.6 - t)/.6);
          serifText('GRAPHIC ERA', W/2, H*.44, Math.min(W*.085, 92), '#f3eee2', a, 10 + (1 - clamp01(t/3))*22);
          text('DEEMED TO BE UNIVERSITY · DEHRADUN', W/2, H*.44 + Math.min(W*.05, 64), Math.min(W*.014, 15), '#ffd36b', clamp01((t-1)/1.2) * clamp01((5.6-t)/.6), '600', 6);
          c.fillStyle = `rgba(255,211,107,${a*.8})`; const lw = clamp01((t-.4)/2.4) * Math.min(W*.5, 520); c.fillRect(W/2 - lw/2, H*.44 + Math.min(W*.05, 64)*1.9, lw, 2);
          if (t > 3.2){ const b = clamp01((t-3.2)/.8) * clamp01((5.7-t)/.5); text('Welcome, Detective.', W/2, H*.66, Math.min(W*.03, 34), '#e9e3d1', b, '400'); }
        }
        // phase 3: speed montage
        if (t > 5.6 && t < 11.4){
          const ma = clamp01((t-5.6)/.6) * clamp01((11.2-t)/.4);
          c.save(); c.font = '600 14px ui-monospace,Consolas,Menlo,monospace'; c.textAlign = 'left';
          for (const col of cols){ col.y -= col.v*dt; if (col.y < -words.length*26) col.y += words.length*26 + H;
            for (let k = 0; k < 40; k++){ const y = col.y + k*26; if (y < -20 || y > H+20) continue; c.globalAlpha = ma * (.12 + .5 * (1 - Math.abs(y/H - .5)*2)) * (k%5 ? .55 : 1);
              c.fillStyle = col.hue === 0 ? '#ffd36b' : col.hue === 1 ? '#7cf0d6' : '#9fb4ff'; c.fillText(words[(col.off + k) % words.length], col.x, y); } }
          c.restore();
          let fl = null; for (const f of flashes) if (t >= f[0] && t < f[0] + .62) fl = f;
          if (fl){ const k = (t - fl[0])/.62, sc = 1.25 - .25*Math.min(1, k*4); if (!hitDone[fl[0]]){ hitDone[fl[0]] = 1; Sfx.hit(flashes.indexOf(fl)); }
            c.save(); c.translate(W/2 + (Math.random()-.5)*(1-k)*8, H/2); c.scale(sc, sc); serifText(fl[1], 0, 0, Math.min(W*.075, 84), '#fff', 1 - k*k*.6, 6); c.restore();
            c.fillStyle = `rgba(255,255,255,${(1-k)*.18})`; c.fillRect(0,0,W,H); }
          text('LOADING THE CASE…', W/2, H - 40, 11, '#7e88a6', ma*.8, '600', 5);
        }
        // phase 4: tagline with a roaming spotlight
        if (t > 11.2){
          const k = clamp01((t-11.2)/1.2), out = clamp01((DUR - t)/1.0);
          const sx = W/2 + Math.sin(t*1.4)*W*.2, sg = c.createRadialGradient(sx, H*.5, 0, sx, H*.5, Math.max(W,H)*.45); sg.addColorStop(0, `rgba(255,236,190,${.22*k*out})`); sg.addColorStop(1,'rgba(255,236,190,0)'); c.fillStyle = sg; c.fillRect(0,0,W,H);
          serifText('Get ready for a', W/2, H*.43, Math.min(W*.04, 44), '#e9e3d1', k*out, 2); serifText('mysterious journey…', W/2, H*.43 + Math.min(W*.06, 70), Math.min(W*.068, 78), '#ffd36b', clamp01((t-11.8)/1.0)*out, 3);
        }
        // letterbox
        c.fillStyle = '#000'; const bh = H*.09; c.fillRect(0,0,W,bh); c.fillRect(0,H-bh,W,bh);
        if (t >= DUR) { finish(); return; }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    });
  }


