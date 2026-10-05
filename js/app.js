/* =========================================================
   PULSE — state, router, onboarding and the app
   ========================================================= */

const LS = 'pulse.v3', LS_DRAFT = 'pulse.draft', LS_PREFS = 'pulse.prefs', LS_THEME = 'pulse.theme';
const APP_VIEWS = ['today', 'plan', 'session', 'fuel', 'progress', 'ask', 'coach', 'profile'];
const LANDING_SECTIONS = ['method', 'product', 'block', 'science', 'faq'];
const VIEW_META = {
  today: { t: 'Today', ic: 'today' },
  plan: { t: 'Plan', ic: 'plan' },
  session: { t: 'Session', ic: 'session' },
  fuel: { t: 'Fuel', ic: 'fuel' },
  progress: { t: 'Progress', ic: 'progress' },
  ask: { t: 'Ask Pulse', ic: 'chat' },
  coach: { t: 'Coach', ic: 'coach' },
  profile: { t: 'Profile', ic: 'profile' }
};

let REAL = null;   // the athlete's own saved state
let S = null;      // the state on screen (REAL or the sample athlete)
let PREFS = { sound: true };
const UI = {
  screen: null, view: null, obStep: 0, draft: null, errors: {}, rebuilding: false,
  planWeek: null, planDay: null, fuelDate: null, foodQ: '', foodFilter: 'all', foodSort: 'match', dietOnly: true, mealShift: 0,
  histFilter: 'all', justDone: null, ci: null, editCheck: false, kitCat: 'all'
};
const stateKey = () => Cloud.user && Cloud.user.role === 'student' ? LS + '.u.' + Cloud.user.uid : LS;

/* ---------- persistence ---------- */
const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
function save() {
  if (!S || S.sample) return;
  S.updatedAt = Date.now();
  const cut = iso(addDays(new Date(), -90));
  for (const k of Object.keys(S.log.food)) if (k < cut) delete S.log.food[k];
  for (const k of Object.keys(S.log.water)) if (k < cut) delete S.log.water[k];
  for (const k of Object.keys(S.log.drinks || {})) if (k < cut) delete S.log.drinks[k];
  if (!store.set(stateKey(), S)) toast('Could not save on this device. Storage may be full or blocked.', { type: 'err' });
  REAL = S;
  if (typeof Sync !== 'undefined') Sync.schedule();
}
function freshState(profile) {
  return { v: 3, profile, swaps: {}, active: null, badges: {}, glasses: [], supps: [], mealSwaps: {}, adjust: [], log: { sessions: [], weight: [{ date: today(), kg: +profile.weight }], food: {}, water: {}, drinks: {}, check: {} }, updatedAt: Date.now() };
}
function blankDraft() {
  const u = Cloud.user || {};
  return { name: u.name ? String(u.name).split(' ')[0] : '', age: '', sex: 'm', height: '', weight: '', climate: 'mild', school: u.school || ((PULSE_CONFIG.schools || [])[0] || {}).id || '', grade: u.grade || '', goal: '', extra: [], sports: [], exp: 'beg', sessions: 3, minutes: 45, days: [], where: 'school', gear: [], equip: [], diet: 'all', allergies: '', injuries: '' };
}
function sampleState() {
  const created = addDays(mondayOf(new Date()), -14);
  const profile = { name: 'Aarav', age: 16, sex: 'm', height: 174, weight: 63, climate: 'hot', goal: 'speed', extra: ['muscle'], sports: ['football', 'athletics'], exp: 'int', sessions: 4, minutes: 60, days: [], where: 'school', gear: ['dumbbells', 'barbell', 'squat-rack', 'adj-bench', 'pullup-bar', 'bands', 'plyo-box', 'medball', 'lat-pulldown', 'leg-press', 'rower'], equip: [], school: 'vasant-valley', grade: '11', diet: 'veg', allergies: '', injuries: '', createdAt: created.getTime() };
  const st = freshState(profile); st.sample = true;
  const days = DEFAULT_DAYS[4];
  st.log.weight = [];
  const wts = [62.1, 62.3, 62.2, 62.5, 62.6, 62.5, 62.8, 62.9, 62.8, 63.0, 63.1];
  for (let i = 0; i < wts.length; i++) st.log.weight.push({ date: iso(addDays(new Date(), -40 + i * 4)), kg: wts[i] });
  const names = ['Upper A', 'Lower A', 'Upper B', 'Lower B'];
  let n = 0;
  for (let k = 7; k >= 0; k--) {
    const mon = addDays(mondayOf(new Date()), -7 * k);
    days.forEach((o, j) => {
      const d = addDays(mon, o);
      if (iso(d) >= today()) return;
      if ((k === 5 && j === 3) || (k === 2 && j === 1)) return;
      const rpe = [6, 7, 7, 8, 7, 8, 8.5, 7][(k + j) % 8], mins = 52 + ((k * 3 + j * 5) % 12);
      st.log.sessions.push({ id: 's' + n, date: iso(d), name: names[j], rpe, mins, load: Math.round(rpe * mins), done: 22, total: 22 + (j % 2), kg: n % 2 ? { 'Bench press': 37.5 + Math.floor(n / 4) * 2.5, 'Back squat': 55 + Math.floor(n / 3) * 2.5 } : { 'Romanian deadlift': 50 + Math.floor(n / 3) * 2.5, 'Standing overhead press': 25 + Math.floor(n / 6) * 2.5 } });
      n++;
    });
  }
  st.log.food[today()] = [{ id: 'poha', s: 1, meal: 'Breakfast' }, { id: 'curd', s: 1, meal: 'Breakfast' }, { id: 'banana', s: 1, meal: 'Snack' }];
  st.log.drinks[today()] = [{ ml: 250, at: Date.now() - 5 * 36e5 }, { ml: 500, at: Date.now() - 3 * 36e5 }, { ml: 250, at: Date.now() - 2 * 36e5 }];
  st.supps = [{ id: 'sp1', key: 'whey', name: 'Whey protein', dose: '1 scoop (25 g) after training', status: 'active', at: Date.now() - 864e6, log: {} }];
  st.log.check[today()] = { sleep: 7.5, sore: 2, energy: 4 };
  for (let i = 1; i < 5; i++) st.log.check[iso(addDays(new Date(), -i))] = { sleep: 7 + (i % 2) * .5, sore: 2, energy: 3 + (i % 2) };
  st.badges = { first: iso(addDays(created, -42)), five: iso(addDays(created, -30)), ten: iso(addDays(created, -16)), quarter: iso(addDays(created, 10)), week: iso(addDays(created, 4)), aware: iso(addDays(created, 2)) };
  return st;
}
function sampleFlag() { try { return sessionStorage.getItem('pulse.sample') === '1'; } catch (e) { return false; } }
function setSampleFlag(on) { try { on ? sessionStorage.setItem('pulse.sample', '1') : sessionStorage.removeItem('pulse.sample'); } catch (e) {} }
function loadPrefs() { PREFS = Object.assign({ sound: true }, store.get(LS_PREFS) || {}); }
function savePrefs() { store.set(LS_PREFS, PREFS); }

/* ---------- theme ---------- */
function themePref() { try { return localStorage.getItem(LS_THEME) || 'system'; } catch (e) { return 'system'; } }
function setTheme(t) {
  try { t === 'system' ? localStorage.removeItem(LS_THEME) : localStorage.setItem(LS_THEME, t); } catch (e) {}
  if (t === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  $$('[data-theme-ic]').forEach(b => b.innerHTML = isDark() ? IC.sun : IC.moon);
  syncSegs();
}
const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
function toggleTheme() { setTheme(isDark() ? 'light' : 'dark'); }

/* ---------- derived data ---------- */
const hasPlan = () => !!(S && S.profile);
function blockIdx(d = new Date()) { return ((blockWeek(d) % 4) + 4) % 4; }
function blockStart(d = new Date()) { return addDays(mondayOf(d), -7 * blockIdx(d)); }
function weekDone(monday) { const a = iso(monday), b = iso(addDays(monday, 7)); return S.log.sessions.filter(s => s.date >= a && s.date < b).length; }
function weekStreak() {
  const planned = trainingDays(S.profile).length, mon = mondayOf(new Date());
  let n = weekDone(mon) >= planned ? 1 : 0;
  for (let k = 1; k < 52; k++) { if (weekDone(addDays(mon, -7 * k)) >= planned) n++; else break; }
  return n;
}
function nextSessionFrom(d, inclusive = false) {
  for (let i = inclusive ? 0 : 1; i < 15; i++) { const x = addDays(d, i), s = sessionFor(x); if (s) return { date: x, sess: s }; }
  return null;
}
const loggedOn = ds => S.log.sessions.filter(s => s.date === ds);
function weekLoads(n = 8) {
  const out = [], mon0 = mondayOf(new Date());
  for (let k = n - 1; k >= 0; k--) {
    const mon = addDays(mon0, -7 * k), a = iso(mon), b = iso(addDays(mon, 7));
    const ss = S.log.sessions.filter(s => s.date >= a && s.date < b);
    out.push({ mon, label: fmtDate(mon), range: `${fmtDate(mon)} – ${fmtDate(addDays(mon, 6))}`, load: ss.reduce((t, s) => t + (s.load || 0), 0), sessions: ss.length, cur: k === 0 });
  }
  out.forEach((w, i) => { const prev = out.slice(Math.max(0, i - 3), i + 1), earlier = prev.slice(0, -1).filter(x => x.load > 0).length; const avg = prev.reduce((t, x) => t + x.load, 0) / prev.length; w.hot = prev.length === 4 && earlier >= 2 && w.load / avg > 1.5; });
  return out;
}
function acwr() {
  // rolling 7-day load against the 28-day weekly average; needs two weeks of history to mean anything
  const ss = S.log.sessions; if (!ss.length || ss[0].date > iso(addDays(new Date(), -14))) return null;
  const sum = days => { const from = iso(addDays(new Date(), -days + 1)); return ss.filter(s => s.date >= from).reduce((t, s) => t + (s.load || 0), 0); };
  const chronic = sum(28) / 4;
  return chronic > 0 ? sum(7) / chronic : null;
}
function bests() {
  const m = {};
  S.log.sessions.forEach(s => Object.entries(s.kg || {}).forEach(([n, kg]) => { kg = +kg; if (kg > 0 && (!m[n] || kg > m[n].kg)) m[n] = { kg, date: s.date }; }));
  return Object.entries(m).sort((a, b) => b[1].kg - a[1].kg);
}
function lastKg(name) {
  for (let i = S.log.sessions.length - 1; i >= 0; i--) { const k = (S.log.sessions[i].kg || {})[name]; if (k) return +k; }
  return null;
}
const litres = n => { const v = n * 0.25; return v % 1 === 0 ? v.toFixed(1) : String(+v.toFixed(2)); };
const restTxt = s => s >= 120 ? mmss(s) : s + ' s';
const isLoaded = e => (!['core', 'carry', 'power'].includes(e.pat) || /swing|carry|slam|chest pass|clean|push press/i.test(e.n)) && !/ s$/.test(e.reps) && !/Nordic|Wall sit|band walk|ball hamstring/i.test(e.n);
function mealIdeas(p, ds, shift = 0) {
  const seed = parseIso(ds).getDate(), out = {};
  for (const [m, list] of Object.entries(MEALS)) {
    const ok = list.filter(c => c.every(id => foodOk(id, p)));
    out[m] = ok.length ? ok[(seed + m.length + shift) % ok.length] : [];
  }
  return out;
}
const mealNow = () => { const h = new Date().getHours(); return h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 18 ? 'Snack' : 'Dinner'; };
const foodMac = f => `${fmtN(f[2])} kcal · P ${fmt1(f[3])} · C ${fmt1(f[4])} · F ${fmt1(f[5])}`;
function itemInfo(it) {
  if (it.custom) return { name: it.custom.name, serving: 'custom', kcal: it.custom.kcal, p: it.custom.p, c: it.custom.c, f: it.custom.f };
  const f = FOODS[it.id]; return f ? { name: f[0], serving: f[1], kcal: f[2], p: f[3], c: f[4], f: f[5] } : null;
}
function foodWhyNot(id, p) {
  const f = FOODS[id];
  if (!DIET_OK[p.diet].includes(f[6])) return 'Not ' + DIET_LABEL[p.diet].toLowerCase();
  const a = f[7].find(x => allergensOf(p).includes(x)); return a ? 'Contains ' + a : '';
}

/* milestones */
const MILESTONES = [
  ['first', 'First session', 'Log your first workout', st => st.log.sessions.length >= 1],
  ['five', 'Five down', 'Five sessions logged', st => st.log.sessions.length >= 5],
  ['ten', 'Double digits', 'Ten sessions logged', st => st.log.sessions.length >= 10],
  ['quarter', 'Twenty-five', '25 sessions. A real habit.', st => st.log.sessions.length >= 25],
  ['week', 'Full week', 'Every planned session in a week', st => weekDone(mondayOf(new Date())) >= trainingDays(st.profile).length],
  ['streak', 'Three in a row', 'Three full weeks back to back', () => weekStreak() >= 3],
  ['hydrated', 'Hydrated', 'Hit your water target in a day', st => waterMl(today()) >= targets(st.profile, !!sessionFor(new Date())).water],
  ['protein', 'Protein on point', 'Hit your protein target in a day', st => sumFoods(st.log.food[today()] || []).p >= targets(st.profile).protein],
  ['aware', 'Self-aware', 'Three readiness check-ins', st => Object.keys(st.log.check).length >= 3]
];
function checkMilestones() {
  if (!S || !S.profile) return;
  S.badges = S.badges || {};
  const fresh = MILESTONES.filter(([id, , , test]) => { try { return !S.badges[id] && test(S); } catch (e) { return false; } });
  if (!fresh.length) return;
  fresh.forEach(([id]) => S.badges[id] = today());
  save();
  const [, t] = fresh[fresh.length - 1];
  setTimeout(() => toast(`<b>Milestone unlocked:</b> ${esc(t)}${fresh.length > 1 ? ` and ${fresh.length - 1} more` : ''}`, { icon: IC.medal, action: UI.view !== 'progress' ? { label: 'View', fn: () => navigate('progress') } : null }), 600);
}

/* =========================================================
   ROUTER
   ========================================================= */
function parseHash() { const h = location.hash.replace(/^#\/?/, ''); const [path, q] = h.split('?'); return { path: path || '', q: new URLSearchParams(q || '') }; }
const entered = () => !!Cloud.user || store.get('pulse.entry') === 'guest';
function leaveSample() { if (S && S.sample) { S = REAL; setSampleFlag(false); stopRest(); } }
function navigate(path) { const h = '#/' + path; if (location.hash === h) route(); else location.hash = h; }
let leaveHooks = [];
function onLeave(fn) { leaveHooks.push(fn); }
function route() {
  const { path } = parseHash();
  leaveHooks.forEach(f => f()); leaveHooks = [];
  if (cmdk) cmdk.close();
  modalStack.slice().forEach(m => m.close());

  if (path === 'welcome') { leaveSample(); return showWelcome(); }
  if (path === 'login' || path === 'signup') { leaveSample(); return showAuth(path); }
  if (Cloud.user && Cloud.user.role === 'coach' && path !== 'about' && !LANDING_SECTIONS.includes(path)) { leaveSample(); return showCoachApp(path); }
  if (path === 'sample') { stopRest(); S = sampleState(); setSampleFlag(true); UI.planWeek = UI.planDay = null; UI.screen = null; history.replaceState(null, '', '#/today'); return showApp('today'); }
  if (path === 'start') { leaveSample(); if (!entered()) return showWelcome(); return showOnboarding(); }
  if (APP_VIEWS.includes(path)) {
    if (!hasPlan() && sampleFlag()) S = sampleState();
    if (!hasPlan()) { S = REAL; }
    if (!hasPlan()) { if (!entered()) return showWelcome(); toast('Build your plan first. It takes about two minutes.'); history.replaceState(null, '', '#/start'); return showOnboarding(); }
    return showApp(path);
  }
  if (path === '') {
    leaveSample();
    if (!entered()) return showWelcome();
    history.replaceState(null, '', REAL && REAL.profile ? '#/today' : '#/start');
    return route();
  }
  // about page (optionally scrolled to a section)
  leaveSample();
  showLanding(LANDING_SECTIONS.includes(path) ? path : null);
}

function setScreen(name, html) {
  const root = $('#root');
  root.innerHTML = html;
  root.firstElementChild && root.firstElementChild.classList.add('screen-enter');
  document.body.classList.toggle('app-on', name === 'app');
  UI.screen = name;
  window.scrollTo(0, 0);
}

/* =========================================================
   ONBOARDING
   ========================================================= */
const OB = [
  { k: 'you', t: 'About you', h: 'First, <em>the basics.</em>', s: 'Pulse uses these to work out your energy needs and set sensible starting loads.' },
  { k: 'goal', t: 'Goal', h: 'What are you <em>training for?</em>', s: 'Pick one main goal. Add up to two extra focuses if you want them.' },
  { k: 'sport', t: 'Sport', h: 'Your sport and <em>experience.</em>', s: 'Pulse adds short prep drills for each sport to keep you healthy through the season.' },
  { k: 'week', t: 'Your week', h: 'When <em>you train.</em>', s: 'Your plan is built around the days you can actually train.' },
  { k: 'kit', t: 'Equipment', h: 'Tap the equipment <em>you can use.</em>', s: 'Your plan is built only from what you pick. Start from a preset if it helps, then add or remove pieces.' },
  { k: 'food', t: 'Food and health', h: 'Fuel, and <em>anything to avoid.</em>', s: 'Meal ideas respect your diet and allergies. Exercises steer around injuries you mention.' }
];
function showOnboarding() {
  if (!UI.draft) {
    const saved = store.get(LS_DRAFT);
    if (REAL && REAL.profile) { UI.draft = Object.assign(blankDraft(), JSON.parse(JSON.stringify(REAL.profile))); UI.rebuilding = true; UI.obStep = 0; }
    else if (saved && saved.draft) { UI.draft = Object.assign(blankDraft(), saved.draft); UI.obStep = clamp(saved.step || 0, 0, OB.length - 1); }
    else { UI.draft = blankDraft(); UI.obStep = 0; }
  }
  UI.errors = {};
  setScreen('onboard', `<div class="ob">
    <aside class="ob-side" aria-label="Plan setup progress">${obSide()}</aside>
    <main class="ob-main" id="main">
      <div class="ob-top">
        <a class="brand" href="#/" aria-label="Pulse home"><span class="brand-mark">${IC.mark}</span>Pulse</a>
        <span class="label" id="ob-count"></span>
        <a class="btn btn-quiet btn-sm" href="#/">${UI.rebuilding ? 'Cancel' : 'Save and exit'}</a>
      </div>
      <div class="ob-progress" role="progressbar" aria-label="Setup progress" aria-valuemin="0" aria-valuemax="${OB.length}"><i id="ob-bar"></i></div>
      <form class="ob-body" id="ob-form" novalidate></form>
      <div class="ob-foot">
        <button type="button" class="btn btn-ghost" data-act="ob-back">${IC.back}<span>Back</span></button>
        <span class="hint hide-m" id="ob-hint"><span class="kbd">↵</span> to continue</span>
        <button type="button" class="btn btn-primary" data-act="ob-next" id="ob-next"></button>
      </div>
    </main></div>`);
  drawObStep(true);
}
function saveDraft() { if (!UI.rebuilding) store.set(LS_DRAFT, { draft: UI.draft, step: UI.obStep }); }
function obSide() {
  const d = UI.draft;
  const sum = [
    ['Athlete', d.name ? `${d.name}${d.age ? ', ' + d.age : ''}` : ''],
    ['Goal', d.goal ? GOALS[d.goal].label : ''],
    ['Sport', d.sports.length ? d.sports.map(s => SPORTS[s].split(' (')[0]).join(', ') : ''],
    ['Week', d.sessions ? `${d.sessions} × ${d.minutes} min` : ''],
    ['Where', ({ gym: 'Full gym', school: 'School gym', home: 'Home', none: 'No equipment' }[d.where]) + (d.where !== 'none' ? ` · ${plural((d.gear || []).length, 'item')}` : '')],
    ['Diet', DIET_LABEL[d.diet]]
  ];
  return `<a class="brand" href="#/"><span class="brand-mark">${IC.mark}</span>Pulse</a>
    <div><div class="label" style="margin-bottom:12px">${UI.rebuilding ? 'Edit your plan' : 'Build your plan'}</div>
    <div class="ob-steps">${OB.map((s, i) => `<button type="button" class="ob-step ${i < UI.obStep ? 'done' : ''} ${i === UI.obStep ? 'cur' : ''}" data-act="ob-goto" data-i="${i}" ${i > UI.obStep ? 'disabled' : ''} ${i === UI.obStep ? 'aria-current="step"' : ''}><span class="n">${i < UI.obStep ? IC.check : i + 1}</span>${s.t}</button>`).join('')}</div></div>
    <div class="ob-sum"><h4 class="label">Your plan so far</h4><dl>${sum.map(([k, v]) => `<div><dt>${k}</dt><dd class="${v ? '' : 'unset'}">${v ? esc(v) : 'Not set'}</dd></div>`).join('')}</dl></div>`;
}
const chip = (f, v, label, on, multi = false) => `<button type="button" class="chip" data-act="${multi ? 'ob-toggle' : 'ob-set'}" data-f="${f}" data-v="${v}" aria-pressed="${on}">${multi ? `<span class="ck">${IC.check}</span>` : ''}${label}</button>`;
const seg = (f, opts, val, cls = '') => `<div class="seg ${cls}" role="radiogroup">${opts.map(([v, l]) => `<button type="button" role="radio" data-act="ob-set" data-f="${f}" data-v="${v}" aria-checked="${String(val) === String(v)}">${l}</button>`).join('')}</div>`;
const fieldErr = k => UI.errors[k] ? `<span class="error" id="err-${k}">${IC.alert}${esc(UI.errors[k])}</span>` : '';
function numField(k, label, suffix, ph, min, max) {
  return `<div class="field ${UI.errors[k] ? 'err' : ''}" data-field="${k}"><label for="f-${k}">${label}</label>
    <div class="input-wrap"><input class="input num" id="f-${k}" data-f="${k}" type="number" inputmode="decimal" placeholder="${ph}" min="${min}" max="${max}" value="${esc(UI.draft[k])}" ${UI.errors[k] ? `aria-invalid="true" aria-describedby="err-${k}"` : ''}><span class="suffix">${suffix}</span></div>${fieldErr(k)}</div>`;
}
function obStepHTML() {
  const d = UI.draft, k = OB[UI.obStep].k;
  if (k === 'you') return `
    <div class="field ${UI.errors.name ? 'err' : ''}" data-field="name"><label for="f-name">First name <span class="hint">Shown on your plan</span></label>
      <input class="input" id="f-name" data-f="name" type="text" autocomplete="given-name" maxlength="24" placeholder="e.g. Maya" value="${esc(d.name)}" ${UI.errors.name ? 'aria-invalid="true" aria-describedby="err-name"' : ''}>${fieldErr('name')}</div>
    <div class="grid-3">${numField('age', 'Age', 'yrs', '16', 12, 25)}${numField('height', 'Height', 'cm', '170', 120, 220)}${numField('weight', 'Weight', 'kg', '60', 30, 150)}</div>
    <div class="grid-2">
      <div class="field"><span class="flabel">Sex <span class="hint">For energy maths</span></span>${seg('sex', [['m', 'Male'], ['f', 'Female']], d.sex, 'full')}</div>
      <div class="field"><span class="flabel">Climate <span class="hint">Sets water</span></span>${seg('climate', [['mild', 'Mild'], ['hot', 'Hot']], d.climate, 'full')}</div>
    </div>
    <div class="grid-2">
      <div class="field ${UI.errors.school ? 'err' : ''}" data-field="school"><label for="f-school">School <span class="hint">${Cloud.user ? 'So your coaches can follow you' : 'Optional for guests'}</span></label>
        <select class="input" id="f-school" data-f="school"><option value="">Not at a listed school</option>${(PULSE_CONFIG.schools || []).map(sc => `<option value="${esc(sc.id)}" ${d.school === sc.id ? 'selected' : ''}>${esc(sc.name)}</option>`).join('')}</select>${fieldErr('school')}</div>
      <div class="field ${UI.errors.grade ? 'err' : ''}" data-field="grade"><label for="f-grade">Grade</label>
        <select class="input" id="f-grade" data-f="grade"><option value="">Choose</option>${(PULSE_CONFIG.grades || []).map(g => `<option value="${g}" ${String(d.grade) === g ? 'selected' : ''}>Grade ${g}</option>`).join('')}</select>${fieldErr('grade')}</div>
    </div>`;
  if (k === 'goal') return `
    <div class="field ${UI.errors.goal ? 'err' : ''}" data-field="goal"><span class="flabel">Main goal</span>
      <div class="opt-list" role="radiogroup" aria-label="Main goal">${Object.entries(GOALS).map(([v, g]) => `<button type="button" class="opt" role="radio" data-act="ob-set" data-f="goal" data-v="${v}" aria-checked="${d.goal === v}"><span class="rad"></span><span><b>${g.label}</b><span class="d">${g.line}</span></span><span class="tag">${SCHEME[v].comp} reps</span></button>`).join('')}</div>${fieldErr('goal')}</div>
    <div class="field"><span class="flabel">Extra focus <span class="hint">Optional · up to two</span></span>
      <div class="chips">${Object.entries(GOALS).filter(([v]) => v !== d.goal).map(([v, g]) => chip('extra', v, g.label, d.extra.includes(v), true)).join('')}</div></div>`;
  if (k === 'sport') return `
    <div class="field"><span class="flabel">Sports you play <span class="hint">Optional · up to three</span></span>
      <div class="chips">${Object.entries(SPORTS).map(([v, l]) => chip('sports', v, l, d.sports.includes(v), true)).join('')}</div></div>
    <div class="field"><span class="flabel">Gym experience</span>
      <div class="opt-list" role="radiogroup" aria-label="Gym experience">${[['beg', 'New to lifting', 'Less than six months of regular training.'], ['int', 'Some experience', 'Six months to two years. You know the main lifts.'], ['adv', 'Experienced', 'Two years or more with consistent technique.']].map(([v, l, s]) => `<button type="button" class="opt" role="radio" data-act="ob-set" data-f="exp" data-v="${v}" aria-checked="${d.exp === v}"><span class="rad"></span><span><b>${l}</b><span class="d">${s}</span></span><span></span></button>`).join('')}</div></div>`;
  if (k === 'week') {
    const n = +d.sessions;
    return `
    <div class="grid-2">
      <div class="field"><span class="flabel">Sessions per week</span>${seg('sessions', [2, 3, 4, 5, 6].map(x => [x, x]), d.sessions, 'full')}</div>
      <div class="field"><span class="flabel">Minutes per session</span>${seg('minutes', [30, 45, 60, 75].map(x => [x, x]), d.minutes, 'full')}</div>
    </div>
    <div class="field ${UI.errors.days ? 'err' : ''}" data-field="days"><span class="flabel">Training days <span class="hint">${d.days.length ? `${d.days.length} of ${n} picked` : `Leave empty and Pulse spaces ${n} days for you`}</span></span>
      <div class="days-pick" role="group" aria-label="Training days">${DAYS.map((x, i) => `<button type="button" data-act="ob-day" data-v="${i}" aria-pressed="${d.days.includes(i)}" aria-label="${DAYS_L[i]}">${x}</button>`).join('')}</div>${fieldErr('days')}</div>
    `;
  }
  if (k === 'kit') return kitStepHTML(d);
  return `
    <div class="field"><span class="flabel">Diet</span>${seg('diet', Object.entries(DIET_LABEL), d.diet, 'full')}</div>
    <div class="grid-2">
      <div class="field"><label for="f-allergies">Allergies <span class="hint">Optional</span></label><input class="input" id="f-allergies" data-f="allergies" type="text" placeholder="e.g. peanuts, lactose" value="${esc(d.allergies)}"></div>
      <div class="field"><label for="f-injuries">Injuries or niggles <span class="hint">Optional</span></label><input class="input" id="f-injuries" data-f="injuries" type="text" placeholder="e.g. left knee" value="${esc(d.injuries)}"></div>
    </div>
    <div class="field"><span class="flabel">Review</span>
      <dl class="review">${[
        [0, 'You', `${esc(d.name)} · ${d.age} yrs · ${d.height} cm · ${d.weight} kg`],
        [1, 'Goal', esc(GOALS[d.goal] ? GOALS[d.goal].label : '') + (d.extra.length ? ' + ' + d.extra.map(x => GOALS[x].label.toLowerCase()).join(', ') : '')],
        [2, 'Sport', d.sports.length ? d.sports.map(s => SPORTS[s]).join(', ') : 'General athletic training'],
        [3, 'Week', `${d.sessions} × ${d.minutes} min · ${d.days.length ? d.days.map(i => DAYS[i]).join(' ') : 'auto days'}`]
      ].map(([i, k2, v]) => `<div><dt>${k2}</dt><dd>${v}</dd><button type="button" data-act="ob-goto" data-i="${i}">Edit</button></div>`).join('')}</dl></div>`;
}
function kitStepHTML(d) {
  const gear = d.gear || (d.gear = []);
  const where = `<div class="field"><span class="flabel">Where you train</span>
      <div class="chips">${[['gym', 'Full gym'], ['school', 'School gym'], ['home', 'Home'], ['none', 'No equipment']].map(([v, l]) => chip('where', v, l, d.where === v)).join('')}</div></div>`;
  if (d.where === 'none') return where + `<div class="kit-none">${IC.user}<div><b>Bodyweight plan</b><p>Push-ups, squats, lunges, planks and jumps. Pick a place with equipment above if you get access to some.</p></div></div>`;
  const cats = EQUIP_CATS.filter(([c]) => UI.kitCat === 'all' || UI.kitCat === c);
  return where + `<div class="field ${UI.errors.gear ? 'err' : ''}" data-field="gear">
      <div class="kit-bar"><span class="flabel">Equipment <span class="hint" id="kit-count">${gear.length ? plural(gear.length, 'piece') + ' picked' : 'Nothing picked yet'}</span></span>
        <div class="kit-acts"><button type="button" class="btn btn-quiet btn-sm" data-act="kit-preset" data-v="${d.where}">${{ gym: 'Typical full gym', school: 'Typical school gym', home: 'Typical home set-up' }[d.where]}</button><button type="button" class="btn btn-quiet btn-sm" data-act="kit-all">Select all</button><button type="button" class="btn btn-quiet btn-sm" data-act="kit-clear" ${gear.length ? '' : 'disabled'}>Clear</button></div></div>
      <div class="chips kit-cats" role="tablist" aria-label="Equipment type">${[['all', 'All'], ...EQUIP_CATS].map(([c, l]) => `<button type="button" class="chip sm" role="tab" data-act="kit-cat" data-v="${c}" aria-selected="${UI.kitCat === c}" aria-pressed="${UI.kitCat === c}">${l}</button>`).join('')}</div>
      ${fieldErr('gear')}
      ${cats.map(([c, l]) => `<div class="kit-sec"><div class="label">${l}</div><div class="kit-grid">${EQUIP.filter(e => e.cat === c).map(e => `<button type="button" class="kit-tile" data-act="kit-tog" data-id="${e.id}" aria-pressed="${gear.includes(e.id)}"><span class="kit-ck">${IC.check}</span>${equipArt(e, 56)}<span class="kit-n">${esc(e.name)}</span></button>`).join('')}</div></div>`).join('')}
    </div>`;
}
function kitSync() {
  const n = (UI.draft.gear || []).length, h = $('#kit-count'); if (h) h.textContent = n ? plural(n, 'piece') + ' picked' : 'Nothing picked yet';
  const c = $('[data-act="kit-clear"]'); if (c) c.disabled = !n;
  if (n && UI.errors.gear) { delete UI.errors.gear; const f = $('[data-field="gear"]'); if (f) { f.classList.remove('err'); const e = f.querySelector('.error'); e && e.remove(); } }
  saveDraft(); $('.ob-side').innerHTML = obSide();
}
function drawObStep(first = false) {
  const st = OB[UI.obStep], form = $('#ob-form');
  form.innerHTML = `<div class="label">Step ${UI.obStep + 1} of ${OB.length} · ${st.t}</div><h1>${st.h}</h1><p class="sub">${st.s}</p><div class="ob-form stagger">${obStepHTML()}</div>`;
  $('.ob-side').innerHTML = obSide();
  $('#ob-count').textContent = `${UI.obStep + 1} / ${OB.length}`;
  $('#ob-bar').style.width = ((UI.obStep + (first ? 0.5 : 1)) / OB.length * 100) + '%';
  raf2(() => $('#ob-bar') && ($('#ob-bar').style.width = ((UI.obStep + 1) / OB.length * 100) + '%'));
  $('.ob-progress').setAttribute('aria-valuenow', UI.obStep + 1);
  const back = $('[data-act="ob-back"]'); back.style.visibility = UI.obStep ? 'visible' : 'hidden';
  $('#ob-next').innerHTML = UI.obStep === OB.length - 1 ? `<span>${UI.rebuilding ? 'Rebuild my plan' : 'Build my plan'}</span>${IC.arrow}` : `<span>Continue</span>${IC.arrow}`;
  animateIn(form);
  if (!first) { const f = form.querySelector('input:not([type=hidden])') || form.querySelector('h1'); if (f && f.tagName === 'INPUT' && matchMedia('(hover: hover)').matches) f.focus({ preventScroll: true }); }
  else setTimeout(() => { const f = form.querySelector('input'); if (f && matchMedia('(hover: hover)').matches) f.focus({ preventScroll: true }); }, 60);
}
function validateStep(i) {
  const d = UI.draft, e = {};
  const k = OB[i].k;
  if (k === 'you') {
    if (!String(d.name).trim()) e.name = 'Add your first name.';
    if (d.age === '' || isNaN(d.age)) e.age = 'Add your age.'; else if (d.age < 12 || d.age > 25) e.age = 'Pulse is built for ages 12 to 25.';
    if (d.height === '' || isNaN(d.height)) e.height = 'Add your height.'; else if (d.height < 120 || d.height > 220) e.height = 'Use 120 to 220 cm.';
    if (d.weight === '' || isNaN(d.weight)) e.weight = 'Add your weight.'; else if (d.weight < 30 || d.weight > 150) e.weight = 'Use 30 to 150 kg.';
  }
  if (k === 'you' && Cloud.user && !d.school) e.school = 'Pick your school so your coaches can see your progress.';
  if (k === 'you' && Cloud.user && !d.grade) e.grade = 'Pick your grade.';
  if (k === 'kit' && d.where !== 'none' && !(d.gear || []).length) e.gear = 'Tap at least one piece of equipment, or choose No equipment.';
  if (k === 'goal' && !d.goal) e.goal = 'Pick a main goal to continue.';
  if (k === 'week' && d.days.length && d.days.length !== +d.sessions) e.days = `Pick ${d.sessions} days, or clear them all and Pulse will choose.`;
  return e;
}
function obNext() {
  const e = validateStep(UI.obStep);
  UI.errors = e;
  if (Object.keys(e).length) {
    drawObStep();
    const f = $('.field.err input') || $('.field.err button'); f && f.focus();
    const firstErr = $('.field.err'); firstErr && firstErr.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
    return;
  }
  if (UI.obStep < OB.length - 1) { UI.obStep++; saveDraft(); drawObStep(); window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' }); return; }
  finishOnboarding();
}
function finishOnboarding() {
  for (let i = 0; i < OB.length; i++) { const e = validateStep(i); if (Object.keys(e).length) { UI.obStep = i; UI.errors = e; drawObStep(); return; } }
  const d = UI.draft;
  const profile = { name: String(d.name).trim(), age: +d.age, sex: d.sex, height: +d.height, weight: +d.weight, climate: d.climate, goal: d.goal, extra: d.extra.filter(x => x !== d.goal).slice(0, 2), sports: d.sports.slice(0, 3), exp: d.exp, sessions: +d.sessions, minutes: +d.minutes, days: d.days.slice().sort((a, b) => a - b), where: d.where, gear: d.where === 'none' ? [] : (d.gear || []).slice(), equip: [], school: d.school || '', grade: d.grade || '', diet: d.diet, allergies: String(d.allergies).trim(), injuries: String(d.injuries).trim() };
  const rebuilding = UI.rebuilding && REAL && REAL.profile;
  if (rebuilding) {
    profile.createdAt = REAL.profile.createdAt;
    S = REAL; S.profile = profile; S.swaps = {}; S.active = null;
    if (+profile.weight !== (S.log.weight[S.log.weight.length - 1] || {}).kg) upsertWeight(today(), +profile.weight);
  } else {
    profile.createdAt = Date.now();
    S = freshState(profile);
  }
  if (rebuilding) { profile.kcalAdj = REAL.profile.kcalAdj || 0; profile.rpeAdj = REAL.profile.rpeAdj || 0; }
  save(); store.del(LS_DRAFT);
  if (Cloud.user) Cloud.updateProfile({ school: profile.school, grade: profile.grade, sports: profile.sports, name: profile.name }).catch(() => {});
  UI.draft = null; UI.rebuilding = false; UI.planWeek = UI.planDay = null;
  showBuilding(rebuilding);
}
function showBuilding(rebuilding) {
  const p = S.profile, kit = kitOf(p);
  const nEx = EX.filter(e => e.eq.some(alt => alt.every(k => kit.includes(k)))).length;
  const steps = [
    p.where === 'none' ? `Matching ${nEx} bodyweight exercises` : `Matching ${nEx} exercises to your ${plural((p.gear || []).length, 'piece')} of equipment`,
    `Laying out ${p.sessions} sessions across your week`,
    'Setting Base, Build, Peak and Deload targets',
    `Working out fuel for ${DIET_LABEL[p.diet].toLowerCase()} eating`
  ];
  setScreen('building', `<main class="build" id="main"><div class="build-in" aria-live="polite">
    <span class="brand-mark" style="width:40px;height:40px;border-radius:11px">${IC.mark}</span>
    <h2>${rebuilding ? 'Rebuilding' : 'Building'} ${esc(p.name)}’s plan</h2>
    <ol>${steps.map(s => `<li><span class="s"></span><span>${s}</span></li>`).join('')}</ol>
    <div class="build-bar"><i></i></div></div></main>`);
  const lis = $$('.build li'), barEl = $('.build-bar i');
  const dt = REDUCED ? 120 : 520;
  lis.forEach((li, i) => {
    setTimeout(() => { li.classList.add('run'); }, i * dt);
    setTimeout(() => { li.classList.remove('run'); li.classList.add('ok'); li.querySelector('.s').innerHTML = IC.check; barEl.style.width = ((i + 1) / lis.length * 100) + '%'; }, i * dt + dt - 60);
  });
  setTimeout(() => {
    navigate('today');
    setTimeout(() => toast(rebuilding ? '<b>Plan rebuilt.</b> Your logs and history are unchanged.' : `<b>Your plan is ready.</b> ${sessionFor(new Date()) ? 'Today is a training day.' : 'Today is a rest day.'}`), 300);
  }, lis.length * dt + 260);
}

/* =========================================================
   APP SHELL
   ========================================================= */
let clockTimer = null;
function showApp(view) {
  const first = UI.screen !== 'app';
  if (view !== 'session') UI.justDone = null;
  if (first) {
    setScreen('app', `<div class="app-wrap">
      ${S.sample ? `<div class="sample-bar">${IC.info.replace('<svg', '<svg width="16" height="16"')}<span>You are exploring <b>Aarav’s</b> sample plan. Changes are not saved.</span><a class="btn btn-accent" href="#/start">Build my own</a></div>` : ''}
      <div class="app">
        <aside class="side" aria-label="Main">
          <a class="brand" href="#/" aria-label="Pulse home"><span class="brand-mark">${IC.mark}</span>Pulse</a>
          <button class="side-search" data-act="cmdk" type="button">${IC.search}<span>Search or jump</span><span class="kbd">${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} K</span></button>
          <nav class="side-nav">${APP_VIEWS.map(v => `<a href="#/${v}" data-nav="${v}">${IC[VIEW_META[v].ic]}<span>${VIEW_META[v].t}</span><span class="badge"></span></a>`).join('')}</nav>
          <div class="side-block" id="side-block"></div>
          <div class="side-foot"><span class="save-state">${S.sample ? '<span class="dot" style="background:var(--warn)"></span>Sample, not saved' : Cloud.user ? `<span class="dot"></span>${Cloud.mode === 'firebase' ? 'Synced to your account' : 'Signed in (demo mode)'}` : '<span class="dot" style="background:var(--ink-4)"></span>Guest · saved on this device'}</span><button class="icon-btn sm" data-act="theme" data-theme-ic aria-label="Toggle dark mode">${isDark() ? IC.sun : IC.moon}</button></div>
        </aside>
        <div class="main">
          <header class="topbar" id="topbar">
            <a class="brand" href="#/" aria-label="Pulse home"><span class="brand-mark">${IC.mark}</span>Pulse</a>
            <h1 class="pg" id="pg-title"></h1><span class="crumb" id="pg-crumb"></span>
            <div class="topbar-r">
              <button class="icon-btn" data-act="cmdk" aria-label="Search and commands" data-tip="Search  ⌘K">${IC.search}</button>
              <button class="icon-btn" data-act="theme" data-theme-ic aria-label="Toggle dark mode">${isDark() ? IC.sun : IC.moon}</button>
              <a class="top-avatar" href="#/profile" data-nav="profile" aria-label="Profile">${esc(initials(S.profile.name))}</a>
            </div>
          </header>
          <main class="content" id="main" tabindex="-1"></main>
        </div>
      </div>
      <nav class="tabbar" aria-label="Main">${['today', 'plan', 'session', 'fuel', 'progress', 'ask', 'coach'].map(v => `<a href="#/${v}" data-nav="${v}">${IC[VIEW_META[v].ic]}<span>${v === 'ask' ? 'Ask' : VIEW_META[v].t}</span></a>`).join('')}</nav>
    </div>`);
    const tb = $('#topbar');
    const onScroll = () => tb && tb.classList.toggle('scrolled', scrollY > 4);
    addEventListener('scroll', onScroll, { passive: true });
  }
  const changed = UI.view !== view;
  UI.view = view;
  $$('[data-nav]').forEach(a => { if (a.dataset.nav === view) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#pg-title').textContent = VIEW_META[view].t;
  $('#pg-crumb').textContent = `· Week ${blockIdx() + 1} of 4 · ${PHASES[blockIdx()].n}`;
  document.title = `${VIEW_META[view].t} · Pulse`;
  drawView(true);
  if (changed && !first) window.scrollTo(0, 0);
  if (!first && changed) $('#main').focus({ preventScroll: true });
}
function sideBlock() {
  const i = blockIdx(), ph = PHASES[i], bs = blockStart();
  const planned = trainingDays(S.profile).length, done = weekDone(mondayOf(new Date()));
  return `<div class="row"><span class="label">Week ${i + 1} of 4</span><span class="label ink">${done}/${planned}</span></div>
    <div class="mini-phase">${[0, 1, 2, 3].map(k => `<i class="${k < i ? 'past' : k === i ? 'on' : ''}"></i>`).join('')}</div>
    <b>${ph.n}</b> <span class="muted" style="font-size:13px">· ${ph.d}</span>
    <div class="muted" style="font-size:12.5px;margin-top:4px">Block ends ${fmtDate(addDays(bs, 27))}</div>`;
}
const VIEWS = {};
function drawView(enter = false) {
  if (UI.screen !== 'app') return;
  const c = $('#main');
  clearInterval(clockTimer);
  c.innerHTML = VIEWS[UI.view]();
  if (enter) { c.classList.remove('view-enter'); void c.offsetWidth; c.classList.add('view-enter'); }
  $('#side-block') && ($('#side-block').innerHTML = sideBlock());
  const live = S.active ? 'Live' : '';
  $$('.side-nav [data-nav="session"] .badge').forEach(b => b.innerHTML = live ? '<span class="pill acc"><span class="dot"></span>Live</span>' : '');
  animateIn(c); bindChartTips(c);
  if (UI.view === 'session' && S.active) startClock();
}
function refresh() { drawView(false); }

/* =========================================================
   VIEW: TODAY
   ========================================================= */
VIEWS.today = () => {
  const p = S.profile, d = new Date(), ds = today(), sess = sessionFor(d), done = loggedOn(ds)[0];
  const i = blockIdx(d), ph = PHASES[i];
  const line = S.active ? 'You have a session in progress.' : done ? 'Today’s training is logged. Recover well tonight.' : sess ? `${sess.name} is on the plan today.` : 'Rest day. Let the work from this week sink in.';
  return `<div class="ph"><div><div class="label">${DAYS_L[wd(d)]} · ${fmtDate(d)}</div><h2 style="margin-top:8px">${greet()}, <em>${esc(p.name)}.</em></h2><p>${line}</p></div>
    <div class="ph-actions"><span class="pill line">Week ${i + 1} · ${ph.n}</span></div></div>
    <div class="dash stagger">
      ${weighInCard()}${adjustCard()}
      <section class="card card-pad c-7" aria-labelledby="t-sess">${todaySessionCard(sess, done)}</section>
      <section class="card water-card c-5">${waterCard()}</section>
      <section class="card c-6" aria-labelledby="t-ready">${readinessCard()}</section>
      <section class="card c-6">${fuelMiniCard()}</section>
      <section class="card c-12">${weekCard()}</section>
    </div>`;
};
function todaySessionCard(sess, done) {
  const ds = today();
  if (S.active) {
    const a = activeSession(), tot = a ? a.exs.reduce((t, e) => t + e.sets, 0) : 0, dn = setsDone();
    return `<div class="sess-hero"><div class="top"><span class="pill acc"><span class="dot"></span>In progress</span><span class="label">${hms((Date.now() - S.active.start) / 1000)} elapsed</span></div>
      <h3 id="t-sess">${esc(a ? a.name : 'Session')}</h3><div class="sess-meta"><span>${IC.check}${dn} of ${tot} sets done</span></div>
      <div style="margin:22px 0">${bar(dn, tot, 'acc')}</div>
      <div class="acts"><a class="btn btn-primary btn-lg" href="#/session">Resume session ${IC.arrow}</a></div></div>`;
  }
  if (done) {
    return `<div class="sess-hero"><div class="top"><span class="pill good">${IC.check.replace('<svg', '<svg width="12" height="12"')} Done</span><span class="label">Logged today</span></div>
      <h3 id="t-sess">${esc(done.name)}</h3><p class="ink2">Nice work. That session added <b>${fmtN(done.load)}</b> to your weekly training load.</p>
      <div class="stats" style="margin:22px 0"><div><span class="label">Time</span><b>${done.mins}<small>min</small></b></div><div><span class="label">Effort</span><b>${done.rpe}<small>RPE</small></b></div><div><span class="label">Sets</span><b>${done.done}<small>/${done.total}</small></b></div><div><span class="label">Load</span><b>${fmtN(done.load)}<small>AU</small></b></div></div>
      <div class="acts"><a class="btn btn-ghost" href="#/progress">See progress ${IC.arrow}</a><a class="btn btn-quiet" href="#/fuel">Log recovery food</a></div></div>`;
  }
  if (!sess) {
    const nx = nextSessionFrom(new Date());
    return `<div class="sess-hero"><div class="top"><span class="pill">Rest day</span>${nx ? `<span class="label">Next · ${DAYS[wd(nx.date)]} ${fmtDate(nx.date)}</span>` : ''}</div>
      <h3 id="t-sess">Recover and reset.</h3><p class="ink2">Rest days are when strength is actually built. An easy walk and ten minutes of mobility is plenty.</p>
      <ul class="mini-list" style="margin:18px 0">${EXTRA_BLOCK.mobility.text.map(([a, b]) => `<li><span>${formName(a)}</span><span>${b}</span></li>`).join('')}</ul>
      <div class="acts">${nx ? `<button class="btn btn-ghost" data-act="start-anyway">Train anyway: ${esc(nx.sess.name)}</button>` : ''}<a class="btn btn-quiet" href="#/plan">See the week</a></div></div>`;
  }
  const c = S.log.check[ds], band = c ? readyBand(readiness(c)) : null;
  const rpeAdj = band && band.k === 'warn' ? ' (aim for the low end today)' : '';
  return `<div class="sess-hero"><div class="top"><span class="pill acc">Today</span><span class="label">${sess.phase.n} week</span></div>
    <h3 id="t-sess">${esc(sess.name)}</h3>
    <div class="sess-meta"><span>${IC.clock}≈ ${sess.mins} min</span><span>${IC.list}${plural(sess.exs.length, 'exercise')}</span><span>${IC.bolt}RPE ${sess.exs[0] ? sess.exs[0].rpe : ''}${rpeAdj}</span></div>
    ${band && band.k === 'bad' ? `<div class="acwr" style="margin-top:18px;background:var(--bad-bg)"><span style="color:var(--bad)">${IC.alert.replace('<svg', '<svg width="20" height="20"')}</span><p><b>Readiness is low.</b> ${band.d}</p></div>` : ''}
    <ol class="ex-peek">${sess.exs.slice(0, 4).map((e, i) => `<li><span class="i">0${i + 1}</span><span>${formName(e.n)}</span><span class="sr2">${e.sets} × ${e.reps}</span></li>`).join('')}
      ${sess.exs.length > 4 ? `<li><span class="i"></span><span class="muted">+ ${sess.exs.length - 4} more${sess.prep ? ` and ${esc(sess.prep.sport.split(' (')[0].toLowerCase())} prep` : ''}</span><span></span></li>` : ''}</ol>
    <div class="acts"><button class="btn btn-primary btn-lg" data-act="start">${IC.play}Start session</button><a class="btn btn-ghost btn-lg" href="#/plan">Full session</a></div></div>`;
}
function readinessCard() {
  const ds = today(), c = S.log.check[ds];
  if (!c || UI.editCheck) {
    if (!UI.ci) UI.ci = c ? { ...c } : { sleep: 7.5, sore: 2, energy: 3 };
    const ci = UI.ci, pct = (ci.sleep - 4) / 6 * 100;
    const scale = (f, cap) => `<div class="scale" role="radiogroup" aria-label="${cap}">${[1, 2, 3, 4, 5].map(v => `<button type="button" role="radio" data-act="ci" data-f="${f}" data-v="${v}" aria-checked="${ci[f] === v}">${v}</button>`).join('')}</div>`;
    return `<div class="card-h"><h3 id="t-ready">Morning check-in</h3><span class="label">30 seconds</span></div>
      <div class="card-b"><p class="muted" style="font-size:13.5px;margin-bottom:18px">Three quick answers set today’s intensity.</p>
      <div class="checkin">
        <div class="ci-row"><div class="top"><label for="ci-sleep">Sleep last night</label><output id="ci-sleep-v">${fmt1(ci.sleep)} h</output></div>
          <input class="range" id="ci-sleep" type="range" min="4" max="10" step="0.5" value="${ci.sleep}" style="--p:${pct}%" data-ci="sleep"></div>
        <div class="ci-row"><div class="top"><span>Muscle soreness</span></div>${scale('sore', 'Muscle soreness, 1 none to 5 very sore')}<div class="scale-cap"><span>None</span><span>Very sore</span></div></div>
        <div class="ci-row"><div class="top"><span>Energy</span></div>${scale('energy', 'Energy, 1 drained to 5 buzzing')}<div class="scale-cap"><span>Drained</span><span>Buzzing</span></div></div>
      </div></div>
      <div class="card-f"><span class="muted" style="font-size:12.5px">${c ? 'Editing today’s check-in' : 'Not checked in yet'}</span><div style="display:flex;gap:6px">${c ? '<button class="btn btn-quiet btn-sm" data-act="ci-cancel">Cancel</button>' : ''}<button class="btn btn-primary btn-sm" data-act="ci-save">Save check-in</button></div></div>`;
  }
  const sc = readiness(c), band = readyBand(sc), col = { good: 'var(--good)', warn: 'var(--warn)', bad: 'var(--bad)' }[band.k];
  return `<div class="card-h"><h3 id="t-ready">Readiness</h3><button class="btn btn-quiet btn-sm" data-act="ci-edit">${IC.edit}Edit</button></div>
    <div class="card-b"><div class="ready">${ring(sc, 100, 112, 9, col, `<span class="big" style="font-size:34px" data-count="${sc}">0</span><span class="sm">of 100</span>`, `Readiness ${sc} of 100`)}
      <div><span class="pill ${band.k}">${band.t}</span><p style="margin-top:10px">${band.d}</p>
      <div class="ready-facts"><span class="pill line">${IC.bed.replace('<svg', '<svg width="12" height="12"')} ${fmt1(c.sleep)} h sleep</span><span class="pill line">Soreness ${c.sore}/5</span><span class="pill line">Energy ${c.energy}/5</span></div></div></div></div>`;
}
function fuelMiniCard() {
  const p = S.profile, ds = today(), t = targets(p, !!sessionFor(new Date())), e = sumFoods(S.log.food[ds] || []);
  const left = t.kcal - e.kcal;
  return `<div class="card-h"><h3>Fuel</h3><a class="btn btn-quiet btn-sm" href="#/fuel">Log food ${IC.arrow}</a></div>
    <div class="card-b"><div style="display:flex;gap:18px;align-items:center;margin-bottom:18px">
      ${ring(e.kcal, t.kcal, 84, 8, 'var(--ink)', `<span class="big" style="font-size:15px">${Math.round(clamp(e.kcal / t.kcal, 0, 9.99) * 100)}%</span>`, `${fmtN(e.kcal)} of ${fmtN(t.kcal)} kcal`)}
      <div><div class="kcal-big" style="font-size:30px"><span data-count="${Math.round(e.kcal)}">0</span></div><div class="muted" style="font-size:13px">of ${fmtN(t.kcal)} kcal · ${left >= 0 ? fmtN(left) + ' left' : fmtN(-left) + ' over'}</div></div></div>
      <div class="macros">${[['Protein', e.p, t.protein, 'acc'], ['Carbs', e.c, t.carbs, ''], ['Fat', e.f, t.fat, '']].map(([n, v, m, cl]) => `<div class="macro"><div class="top"><b>${n}</b><span><strong>${fmtN(v)}</strong> / ${m} g</span></div>${bar(v, m, cl)}</div>`).join('')}</div></div>`;
}
function weekStrip(mon, opts = {}) {
  const days = trainingDays(S.profile), ds0 = today();
  return `<div class="week">${DAYS.map((d, i) => {
    const dt = addDays(mon, i), ds = iso(dt), planned = days.includes(i), done = loggedOn(ds).length > 0;
    const st = done ? 'done' : planned ? (ds < ds0 ? 'missed' : '') : 'rest';
    const sess = opts.labels && planned ? sessionFor(dt) : null;
    const tag = opts.act ? 'button' : 'div';
    return `<${tag} class="wday ${st} ${ds === ds0 ? 'today' : ''} ${opts.sel === i ? 'sel' : ''}" ${opts.act ? `type="button" data-act="${opts.act}" data-i="${i}" aria-pressed="${opts.sel === i}"` : ''} aria-label="${DAYS_L[i]} ${fmtDate(dt)}: ${done ? 'done' : planned ? 'training' : 'rest'}">
      <span class="d">${d}</span><span class="n">${dt.getDate()}</span><span class="st">${done ? IC.check : ''}</span>${opts.labels ? `<span class="lbl">${sess ? esc(sess.name) : 'Rest'}</span>` : ''}</${tag}>`;
  }).join('')}</div>`;
}
function weekCard() {
  const planned = trainingDays(S.profile).length, done = weekDone(mondayOf(new Date())), st = weekStreak();
  return `<div class="card-h"><h3>This week</h3><span class="pill ${done >= planned ? 'acc' : ''}">${done}/${planned} sessions</span></div>
    <div class="card-b">${weekStrip(mondayOf(new Date()))}
      <p class="muted" style="font-size:12.5px;margin-top:14px">${st > 1 ? `${st}-week streak of full weeks. Keep it going.` : done >= planned ? 'Every planned session done this week.' : `${plural(planned - done, 'session')} to go. Missed days do not carry over.`}</p></div>`;
}

/* =========================================================
   VIEW: PLAN
   ========================================================= */
const RAMP = [['Raise', 'Easy jog, skips or bike', '2 min'], ['Activate', 'Glute bridge + band pull-apart', '2 × 10'], ['Mobilise', 'World’s greatest stretch', '4 / side'], ['Potentiate', 'Two lighter ramp-up sets of your first lift', '2 sets']];
VIEWS.plan = () => {
  const now = new Date(), cur = blockIdx(now), bs = blockStart(now);
  if (UI.planWeek == null) UI.planWeek = cur;
  if (UI.planDay == null) UI.planDay = wd(now);
  const mon = addDays(bs, 7 * UI.planWeek), date = addDays(mon, UI.planDay), ds = iso(date), sess = sessionFor(date), done = loggedOn(ds)[0];
  const isToday = ds === today();
  return `<div class="ph"><div><div class="label">Four-week block · ${fmtDate(bs)} – ${fmtDate(addDays(bs, 27))}</div><h2 style="margin-top:8px">Your <em>plan.</em></h2>
    <p>${S.profile.sessions} sessions a week · ${GOALS[S.profile.goal].label.toLowerCase()}${S.profile.sports.length ? ' · ' + S.profile.sports.map(s => SPORTS[s].split(' (')[0].toLowerCase()).join(' and ') : ''}</p></div>
    <div class="ph-actions"><button class="btn btn-ghost btn-sm" data-act="plan-today">Jump to today</button><a class="btn btn-quiet btn-sm" href="#/start">${IC.edit}Edit inputs</a></div></div>
    <div class="block-strip" role="tablist" aria-label="Weeks in this block">${PHASES.map((ph, i) => {
      const m = addDays(bs, 7 * i), pct = i < cur ? 100 : i === cur ? (wd(now) + 1) / 7 * 100 : 0;
      return `<button class="bk ${i === cur ? 'now' : ''}" role="tab" aria-selected="${UI.planWeek === i}" data-act="plan-week" data-i="${i}"><span class="label"><span>Week ${i + 1}</span></span><b>${ph.n}</b><span class="d">${fmtDate(m)} – ${fmtDate(addDays(m, 6))}</span><span class="meter" style="width:${pct}%"></span></button>`;
    }).join('')}</div>
    <div style="margin-bottom:16px">${weekStrip(mon, { labels: true, act: 'plan-day', sel: UI.planDay })}</div>
    <div class="card view-enter" id="plan-detail">${sess ? sessionDetail(sess, date, done, isToday) : restDetail(date)}</div>`;
};
function sessionDetail(sess, date, done, isToday) {
  const rpe = sess.exs[0] ? sess.exs[0].rpe : 7;
  return `<div class="sess-head"><div><div class="label">${DAYS_L[wd(date)]} · ${fmtDate(date)} · ${sess.phase.n}</div><h3>${esc(sess.name)}</h3><p class="muted" style="margin-top:2px">${esc(sess.focus)} · ${esc(sess.phase.d.toLowerCase())}</p></div>
      <div class="ph-actions">${done ? `<span class="pill good">${IC.check.replace('<svg', '<svg width="12" height="12"')} Logged · RPE ${done.rpe}</span>` : ''}<span class="pill line">${IC.clock.replace('<svg', '<svg width="12" height="12"')} ≈ ${sess.mins} min</span><span class="pill line" data-tip="Rate of perceived exertion, 1 to 10">RPE ${rpe}</span>
      ${isToday && !done ? `<button class="btn btn-primary btn-sm" data-act="start">${IC.play}Start</button>` : ''}</div></div>
    <div class="sess-sec"><div class="label"><span>Warm-up · RAMP · 6 min</span></div><ul class="mini-list">${RAMP.map(([a, b, c]) => `<li><span><b style="font-weight:550">${a}</b> <span class="muted">· ${formLinks(b)}</span></span><span>${c}</span></li>`).join('')}</ul></div>
    <div class="sess-sec"><div class="label"><span>Main work · ${plural(sess.exs.length, 'exercise')}</span><span class="hide-m">Sets × reps · rest · effort</span></div>
      ${sess.exs.map((e, i) => `<div class="ex" data-ex="${esc(e.key)}"><span class="i">${String(i + 1).padStart(2, '0')}</span>
        <div class="ex-main">${formThumb(e.n)}<div style="min-width:0"><h5>${esc(e.n)}</h5><p>${esc(e.cue)}</p>${formOf(e.n) ? `<button type="button" class="ex-form" data-act="form" data-n="${esc(e.n)}">${PLAY}Watch form</button>` : ''}</div></div>
        <div class="spec"><div><b>${e.sets} × ${e.reps}</b><span>Sets × reps</span></div><div><b>${restTxt(e.rest)}</b><span>Rest</span></div><div><b>${e.rpe}</b><span>RPE</span></div>
        ${e.alts > 1 ? `<button class="icon-btn sm" data-act="swap" data-key="${esc(e.key)}" data-n="${esc(e.n)}" aria-label="Swap ${esc(e.n)} for an alternative" data-tip="Swap exercise">${IC.swap}</button>` : '<span style="width:32px"></span>'}</div></div>`).join('')}</div>
    ${sess.prep ? `<div class="sess-sec"><div class="label"><span>${esc(sess.prep.sport.split(' (')[0])} prep · 5 min</span><span>Injury prevention</span></div><ul class="mini-list">${sess.prep.items.map(([a, b]) => `<li><span>${formName(a)}</span><span>${esc(b)}</span></li>`).join('')}</ul></div>` : ''}
    ${sess.blocks.map(b => `<div class="sess-sec"><div class="label"><span>${esc(b.t)} · ${b.min} min</span><span>${esc(b.why)}</span></div><ul class="mini-list">${b.items.map(([a, c]) => `<li><span>${formName(a)}</span><span>${esc(c)}</span></li>`).join('')}</ul></div>`).join('')}
    <div class="sess-sec"><div class="label"><span>Cool-down · 3 min</span></div><ul class="mini-list"><li><span>Slow nasal breathing, lying down</span><span>90 s</span></li><li><span>Stretch whatever feels tight</span><span>90 s</span></li></ul></div>`;
}
function restDetail(date) {
  const nx = nextSessionFrom(date);
  return `<div class="empty"><div class="glyph">${IC.bed}</div><h4>${DAYS_L[wd(date)]} is a rest day</h4>
    <p>No lifting planned. Light movement helps: a 20-minute walk, easy skill work for your sport, or the mobility flow below.</p>
    <ul class="mini-list" style="width:100%;max-width:420px;margin-top:8px;text-align:left">${EXTRA_BLOCK.mobility.text.map(([a, b]) => `<li><span>${formName(a)}</span><span>${b}</span></li>`).join('')}</ul>
    ${nx ? `<div class="acts"><button class="btn btn-ghost btn-sm" data-act="plan-goto" data-d="${iso(nx.date)}">Next up: ${esc(nx.sess.name)}, ${DAYS[wd(nx.date)]} ${IC.arrow}</button></div>` : ''}</div>`;
}

/* =========================================================
   VIEW: SESSION
   ========================================================= */
function activeSession() { return S.active ? sessionFor(parseIso(S.active.from)) : null; }
function setsDone() { if (!S.active) return 0; return Object.values(S.active.sets).reduce((t, a) => t + a.filter(Boolean).length, 0); }
VIEWS.session = () => {
  if (UI.justDone) return doneScreen(UI.justDone);
  if (S.active) return liveSession();
  const ds = today(), sess = sessionFor(new Date()), done = loggedOn(ds)[0];
  if (done) return `<div class="ph"><div><div class="label">Session</div><h2 style="margin-top:8px">Today is <em>done.</em></h2><p>${esc(done.name)} · ${done.mins} min · RPE ${done.rpe}. Come back tomorrow.</p></div></div>
    <div class="card"><div class="empty"><div class="glyph">${IC.check}</div><h4>Nothing left for today</h4><p>Your next session is ${(() => { const nx = nextSessionFrom(new Date()); return nx ? `<b>${esc(nx.sess.name)}</b> on ${DAYS_L[wd(nx.date)]}` : 'coming up soon'; })()}. Eat well and get to bed on time.</p><div class="acts"><a class="btn btn-ghost btn-sm" href="#/progress">See progress</a><a class="btn btn-quiet btn-sm" href="#/fuel">Log food</a></div></div></div>`;
  if (!sess) {
    const nx = nextSessionFrom(new Date());
    return `<div class="ph"><div><div class="label">Session</div><h2 style="margin-top:8px">No session <em>today.</em></h2><p>It is a rest day on your plan.</p></div></div>
      <div class="card"><div class="empty"><div class="glyph">${IC.bed}</div><h4>Rest is part of the plan</h4><p>Training on a rest day is fine if you missed a session this week. Pulse will load your next planned session.</p>
      <div class="acts">${nx ? `<button class="btn btn-primary btn-sm" data-act="start-anyway">${IC.play}Train anyway: ${esc(nx.sess.name)}</button>` : ''}<a class="btn btn-ghost btn-sm" href="#/plan">View plan</a></div></div></div>`;
  }
  const tot = sess.exs.reduce((t, e) => t + e.sets, 0);
  return `<div class="ph"><div><div class="label">Ready when you are</div><h2 style="margin-top:8px">${esc(sess.name)}</h2><p>${esc(sess.focus)} · ${plural(tot, 'set')} · about ${sess.mins} minutes</p></div>
    <div class="ph-actions"><button class="btn btn-primary btn-lg" data-act="start">${IC.play}Start session</button></div></div>
    <div class="dash">
      <div class="card c-5"><div class="card-h"><h3>Warm up first</h3><span class="label">6 min</span></div><div class="card-b"><ul class="mini-list">${RAMP.map(([a, b, c]) => `<li><span><b style="font-weight:550">${a}</b> <span class="muted">· ${formLinks(b)}</span></span><span>${c}</span></li>`).join('')}</ul></div></div>
      <div class="card c-7"><div class="card-h"><h3>What is coming</h3><span class="label">${sess.phase.n} week</span></div><div class="card-b"><ol class="ex-peek" style="margin:0">${sess.exs.map((e, i) => `<li><span class="i">${String(i + 1).padStart(2, '0')}</span><span>${formName(e.n)}</span><span class="sr2">${e.sets} × ${e.reps}</span></li>`).join('')}</ol>
      <p class="muted" style="font-size:13px;margin-top:14px">Tap any exercise to watch how it is done. During the session, tap each set as you finish it.</p></div></div>
    </div>`;
};
function liveSession() {
  const sess = activeSession();
  if (!sess) { S.active = null; save(); return VIEWS.session(); }
  const a = S.active, tot = sess.exs.reduce((t, e) => t + e.sets, 0), dn = setsDone();
  const extras = [...(sess.prep ? [{ t: sess.prep.sport.split(' (')[0] + ' prep', items: sess.prep.items }] : []), ...sess.blocks.map(b => ({ t: b.t, items: b.items }))];
  return `<div class="card raised" style="overflow:hidden">
    <div class="live-head"><div><div class="label" style="display:flex;gap:8px;align-items:center"><span class="dot live"></span>Live · ${sess.phase.n} week${a.from !== a.date ? ' · from ' + DAYS[wd(parseIso(a.from))] : ''}</div><h3 style="margin-top:6px">${esc(sess.name)}</h3></div>
      <div style="text-align:right"><div class="clock" id="clock" aria-label="Elapsed time">${hms((Date.now() - a.start) / 1000)}</div><div class="label" style="margin-top:6px" id="sets-lbl">${dn} / ${tot} sets</div></div></div>
    <div class="live-progress" role="progressbar" aria-label="Sets completed" aria-valuemin="0" aria-valuemax="${tot}" aria-valuenow="${dn}"><i id="live-bar" style="width:${tot ? dn / tot * 100 : 0}%"></i></div>
    ${sess.exs.map(e => {
      const arr = a.sets[e.key] || [], complete = arr.filter(Boolean).length >= e.sets, last = lastKg(e.n), kg = a.kg[e.n] ?? last ?? '';
      return `<div class="lx ${complete ? 'complete' : ''}" data-lx="${esc(e.key)}">
        <div class="lx-top">${formThumb(e.n, 'sm')}<div style="min-width:0"><h5><span class="tickc">${IC.check}</span>${esc(e.n)}</h5><p>${e.sets} × ${e.reps} · rest ${restTxt(e.rest)} · RPE ${e.rpe} · ${esc(e.cue)}</p></div></div>
        <div class="lx-row"><div class="sets" role="group" aria-label="Sets for ${esc(e.n)}">${Array.from({ length: e.sets }, (_, j) => `<button class="set" data-act="set" data-key="${esc(e.key)}" data-j="${j}" aria-pressed="${!!arr[j]}" aria-label="Set ${j + 1} of ${e.sets}">${arr[j] ? IC.check.replace('<svg', '<svg width="15" height="15"') : `Set ${j + 1}`}</button>`).join('')}</div>
        ${isLoaded(e) ? `<div class="kg"><button data-act="kg" data-n="${esc(e.n)}" data-v="-2.5" aria-label="Decrease weight">${IC.minus}</button><input type="number" inputmode="decimal" step="0.5" min="0" data-kg="${esc(e.n)}" value="${kg}" placeholder="0" aria-label="Weight in kilograms for ${esc(e.n)}"><span class="u">kg</span><button data-act="kg" data-n="${esc(e.n)}" data-v="2.5" aria-label="Increase weight">${IC.plus}</button></div>` : ''}</div>
        ${last ? `<div class="last" style="margin-top:10px">Last time: ${fmt1(last)} kg</div>` : ''}</div>`;
    }).join('')}
    ${extras.map(x => `<div class="lx"><div class="label" style="margin-bottom:8px">${esc(x.t)} · optional</div><ul class="mini-list">${x.items.map(([n, r]) => `<li><span>${formName(n)}</span><span>${esc(r)}</span></li>`).join('')}</ul></div>`).join('')}
    <div class="card-f" style="padding:16px 22px"><button class="btn btn-quiet" data-act="discard">${IC.trash}Discard</button><button class="btn btn-primary btn-lg" data-act="finish">Finish session ${IC.arrow}</button></div>
  </div>`;
}
function startClock() {
  clearInterval(clockTimer);
  clockTimer = setInterval(() => { const c = $('#clock'); if (!c || !S.active) return clearInterval(clockTimer); c.textContent = hms((Date.now() - S.active.start) / 1000); }, 1000);
}
function startSession(fromDate) {
  if (S.active) { navigate('session'); return; }
  primeAudio();
  const from = fromDate || today();
  S.active = { date: today(), from, start: Date.now(), sets: {}, kg: {} };
  save();
  if (UI.view === 'session') refresh(); else navigate('session');
  toast('Session started. Tap a set when you finish it.', { icon: IC.play });
}
function updateLiveCounters() {
  const sess = activeSession(); if (!sess) return;
  const tot = sess.exs.reduce((t, e) => t + e.sets, 0), dn = setsDone();
  const b = $('#live-bar'); if (b) { b.style.width = (dn / tot * 100) + '%'; b.parentElement.setAttribute('aria-valuenow', dn); }
  const l = $('#sets-lbl'); if (l) l.textContent = `${dn} / ${tot} sets`;
}
function toggleSet(key, j, btn) {
  const sess = activeSession(); if (!sess) return;
  const e = sess.exs.find(x => x.key === key); if (!e) return;
  const arr = S.active.sets[key] || (S.active.sets[key] = Array(e.sets).fill(false));
  arr[j] = !arr[j];
  save();
  btn.setAttribute('aria-pressed', arr[j]);
  btn.innerHTML = arr[j] ? IC.check.replace('<svg', '<svg width="15" height="15"') : `Set ${j + 1}`;
  if (arr[j]) { btn.classList.remove('just'); void btn.offsetWidth; btn.classList.add('just'); if (navigator.vibrate) navigator.vibrate(12); }
  const lx = btn.closest('.lx'), complete = arr.filter(Boolean).length >= e.sets;
  lx.classList.toggle('complete', complete);
  updateLiveCounters();
  const tot = sess.exs.reduce((t, x) => t + x.sets, 0);
  if (arr[j]) {
    if (setsDone() >= tot) { stopRest(); toast('<b>Every set done.</b> Finish the session to log it.', { action: { label: 'Finish', fn: finishSession } }); }
    else startRest(complete ? Math.min(e.rest, 90) : e.rest, complete ? 'Next exercise' : `${e.n} · set ${arr.filter(Boolean).length + 1}`);
  }
}
/* rest timer */
let REST = null;
function startRest(secs, label) {
  stopRest();
  const el = document.createElement('div'); el.className = 'rest-bar'; el.setAttribute('role', 'timer'); el.setAttribute('aria-live', 'off');
  const C = 2 * Math.PI * 14;
  el.innerHTML = `<svg class="rest-ring" viewBox="0 0 34 34"><circle class="trk2" cx="17" cy="17" r="14"/><circle class="v2" cx="17" cy="17" r="14" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
    <div style="flex:1;min-width:0"><div class="label">Rest</div><div style="font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;color:rgba(241,239,233,.75)">${esc(label)}</div></div>
    <span class="t">${mmss(secs)}</span><button class="btn btn-sm btn-quiet" data-r="add">+15 s</button><button class="btn btn-sm btn-quiet" data-r="skip">Skip</button>`;
  $('#layer').appendChild(el);
  REST = { end: Date.now() + secs * 1000, total: secs, el };
  el.querySelector('[data-r="add"]').onclick = () => { REST.end += 15000; REST.total += 15; tickRest(); };
  el.querySelector('[data-r="skip"]').onclick = stopRest;
  REST.timer = setInterval(tickRest, 250); tickRest();
}
function tickRest() {
  if (!REST) return;
  const left = (REST.end - Date.now()) / 1000, C = 2 * Math.PI * 14;
  REST.el.querySelector('.t').textContent = mmss(Math.ceil(left));
  REST.el.querySelector('.v2').style.strokeDashoffset = C * (1 - clamp(left / REST.total, 0, 1));
  if (left <= 0) { stopRest(); if (PREFS.sound) chime(); if (navigator.vibrate) navigator.vibrate([60, 60, 60]); toast('Rest over. Next set.', { icon: IC.bolt, ms: 2200 }); }
}
function stopRest() {
  if (!REST) return;
  clearInterval(REST.timer);
  const el = REST.el; el.style.transition = 'opacity .2s, transform .2s'; el.style.opacity = 0; el.style.transform = 'translate(-50%, 10px)'; setTimeout(() => el.remove(), 200);
  REST = null;
}
const RPE_TXT = { 1: 'Barely anything. Could do this all day.', 2: 'Very easy. Chatting the whole time.', 3: 'Easy. Breathing a little harder.', 4: 'Comfortable. Light sweat.', 5: 'Moderate. Working, with plenty left.', 6: 'Somewhat hard. Three or four reps left in the tank.', 7: 'Hard. Two or three reps left in the tank.', 8: 'Very hard. One or two reps left.', 9: 'Near max. Maybe one more rep.', 10: 'Maximal. Nothing left at all.' };
function finishSession() {
  const sess = activeSession(); if (!sess) return;
  const tot = sess.exs.reduce((t, e) => t + e.sets, 0), dn = setsDone();
  if (!dn) { toast('Tick off at least one set before finishing, or discard the session.', { type: 'err' }); return; }
  const ask = () => {
    let rpe = null;
    openModal({
      title: 'How hard was that?', sub: 'Rate the whole session from 1 to 10. Pulse multiplies it by the minutes to track your training load.',
      body: `<div class="rpe-grid" role="radiogroup" aria-label="Session effort">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<button type="button" role="radio" aria-checked="false" data-v="${v}">${v}</button>`).join('')}</div><div class="rpe-desc" id="rpe-desc">Pick a number. Most good sessions land between 6 and 8.</div>`,
      actions: [{ label: 'Back to session' }, { label: 'Save session', kind: 'btn-primary', fn: (api, btn) => { if (!rpe) { $('#rpe-desc').innerHTML = `<span style="color:var(--bad)">Choose a number from 1 to 10 first.</span>`; return false; } logSession(rpe); } }],
      onOpen(m) {
        $$('.rpe-grid button', m).forEach(b => b.onclick = () => { rpe = +b.dataset.v; $$('.rpe-grid button', m).forEach(x => x.setAttribute('aria-checked', x === b)); $('#rpe-desc').textContent = RPE_TXT[rpe]; });
      }
    });
  };
  if (dn < tot) confirmModal({ title: `Finish with ${dn} of ${tot} sets?`, sub: 'Unticked sets will not count. You can still log the session and its effort.', confirm: 'Finish anyway', onConfirm: () => { setTimeout(ask, 240); } });
  else ask();
}
function logSession(rpe) {
  const sess = activeSession(), a = S.active;
  const tot = sess.exs.reduce((t, e) => t + e.sets, 0), dn = setsDone();
  const mins = Math.max(1, Math.round((Date.now() - a.start) / 60000));
  const kg = {};
  sess.exs.forEach(e => { const v = +a.kg[e.n]; if (v > 0 && (a.sets[e.key] || []).some(Boolean)) kg[e.n] = v; });
  const prevBest = Object.fromEntries(bests());
  const pbs = Object.entries(kg).filter(([n, v]) => !prevBest[n] || v > prevBest[n].kg).map(([n, v]) => ({ n, v, prev: prevBest[n] ? prevBest[n].kg : null }));
  const entry = { id: 's' + Date.now().toString(36), date: a.date, from: a.from, tKey: sess.tKey, name: sess.name, rpe, mins, load: Math.round(rpe * mins), done: dn, total: tot, kg };
  S.log.sessions.push(entry);
  S.log.sessions.sort((x, y) => x.date < y.date ? -1 : x.date > y.date ? 1 : 0);
  S.active = null;
  stopRest(); save();
  UI.justDone = { entry, pbs };
  refresh();
  window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
  checkMilestones();
}
function doneScreen({ entry, pbs }) {
  const planned = trainingDays(S.profile).length, wk = weekDone(mondayOf(new Date())), r = acwr();
  return `<div class="card raised"><div class="done-hero">
      <div class="seal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></div>
      <h2>Session logged.</h2><p>${esc(entry.name)} · ${fmtDate(parseIso(entry.date))}${entry.done < entry.total ? ` · ${entry.done} of ${entry.total} sets` : ' · every set done'}</p></div>
    <div style="padding:0 22px 22px"><div class="stats">
      <div><span class="label">Duration</span><b>${entry.mins}<small>min</small></b></div>
      <div><span class="label">Effort</span><b>${entry.rpe}<small>RPE</small></b><span class="delta">${esc(RPE_TXT[entry.rpe].split('.')[0])}</span></div>
      <div><span class="label">Load</span><b><span data-count="${entry.load}">0</span><small>AU</small></b>${r ? `<span class="delta ${r > 1.5 ? 'hot' : ''}">Acute:chronic ${fmt1(r)}</span>` : ''}</div>
      <div><span class="label">This week</span><b>${wk}<small>/ ${planned}</small></b><span class="delta ${wk >= planned ? 'up' : ''}">${wk >= planned ? 'Week complete' : plural(planned - wk, 'session') + ' to go'}</span></div>
    </div>
    ${pbs.length ? `<div class="card" style="margin-top:14px;background:var(--surface-2)"><div class="card-h"><h3>New personal bests</h3><span class="pill acc">${pbs.length}</span></div><div class="card-b"><ul class="pb-list">${pbs.map(p => `<li><div><div class="nm">${esc(p.n)}</div><div class="dt">${p.prev ? `Up from ${fmt1(p.prev)} kg` : 'First logged weight'}</div></div><b>${fmt1(p.v)} kg</b></li>`).join('')}</ul></div></div>` : ''}
    <div class="acwr" style="margin-top:14px;background:color-mix(in srgb, #3B82C4 10%, transparent)"><span style="color:#3B82C4">${IC.drop.replace('<svg', '<svg width="22" height="22"')}</span><p><b>Drink ${entry.mins > 50 ? '500–750' : '400–500'} ml in the next hour.</b> You lost water through sweat, and even mild dehydration slows recovery. <button class="link-tip" data-act="drink" data-ml="500">Log 500 ml now</button></p></div>
    <div class="acwr" style="margin-top:14px">${IC.fuel.replace('<svg', '<svg width="22" height="22"')}<p><b>Refuel in the next two hours.</b> Aim for ${Math.round(S.profile.weight * 0.3)}–${Math.round(S.profile.weight * 0.4)} g of protein plus carbs, like ${S.profile.diet === 'vegan' ? 'dal, rice and a pea shake' : S.profile.diet === 'veg' ? 'paneer with roti, or curd and a banana' : 'chicken, rice and fruit'}.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:18px"><a class="btn btn-primary" href="#/today">Back to today</a><a class="btn btn-ghost" href="#/progress">See progress</a><a class="btn btn-quiet" href="#/fuel">Log food</a></div></div></div>`;
}

/* =========================================================
   VIEW: FUEL
   ========================================================= */
function foodResults() {
  const p = S.profile, q = UI.foodQ.trim().toLowerCase();
  let r = Object.entries(FOODS).filter(([id, f]) => (!q || f[0].toLowerCase().includes(q) || id.includes(q)) && (!UI.dietOnly || foodOk(id, p)));
  const F = { protein: f => f[3] >= 15, carbs: f => f[4] >= 30, light: f => f[2] <= 150 }[UI.foodFilter];
  if (F) r = r.filter(([, f]) => F(f));
  const sorts = { match: ([a, f], [b, g]) => (q ? (g[0].toLowerCase().startsWith(q) - f[0].toLowerCase().startsWith(q)) : 0) || f[0].localeCompare(g[0]), protein: (a, b) => b[1][3] - a[1][3], kcal: (a, b) => a[1][2] - b[1][2], az: (a, b) => a[1][0].localeCompare(b[1][0]) };
  return r.sort(sorts[UI.foodSort]);
}
function addFood(id, opts = {}) {
  const ds = UI.fuelDate || today();
  const arr = S.log.food[ds] || (S.log.food[ds] = []);
  arr.push(Object.assign({ id, s: 1, meal: ds === today() ? mealNow() : 'Other' }, opts));
  save(); checkMilestones();
}

/* =========================================================
   VIEW: PROGRESS
   ========================================================= */
VIEWS.progress = () => {
  const ss = S.log.sessions, bs = iso(blockStart()), inBlock = ss.filter(s => s.date >= bs);
  const planned = trainingDays(S.profile).length, weeksIn = blockIdx() + 1;
  const recent = ss.slice(-8), avgRpe = recent.length ? recent.reduce((t, s) => t + s.rpe, 0) / recent.length : null;
  const w = S.log.weight, wl = w[w.length - 1], wf = w[0], wd2 = wl && wf ? wl.kg - wf.kg : 0;
  const weeks = weekLoads(8), r = acwr();
  const zone = r == null ? null : r < 0.8 ? ['Under-loaded', 'Training is lighter than usual. Fine in a deload, otherwise add a session.'] : r <= 1.3 ? ['Sweet spot', 'This week matches what your body is used to. Good place to be.'] : r <= 1.5 ? ['Caution', 'Load is climbing quickly. Sleep and eat well this week.'] : ['Spike', 'This week is well above your recent average. Injury risk climbs here, so ease off.'];
  const hist = (UI.histFilter === 'block' ? inBlock : ss).slice().reverse();
  const pb = bests().slice(0, 6), got = S.badges || {};
  return `<div class="ph"><div><div class="label">${plural(ss.length, 'session')} logged</div><h2 style="margin-top:8px">Your <em>progress.</em></h2></div></div>
    <div class="stats stagger" style="margin-bottom:16px">
      <div><span class="label">This block</span><b>${inBlock.length}<small>/ ${planned * weeksIn}</small></b><span class="delta">sessions so far</span></div>
      <div><span class="label">Streak</span><b>${weekStreak()}<small>${weekStreak() === 1 ? 'week' : 'weeks'}</small></b><span class="delta">of full weeks</span></div>
      <div><span class="label">Avg effort</span><b>${avgRpe ? fmt1(avgRpe) : '–'}<small>RPE</small></b><span class="delta">${recent.length ? 'last ' + plural(recent.length, 'session') : 'no sessions yet'}</span></div>
      <div><span class="label">Body weight</span><b>${wl ? fmt1(wl.kg) : '–'}<small>kg</small></b><span class="delta ${wd2 > 0 ? 'up' : ''}">${w.length > 1 ? `${wd2 >= 0 ? '+' : ''}${fmt1(wd2)} kg since ${fmtDate(parseIso(wf.date))}` : 'Log weekly to see a trend'}</span></div>
    </div>
    <div class="dash">
      <section class="card c-7"><div class="card-h"><h3>Training load</h3><span class="label">RPE × minutes · 8 weeks</span></div>
        <div class="card-b">${ss.length ? loadChartSVG(weeks) + (r != null ? `<div class="acwr"><div><div class="label" data-tip="Last 7 days ÷ weekly average of the last 28">Acute : chronic</div><div class="v" style="margin-top:6px">${fmt1(r)}</div></div><div style="flex:1;min-width:0"><p><b>${zone[0]}.</b> ${zone[1]}</p><div class="zone" aria-hidden="true"><i style="left:${clamp(r / 2, 0, 1) * 100}%"></i></div></div></div>` : '')
          : `<div class="empty"><div class="glyph">${IC.progress}</div><h4>No sessions yet</h4><p>Finish your first session and your weekly load will show up here.</p><div class="acts"><a class="btn btn-primary btn-sm" href="#/session">Go to session</a></div></div>`}</div></section>
      <section class="card c-5"><div class="card-h"><h3>Body weight</h3><span class="label">${w.length} entries</span></div>
        <div class="card-b">${w.length > 1 ? weightChartSVG(w.slice(-16)) : `<div class="empty" style="padding:24px 8px"><div class="glyph">${IC.scale}</div><h4>One entry so far</h4><p>Weigh in once a week, same time of day, to see a trend.</p></div>`}
          <form class="field" data-form="weight" style="margin-top:16px" novalidate><label for="w-in">Log today’s weight</label><div style="display:flex;gap:8px"><div class="input-wrap" style="flex:1"><input class="input num" id="w-in" type="number" step="0.1" min="30" max="200" inputmode="decimal" placeholder="${wl ? fmt1(wl.kg) : '60'}"><span class="suffix">kg</span></div><button class="btn btn-primary" type="submit">Save</button></div><span class="error" id="w-err" hidden></span></form></div></section>
      <section class="card c-5"><div class="card-h"><h3>Personal bests</h3><span class="label">Heaviest logged</span></div>
        <div class="card-b">${pb.length ? `<ul class="pb-list">${pb.map(([n, x]) => `<li><div><div class="nm">${esc(n)}</div><div class="dt">${fmtDate(parseIso(x.date))}</div></div><b>${fmt1(x.kg)} kg</b></li>`).join('')}</ul>` : `<div class="empty" style="padding:24px 8px"><div class="glyph">${IC.medal}</div><h4>No weights logged</h4><p>Enter the kilos you lift during a session and your bests appear here.</p></div>`}</div></section>
      <section class="card c-7"><div class="card-h"><h3>History</h3>${seg2('hist', [['all', 'All'], ['block', 'This block']], UI.histFilter)}</div>
        <div class="card-b">${hist.length ? `<ul class="hist">${hist.slice(0, 12).map(s => { const d = parseIso(s.date); return `<li><div class="dte"><b>${d.getDate()}</b><span>${d.toLocaleDateString('en', { month: 'short' })}</span></div><div style="min-width:0"><div class="nm">${esc(s.name)}</div><div class="sub">${DAYS[wd(d)]} · ${s.mins} min · ${s.done}/${s.total} sets · RPE ${s.rpe}</div></div><span class="ld">${fmtN(s.load)} AU</span><button class="icon-btn sm" data-act="hist-del" data-id="${esc(s.id || s.date)}" aria-label="Delete ${esc(s.name)} on ${fmtDate(d)}">${IC.trash}</button></li>`; }).join('')}</ul>${hist.length > 12 ? `<p class="muted" style="font-size:12.5px;margin-top:12px">Showing the latest 12 of ${hist.length}. Export your data from Profile for the full record.</p>` : ''}`
          : `<div class="empty" style="padding:24px 8px"><h4 style="font-size:15px">Nothing here yet</h4><p style="font-size:13.5px">${UI.histFilter === 'block' ? 'No sessions logged in this block yet.' : 'Logged sessions will appear here.'}</p></div>`}</div></section>
      <section class="card c-12"><div class="card-h"><h3>Milestones</h3><span class="pill ${Object.keys(got).length ? 'acc' : ''}">${MILESTONES.filter(m => got[m[0]]).length} of ${MILESTONES.length}</span></div>
        <div class="card-b"><div class="badges">${MILESTONES.map(([id, t, d]) => `<div class="medal ${got[id] ? 'got' : ''}"><span class="m">${got[id] ? IC.medal : IC.lock}</span><b>${esc(t)}</b>${got[id] ? 'Earned ' + fmtDate(parseIso(got[id])) : esc(d)}</div>`).join('')}</div></div></section>
    </div>`;
};
const seg2 = (k, opts, val) => `<div class="seg sm" role="tablist">${opts.map(([v, l]) => `<button type="button" role="tab" data-act="seg" data-k="${k}" data-v="${v}" aria-selected="${val === v}">${l}</button>`).join('')}</div>`;
function upsertWeight(ds, kg) {
  const w = S.log.weight, i = w.findIndex(x => x.date === ds);
  if (i >= 0) w[i].kg = kg; else { w.push({ date: ds, kg }); w.sort((a, b) => a.date < b.date ? -1 : 1); }
}

/* =========================================================
   VIEW: PROFILE
   ========================================================= */
VIEWS.profile = () => {
  const p = S.profile, t = targets(p), tp = themePref();
  const where = { gym: 'Full gym', school: 'School gym', home: 'Home', none: 'No equipment' }[p.where];
  return `<div class="ph"><div class="prof-head"><span class="avatar">${esc(initials(p.name))}</span><div><h2>${esc(p.name)}</h2><p style="margin-top:2px">${p.age} · ${GOALS[p.goal].label}${p.sports.length ? ' · ' + p.sports.map(s => SPORTS[s].split(' (')[0]).join(', ') : ''}</p></div></div>
    <div class="ph-actions"><a class="btn btn-primary" href="#/start">${IC.edit}Edit plan inputs</a></div></div>
    <div class="dash">
      <section class="card c-12">${accountCard()}</section>
      <section class="card c-7"><div class="card-h"><h3>Your inputs</h3><span class="label">Change any of these in Edit plan inputs</span></div>
        <div class="card-b"><dl class="review" style="border:0;background:none">${[
          ['Body', `${p.height} cm · ${p.weight} kg · ${p.sex === 'f' ? 'female' : 'male'}`],
          ['Goal', GOALS[p.goal].label + (p.extra.length ? ' + ' + p.extra.map(x => GOALS[x].label.toLowerCase()).join(', ') : '')],
          ['Week', `${p.sessions} × ${p.minutes} min · ${trainingDays(p).map(i => DAYS[i]).join(' ')}`],
          ['School', p.school ? Cloud.schoolName(p.school) + (p.grade ? ` · grade ${p.grade}` : '') : 'Not set'],
          ['Where', where + (p.where !== 'none' ? ` · ${plural((p.gear || []).length || (p.equip || []).length, 'piece')} of equipment` : '')],
          ['Level', { beg: 'New to lifting', int: 'Some experience', adv: 'Experienced' }[p.exp]],
          ['Diet', DIET_LABEL[p.diet] + (p.allergies ? ` · avoids ${p.allergies}` : '')],
          ['Injuries', p.injuries || 'None noted']
        ].map(([k, v]) => `<div style="padding-inline:0"><dt>${k}</dt><dd>${esc(v)}</dd><span></span></div>`).join('')}</dl></div></section>
      <section class="card c-5"><div class="card-h"><h3>Daily targets</h3><span class="label">Training day</span></div>
        <div class="card-b"><div class="kv" style="padding-top:0">${[['Energy', fmtN(t.kcal) + ' kcal'], ['Resting energy (BMR)', fmtN(t.bmr) + ' kcal'], ['Protein', t.protein + ' g'], ['Carbs', t.carbs + ' g'], ['Fat', t.fat + ' g'], ['Water', fmt1(t.water / 1000) + ' L']].map(([a, b]) => `<div><span>${a}</span><span>${b}</span></div>`).join('')}</div></div></section>
      <section class="card c-6"><div class="card-h"><h3>Preferences</h3></div>
        <div class="card-b settings">
          <div class="set-row"><div><b>Appearance</b><span>Follow your device, or pick one</span></div><div class="seg sm" role="radiogroup" aria-label="Theme">${[['system', 'Auto'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button type="button" role="radio" data-act="theme-set" data-v="${v}" aria-checked="${tp === v}">${l}</button>`).join('')}</div></div>
          <div class="set-row"><div><b>Water reminders</b><span>${PREFS.remind ? `Every ${PREFS.remind} minutes, 7 am to 9 pm` : 'Off'}</span></div><button class="btn btn-ghost btn-sm" data-act="water-remind">${IC.bell}Change</button></div>
          <div class="set-row"><div><b>Rest timer sound</b><span>A soft chime when rest is over</span></div><button class="switch" role="switch" aria-checked="${PREFS.sound}" data-act="pref-sound" aria-label="Rest timer sound"></button></div>
          <div class="set-row"><div><b>Exercise swaps</b><span>${Object.keys(S.swaps || {}).length ? plural(Object.keys(S.swaps).length, 'swap') + ' in your plan' : 'No swaps made'}</span></div><button class="btn btn-ghost btn-sm" data-act="reset-swaps" ${Object.keys(S.swaps || {}).length ? '' : 'disabled'}>Reset swaps</button></div>
          <div class="set-row"><div><b>Restart the block</b><span>Begin again at Base week from this Monday</span></div><button class="btn btn-ghost btn-sm" data-act="restart-block">Restart</button></div>
        </div></section>
      <section class="card c-6"><div class="card-h"><h3>Your data</h3><span class="label">${S.sample ? 'Sample only' : Cloud.user ? 'Saved to your account' : 'Stored on this device'}</span></div>
        <div class="card-b settings">
          <div class="set-row"><div><b>Export</b><span>Download everything as a JSON file</span></div><button class="btn btn-ghost btn-sm" data-act="export">${IC.download}Export</button></div>
          <div class="set-row"><div><b>Import</b><span>Restore from a Pulse export</span></div><label class="btn btn-ghost btn-sm" tabindex="0">${IC.upload}Import<input type="file" accept="application/json,.json" id="import-file" hidden></label></div>
          <div class="set-row"><div><b>Delete all data</b><span>Removes your plan and logs${Cloud.user ? ' from your account' : ' from this browser'}</span></div><button class="btn btn-ghost btn-sm" data-act="wipe" style="color:var(--bad)">${IC.trash}Delete</button></div>
        </div></section>
      <p class="muted c-12" style="font-size:12.5px;max-width:60em">Pulse gives general training and nutrition guidance, not medical advice. If you are under 18, train with supervision where you can, and check with a coach, parent or doctor before starting a new programme, especially if you have an injury or a health condition.</p>
    </div>`;
};

/* =========================================================
   ACTIONS (event delegation)
   ========================================================= */
const ACT = {
  cmdk: () => openCmdk(),
  theme: () => toggleTheme(),
  'theme-set': el => { setTheme(el.dataset.v); $$('[data-act="theme-set"]').forEach(b => b.setAttribute('aria-checked', b === el)); syncSegs(); },
  'pref-sound': el => { PREFS.sound = !PREFS.sound; savePrefs(); el.setAttribute('aria-checked', PREFS.sound); if (PREFS.sound) { primeAudio(); chime(); } },

  /* onboarding */
  'ob-set': el => {
    const f = el.dataset.f, raw = el.dataset.v, v = ['sessions', 'minutes'].includes(f) ? +raw : raw;
    UI.draft[f] = v;
    if (f === 'goal') UI.draft.extra = UI.draft.extra.filter(x => x !== v);
    if (f === 'sessions' && UI.draft.days.length > v) UI.draft.days = [];
    delete UI.errors[f]; saveDraft();
    const keepScroll = scrollY;
    if (['goal', 'where', 'sessions'].includes(f)) { drawObStep(); window.scrollTo(0, keepScroll); } else { const grp = el.parentElement; $$('[data-act="ob-set"][data-f="' + f + '"]', grp).forEach(b => b.setAttribute(b.hasAttribute('aria-pressed') ? 'aria-pressed' : 'aria-checked', b === el)); syncSegs(grp.parentElement); $('.ob-side').innerHTML = obSide(); }
  },
  'ob-toggle': el => {
    const f = el.dataset.f, v = el.dataset.v, arr = UI.draft[f], max = { extra: 2, sports: 3 }[f] || 99;
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else { if (arr.length >= max) { toast(`You can pick up to ${max}. Remove one first.`, { type: 'err' }); return; } arr.push(v); }
    el.setAttribute('aria-pressed', i < 0); saveDraft(); $('.ob-side').innerHTML = obSide();
    const hint = el.closest('.field').querySelector('.hint'); if (f === 'equip' && hint) hint.textContent = arr.length ? plural(arr.length, 'item') : 'Bodyweight only';
  },
  'ob-day': el => {
    const v = +el.dataset.v, d = UI.draft.days, i = d.indexOf(v), n = +UI.draft.sessions;
    if (i >= 0) d.splice(i, 1); else { if (d.length >= n) { toast(`You picked ${n} sessions a week. Unselect a day first.`, { type: 'err' }); return; } d.push(v); }
    delete UI.errors.days; saveDraft();
    el.setAttribute('aria-pressed', i < 0);
    const f = el.closest('.field'); f.classList.remove('err'); const er = f.querySelector('.error'); er && er.remove();
    f.querySelector('.hint').textContent = d.length ? `${d.length} of ${n} picked` : `Leave empty and Pulse spaces ${n} days for you`;
  },
  'kit-tog': el => { const g = UI.draft.gear || (UI.draft.gear = []), id = el.dataset.id, i = g.indexOf(id); if (i >= 0) g.splice(i, 1); else g.push(id); el.setAttribute('aria-pressed', i < 0); if (i < 0) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } kitSync(); },
  'kit-all': () => { UI.draft.gear = EQUIP.map(e => e.id); $$('.kit-tile').forEach(b => b.setAttribute('aria-pressed', 'true')); kitSync(); },
  'kit-clear': () => { UI.draft.gear = []; $$('.kit-tile').forEach(b => b.setAttribute('aria-pressed', 'false')); kitSync(); },
  'kit-preset': el => { UI.draft.gear = (GYM_PRESETS[el.dataset.v] || []).slice(); $$('.kit-tile').forEach(b => b.setAttribute('aria-pressed', UI.draft.gear.includes(b.dataset.id))); kitSync(); toast(`Preset applied. Tap any piece to add or remove it.`); },
  'kit-cat': el => { UI.kitCat = el.dataset.v; const y = scrollY; drawObStep(); window.scrollTo(0, y); },
  'ob-next': () => obNext(),
  'ob-back': () => { if (UI.obStep > 0) { UI.obStep--; UI.errors = {}; saveDraft(); drawObStep(); } },
  'ob-goto': el => { const i = +el.dataset.i; if (i <= UI.obStep) { UI.obStep = i; UI.errors = {}; drawObStep(); } },

  /* today */
  start: () => startSession(),
  'start-anyway': () => { const nx = nextSessionFrom(new Date()); if (nx) startSession(iso(nx.date)); },
  ci: el => { UI.ci[el.dataset.f] = +el.dataset.v; $$(`[data-act="ci"][data-f="${el.dataset.f}"]`).forEach(b => b.setAttribute('aria-checked', b === el)); },
  'ci-save': () => { S.log.check[today()] = { ...UI.ci }; UI.editCheck = false; UI.ci = null; save(); refresh(); const b = readyBand(readiness(S.log.check[today()])); toast(`<b>Checked in.</b> ${b.t}.`); checkMilestones(); },
  'ci-edit': () => { UI.editCheck = true; UI.ci = { ...S.log.check[today()] }; refresh(); },
  'ci-cancel': () => { UI.editCheck = false; UI.ci = null; refresh(); },

  /* plan */
  'plan-week': el => { UI.planWeek = +el.dataset.i; refresh(); },
  'plan-day': el => { UI.planDay = +el.dataset.i; refresh(); },
  'plan-today': () => { UI.planWeek = blockIdx(); UI.planDay = wd(new Date()); refresh(); },
  'plan-goto': el => { const d = parseIso(el.dataset.d), bs = blockStart(); const w = Math.floor((mondayOf(d) - bs) / (7 * 864e5)); if (w > 3) { toast('That session is in your next block.'); return; } UI.planWeek = w; UI.planDay = wd(d); refresh(); },
  swap: el => {
    const key = el.dataset.key, from = el.dataset.n;
    S.swaps[key] = (S.swaps[key] || 0) + 1; save();
    refresh();
    const row = $(`.ex[data-ex="${CSS.escape(key)}"]`);
    if (row) { row.classList.add('swapping'); const to = row.querySelector('h5').textContent; toast(`Swapped <b>${esc(from)}</b> for <b>${esc(to)}</b>.`, { icon: IC.swap, action: { label: 'Undo', fn: () => { S.swaps[key] = Math.max(0, S.swaps[key] - 1); if (!S.swaps[key]) delete S.swaps[key]; save(); refresh(); } } }); }
  },

  /* session */
  set: el => toggleSet(el.dataset.key, +el.dataset.j, el),
  kg: el => { const n = el.dataset.n, inp = el.parentElement.querySelector('input'); const v = Math.max(0, (+inp.value || 0) + +el.dataset.v); inp.value = v; S.active.kg[n] = v; save(); },
  finish: () => finishSession(),
  discard: () => confirmModal({ title: 'Discard this session?', sub: 'The sets you ticked will not be saved. This cannot be undone.', confirm: 'Discard session', danger: true, onConfirm: () => { S.active = null; stopRest(); save(); refresh(); toast('Session discarded.'); } }),

  /* fuel */
  'fuel-day': el => { const d = addDays(parseIso(UI.fuelDate), +el.dataset.v); if (iso(d) > today()) return; UI.fuelDate = iso(d); refresh(); },
  'food-add': el => {
    const id = el.dataset.id; addFood(id);
    const f = FOODS[id];
    const y = scrollY; refresh(); window.scrollTo(0, y);
    const row = $(`.food-row[data-id="${id}"]`); if (row) { row.classList.add('flash'); }
    toast(`Added <b>${esc(f[0])}</b> · ${fmtN(f[2])} kcal`, { action: { label: 'Undo', fn: () => { const arr = S.log.food[UI.fuelDate] || []; const i = arr.map(x => x.id).lastIndexOf(id); if (i >= 0) arr.splice(i, 1); save(); refresh(); } } });
  },
  'food-del': el => {
    const ds = UI.fuelDate, arr = S.log.food[ds], i = +el.dataset.i, [it] = arr.splice(i, 1); save();
    const y = scrollY; refresh(); window.scrollTo(0, y);
    const f = itemInfo(it); toast(`Removed ${esc(f ? f.name : 'item')}.`, { action: { label: 'Undo', fn: () => { (S.log.food[ds] || (S.log.food[ds] = [])).splice(i, 0, it); save(); refresh(); } } });
  },
  serv: el => { const arr = S.log.food[UI.fuelDate], it = arr[+el.dataset.i]; it.s = clamp((it.s || 1) + +el.dataset.v, 0.5, 10); save(); const y = scrollY; refresh(); window.scrollTo(0, y); },
  'food-filter': el => { UI.foodFilter = el.dataset.v; redrawFoodSearch(); },
  'diet-only': () => { UI.dietOnly = !UI.dietOnly; redrawFoodSearch(); },
  'custom-food': () => customFoodModal(),
  'how-kcal': () => { const p = S.profile, t = targets(p, !!sessionFor(parseIso(UI.fuelDate || today()))); openModal({ title: 'How your targets are set', sub: 'Every number comes from a published method.', body: `<div class="kv" style="padding-top:0">${[['Resting energy (Mifflin–St Jeor)', fmtN(t.bmr) + ' kcal'], ['× activity for ' + p.sessions + ' sessions a week', '× ' + ({ 2: 1.45, 3: 1.55, 4: 1.6, 5: 1.7, 6: 1.8 }[p.sessions] || 1.55)], ['× goal: ' + GOALS[p.goal].label.toLowerCase(), '× ' + ({ muscle: 1.1, strength: 1.05, lean: p.age < 18 ? 0.92 : 0.85, general: 1, endurance: 1.1, speed: 1.05, mobility: 1 }[p.goal])], ['Daily energy', fmtN(t.kcal) + ' kcal'], ['Protein at ' + ({ muscle: 1.8, strength: 1.8, lean: 2.0, general: 1.5, endurance: 1.5, speed: 1.7, mobility: 1.4 }[p.goal]) + ' g per kg', t.protein + ' g'], ['Fat at 27% of energy', t.fat + ' g'], ['Carbs fill the rest', t.carbs + ' g'], ['Water: 35 ml per kg' + (p.climate === 'hot' ? ' + heat' : '') + ' + training', litres(t.water / 250) + ' L']].map(([a, b]) => `<div><span>${a}</span><span>${b}</span></div>`).join('')}</div><p class="muted" style="font-size:13px;margin-top:14px">${p.age < 18 && p.goal === 'lean' ? 'Because you are under 18, Pulse keeps the deficit small so growth is not affected.' : 'Targets update automatically when you log a new body weight.'}</p>`, actions: [{ label: 'Got it', kind: 'btn-primary' }] }); },

  /* progress */
  seg: el => { if (el.dataset.k === 'hist') UI.histFilter = el.dataset.v; const y = scrollY; refresh(); window.scrollTo(0, y); },
  'hist-del': el => {
    const id = el.dataset.id, i = S.log.sessions.findIndex(s => (s.id || s.date) === id); if (i < 0) return;
    const [s] = S.log.sessions.splice(i, 1); save(); const y = scrollY; refresh(); window.scrollTo(0, y);
    toast(`Deleted ${esc(s.name)} from ${fmtDate(parseIso(s.date))}.`, { action: { label: 'Undo', fn: () => { S.log.sessions.splice(i, 0, s); save(); refresh(); } } });
  },

  /* profile */
  'reset-swaps': () => { const old = S.swaps; S.swaps = {}; save(); refresh(); toast('Exercise swaps reset to the original plan.', { action: { label: 'Undo', fn: () => { S.swaps = old; save(); refresh(); } } }); },
  'restart-block': () => confirmModal({ title: 'Restart your block?', sub: 'Your plan goes back to Base week starting this Monday. Logged sessions and food stay as they are.', confirm: 'Restart block', onConfirm: () => { S.profile.createdAt = mondayOf(new Date()).getTime(); UI.planWeek = UI.planDay = null; save(); refresh(); $('#pg-crumb').textContent = `· Week 1 of 4 · Base`; toast('Block restarted. This is Base week.'); } }),
  export: () => {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pulse-${(S.profile.name || 'athlete').toLowerCase()}-${today()}.json`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Export downloaded.', { icon: IC.download });
  },
  wipe: () => confirmModal({ title: 'Delete all your Pulse data?', sub: 'Your plan, sessions, food logs and check-ins will be removed from this browser. Export first if you want a copy. This cannot be undone.', confirm: 'Delete everything', danger: true, onConfirm: () => { if (S.sample) { S = REAL; navigate(''); return; } store.del(stateKey()); store.del(LS_DRAFT); if (Cloud.user) { Cloud.saveState(null).catch(() => {}); Cloud.publishProgress([]).catch(() => {}); } REAL = S = null; UI.draft = null; navigate(Cloud.user ? 'start' : ''); setTimeout(() => toast(Cloud.user ? 'All plan data deleted. Your account is still here.' : 'All data deleted from this browser.'), 300); } })
};
function redrawFoodSearch() {
  const box = $('#food-search'); if (!box) return;
  const had = document.activeElement && document.activeElement.id === 'food-q', pos = had ? document.activeElement.selectionStart : 0;
  box.innerHTML = foodSearchCard();
  if (had) { const i = $('#food-q'); i.focus(); try { i.setSelectionRange(pos, pos); } catch (e) {} }
}
/* ---------- global listeners ---------- */
document.addEventListener('click', e => {
  if (e.target.closest('.skip')) { e.preventDefault(); const m = $('#main'); if (m) { m.setAttribute('tabindex', '-1'); m.focus(); } return; }
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.f && UI.screen === 'onboard') {
    const num = t.type === 'number';
    UI.draft[t.dataset.f] = num ? (t.value === '' ? '' : +t.value) : t.value;
    if (UI.errors[t.dataset.f]) { delete UI.errors[t.dataset.f]; const f = t.closest('.field'); f.classList.remove('err'); t.removeAttribute('aria-invalid'); const er = f.querySelector('.error'); er && er.remove(); }
    saveDraft(); $('.ob-side').innerHTML = obSide();
  }
  if (t.dataset.ci) { UI.ci.sleep = +t.value; t.style.setProperty('--p', (t.value - 4) / 6 * 100 + '%'); $('#ci-sleep-v').textContent = fmt1(+t.value) + ' h'; }
  if (t.id === 'food-q') { UI.foodQ = t.value; const r = $('#food-res'); if (r) redrawFoodSearch(); }
  if (t.dataset.kg && S && S.active) { S.active.kg[t.dataset.kg] = t.value === '' ? '' : +t.value; save(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'food-sort') { UI.foodSort = t.value; redrawFoodSearch(); }
  if (t.id === 'import-file' && t.files[0]) importFile(t.files[0]);
});
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.id === 'ob-form') { e.preventDefault(); obNext(); }
  if (f.dataset.form === 'weight') {
    e.preventDefault();
    const inp = $('#w-in'), err = $('#w-err'), v = +inp.value;
    if (!inp.value || v < 30 || v > 200) { err.hidden = false; err.innerHTML = `${IC.alert}Enter a weight between 30 and 200 kg.`; f.classList.add('err'); inp.focus(); return; }
    logWeighIn(round(v, 1));
  }
});
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk ? cmdk.close() : openCmdk(); return; }
  if (e.key === 'Escape') { if (modalStack.length) { modalStack[modalStack.length - 1].close(); return; } }
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
  if (e.key === '/' && !typing && !cmdk && !modalStack.length) { e.preventDefault(); openCmdk(); return; }
  if (e.key === 'Enter' && UI.screen === 'onboard' && !modalStack.length && document.activeElement.tagName === 'INPUT') { e.preventDefault(); obNext(); }
  if (e.target.matches && e.target.matches('label.btn') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.target.querySelector('input').click(); }
});
function importFile(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!d || !d.profile || !d.log || !Array.isArray(d.log.sessions)) throw new Error('shape');
      confirmModal({ title: 'Replace your data with this file?', sub: `${esc(d.profile.name || 'Athlete')} · ${plural(d.log.sessions.length, 'session')}. Your current plan and logs on this device will be overwritten.`, confirm: 'Import', onConfirm: () => {
        delete d.sample; migrateState(d);
        S = d; save(); UI.planWeek = UI.planDay = null; UI.screen = null; navigate('today'); setTimeout(() => toast('<b>Import complete.</b> Welcome back.'), 300);
      } });
    } catch (err) { toast('That file is not a Pulse export. Nothing was changed.', { type: 'err' }); }
  };
  rd.onerror = () => toast('Could not read that file.', { type: 'err' });
  rd.readAsText(file);
}

/* ---------- commands for the palette ---------- */
function commands(q) {
  const list = [];
  const inApp = UI.screen === 'app' && hasPlan();
  if (inApp) {
    APP_VIEWS.forEach(v => list.push({ group: 'Go to', label: VIEW_META[v].t, icon: IC[VIEW_META[v].ic], run: () => navigate(v), hint: v === UI.view ? 'Current' : '' }));
    const sess = sessionFor(new Date());
    if (S.active) list.push({ group: 'Actions', label: 'Resume session', icon: IC.play, run: () => navigate('session') });
    else if (sess && !loggedOn(today()).length) list.push({ group: 'Actions', label: `Start today’s session: ${esc(sess.name)}`, icon: IC.play, k: 'train workout', run: () => startSession() });
    list.push({ group: 'Actions', label: 'Log a glass of water', icon: IC.drop, k: 'drink hydrate', run: () => addDrink(250) });
    list.push({ group: 'Actions', label: 'Ask Pulse a question', icon: IC.chat, k: 'chat coach bot help', run: () => navigate('ask') });
    list.push({ group: 'Actions', label: 'Add your glass', icon: IC.glass, k: 'water cup bottle photo', run: () => glassModal() });
    list.push({ group: 'Actions', label: 'Morning check-in', icon: IC.bed, k: 'readiness sleep', run: () => { UI.editCheck = !!S.log.check[today()]; UI.ci = null; navigate('today'); } });
    list.push({ group: 'Actions', label: 'Add a custom food', icon: IC.plus, k: 'meal', run: () => { UI.fuelDate = today(); navigate('fuel'); setTimeout(customFoodModal, 350); } });
    list.push({ group: 'Actions', label: 'Edit plan inputs', icon: IC.edit, k: 'rebuild settings', run: () => navigate('start') });
    list.push({ group: 'Actions', label: 'Export my data', icon: IC.download, k: 'backup json', run: () => ACT.export() });
    if (q && q.length > 2) Object.keys(FORM).filter(n => n.toLowerCase().includes(q)).slice(0, 5).forEach(n => list.push({ group: 'Exercise form', label: `How to do ${esc(n)}`, icon: IC.play, always: true, run: () => formModal(n) }));
    if (q && q.length > 1) {
      Object.entries(FOODS).filter(([id, f]) => f[0].toLowerCase().includes(q)).slice(0, 6).forEach(([id, f]) => list.push({ group: 'Log food', label: `Log ${esc(f[0])}`, hint: `${fmtN(f[2])} kcal`, icon: IC.fuel, always: true, run: () => { UI.fuelDate = today(); addFood(id); if (UI.view === 'fuel') refresh(); toast(`Added <b>${esc(f[0])}</b> · ${fmtN(f[2])} kcal`, { action: { label: 'View', fn: () => navigate('fuel') } }); } }));
    }
    if (S.sample) list.push({ group: 'Pulse', label: 'Build my own plan', icon: IC.arrow, run: () => navigate('start') });
    list.push({ group: 'Pulse', label: 'Back to the homepage', icon: IC.mark, k: 'landing home', run: () => navigate('') });
  } else {
    list.push({ group: 'Start', label: REAL ? 'Open my plan' : 'Build my plan', icon: IC.arrow, run: () => navigate(REAL ? 'today' : 'start') });
    list.push({ group: 'Start', label: 'Explore the sample athlete', icon: IC.profile, k: 'demo aarav', run: () => navigate('sample') });
    [['method', 'How it works'], ['product', 'Inside the app'], ['block', 'The four-week block'], ['science', 'The science'], ['faq', 'Questions']].forEach(([id, l]) => list.push({ group: 'On this page', label: l, icon: IC.chevR, run: () => navigate(id) }));
  }
  list.push({ group: 'Preferences', label: isDark() ? 'Switch to light mode' : 'Switch to dark mode', icon: isDark() ? IC.sun : IC.moon, k: 'theme appearance', run: toggleTheme });
  return list;
}

/* ---------- boot ---------- */
async function boot() {
  loadPrefs();
  $('#root').innerHTML = '<div class="boot"><span class="brand-mark">' + IC.mark + '</span></div>';
  await Cloud.init();
  if (Cloud.user && Cloud.user.role === 'student') {
    let cloud = null; try { cloud = await Cloud.loadState(); } catch (e) {}
    const local = store.get(stateKey());
    REAL = [cloud, local].filter(x => x && x.profile && x.log).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0] || null;
  } else if (!Cloud.user) REAL = store.get(LS);
  if (REAL && (!REAL.profile || !REAL.log)) REAL = null;
  if (REAL) migrateState(REAL);
  S = sampleFlag() ? sampleState() : REAL;
  if (Cloud.user && REAL) { Sync.schedule(); Sync.pullReviews(); }
  Reminders.start();
  if (Cloud.offline) setTimeout(() => toast('Could not reach the Pulse servers. You can still use Pulse as a guest.', { type: 'err', ms: 8000 }), 600);
  addEventListener('hashchange', route);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { $$('[data-theme-ic]').forEach(b => b.innerHTML = isDark() ? IC.sun : IC.moon); });
  addEventListener('storage', e => { if (e.key === stateKey() && !(S && S.sample)) { REAL = store.get(stateKey()); if (REAL) migrateState(REAL); S = REAL; if (UI.screen === 'app') { if (!S) navigate(''); else refresh(); } } });
  addEventListener('pointerdown', primeAudio, { once: true });
  route();
}
addEventListener('DOMContentLoaded', boot);
