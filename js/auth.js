/* =========================================================
   PULSE — welcome (guest / sign up / log in), accounts and sync
   ========================================================= */

function authShell(inner, aside = '') {
  return `<div class="auth">
    <aside class="auth-side">
      <a class="brand" href="#/about"><span class="brand-mark">${IC.mark}</span>Pulse</a>
      <div class="auth-lanes" aria-hidden="true">${typeof LANES_SVG === 'function' ? LANES_SVG('draw') : ''}</div>
      <div class="auth-copy">${aside || `<h2 class="h-display" style="font-size:clamp(34px,4vw,52px)">Train for the gym <em>you actually</em> have.</h2>
        <p>Plans built from your equipment, meals sized to your goal, and water that finally gets the attention it deserves.</p>`}</div>
      <div class="auth-meta"><span>${IC.check}Built for student athletes</span><span>${IC.check}Coaches see progress, not your food log</span></div>
    </aside>
    <main class="auth-main" id="main">${inner}</main></div>`;
}
const demoNote = () => Cloud.mode === 'local' ? `<p class="demo-note">${IC.info}<span><b>Demo mode.</b> Accounts are kept in this browser only until the school’s Firebase project is connected.</span></p>` : '';

function showWelcome() {
  document.title = 'Welcome · Pulse';
  setScreen('welcome', authShell(`<div class="auth-box stagger">
      <div class="label">Welcome to Pulse</div>
      <h1>How do you want <em>to start?</em></h1>
      <div class="choice-list">
        <button class="choice" data-act="go-guest"><span class="ci">${IC.user}</span><span><b>Continue as a guest</b><span>Try everything now. Your plan stays on this device.</span></span>${IC.arrow}</button>
        <a class="choice" href="#/signup"><span class="ci acc">${IC.plus}</span><span><b>Create an account</b><span>Sync across devices and let your coaches follow your progress.</span></span>${IC.arrow}</a>
        <a class="choice" href="#/login"><span class="ci">${IC.lock}</span><span><b>Log in</b><span>Already have a Pulse account? Pick up where you left off.</span></span>${IC.arrow}</a>
      </div>
      ${demoNote()}
      <p class="auth-links"><a href="#/about">What is Pulse?</a><span>·</span><a href="#/sample">See a sample athlete</a></p>
    </div>`));
  animateIn($('#root'));
}

/* ---------- sign up / log in ---------- */
let AUTHF = { role: 'student', sports: [] };
function showAuth(kind) {
  document.title = (kind === 'signup' ? 'Create an account' : 'Log in') + ' · Pulse';
  const schools = PULSE_CONFIG.schools || [];
  const sel = (id, label, opts, val, hint = '') => `<div class="field" data-field="${id}"><label for="a-${id}">${label}${hint ? ` <span class="hint">${hint}</span>` : ''}</label><select class="input" id="a-${id}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${val === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
  const fld = (id, label, type, ph, ac, extra = '') => `<div class="field" data-field="${id}"><label for="a-${id}">${label}</label><div class="input-wrap">${`<input class="input" id="a-${id}" type="${type}" placeholder="${ph}" autocomplete="${ac}" ${extra}>`}${type === 'password' ? `<button type="button" class="pw-eye" data-act="pw-eye" aria-label="Show password">${IC.eye.replace('<svg', '<svg width="16" height="16"')}</button>` : ''}</div></div>`;
  const coach = AUTHF.role === 'coach';
  const form = kind === 'signup' ? `
      <div class="seg full" role="radiogroup" aria-label="Account type">${[['student', 'I’m a student'], ['coach', 'I’m a coach']].map(([v, l]) => `<button type="button" role="radio" data-act="auth-role" data-v="${v}" aria-checked="${AUTHF.role === v}">${l}</button>`).join('')}</div>
      ${fld('name', 'Full name', 'text', coach ? 'e.g. Ms Rhea Kapoor' : 'e.g. Maya Sharma', 'name', 'maxlength="40"')}
      ${fld('email', 'Email', 'email', 'you@school.edu', 'email')}
      ${fld('pw', 'Password', 'password', 'At least 6 characters', 'new-password')}
      <div class="grid-2">${sel('school', 'School', [['', 'Choose your school'], ...schools.map(sc => [sc.id, sc.name])], schools.length === 1 ? schools[0].id : '')}
      ${coach ? fld('code', 'Coach access code', 'text', 'From your school’s Pulse admin', 'off', 'autocapitalize="characters"') : sel('grade', 'Grade', [['', 'Choose'], ...(PULSE_CONFIG.grades || []).map(g => [g, 'Grade ' + g])], '')}</div>
      ${coach ? `<div class="field" data-field="sports"><span class="flabel">Sports you coach <span class="hint">You will see students who play these</span></span><div class="chips">${[['general', 'PE / general fitness'], ...Object.entries(SPORTS)].map(([v, l]) => `<button type="button" class="chip" data-act="auth-sport" data-v="${v}" aria-pressed="${AUTHF.sports.includes(v)}"><span class="ck">${IC.check}</span>${esc(l.split(' (')[0])}</button>`).join('')}</div></div>` : ''}
      ${!coach && REAL && REAL.profile && !Cloud.user ? `<p class="muted" style="font-size:13px">${IC.check.replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px"')} Your guest plan for <b>${esc(REAL.profile.name)}</b> will move into this account.</p>` : ''}`
    : `${fld('email', 'Email', 'email', 'you@school.edu', 'email')}${fld('pw', 'Password', 'password', 'Your password', 'current-password')}
      <button type="button" class="link-tip" data-act="auth-forgot" style="justify-self:start">Forgot your password?</button>`;
  setScreen('auth', authShell(`<div class="auth-box">
      <a class="btn btn-quiet btn-sm auth-back" href="#/welcome">${IC.back}<span>Back</span></a>
      <div class="label">${kind === 'signup' ? (coach ? 'Coach account' : 'Student account') : 'Welcome back'}</div>
      <h1>${kind === 'signup' ? (coach ? 'Follow your <em>athletes.</em>' : 'Create your <em>account.</em>') : 'Log in to <em>Pulse.</em>'}</h1>
      <form class="auth-form" id="auth-form" data-kind="${kind}" novalidate>${form}
        <div class="form-err" id="auth-err" role="alert" hidden></div>
        <button class="btn btn-primary btn-lg" type="submit" id="auth-go">${kind === 'signup' ? 'Create account' : 'Log in'} ${IC.arrow}</button>
      </form>
      <p class="auth-links">${kind === 'signup' ? 'Already have an account? <a href="#/login">Log in</a>' : 'New to Pulse? <a href="#/signup">Create an account</a>'}<span>·</span><button type="button" class="link-tip" data-act="go-guest">Continue as a guest</button></p>
      ${demoNote()}
    </div>`, kind === 'signup' && coach ? `<h2 class="h-display" style="font-size:clamp(32px,3.6vw,48px)">See how your athletes <em>are really doing.</em></h2><p>Weekly sessions, weigh-in trends, hydration and readiness for every student who plays your sport. Plus one place to verify doctors’ notes for supplements.</p>` : ''));
  const f = $('#a-name') || $('#a-email'); if (f && matchMedia('(hover: hover)').matches) f.focus();
}
function authErr(msg, field) {
  const e = $('#auth-err'); e.hidden = false; e.innerHTML = IC.alert + '<span>' + esc(msg) + '</span>';
  $$('.auth-form .field').forEach(x => x.classList.remove('err'));
  if (field) { const fe = $(`.auth-form [data-field="${field}"]`); if (fe) { fe.classList.add('err'); const i = fe.querySelector('input,select'); i && i.focus(); } }
}
async function submitAuth(form) {
  const kind = form.dataset.kind, v = id => { const el = $('#a-' + id); return el ? el.value.trim() : ''; };
  const btn = $('#auth-go'), label = btn.innerHTML;
  const email = v('email'), pw = $('#a-pw').value;
  if (kind === 'signup') {
    if (!v('name')) return authErr('Add your name.', 'name');
    if (!Cloud.validEmail(email)) return authErr('Enter a valid email address.', 'email');
    if (pw.length < 6) return authErr('Use at least 6 characters for your password.', 'pw');
    if (!v('school')) return authErr('Choose your school.', 'school');
    if (AUTHF.role === 'student' && !v('grade')) return authErr('Choose your grade.', 'grade');
    if (AUTHF.role === 'coach' && !v('code')) return authErr('Enter the coach access code from your school.', 'code');
    if (AUTHF.role === 'coach' && !AUTHF.sports.length) return authErr('Pick at least one sport you coach.', 'sports');
  } else {
    if (!Cloud.validEmail(email)) return authErr('Enter the email you signed up with.', 'email');
    if (!pw) return authErr('Enter your password.', 'pw');
  }
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span>' + (kind === 'signup' ? 'Creating account…' : 'Logging in…');
  try {
    const guest = REAL && REAL.profile && !Cloud.user ? REAL : null;
    if (kind === 'signup') await Cloud.signUp({ role: AUTHF.role, name: v('name'), email, password: pw, school: v('school'), grade: v('grade'), sports: AUTHF.role === 'coach' ? AUTHF.sports.slice() : [], coachCode: v('code') });
    else await Cloud.signIn(email, pw);
    await afterSignIn(guest, kind);
  } catch (e) {
    btn.disabled = false; btn.innerHTML = label;
    authErr(e.message || 'Something went wrong. Try again.');
  }
}
/* after sign-in: coaches go to their dashboard; students get their cloud plan (or carry the guest plan in) */
async function afterSignIn(guest, kind) {
  const u = Cloud.user;
  store.del('pulse.entry');
  Object.assign(COACH, { roster: [], pending: [], loaded: false, loading: false, err: '' });
  AUTHF = { role: 'student', sports: [] };
  if (u.role === 'coach') { S = REAL = null; UI.screen = null; navigate('students'); setTimeout(() => toast(`<b>Welcome, ${esc(u.name.split(' ')[0])}.</b> ${kind === 'signup' ? 'Your coach account is ready.' : ''}`), 300); return; }
  let cloud = null;
  try { cloud = await Cloud.loadState(); } catch (e) {}
  const local = store.get(stateKey());
  let st = [cloud, local].filter(x => x && x.profile).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0] || null;
  if (!st && guest) { st = JSON.parse(JSON.stringify(guest)); st.profile.school = u.school || st.profile.school || ''; st.profile.grade = u.grade || st.profile.grade || ''; }
  REAL = S = st ? migrateState(st) : null;
  UI.screen = null; UI.draft = null;
  if (S) { save(); Sync.now(); Sync.pullReviews(); navigate('today'); setTimeout(() => toast(guest && kind === 'signup' ? '<b>Account created.</b> Your plan moved in with you.' : `<b>Welcome back, ${esc(S.profile.name)}.</b>`), 300); }
  else { navigate('start'); setTimeout(() => toast('<b>Account ready.</b> Now let’s build your plan.'), 300); }
}
async function signOut() {
  await Sync.now();
  await Cloud.signOut();
  store.del('pulse.entry');
  Object.assign(COACH, { roster: [], pending: [], loaded: false, loading: false, err: '' });
  REAL = S = null; UI.screen = null; UI.draft = null; stopRest();
  navigate('welcome');
  setTimeout(() => toast('Signed out.'), 300);
}
function forgotModal() {
  openModal({
    title: 'Reset your password', sub: 'We will email you a link to choose a new one.',
    body: `<div class="field"><label for="fp-email">Email</label><input class="input" id="fp-email" type="email" value="${esc(($('#a-email') || {}).value || '')}" autocomplete="email"></div><span class="error" id="fp-err" hidden></span>`,
    actions: [{ label: 'Cancel' }, { label: 'Send link', kind: 'btn-primary', fn: async api => {
      const e = $('#fp-email', api.el).value.trim(), er = $('#fp-err', api.el);
      try { await Cloud.resetPassword(e); toast('Check your inbox for the reset link.', { icon: IC.check }); }
      catch (x) { er.hidden = false; er.innerHTML = IC.alert + esc(x.message); return false; }
    } }]
  });
}

/* ---------- account card on the profile page ---------- */
function accountCard() {
  const u = Cloud.user;
  if (S.sample) return `<div class="card-h"><h3>Account</h3></div><div class="card-b"><p class="muted">This is a sample athlete. <a href="#/welcome">Start your own</a> to create an account.</p></div>`;
  if (!u) return `<div class="acct"><span class="acct-ic">${IC.user}</span><div><b>You are using Pulse as a guest</b><p>Your plan lives only in this browser. Create an account to keep it safe, use it on your phone and laptop, and let your coaches follow your progress.</p></div>
    <div class="acct-acts"><a class="btn btn-primary" href="#/signup">Create an account</a><a class="btn btn-ghost" href="#/login">Log in</a></div></div>`;
  return `<div class="acct"><span class="acct-ic acc">${esc(initials(u.name))}</span><div><b>${esc(u.name)}</b><p>${esc(u.email)} · ${esc(Cloud.schoolName(S.profile.school || u.school) || 'No school set')}${S.profile.grade ? ` · grade ${esc(S.profile.grade)}` : ''}</p></div>
    <div class="acct-acts"><a class="btn btn-ghost" href="#/coach">${IC.coach}Coach access</a><button class="btn btn-quiet" data-act="sign-out">${IC.logout}Sign out</button></div></div>`;
}

/* ---------- sync ---------- */
const Sync = {
  t: null, last: '', failed: false,
  ok() { return Cloud.user && Cloud.user.role === 'student' && REAL && REAL.profile && !(S && S.sample); },
  schedule() { if (!this.ok()) return; clearTimeout(this.t); this.t = setTimeout(() => this.now(), 1500); },
  async now() {
    clearTimeout(this.t);
    if (!this.ok()) return;
    try {
      await Cloud.saveState(REAL);
      const docs = progressDocs(REAL), key = JSON.stringify(docs);
      if (key !== this.last) { await Cloud.publishProgress(docs); this.last = key; }
      if (this.failed) toast('Back online. Everything is synced.');
      this.failed = false;
    } catch (e) {
      if (!this.failed) toast('Could not sync right now. Your changes are safe on this device and will sync later.', { type: 'err' });
      this.failed = true;
    }
  },
  /* coaches' decisions on supplement notes */
  async pullReviews() {
    if (!this.ok()) return;
    const waiting = (REAL.supps || []).filter(sp => sp.status === 'pending');
    if (!waiting.length) return;
    let rv = {}; try { rv = await Cloud.myReviews(); } catch (e) { return; }
    let changed = false;
    waiting.forEach(sp => {
      const r = rv[sp.id]; if (!r || r.at < (sp.sentAt || 0)) return;
      sp.status = r.decision === 'approve' ? 'active' : 'rejected';
      sp.review = { byName: r.byName, comment: r.comment || '', at: r.at };
      changed = true;
      toast(r.decision === 'approve' ? `<b>${esc(sp.name)} verified</b> by ${esc(r.byName)}. It is now in your plan.` : `<b>${esc(sp.name)} was not approved</b> by ${esc(r.byName)}.${r.comment ? ' “' + esc(r.comment) + '”' : ''}`, { icon: IC.shield, ms: 9000, action: { label: 'View', fn: () => navigate('fuel') } });
    });
    if (changed) { save(); if (UI.screen === 'app') refresh(); }
  }
};
function migrateState(st) {
  st.log = st.log || {}; st.log.food = st.log.food || {}; st.log.water = st.log.water || {}; st.log.drinks = st.log.drinks || {}; st.log.check = st.log.check || {}; st.log.weight = st.log.weight || []; st.log.sessions = st.log.sessions || [];
  st.swaps = st.swaps || {}; st.glasses = st.glasses || []; st.supps = st.supps || []; st.mealSwaps = st.mealSwaps || {}; st.adjust = st.adjust || [];
  const p = st.profile;
  if (p && !Array.isArray(p.gear) && p.where !== 'gym') { p.gear = []; const map = { dumbbell: 'dumbbells', barbell: 'barbell', rack: 'squat-rack', bench: 'flat-bench', kettlebell: 'kettlebells', cable: 'cable-stack', machine: 'leg-press', pullup: 'pullup-bar', band: 'bands', box: 'plyo-box', medball: 'medball' }; (p.equip || []).forEach(k => { if (map[k]) p.gear.push(map[k]); if (k === 'machine') p.gear.push('lat-pulldown'); }); }
  if (p && p.where === 'gym' && !Array.isArray(p.gear)) p.gear = EQUIP.map(e => e.id);
  return st;
}

Object.assign(ACT, {
  'go-guest': () => { store.set('pulse.entry', 'guest'); navigate(REAL && REAL.profile ? 'today' : 'start'); },
  'auth-role': el => { AUTHF.role = el.dataset.v; showAuth('signup'); },
  'auth-sport': el => { const v = el.dataset.v, i = AUTHF.sports.indexOf(v); if (i >= 0) AUTHF.sports.splice(i, 1); else AUTHF.sports.push(v); el.setAttribute('aria-pressed', i < 0); },
  'auth-forgot': () => forgotModal(),
  'pw-eye': el => { const i = el.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); el.classList.toggle('on', show); },
  'sign-out': () => confirmModal({ title: 'Sign out of Pulse?', sub: 'Your plan is saved to your account. Log in again on any device to pick it up.', confirm: 'Sign out', onConfirm: () => signOut() })
});
document.addEventListener('submit', e => { if (e.target.id === 'auth-form') { e.preventDefault(); submitAuth(e.target); } });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { Sync.pullReviews(); if (UI.screen === 'coach') coachRefresh(true); } else Sync.now(); });
setInterval(() => Sync.pullReviews(), 120000);
