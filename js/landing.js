/* =========================================================
   PULSE — landing page
   ========================================================= */

const LANES_SVG = (cls = '') => {
  // concentric track lanes, offset to the right
  let d = '';
  for (let i = 0; i < 8; i++) {
    const rx = 520 + i * 46, ry = 300 + i * 46, cx = 1180, cy = 420;
    d += `<path class="${cls}" style="animation-delay:${200 + i * 70}ms" d="M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0"/>`;
  }
  return `<svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" width="100%" height="100%">${d}</svg>`;
};

const SCIENCE = [
  ['Warm-up', 'RAMP protocol', 'Raise, Activate, Mobilise, Potentiate. Six minutes that prepare the exact movements you are about to load.', 'Raise → Activate → Mobilise → Potentiate'],
  ['Energy', 'Mifflin–St Jeor', 'Resting energy from height, weight, age and sex, scaled by how often you train and what you are training for.', 'BMR = 10W + 6.25H − 5A + s'],
  ['Load', 'Session RPE', 'How hard a session felt, multiplied by how long it lasted. A simple number that tracks fatigue surprisingly well.', 'Load (AU) = RPE × minutes'],
  ['Planning', 'Block periodisation', 'Three weeks of rising intensity, then a lighter week so your body absorbs the work instead of breaking down.', 'Base · Build · Peak · Deload'],
  ['Injury risk', 'Acute : chronic ratio', 'This week’s load against your four-week average. Pulse flags spikes above 1.5, where injury risk climbs.', 'ACWR = this week ÷ 4-week avg'],
  ['Recovery', 'Protein by body weight', 'Between 1.4 and 2.0 g per kilo depending on your goal, spread across meals of 20 to 40 g.', 'Protein = kg × 1.4–2.0 g']
];
const FAQ = [
  ['Is Pulse really free?', 'Yes. There is no account, no subscription and no ads. Your plan and logs live in your browser, and you can export them any time from Profile.'],
  ['My school gym only has dumbbells and a bench. Will it work?', 'That is exactly who Pulse is for. You tell it what you can reach, and it only picks from the 66 exercises that fit that kit. If a station is busy, swap any exercise in one tap for another that trains the same movement.'],
  ['I am 14. Is lifting safe at my age?', 'Supervised strength training is widely recommended for teenagers. Pulse starts newer lifters at moderate effort, focuses on technique in the Base week and never programmes maximal lifts. If you have an injury or a health condition, check with a coach, parent or doctor first.'],
  ['Does it work for vegetarian or vegan athletes?', 'Yes. Meal ideas and the food search respect vegetarian, vegan and pescatarian diets, and skip anything containing allergens you list, from dairy and gluten to peanuts and sesame. The foods are the ones you actually eat, like dal, paneer, poha and idli.'],
  ['How does the morning check-in change my session?', 'Sleep, soreness and energy combine into a readiness score out of 100. Above 70 you train as planned. Between 45 and 70 Pulse tells you to stay at the low end of the effort range. Below 45 it suggests a recovery day instead.'],
  ['Where is my data stored?', 'Only in this browser, on this device. Nothing is sent to a server. Clearing your browser data removes it, so use Export in Profile if you want a backup or want to move to another device.']
];

let landingCleanup = [];
function showLanding(section) {
  landingCleanup.forEach(f => f()); landingCleanup = [];
  const have = REAL && REAL.profile;
  const sports = Object.values(SPORTS).map(s => s.split(' (')[0]);
  const html = `<div class="landing">
  <header class="nav" id="nav"><div class="wrap">
    <a class="brand" href="#/" aria-label="Pulse home"><span class="brand-mark">${IC.mark}</span>Pulse</a>
    <nav class="nav-links" aria-label="Sections">
      <a href="#/method" data-sec="method">How it works</a><a href="#/product" data-sec="product">Inside the app</a><a href="#/block" data-sec="block">The block</a><a href="#/science" data-sec="science">Science</a><a href="#/faq" data-sec="faq">FAQ</a>
    </nav>
    <div class="nav-r">
      <button class="icon-btn hide-m" data-act="cmdk" aria-label="Search" data-tip="Search  ⌘K">${IC.search}</button>
      <button class="icon-btn" data-act="theme" data-theme-ic aria-label="Toggle dark mode">${isDark() ? IC.sun : IC.moon}</button>
      ${have ? `<a class="btn btn-primary btn-sm hide-m" href="#/today">Open my plan ${IC.arrow}</a>` : `<a class="btn btn-primary btn-sm hide-m" href="#/start">Build my plan ${IC.arrow}</a>`}
      <button class="icon-btn nav-menu-btn" id="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="mnav">${IC.menu}</button>
    </div></div></header>

  <main id="main">
  <section class="hero">
    <div class="hero-lanes">${LANES_SVG('draw')}</div>
    <div class="wrap hero-grid">
      <div class="stagger">
        <a class="eyebrow" href="#/sample"><span class="pill acc">Sample</span>See a real plan for a 16-year-old footballer ${IC.chevR.replace('<svg', '<svg width="14" height="14"')}</a>
        <h1 class="h-display">Built for the gym <em>you actually</em> <span class="hl">have.</span></h1>
        <p class="lede">Pulse turns your sport, schedule and equipment into a four-week training block, sets your food targets by the gram, and adjusts every session to how you slept.</p>
        <div class="hero-cta">
          ${have ? `<a class="btn btn-primary btn-lg" href="#/today">Open my plan ${IC.arrow}</a><a class="btn btn-ghost btn-lg" href="#/start">Rebuild it</a>` : `<a class="btn btn-primary btn-lg" href="#/start">Build my plan ${IC.arrow}</a><a class="btn btn-ghost btn-lg" href="#/sample">Explore a sample athlete</a>`}
        </div>
        <div class="hero-meta"><span>${IC.check}Free, no account</span><span>${IC.check}About two minutes</span><span>${IC.check}Data stays on your device</span></div>
      </div>
      <div class="demo" aria-label="Interactive readiness demo">
        <div class="demo-card">
          <div class="demo-top"><span class="label">Morning check-in</span><span class="pill line"><span class="dot live"></span>Try it</span></div>
          <div class="demo-score"><div id="demo-ring"></div><div><div class="band" id="demo-band"></div><p id="demo-desc"></p></div></div>
          <div class="demo-sliders">
            <label class="demo-sl"><span>Sleep</span><input class="range" type="range" min="4" max="10" step="0.5" value="7.5" data-demo="sleep" aria-label="Hours of sleep"><output id="o-sleep">7.5 h</output></label>
            <label class="demo-sl"><span>Soreness</span><input class="range" type="range" min="1" max="5" step="1" value="2" data-demo="sore" aria-label="Muscle soreness from 1 to 5"><output id="o-sore">2 / 5</output></label>
            <label class="demo-sl"><span>Energy</span><input class="range" type="range" min="1" max="5" step="1" value="4" data-demo="energy" aria-label="Energy from 1 to 5"><output id="o-energy">4 / 5</output></label>
          </div>
          <div class="demo-sess"><div><span class="label">Today · Peak week</span><div style="margin-top:4px"><b id="demo-sname">Upper A</b> <span class="muted" style="font-size:13px" id="demo-smeta">· 6 exercises</span></div></div><span class="rpe" id="demo-rpe"></span></div>
        </div>
        ${withSample(() => { const t = targets(S.profile, true); return `<div class="demo-float f1"><span class="ic">${IC.fuel}</span><div><b>${fmtN(t.kcal)} kcal</b><span class="muted">${t.protein} g protein today</span></div></div>`; })}
        <div class="demo-float f2"><span class="ic">${IC.swap}</span><div><b>Rack taken?</b><span class="muted">Swap in one tap</span></div></div>
      </div>
    </div>
  </section>

  <div class="marquee" aria-label="Sports with prep drills"><div class="marquee-track">${[0, 1].map(k => sports.map(s => `<span ${k ? 'aria-hidden="true"' : ''}>${esc(s)}</span>`).join('')).join('')}</div></div>

  <section class="sec" id="method"><div class="wrap">
    <div class="sec-head reveal"><div><div class="label"><i>01</i> How it works</div><h2 class="h2">Two minutes in. <em>Four weeks</em> out.</h2></div>
      <p>No templates copied from a bodybuilding forum. Pulse builds the plan from your answers, then keeps adjusting it as you train.</p></div>
    <div class="lanes">
      <div class="lane reveal"><span class="lane-n">1</span><div><h3>Tell Pulse about you</h3><p>Body, goal, sport, weekly schedule and the equipment you can actually reach. Five short steps, saved as you go.</p></div>
        <div class="lane-vis">${['Football', '4 × 60 min', 'School gym', 'Vegetarian'].map((t, i) => `<span class="chip" aria-pressed="${i === 0}" style="pointer-events:none">${t}</span>`).join('')}</div></div>
      <div class="lane reveal"><span class="lane-n">2</span><div><h3>Get a four-week block</h3><p>Sessions matched to your kit and level, sport prep drills, and food and water targets worked out by the gram.</p></div>
        <div class="phase-bars" style="margin-bottom:22px">${[['Base', 55], ['Build', 72], ['Peak', 100], ['Deload', 36]].map(([n, h], i) => `<div class="${i === 2 ? 'on' : ''}" style="height:${h}%"><span>${n}</span></div>`).join('')}</div></div>
      <div class="lane reveal"><span class="lane-n">3</span><div><h3>Train, log, adjust</h3><p>A quick morning check-in sets the day’s intensity. Tick off sets, log your loads, and watch training load and personal bests build.</p></div>
        <div class="lane-log"><div class="stat-tile"><span class="label">Readiness</span><b>82</b></div><div class="stat-tile"><span class="label">Effort</span><b>RPE 8</b></div><div class="stat-tile"><span class="label">Load</span><b>464 AU</b></div></div></div>
    </div>
  </div></section>

  <section class="sec" id="product"><div class="wrap">
    <div class="sec-head reveal"><div><div class="label"><i>02</i> Inside the app</div><h2 class="h2">The whole week <em>on one screen.</em></h2></div>
      <p>This is Aarav’s real plan: 16, football and sprints, a school gym and a vegetarian diet. Click around. Everything here is generated by the same engine that builds yours.</p></div>
    <div class="product-tabs reveal"><div class="seg" role="tablist" aria-label="App preview">${[['plan', 'Plan'], ['fuel', 'Fuel'], ['progress', 'Progress']].map(([v, l], i) => `<button type="button" role="tab" data-prod="${v}" aria-selected="${i === 0}" aria-controls="prod-body">${l}</button>`).join('')}</div></div>
    <div class="window reveal"><div class="window-bar"><span class="dots"><i></i><i></i><i></i></span><span class="url" id="prod-url">pulse / aarav / plan</span><a class="btn btn-quiet btn-sm" href="#/sample">Open full app ${IC.external.replace('<svg', '<svg width="14" height="14"')}</a></div>
      <div class="window-body" id="prod-body" role="tabpanel"></div></div>
  </div></section>

  <section class="sec" id="block"><div class="wrap">
    <div class="sec-head reveal"><div><div class="label"><i>03</i> The block</div><h2 class="h2">Hard weeks, then an <em>easy one.</em></h2></div>
      <p>Getting stronger is not about going all out every session. Each block ramps up for three weeks, then backs off so the work turns into fitness. Pick a week to see what changes.</p></div>
    <div class="block-grid reveal">
      <div class="card block-chart"><div class="block-cols" role="tablist" aria-label="Weeks of the block">${PHASES.map((ph, i) => {
        const inten = { 0: 62, 1: 74, 2: 88, 3: 40 }[i], vol = { 0: 70, 1: 72, 2: 92, 3: 46 }[i];
        return `<button class="block-col" role="tab" data-blk="${i}" aria-selected="${i === 2}"><div class="bars"><i class="v" style="height:${vol}%"></i><i class="n" style="height:${inten}%"></i></div><div class="cap"><b>${ph.n}</b><span>Week ${i + 1}</span></div></button>`;
      }).join('')}</div>
        <div class="legend"><span><i style="background:var(--ink-3)"></i>Volume (sets)</span><span><i style="background:var(--accent)"></i>Intensity (effort)</span></div></div>
      <div class="card block-detail" id="blk-detail" aria-live="polite"></div>
    </div>
  </div></section>

  <section class="sec" id="science"><div class="wrap">
    <div class="sec-head reveal"><div><div class="label"><i>04</i> The science</div><h2 class="h2">Built on methods <em>coaches use.</em></h2></div>
      <p>Every number in Pulse comes from an established method you can look up. Nothing is a black box.</p></div>
    <div class="sci">${SCIENCE.map(([k, t, d, f]) => `<div class="sci-row reveal"><span class="label">${k}</span><h3>${t}</h3><p>${d}</p><div><code>${f}</code></div></div>`).join('')}</div>
  </div></section>

  <section class="sec" id="faq"><div class="wrap">
    <div class="sec-head reveal"><div><div class="label"><i>05</i> Questions</div><h2 class="h2">Good to <em>know.</em></h2></div><p>Still unsure? Open the sample athlete and click through a real plan. Nothing is saved until you build your own.</p></div>
    <div class="faq reveal">${FAQ.map(([q, a], i) => `<details ${i === 0 ? 'open' : ''}><summary>${q}<span class="pm" aria-hidden="true"></span></summary><div class="ans">${a}</div></details>`).join('')}</div>
  </div></section>

  <section class="wrap"><div class="cta-band reveal"><div class="lanes-bg">${LANES_SVG()}</div>
    <div class="label" style="color:rgba(241,239,233,.5);position:relative">Your next block</div>
    <h2 class="h2" style="margin-top:14px">Starts <em>this Monday.</em></h2>
    <p>Two minutes of questions, then a plan that fits your sport, your gym and your week. Free, and your data stays with you.</p>
    <div class="hero-cta">${have ? `<a class="btn btn-accent btn-lg" href="#/today">Open my plan ${IC.arrow}</a>` : `<a class="btn btn-accent btn-lg" href="#/start">Build my plan ${IC.arrow}</a><a class="btn btn-ghost btn-lg" href="#/sample">See the sample</a>`}</div>
  </div></section>
  </main>

  <footer class="foot"><div class="wrap">
    <div class="foot-grid">
      <div><a class="brand" href="#/"><span class="brand-mark">${IC.mark}</span>Pulse</a><p class="muted" style="font-size:14px;margin-top:14px;max-width:24em">Training and fuel planning for student athletes. Built for school gyms, busy weeks and growing bodies.</p></div>
      <div><h4>Product</h4><ul><li><a href="#/method">How it works</a></li><li><a href="#/product">Inside the app</a></li><li><a href="#/block">The block</a></li><li><a href="#/science">Science</a></li></ul></div>
      <div><h4>Start</h4><ul><li><a href="#/start">${have ? 'Rebuild my plan' : 'Build my plan'}</a></li><li><a href="#/sample">Sample athlete</a></li>${have ? '<li><a href="#/today">Open my plan</a></li>' : ''}<li><a href="#/faq">FAQ</a></li></ul></div>
      <div><h4>Legal</h4><ul><li><button data-act="legal" data-v="privacy">Privacy</button></li><li><button data-act="legal" data-v="terms">Terms</button></li><li><button data-act="cmdk"><span style="display:inline-flex;gap:6px;align-items:center">Shortcuts <span class="kbd">⌘K</span></span></button></li></ul></div>
    </div>
    <div class="foot-note"><span>Pulse gives general guidance, not medical advice. Check with a coach, parent or doctor before starting a new programme.</span><span>© ${new Date().getFullYear()} Pulse</span></div>
  </div></footer></div>`;
  setScreen('landing', html);
  document.title = 'Pulse · Training and fuel for student athletes';
  bindLanding();
  if (section) {
    const el = document.getElementById(section);
    if (el) requestAnimationFrame(() => { $$('.reveal').forEach(r => r.classList.add('in')); el.scrollIntoView({ behavior: 'auto' }); });
  }
}

function bindLanding() {
  /* nav background on scroll + active section */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  landingCleanup.push(() => removeEventListener('scroll', onScroll));
  const secs = LANDING_SECTIONS.map(id => document.getElementById(id)).filter(Boolean);
  const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) $$('.nav-links a').forEach(a => a.classList.toggle('active', a.dataset.sec === e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => so.observe(s));
  landingCleanup.push(() => so.disconnect());

  /* in-page links scroll smoothly without re-rendering */
  $$('.landing a[href^="#/"]').forEach(a => {
    const id = a.getAttribute('href').slice(2);
    if (!LANDING_SECTIONS.includes(id)) return;
    a.addEventListener('click', e => {
      e.preventDefault(); closeMenu();
      history.replaceState(null, '', '#/' + id);
      document.getElementById(id).scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
    });
  });

  /* reveal on scroll */
  const ro = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal').forEach((el, i) => { el.style.setProperty('--d', (i % 3) * 60 + 'ms'); ro.observe(el); });
  landingCleanup.push(() => ro.disconnect());

  /* mobile menu */
  const btn = $('#menu-btn');
  btn.addEventListener('click', () => { $('#mnav') ? closeMenu() : openMenu(); });

  /* hero demo */
  const demo = { sleep: 7.5, sore: 2, energy: 4 };
  const drawDemo = () => {
    const sc = readiness(demo), b = readyBand(sc), col = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)' }[b.k];
    const ringBox = $('#demo-ring');
    if (!ringBox.firstChild) { ringBox.innerHTML = ring(sc, 100, 104, 9, col, `<span class="big" style="font-size:32px" id="demo-sc">${sc}</span><span class="sm">Ready</span>`, 'Readiness score'); animateIn(ringBox); }
    else {
      const c = ringBox.querySelector('.val'), r = (104 - 9) / 2, C = 2 * Math.PI * r;
      c.style.strokeDashoffset = C * (1 - sc / 100); c.setAttribute('stroke', col);
      $('#demo-sc').textContent = sc;
    }
    ringBox.querySelector('.sm').textContent = b.k === 'good' ? 'Ready' : b.k === 'warn' ? 'Caution' : 'Recover';
    $('#demo-band').textContent = b.t; $('#demo-band').style.color = col;
    $('#demo-desc').textContent = b.d;
    const rpe = $('#demo-rpe');
    if (b.k === 'good') { $('#demo-sname').textContent = 'Upper A'; $('#demo-smeta').textContent = '· 6 exercises'; rpe.innerHTML = 'RPE 8.5'; }
    else if (b.k === 'warn') { $('#demo-sname').textContent = 'Upper A'; $('#demo-smeta').textContent = '· skip the finisher'; rpe.innerHTML = '<s>8.5</s> RPE 7.5'; }
    else { $('#demo-sname').textContent = 'Recovery flow'; $('#demo-smeta').textContent = '· 20 min easy'; rpe.innerHTML = '<s>Upper A</s> Swapped'; }
  };
  $$('[data-demo]').forEach(inp => {
    const set = () => {
      const k = inp.dataset.demo; demo[k] = +inp.value;
      inp.style.setProperty('--p', ((inp.value - inp.min) / (inp.max - inp.min) * 100) + '%');
      $('#o-' + k).textContent = k === 'sleep' ? fmt1(+inp.value) + ' h' : inp.value + ' / 5';
      drawDemo();
    };
    inp.addEventListener('input', set); set();
  });

  /* product preview */
  const prodSeg = $('.product-tabs .seg');
  const drawProd = v => {
    $$('[data-prod]').forEach(b => b.setAttribute('aria-selected', b.dataset.prod === v));
    syncSegs(prodSeg.parentElement);
    $('#prod-url').textContent = `pulse / aarav / ${v}`;
    const body = $('#prod-body');
    body.innerHTML = withSample(() => previewHTML(v));
    animateIn(body); bindChartTips(body);
  };
  $$('[data-prod]').forEach(b => b.addEventListener('click', () => drawProd(b.dataset.prod)));
  prodSeg.addEventListener('keydown', e => { if (!/Arrow(Left|Right)/.test(e.key)) return; const bs = $$('[data-prod]'), i = bs.findIndex(b => b.getAttribute('aria-selected') === 'true'), n = bs[(i + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length]; n.focus(); drawProd(n.dataset.prod); });
  $('#prod-body').addEventListener('click', e => { const d = e.target.closest('[data-pday]'); if (d) { PREVIEW_DAY = +d.dataset.pday; drawProd('plan'); } });
  drawProd('plan');

  /* block explorer */
  const BLK = [
    ['Learn the movements at a comfortable effort. Every rep should look the same as the last one.', 'Groove technique', '3 per lift', '7.5'],
    ['Add a little weight each session while your technique holds. The bread-and-butter week.', 'Add load', '3 per lift', '8'],
    ['The hardest week of the block. An extra set on your main lifts and efforts close to your limit.', 'Hardest week', '4 per lift', '8.5'],
    ['Fewer sets and lighter effort. It feels too easy, and that is the point: this is when you adapt.', 'Recover, absorb', '2 per lift', '6']
  ];
  const drawBlk = i => {
    $$('[data-blk]').forEach(b => b.setAttribute('aria-selected', +b.dataset.blk === i));
    const [d, focus, sets, rpe] = BLK[i];
    $('#blk-detail').innerHTML = `<span class="label">Week ${i + 1} of 4</span><h3>${PHASES[i].n}</h3><p>${d}</p><div class="kv"><div><span>Focus</span><span>${focus}</span></div><div><span>Main lift sets</span><span>${sets}</span></div><div><span>Target effort</span><span>RPE ${rpe}</span></div></div>`;
    $('#blk-detail').firstElementChild.parentElement.classList.remove('view-enter'); void $('#blk-detail').offsetWidth; $('#blk-detail').classList.add('view-enter');
  };
  $$('[data-blk]').forEach(b => b.addEventListener('click', () => drawBlk(+b.dataset.blk)));
  drawBlk(2);
  syncSegs();
}
function openMenu() {
  const m = document.createElement('nav'); m.className = 'mnav'; m.id = 'mnav'; m.setAttribute('aria-label', 'Menu');
  const have = REAL && REAL.profile;
  m.innerHTML = [['method', 'How it works'], ['product', 'Inside the app'], ['block', 'The block'], ['science', 'Science'], ['faq', 'FAQ']].map(([id, l]) => `<a href="#/${id}">${l}${IC.chevR.replace('<svg', '<svg width="16" height="16"')}</a>`).join('') + `<a class="btn btn-primary btn-lg btn-block" href="${have ? '#/today' : '#/start'}" style="display:flex">${have ? 'Open my plan' : 'Build my plan'} ${IC.arrow}</a>`;
  document.body.appendChild(m);
  $('#menu-btn').setAttribute('aria-expanded', 'true'); $('#menu-btn').innerHTML = IC.x;
  $$('a', m).forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(2);
    if (LANDING_SECTIONS.includes(id)) { e.preventDefault(); closeMenu(); history.replaceState(null, '', '#/' + id); document.getElementById(id).scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' }); }
    else closeMenu();
  }));
  m.querySelector('a').focus();
  const esc2 = e => { if (e.key === 'Escape') closeMenu(); };
  document.addEventListener('keydown', esc2, { once: true });
}
function closeMenu() {
  const m = $('#mnav'); if (!m) return;
  m.remove(); const b = $('#menu-btn'); if (b) { b.setAttribute('aria-expanded', 'false'); b.innerHTML = IC.menu; }
}

/* render a preview with the sample athlete as the active state */
let SAMPLE = null, PREVIEW_DAY = 0;
function withSample(fn) {
  if (!SAMPLE) SAMPLE = sampleState();
  const keep = S; S = SAMPLE;
  try { return fn(); } finally { S = keep; }
}
function previewHTML(v) {
  if (v === 'plan') {
    const mon = mondayOf(new Date()), date = addDays(mon, PREVIEW_DAY), sess = sessionFor(date);
    const days = trainingDays(S.profile);
    const strip = `<div class="week" style="margin-bottom:16px">${DAYS.map((d, i) => { const dt = addDays(mon, i), s = days.includes(i) ? sessionFor(dt) : null; return `<button class="wday ${s ? '' : 'rest'} ${i === PREVIEW_DAY ? 'sel' : ''}" data-pday="${i}" aria-pressed="${i === PREVIEW_DAY}"><span class="d">${d}</span><span class="n">${dt.getDate()}</span><span class="st"></span><span class="lbl">${s ? esc(s.name) : 'Rest'}</span></button>`; }).join('')}</div>`;
    if (!sess) return strip + `<div class="empty"><div class="glyph">${IC.bed}</div><h4>${DAYS_L[PREVIEW_DAY]} is a rest day</h4><p>Pulse suggests easy movement and a short mobility flow. Pick a training day above to see a full session.</p></div>`;
    return strip + `<div class="card" style="background:var(--surface)"><div class="sess-head" style="padding:18px 20px"><div><div class="label">${DAYS_L[PREVIEW_DAY]} · ${sess.phase.n} week</div><h3 style="font-size:22px">${esc(sess.name)} <span class="muted" style="font-weight:400;font-size:15px">· ${esc(sess.focus)}</span></h3></div><div class="ph-actions"><span class="pill line">≈ ${sess.mins} min</span><span class="pill acc">RPE ${sess.exs[0].rpe}</span></div></div>
      <div class="sess-sec" style="padding:0 20px 8px">${sess.exs.slice(0, 5).map((e, i) => `<div class="ex"><span class="i">${String(i + 1).padStart(2, '0')}</span><div style="min-width:0"><h5>${esc(e.n)}</h5><p>${esc(e.cue)}</p></div><div class="spec"><div><b>${e.sets} × ${e.reps}</b><span>Sets × reps</span></div><div class="hide-m"><b>${restTxt(e.rest)}</b><span>Rest</span></div><span class="icon-btn sm" aria-hidden="true" style="color:var(--ink-3)">${IC.swap}</span></div></div>`).join('')}</div>
      ${sess.prep ? `<div class="sess-sec" style="padding:0 20px 14px"><div class="label"><span>${esc(sess.prep.sport.split(' (')[0])} prep</span><span>Injury prevention</span></div><ul class="mini-list">${sess.prep.items.map(([a, b]) => `<li><span>${esc(a)}</span><span>${esc(b)}</span></li>`).join('')}</ul></div>` : ''}</div>`;
  }
  if (v === 'fuel') {
    const t = targets(S.profile, true), e = { kcal: 1840, p: 74, c: 236, f: 58 }, ideas = mealIdeas(S.profile, today());
    return `<div class="dash"><div class="card card-pad c-5" style="background:var(--surface)"><div class="label" style="margin-bottom:16px">Training day · vegetarian</div><div style="display:flex;gap:20px;align-items:center">${ring(e.kcal, t.kcal, 120, 10, 'var(--ink)', `<span class="big" style="font-size:24px">${fmtN(e.kcal)}</span><span class="sm">of ${fmtN(t.kcal)}</span>`, 'Calories')}
        <div class="macros" style="flex:1">${[['Protein', e.p, t.protein, 'acc'], ['Carbs', e.c, t.carbs, ''], ['Fat', e.f, t.fat, '']].map(([n, v2, m, cl]) => `<div class="macro"><div class="top"><b>${n}</b><span><strong>${v2}</strong>/${m} g</span></div>${bar(v2, m, cl)}</div>`).join('')}</div></div>
        <div class="water" style="margin-top:22px">${Array.from({ length: Math.round(t.water / 250) }, (_, i) => `<span class="glass ${i < 7 ? 'full' : ''}" style="height:34px"></span>`).join('')}</div><p class="muted" style="font-size:12.5px;margin-top:10px">7 of ${Math.round(t.water / 250)} glasses · extra for hot weather</p></div>
      <div class="card c-7" style="background:var(--surface)"><div class="card-h"><h3>Meal ideas</h3><span class="label">Filtered for vegetarian</span></div><div class="card-b" style="padding-top:6px">${Object.entries(ideas).map(([m, c]) => { const tt = sumFoods(c.map(id => ({ id, s: 1 }))); return `<div class="meal"><span class="label">${m}</span><div style="min-width:0"><div class="what">${c.map(id => esc(FOODS[id][0])).join(' + ')}</div><div class="mac">${fmtN(tt.kcal)} kcal · ${fmtN(tt.p)} g protein</div></div><span class="btn btn-ghost btn-sm" aria-hidden="true">${IC.plus}Add</span></div>`; }).join('')}</div></div></div>`;
  }
  const weeks = weekLoads(8), r = acwr(), pb = bests().slice(0, 4);
  return `<div class="dash"><div class="card c-7" style="background:var(--surface)"><div class="card-h"><h3>Training load</h3><span class="label">8 weeks</span></div><div class="card-b">${loadChartSVG(weeks)}<div class="acwr"><div><div class="label">Acute : chronic</div><div class="v" style="margin-top:6px">${fmt1(r)}</div></div><div style="flex:1"><p><b>${r <= 1.3 && r >= .8 ? 'Sweet spot.' : r > 1.5 ? 'Spike.' : r < .8 ? 'Under-loaded.' : 'Caution.'}</b> Hover the bars for weekly detail.</p><div class="zone"><i style="left:${clamp(r / 2, 0, 1) * 100}%"></i></div></div></div></div></div>
    <div class="card c-5" style="background:var(--surface)"><div class="card-h"><h3>Personal bests</h3></div><div class="card-b"><ul class="pb-list">${pb.map(([n, x]) => `<li><div><div class="nm">${esc(n)}</div><div class="dt">${fmtDate(parseIso(x.date))}</div></div><b>${fmt1(x.kg)} kg</b></li>`).join('')}</ul></div></div></div>`;
}

/* legal modals */
ACT.legal = el => {
  const p = el.dataset.v === 'privacy';
  openModal({
    title: p ? 'Privacy' : 'Terms of use', size: 560,
    body: `<div class="prose">${p ? `<p>Pulse has no accounts and no server. Everything you enter, from your profile to your food logs, is stored in your browser’s local storage on this device.</p><h4>What we collect</h4><p>Nothing. There are no analytics, cookies or trackers. Fonts are loaded from Google Fonts, which receives a standard web request when the page loads.</p><h4>Your control</h4><p>Export your data as a file, or delete everything, from the Profile page at any time.</p>`
      : `<p>Pulse provides general training and nutrition guidance for educational purposes. It is not medical advice and does not replace a qualified coach, doctor or dietitian.</p><h4>Train safely</h4><p>Use good technique, train with supervision where possible and stop if you feel pain. If you are under 18, check with a parent or guardian before starting a new programme.</p><h4>No warranty</h4><p>Pulse is provided as is. You are responsible for how you use the plans it generates.</p>`}</div>`,
    actions: [{ label: 'Close', kind: 'btn-primary' }]
  });
};
