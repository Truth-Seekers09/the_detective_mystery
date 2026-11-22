'use strict';
// Looks for every suspect (used by both the SVG portraits and the walking characters).
const LOOKS = [
  {skin:'#c89b72',hair:'#1b1b1b',style:'short', top:'#e4e8ee',acc:['glasses','stubble'],pants:'#3b4252',tag:'lab coat'},   // 0 Anand
  {skin:'#e0ac84',hair:'#2a1a14',style:'long',  top:'#7a5cc4',acc:[],pants:'#2d3348'},                                  // 1 Neha
  {skin:'#d9a67c',hair:'#3a2a22',style:'bun',   top:'#3f8f6f',acc:['glasses'],pants:'#3a3a48'},                         // 2 Seema
  {skin:'#b98458',hair:'#1a1a1a',style:'cap',   top:'#2c3e5e',acc:['mustache'],pants:'#1f2a40',cap:'#22304d'},          // 3 Rawat
  {skin:'#d8a47e',hair:'#2a2018',style:'messy', top:'#e0663f',acc:[],pants:'#2b3a55'},                                  // 4 Rohit
  {skin:'#cc9a74',hair:'#9a9a9a',style:'short', top:'#2b3550',acc:['glasses','tie'],pants:'#232a40'},                   // 5 Sethi
  {skin:'#e2b08a',hair:'#1a1210',style:'pony',  top:'#e8b04a',acc:[],pants:'#40324a'},                                  // 6 Pooja
  {skin:'#b98a60',hair:'#222',   style:'cap',   top:'#f08a24',acc:[],pants:'#2f3544',cap:'#d9d9d9'},                    // 7 Sandeep
  {skin:'#d3a07a',hair:'#20161c',style:'bob',   top:'#8b2f4b',acc:['glasses'],pants:'#2a2232'},                         // 8 Meera
  {skin:'#caa07a',hair:'#181818',style:'quiff', top:'#2b8c8c',acc:['lanyard'],pants:'#2e3445'},                        // 9 Kabir
  {skin:'#e5b693',hair:'#4a2a1a',style:'long',  top:'#3a6ea5',acc:['glasses'],pants:'#262c40'},                         // 10 Isha
  {skin:'#b07d52',hair:'#1a1a1a',style:'cap',   top:'#4a4f3a',acc:['mustache'],pants:'#2c2f24',cap:'#3a3e2d'}           // 11 Chauhan
];
const BG_TINTS = ['#2b3a67','#3b2b5f','#1f4f5a','#5a2f3f','#2f4f3a','#4a3b22','#2a2f55','#553a2a','#3a2f55','#1f4a4a','#3f3a2a','#2a4a3f'];

function portraitSVG(id){
  const L = LOOKS[id % LOOKS.length], bg = BG_TINTS[id % BG_TINTS.length];
  let s = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="pg${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#0c1020"/></linearGradient>
  <radialGradient id="pr${id}" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
  <rect width="100" height="100" fill="url(#pg${id})"/><rect width="100" height="100" fill="url(#pr${id})"/>`;
  // hair behind head
  if (L.style==='long') s += `<path d="M26 52 Q24 20 50 18 Q76 20 74 52 L76 86 L24 86Z" fill="${L.hair}"/>`;
  if (L.style==='bob')  s += `<path d="M27 56 Q24 20 50 18 Q76 20 73 56 L70 62 L30 62Z" fill="${L.hair}"/>`;
  if (L.style==='pony') s += `<path d="M68 34 Q90 40 82 66 Q78 52 66 46Z" fill="${L.hair}"/>`;
  // shoulders / top
  s += `<path d="M8 100 Q10 70 36 66 L64 66 Q90 70 92 100Z" fill="${L.top}"/><path d="M40 66 L50 80 L60 66Z" fill="rgba(0,0,0,.18)"/>`;
  if (L.acc.includes('tie')) s += `<path d="M47 70 L53 70 L55 90 L50 94 L45 90Z" fill="#a52a3a"/>`;
  if (L.acc.includes('lanyard')) s += `<path d="M40 66 L48 92 L52 92 L60 66" stroke="#ffd36b" stroke-width="3" fill="none"/><rect x="45" y="90" width="10" height="8" rx="1.5" fill="#fff"/>`;
  // neck + head
  s += `<rect x="43" y="55" width="14" height="14" rx="5" fill="${L.skin}"/><path d="M43 62 Q50 68 57 62 L57 66 L43 66Z" fill="rgba(0,0,0,.15)"/>`;
  s += `<ellipse cx="50" cy="40" rx="18.5" ry="21" fill="${L.skin}"/><ellipse cx="31.5" cy="42" rx="3" ry="4.5" fill="${L.skin}"/><ellipse cx="68.5" cy="42" rx="3" ry="4.5" fill="${L.skin}"/>`;
  // hair front
  const H = L.hair;
  if (L.style==='short') s += `<path d="M31 38 Q30 17 50 17 Q70 17 69 38 Q64 28 50 28 Q36 28 31 38Z" fill="${H}"/>`;
  if (L.style==='messy') s += `<path d="M30 40 Q26 14 50 14 Q76 14 70 40 Q66 26 58 30 Q52 22 44 30 Q36 24 30 40Z" fill="${H}"/>`;
  if (L.style==='quiff') s += `<path d="M30 38 Q28 14 54 13 Q74 14 70 38 Q62 24 46 26 Q36 28 30 38Z" fill="${H}"/>`;
  if (L.style==='long' || L.style==='bob') s += `<path d="M30 40 Q28 17 50 17 Q72 17 70 40 Q60 26 50 28 Q40 26 30 40Z" fill="${H}"/>`;
  if (L.style==='bun') s += `<circle cx="50" cy="13" r="8" fill="${H}"/><path d="M31 38 Q30 17 50 17 Q70 17 69 38 Q62 27 50 28 Q38 27 31 38Z" fill="${H}"/>`;
  if (L.style==='pony') s += `<path d="M31 38 Q30 16 50 16 Q70 16 69 38 Q62 26 50 28 Q38 26 31 38Z" fill="${H}"/>`;
  if (L.style==='cap') s += `<path d="M30 33 Q30 14 50 14 Q70 14 70 33Z" fill="${L.cap}"/><path d="M28 33 L74 33 Q80 33 76 37 L28 37Z" fill="${L.cap}" opacity=".92"/><rect x="42" y="20" width="16" height="7" rx="2" fill="rgba(255,255,255,.18)"/>`;
  // face
  s += `<ellipse cx="42.5" cy="41" rx="2.2" ry="2.6" fill="#1b1410"/><ellipse cx="57.5" cy="41" rx="2.2" ry="2.6" fill="#1b1410"/>
  <circle cx="43.2" cy="40.2" r=".8" fill="#fff"/><circle cx="58.2" cy="40.2" r=".8" fill="#fff"/>
  <path d="M38 36 Q42.5 33.5 47 36" stroke="${L.hair==='#9a9a9a'?'#777':L.hair}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M53 36 Q57.5 33.5 62 36" stroke="${L.hair==='#9a9a9a'?'#777':L.hair}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M50 42 Q48.5 48 51.5 48.5" stroke="rgba(0,0,0,.28)" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <path d="M43.5 53 Q50 57.5 56.5 53" stroke="#6a2f2a" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  if (L.acc.includes('mustache')) s += `<path d="M42 51 Q50 47.5 58 51 Q50 53 42 51Z" fill="${L.hair}"/>`;
  if (L.acc.includes('stubble')) s += `<path d="M34 46 Q50 70 66 46 Q66 60 50 62 Q34 60 34 46Z" fill="rgba(20,20,20,.28)"/>`;
  if (L.acc.includes('glasses')) s += `<g fill="rgba(180,220,255,.15)" stroke="#1d1d26" stroke-width="1.6"><rect x="35" y="36.5" width="14" height="10" rx="4"/><rect x="51" y="36.5" width="14" height="10" rx="4"/></g><path d="M49 41 L51 41" stroke="#1d1d26" stroke-width="1.6"/>`;
  return s + '</svg>';
}
function detectivePortraitSVG(){
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="dg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3060"/><stop offset="1" stop-color="#0c1020"/></linearGradient></defs>
  <rect width="100" height="100" fill="url(#dg)"/><path d="M6 100 Q8 68 34 64 L66 64 Q92 68 94 100Z" fill="#b98a55"/><path d="M38 64 L50 84 L62 64Z" fill="#e8e1d0"/><path d="M36 62 Q50 74 64 62 L66 68 Q50 80 34 68Z" fill="#c8443d"/>
  <rect x="43" y="52" width="14" height="14" rx="5" fill="#d9a67c"/><ellipse cx="50" cy="42" rx="17" ry="19" fill="#e0ac84"/>
  <ellipse cx="43" cy="43" rx="2" ry="2.4" fill="#1b1410"/><ellipse cx="57" cy="43" rx="2" ry="2.4" fill="#1b1410"/><path d="M44 53 Q50 56 56 53" stroke="#6a2f2a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <ellipse cx="50" cy="30" rx="30" ry="6" fill="#3a2f27"/><path d="M33 30 Q33 10 50 10 Q67 10 67 30Z" fill="#4a3b30"/><rect x="33" y="24" width="34" height="5" fill="#241b15"/></svg>`;
}

