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

