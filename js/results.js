/* =========================================================
   PULSE — school events and results
   · Public events (inter-house, sports day): winners and house points, open to everyone.
   · Personal events (functional fitness test, bronze / silver / gold pins): each student's result
     is stored ENCRYPTED. The lookup key and the encryption key are both derived in the browser from
     full name + school ID + date of birth (+ an access code if the school uses one), so a result can
     only be opened by someone who knows all of those. Firestore rules also block listing the results.
   ========================================================= */
const TIERS = ['none', 'bronze', 'silver', 'gold'], TIER_L = { none: 'No pin yet', bronze: 'Bronze pin', silver: 'Silver pin', gold: 'Gold pin' };
const RES = { mine: null, mineMsg: '', oldMsg: '', rs: null, rsLoaded: false, lg: { mode: 'login', busy: false, msg: '', email: '', demo: false }, events: [], loaded: false, loading: false, err: '', sel: null, q: '', out: null, busy: false, kind: 'private', build: null, busyBuild: false, codes: null };
const b64 = u8 => btoa(String.fromCharCode(...u8)), unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0)), hex = u8 => [...u8].map(x => x.toString(16).padStart(2, '0')).join('');
const normName = s => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const normId = s => String(s || '').toUpperCase().replace(/[\s-]/g, '');
const enc = new TextEncoder(), dec = new TextDecoder();

async function deriveKeys(ev, name, id, dob, code) {
  const secret = [normName(name), normId(id), String(dob || '').trim(), normId(code)].join('|');
  const km = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode('pulse-results:' + ev.id + ':' + ev.salt), iterations: 150000, hash: 'SHA-512' }, km, 512));
  return { tag: hex(bits.slice(0, 16)), key: await crypto.subtle.importKey('raw', bits.slice(16, 48), 'AES-GCM', false, ['encrypt', 'decrypt']) };
}
async function sealRow(ev, name, id, dob, code, rec) {
  const { tag, key } = await deriveKeys(ev, name, id, dob, code), iv = crypto.getRandomValues(new Uint8Array(12));
  const c = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(ev.id) }, key, enc.encode(JSON.stringify(rec))));
  return { tag, iv: b64(iv), c: b64(c) };
}
async function openRow(ev, keys, row) {
  try { const p = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(row.iv), additionalData: enc.encode(ev.id) }, keys.key, unb64(row.c)); return JSON.parse(dec.decode(p)); } catch (e) { return null; }
}
async function lookupResult(ev, name, id, dob, code) {
  const keys = await deriveKeys(ev, name, id, dob, code), row = await Cloud.getResult(ev.id, keys.tag);
  return row ? openRow(ev, keys, row) : null;
}
function tierOf(cr, v) { if (v === '' || v == null || !isFinite(+v)) return 0; v = +v; const t = [cr.b, cr.s, cr.g].map(x => cr.hi ? v >= x : v <= x); return t[2] ? 3 : t[1] ? 2 : t[0] ? 1 : 0; }
function pinOf(ev, scores) { const ts = ev.crit.map((c, i) => tierOf(c, scores[i])); if (!ts.length) return { pin: 0, ts }; return { pin: ev.rule === 'avg' ? Math.floor(ts.reduce((a, b) => a + b, 0) / ts.length) : Math.min(...ts), ts }; }
function nextTarget(cr, v, t) { if (t >= 3) return null; const goal = [cr.b, cr.s, cr.g][t]; if (v === '' || v == null || !isFinite(+v)) return { goal, gap: null }; return { goal, gap: Math.abs(goal - (+v)) }; }

/* ---- CSV and criteria ---- */
function parseCSV(txt) {
  const rows = []; let r = [], f = '', q = false; txt = String(txt).replace(/\r/g, '');
  for (let i = 0; i < txt.length; i++) {
    const ch = txt[i];
    if (q) { if (ch === '"' && txt[i + 1] === '"') { f += '"'; i++; } else if (ch === '"') q = false; else f += ch; }
    else if (ch === '"') q = true; else if (ch === ',' || ch === '\t') { r.push(f); f = ''; } else if (ch === '\n') { r.push(f); rows.push(r); r = []; f = ''; } else f += ch;
  }
  if (f.length || r.length) { r.push(f); rows.push(r); }
  return rows.filter(x => x.some(y => String(y).trim() !== ''));
}
function parseCrit(txt) {
  const out = [], errs = [];
  String(txt).split('\n').map(x => x.trim()).filter(Boolean).forEach((l, i) => {
    const p = l.split('|').map(x => x.trim());
    if (p.length < 6) { errs.push(`Criteria line ${i + 1}: use  Test | unit | higher or lower | bronze | silver | gold`); return; }
    const hi = /^h/i.test(p[2]), b = +p[3], s = +p[4], g = +p[5];
    if (![b, s, g].every(isFinite)) { errs.push(`Criteria line ${i + 1}: bronze, silver and gold must be numbers`); return; }
    if (hi ? !(b <= s && s <= g) : !(b >= s && s >= g)) { errs.push(`Criteria line ${i + 1}: for "${hi ? 'higher' : 'lower'} is better" the numbers must go ${hi ? 'up' : 'down'} from bronze to gold`); return; }
    out.push({ n: p[0], u: p[1], hi: hi ? 1 : 0, b, s, g });
  });
  return { crit: out, errs };
}
const rid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const genCode = () => { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', u = crypto.getRandomValues(new Uint8Array(8)); return [...u].map(x => A[x % A.length]).join('').replace(/(.{4})(.{4})/, '$1-$2'); };

async function buildPrivate(o, onProg) {
  const errs = [], { crit, errs: ce } = parseCrit(o.crit); errs.push(...ce);
  if (!crit.length && !ce.length) errs.push('Add at least one criteria line.');
  const rows = parseCSV(o.csv); if (rows.length < 2) errs.push('Paste the results table with a header row and at least one student.');
  if (errs.length) return { errs };
  const head = rows[0].map(h => h.trim().toLowerCase()), col = k => head.indexOf(k);
  ['name', 'id', 'dob'].forEach(k => { if (col(k) < 0) errs.push(`The header row needs a "${k}" column.`); });
  const ci = crit.map(c => head.indexOf(c.n.toLowerCase())); crit.forEach((c, i) => { if (ci[i] < 0) errs.push(`No column named "${c.n}" in the header row.`); });
  if (errs.length) return { errs };
  const ev = { id: o.id || rid(), title: o.title, date: o.date, kind: 'private', desc: o.desc || '', salt: b64(crypto.getRandomValues(new Uint8Array(12))), rule: o.rule === 'avg' ? 'avg' : 'min', needCode: false, crit, n: 0 };
  const seen = new Set(), sealed = [], logins = [], tally = { gold: 0, silver: 0, bronze: 0, none: 0 };
  for (let r = 1; r < rows.length; r++) {
    const R = rows[r], name = (R[col('name')] || '').trim(), id = (R[col('id')] || '').trim(), dob = (R[col('dob')] || '').trim();
    if (!name || !id) { errs.push(`Row ${r + 1}: name and id are required.`); continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || isNaN(new Date(dob))) { errs.push(`Row ${r + 1} (${name}): date of birth must look like 2009-05-14.`); continue; }
    const code = '', email = col('email') >= 0 ? (R[col('email')] || '').trim().toLowerCase() : '';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { errs.push(`Row ${r + 1} (${name}): the email does not look right.`); continue; }
    const key = [normName(name), normId(id), dob].join('|');
    if (seen.has(key)) { errs.push(`Row ${r + 1} (${name}): duplicate of an earlier row.`); continue; } seen.add(key);
    const scores = ci.map(i => { const v = (R[i] || '').trim(); return v === '' ? '' : +v; });
    if (scores.some(v => v !== '' && !isFinite(v))) { errs.push(`Row ${r + 1} (${name}): scores must be numbers (leave blank if not attempted).`); continue; }
    tally[TIERS[pinOf(ev, scores).pin]]++;
    sealed.push({ name, id, dob, code, rec: { name, scores, note: col('note') >= 0 ? (R[col('note')] || '').trim() : '' } });
    if (email) logins.push({ sid: normId(id), email, rec: sealed[sealed.length - 1].rec });
  }
  if (errs.length) return { errs };
  const out = [];
  for (let i = 0; i < sealed.length; i++) { const s = sealed[i]; out.push(await sealRow(ev, s.name, s.id, s.dob, s.code, s.rec)); if (onProg) onProg(i + 1, sealed.length); }
  ev.n = out.length; ev.logins = logins.length; return { ev, rows: out, tally, logins };
}
function buildPublic(o) {
  const errs = [], rows = parseCSV(o.csv); if (rows.length < 2) return { errs: ['Paste the results table with a header row and at least one result.'] };
  const head = rows[0].map(h => h.trim().toLowerCase()), col = k => head.indexOf(k);
  ['category', 'place', 'name'].forEach(k => { if (col(k) < 0) errs.push(`The header row needs a "${k}" column.`); });
  if (errs.length) return { errs };
  const cats = {}, pts = { 1: 5, 2: 3, 3: 1 }, houses = {};
  for (let r = 1; r < rows.length; r++) {
    const R = rows[r], cat = (R[col('category')] || '').trim(), p = parseInt(R[col('place')]), name = (R[col('name')] || '').trim();
    if (!cat || !name || !(p >= 1 && p <= 8)) { errs.push(`Row ${r + 1}: category, a place from 1 to 8, and a name are required.`); continue; }
    const house = col('house') >= 0 ? (R[col('house')] || '').trim() : '', res = col('result') >= 0 ? (R[col('result')] || '').trim() : '';
    (cats[cat] = cats[cat] || []).push({ p, name, house, res }); if (house && pts[p]) houses[house] = (houses[house] || 0) + pts[p];
  }
  if (errs.length) return { errs };
  return { ev: { id: rid(), title: o.title, date: o.date, kind: 'public', desc: o.desc || '', cats: Object.entries(cats).map(([name, pl]) => ({ name, places: pl.sort((a, b) => a.p - b.p) })), houses: Object.entries(houses).map(([name, pt]) => ({ name, pt })).sort((a, b) => b.pt - a.pt) } };
}

/* ---- attempt limiter (browser side: discourages casual guessing only) ---- */
function lockLeft() { try { const a = JSON.parse(sessionStorage.getItem('pulse.att') || '{"n":0,"t":0}'), w = a.t + 60000 - Date.now(); return a.n >= 5 && w > 0 ? Math.ceil(w / 1000) : 0; } catch (e) { return 0; } }
function noteAttempt(ok) { try { let a = JSON.parse(sessionStorage.getItem('pulse.att') || '{"n":0,"t":0}'); if (ok) a = { n: 0, t: 0 }; else { if (a.n >= 5 && Date.now() - a.t > 60000) a.n = 0; a.n++; a.t = Date.now(); } sessionStorage.setItem('pulse.att', JSON.stringify(a)); } catch (e) {} }

/* ---- loading ---- */
async function resLoad() {
  if (RES.loading) return; RES.loading = true;
  try { const u = Cloud.user; RES.events = await Cloud.eventsList(u && u.school ? u.school : ''); RES.err = ''; RES.loaded = true; }
  catch (e) { RES.err = e.message || 'Could not load events.'; RES.loaded = true; }
  RES.loading = false;
}
const resRedraw = () => { if (UI.screen === 'app' && UI.view === 'results') drawView(); else if (UI.screen === 'coach' && UI.coachView === 'results') coachDraw(); };
const fmtDY = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return d; } };
const pinPill = t => `<span class="pill ${t === 3 ? 'acc' : t ? 'good' : 'line'}">${IC.medal}${TIER_L[TIERS[t]]}</span>`;

/* ---- student view: always the school + student ID login. There is no event list to search. ---- */
const resSchoolDefault = () => { const p = S && S.profile; return (p && (p.schoolName || (p.school && Cloud.schoolName(p.school)))) || (Cloud.user && Cloud.user.schoolName) || ''; };
VIEWS.results = () => {
  if (!RES.rsLoaded) { RES.rsLoaded = true; Cloud.resSession().then(x => { RES.rs = x; if (x && x.verified) resFetchAll(); else resRedraw(); }).catch(() => resRedraw()); }
  const shown = RES.mine && RES.mine.length ? RES.mine.map(x => resCard(x.ev, x.rec)).join('<div style="height:16px"></div>') + '<div style="height:16px"></div>' : '';
  return `<div class="ph"><div><div class="label">${esc(resSchoolDefault() || 'Your school')}</div><h2 style="margin-top:8px">School <em>results.</em></h2><p>Log in with your school and student ID to see your own results from fitness tests and school events.</p></div></div>
    ${shown}${loginCard()}${oldLookupCard()}`;
};
/* every personal event the school has published for this student ID */
async function resFetchAll() {
  if (!RES.rs || !RES.rs.verified) return;
  RES.lg.busy = true; RES.mine = null; RES.mineMsg = ''; resRedraw();
  try {
    const evs = (await Cloud.eventsList(RES.rs.school)).filter(e => e.kind === 'private').sort((a, b) => (b.date || '') < (a.date || '') ? -1 : 1), out = [];
    for (const ev of evs) { const rec = await Cloud.resGet(ev.id, RES.rs.sid); if (rec) out.push({ ev, rec }); }
    RES.mine = out;
    RES.mineMsg = out.length ? '' : (evs.length ? 'No result is published for this student ID yet. Your school list may not have your email, or it may have a different one. Ask your PE teacher.' : 'Your school has not published any results yet. They will show here once they do.');
  } catch (x) { RES.mineMsg = x.message || 'Could not load your results. Try again.'; }
  RES.lg.busy = false; resRedraw();
}
const schoolField = (id, g) => `<div class="field"><label for="${id}">School <span class="hint">Type your school’s name</span></label><input class="input" id="${id}" name="school" required maxlength="80" autocomplete="organization" list="rs-list" placeholder="e.g. Vasant Valley School" value="${esc(g.schoolIn != null ? g.schoolIn : resSchoolDefault())}"><datalist id="rs-list">${Object.values(typeof Cloud.knownNames === 'function' ? Cloud.knownNames() : {}).map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist></div>`;
/* school + student ID + password, with a verification email for anyone who has not created a login yet */
function loginCard() {
  const g = RES.lg, bad = RES.mineMsg ? `<p role="alert" style="color:${RES.mine && RES.mine.length ? 'var(--ink-3)' : 'var(--bad)'};margin-top:10px">${esc(RES.mineMsg)}</p>` : '';
  const err = g.msg ? `<p role="alert" id="rl-err" style="color:var(--bad);margin-top:10px">${esc(g.msg)}</p>` : '';
  const sidField = id => `<div class="field" style="margin-top:12px"><label for="${id}">Student ID</label><input class="input" id="${id}" name="sid" required maxlength="30" autocomplete="username" autocapitalize="characters" spellcheck="false" placeholder="Your school ID number" value="${esc(g.sidIn || '')}"></div>`;
  if (RES.rs && RES.rs.verified) return `<div class="card"><div class="card-h"><h3>Your results</h3></div><div class="card-b">${g.busy ? '<div class="empty" style="padding:30px 8px"><span class="spin lg"></span><h4>Finding your results…</h4></div>' : `<p class="muted">Logged in with student ID ${esc(RES.rs.sid)} at ${esc(Cloud.schoolName(RES.rs.school))}.</p>${bad}<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" data-act="rl-refresh">Check again</button><button class="btn btn-ghost btn-sm" data-act="rl-out">Log out</button></div>`}</div></div>`;
  if (g.mode === 'verify') return `<div class="card"><div class="card-h"><h3>Check your email</h3></div><div class="card-b">
    <p>We sent a verification link to <b>${esc(g.email)}</b>. Open it, then come back here and tap the button below.</p>
    ${g.demo ? `<p class="muted" style="font-size:13px;margin-top:8px">Demo mode cannot send real email. Tap "Simulate the email link" to carry on.</p>` : `<p class="muted" style="font-size:13px;margin-top:8px">It can take a minute. Check spam if you cannot see it.</p>`}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">${g.demo ? '<button class="btn btn-ghost" data-act="rl-demo">Simulate the email link</button>' : ''}<button class="btn btn-primary" data-act="rl-check" ${g.busy ? 'disabled' : ''}>${g.busy ? 'Checking…' : 'I have verified my email'}</button>${g.demo ? '' : '<button class="btn btn-quiet" data-act="rl-resend">Send it again</button>'}<button class="btn btn-quiet" data-act="rl-mode" data-m="login">Back</button></div>${err}</div></div>`;
  if (g.mode === 'create') return `<div class="card"><div class="card-h"><h3>Create your student ID login</h3></div><div class="card-b">
    <p class="muted" style="font-size:14px;margin-bottom:14px">Use the email your school has for you. We send a verification link to it. You only see a result if your verified email matches the one on your school's list.</p>
    <form id="res-create" novalidate>${schoolField('rc-s', g)}${sidField('rc-i')}
      <div class="field" style="margin-top:12px"><label for="rc-e">School email</label><input class="input" id="rc-e" name="email" type="email" required maxlength="80" autocomplete="email" placeholder="you@school.org" value="${esc(g.emailIn || '')}"></div>
      <div class="field" style="margin-top:12px"><label for="rc-p">Choose a password<span class="hint">At least 8 characters</span></label><input class="input" id="rc-p" name="pw" type="password" required minlength="8" maxlength="72" autocomplete="new-password"></div>
      <div class="field" style="margin-top:12px"><label for="rc-p2">Repeat the password</label><input class="input" id="rc-p2" name="pw2" type="password" required maxlength="72" autocomplete="new-password"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-primary" ${g.busy ? 'disabled' : ''}>${g.busy ? 'Sending…' : 'Send verification email'}</button><button class="btn btn-quiet" type="button" data-act="rl-mode" data-m="login">I already have one</button></div>${err}</form></div></div>`;
  return `<div class="card"><div class="card-h"><h3>See your own results</h3></div><div class="card-b">
    <p class="muted" style="font-size:14px;margin-bottom:14px">Log in with your school, student ID and password.</p>
    <form id="res-login" novalidate>${schoolField('rg-s', g)}${sidField('rg-i')}
      <div class="field" style="margin-top:12px"><label for="rg-p">Password</label><input class="input" id="rg-p" name="pw" type="password" required maxlength="72" autocomplete="current-password"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-primary" ${g.busy || lockLeft() ? 'disabled' : ''}>${g.busy ? 'Logging in…' : 'Log in'}</button></div>${lockLeft() ? `<p class="muted" role="alert" style="margin-top:8px">Too many tries. Wait ${lockLeft()} seconds.</p>` : ''}${err}${bad}</form>
    <p style="margin-top:16px;font-size:14px">No student ID login yet? <button class="btn btn-quiet btn-sm" data-act="rl-mode" data-m="create">Create one with your email</button></p></div></div>`;
}
function oldLookupCard() {
  const lk = lockLeft(), needLogin = Cloud.mode === 'firebase' && !Cloud.user;
  return `<details class="card" style="margin-top:16px"><summary class="card-h" style="cursor:pointer"><h3>Or use your name and date of birth</h3></summary><div class="card-b">
    <p class="muted" style="font-size:14px;margin-bottom:14px">Enter the same details your school has on file. Results are stored encrypted, so they cannot be opened without these details.</p>
    ${needLogin ? `<p><b>Log in with your Pulse account to use this option.</b></p><a class="btn btn-primary" href="#/login">Log in</a>` : `<form id="res-look" autocomplete="off" novalidate>
      ${schoolField('rl-s', RES.lg)}
      <div class="field" style="margin-top:12px"><label for="rl-n">Full name</label><input class="input" id="rl-n" name="name" required maxlength="60" placeholder="As on your school record"></div>
      <div class="field" style="margin-top:12px"><label for="rl-i">School ID</label><input class="input" id="rl-i" name="sid" required maxlength="30" autocomplete="off" placeholder="Your school ID number"></div>
      <div class="field" style="margin-top:12px"><label for="rl-d">Date of birth</label><input class="input" id="rl-d" name="dob" type="date" required></div>
      <div style="margin-top:16px"><button class="btn btn-primary" ${RES.busy || lk ? 'disabled' : ''}>${RES.busy ? 'Checking…' : 'Show my results'}</button></div>
      ${lk ? `<p class="muted" role="alert" style="margin-top:8px">Too many tries. Wait ${lk} seconds.</p>` : ''}
      ${RES.oldMsg ? `<p role="alert" style="color:var(--bad);margin-top:10px">${esc(RES.oldMsg)}</p>` : ''}</form>`}</div></details>`;
}
function resCard(ev, r) {
  const { pin, ts } = pinOf(ev, r.scores), saved = (S.pins || []).some(p => p.ev === ev.id);
  return `<div class="card"><div class="card-h"><div><span class="label">${esc(ev.title)} · ${esc(fmtDY(ev.date))}</span><h3>${esc(r.name)}</h3></div>${pinPill(pin)}</div><div class="card-b">
    <table class="res-t"><tr><th>Test</th><th>Your result</th><th>Level</th><th>Next pin</th></tr>${ev.crit.map((c, i) => { const v = r.scores[i], t = ts[i], n = nextTarget(c, v, t); return `<tr><td>${esc(c.n)}</td><td>${v === '' ? 'Not attempted' : esc(v + ' ' + c.u)}</td><td>${t ? TIER_L[TIERS[t]].replace(' pin', '') : 'None'}</td><td class="muted">${n ? esc(n.goal + ' ' + c.u) + (n.gap != null ? ` (${+n.gap.toFixed(2)} to go)` : '') : 'Top level'}</td></tr>`; }).join('')}</table>
    <p class="muted" style="font-size:13px;margin-top:10px">${ev.rule === 'avg' ? 'Your pin is the average of your levels across all tests.' : 'Your pin is set by your lowest level across all tests.'}</p>
    ${r.note ? `<p style="margin-top:8px"><b>Note from your teacher:</b> ${esc(r.note)}</p>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn btn-primary btn-sm" data-act="res-save" data-id="${esc(ev.id)}">${saved ? 'Update saved result' : 'Save to my profile'}</button></div></div></div>`;
}

/* ---- coach view ---- */
function resCoachView() {
  const u = Cloud.user, evs = RES.events.slice().sort((a, b) => (b.date || '') < (a.date || '') ? -1 : 1), k = RES.kind;
  if (!RES.loaded) { resLoad().then(resRedraw); }
  return `<div class="ph"><div><div class="label">${esc(Cloud.schoolName(u.school))}</div><h2 style="margin-top:8px">School <em>results.</em></h2><p>Publish winners from public events, or personal results like a fitness test with bronze, silver and gold pins. Students see them straight away.</p></div></div>
    <div class="card" style="margin-bottom:16px"><div class="card-h"><h3>Published events</h3></div><div class="card-b">${evs.length ? evs.map(e => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--line)"><div><b>${esc(e.title)}</b><div class="muted" style="font-size:13px">${esc(fmtDY(e.date))} · ${e.kind === 'private' ? e.n + ' students, encrypted' : 'public'}</div></div><button class="btn btn-ghost btn-sm" data-act="res-del" data-id="${esc(e.id)}">${IC.trash}Delete</button></div>`).join('') : '<p class="muted">No events yet.</p>'}</div></div>
    <div class="card"><div class="card-h"><h3>Add an event</h3></div><div class="card-b"><form id="res-build" novalidate>
      <div class="field"><label for="rb-k">Type</label><select class="input" id="rb-k" name="kind" data-rk><option value="private" ${k === 'private' ? 'selected' : ''}>Personal results (fitness test, pins). ID required</option><option value="public" ${k === 'public' ? 'selected' : ''}>Public winners (inter-house, sports day)</option></select></div>
      <div class="field" style="margin-top:12px"><label for="rb-t">Event name</label><input class="input" id="rb-t" name="title" required maxlength="80"></div>
      <div class="field" style="margin-top:12px"><label for="rb-d">Date</label><input class="input" id="rb-d" name="date" type="date" required value="${today()}"></div>
      <div class="field" style="margin-top:12px"><label for="rb-s">Short description (optional)</label><input class="input" id="rb-s" name="desc" maxlength="100"></div>
      ${k === 'private' ? `<div class="field" style="margin-top:12px"><label for="rb-c">Pin criteria, one test per line<span class="hint">Test | unit | higher or lower | bronze | silver | gold. Each number is the minimum needed for that pin.</span></label><textarea class="input" id="rb-c" name="crit" rows="4" placeholder="Push-ups | reps | higher | 15 | 25 | 35&#10;1 km run | min | lower | 6 | 5 | 4"></textarea></div>
      <div class="field" style="margin-top:12px"><label for="rb-r">How the overall pin is decided</label><select class="input" id="rb-r" name="rule"><option value="min">Lowest level across all tests</option><option value="avg">Average level across all tests</option></select></div>
      <div class="field" style="margin-top:12px"><label for="rb-v">Results table (CSV)<span class="hint">Columns: name, id, dob (YYYY-MM-DD), email, one column per test named exactly as above, optional note. The email is the student's school email: students who verify that email can log in with their student ID and password to see their result. Leave a score blank if not attempted.</span></label><textarea class="input" id="rb-v" name="csv" rows="7" placeholder="name,id,dob,Push-ups,1 km run,note&#10;Asha Rao,VV1042,2009-05-14,28,5.4,Great effort"></textarea></div>`
      : `<div class="field" style="margin-top:12px"><label for="rb-v">Results table (CSV)<span class="hint">Columns: category, place (1 to 8), name; optional house and result. House points are added up for you.</span></label><textarea class="input" id="rb-v" name="csv" rows="7" placeholder="category,place,name,house,result&#10;100m Under 16 Boys,1,Arjun Mehta,Red,12.4s"></textarea></div>`}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;align-items:center"><label class="btn btn-ghost btn-sm" style="cursor:pointer">${IC.upload}Load CSV from file<input type="file" accept=".csv,text/csv,text/plain" data-rcsv hidden></label><button class="btn btn-primary" ${RES.busyBuild ? 'disabled' : ''}>${RES.busyBuild ? 'Encrypting…' : 'Build and publish'}</button></div>
      <div id="res-stat" aria-live="polite">${resStat()}</div></form></div></div>`;
}
function resStat() {
  const b = RES.build; if (!b) return '';
  if (b.errs) return `<div role="alert" style="color:var(--bad);margin-top:10px">${b.errs.slice(0, 8).map(x => `<div>${esc(x)}</div>`).join('')}${b.errs.length > 8 ? `<div>and ${b.errs.length - 8} more</div>` : ''}</div>`;
  return `<div style="margin-top:12px;padding:12px;border:1px solid var(--line);border-radius:10px"><b>Published: ${esc(b.done)}</b><p class="muted" style="margin:.3em 0;font-size:13.5px">${esc(b.sum)}</p>${false ? `<p class="muted" style="font-size:13.5px">Download the access codes now. They are not stored anywhere and cannot be recovered.</p><button type="button" class="btn btn-accent btn-sm" data-act="res-codes">${IC.download}Download access codes</button>` : ''}</div>`;
}
const dlFile = (name, txt, type) => { const b = new Blob([txt], { type: type || 'text/plain' }), l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 2000); };

/* ---- actions ---- */
Object.assign(ACT, {
  'res-save': el => {
    const x = (RES.mine || []).find(m => m.ev.id === el.dataset.id); if (!x) return; const ev = x.ev;
    const { pin } = pinOf(ev, x.rec.scores); S.pins = (S.pins || []).filter(p => p.ev !== ev.id);
    S.pins.push({ ev: ev.id, title: ev.title, date: ev.date, pin, crit: ev.crit.map((c, i) => ({ n: c.n, u: c.u, v: x.rec.scores[i] })) });
    save(); toast('Saved to your profile.'); drawView();
  },
  'res-del': el => confirmModal({ title: 'Delete this event?', sub: 'Students will no longer see these results. This cannot be undone.', confirm: 'Delete', danger: true, onConfirm: async () => {
    try { await Cloud.deleteEvent(el.dataset.id); RES.events = RES.events.filter(e => e.id !== el.dataset.id); toast('Event deleted.'); resRedraw(); } catch (e) { toast(e.message, { type: 'err' }); }
  } }),
  'rl-mode': el => { RES.lg.mode = el.dataset.m; RES.lg.msg = ''; drawView(); },
  'rl-out': async () => { try { await Cloud.resSignOut(); } catch (e) {} RES.rs = null; RES.mine = null; RES.mineMsg = ''; RES.lg = { mode: 'login', busy: false, msg: '', email: '', demo: false }; drawView(); },
  'rl-refresh': () => resFetchAll(),
  'rl-demo': async () => { try { await Cloud.resVerifyNow(); } catch (e) { RES.lg.msg = e.message; drawView(); return; } await rlCheck(); },
  'rl-check': () => rlCheck(),
  'rl-resend': async () => { try { await Cloud.resResend(); toast('Verification email sent again.'); } catch (e) { RES.lg.msg = e.message || 'Could not send it.'; drawView(); } },
  'res-codes': () => { if (RES.codes) dlFile('access-codes.csv', 'name,id,access code\n' + RES.codes.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv'); }
});
async function rlCheck() {
  RES.lg.busy = true; RES.lg.msg = ''; drawView();
  try {
    const ok = await Cloud.resCheck(); RES.lg.busy = false;
    if (!ok) { RES.lg.msg = 'Your email is not verified yet. Open the link in the email we sent, then try again.'; drawView(); return; }
    RES.rs = await Cloud.resSession(); RES.lg.mode = 'login'; toast('Email verified. Your student ID login is ready.');
    resFetchAll();
  } catch (e) { RES.lg.busy = false; RES.lg.msg = e.message || 'Could not check. Try again.'; drawView(); }
}
document.addEventListener('input', e => {
  if (e.target.id !== 'res-q') return; RES.q = e.target.value; const p = e.target.selectionStart; drawView(); const i = $('#res-q'); if (i) { i.focus(); try { i.setSelectionRange(p, p); } catch (x) {} }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches && t.matches('[data-rk]')) { RES.kind = t.value; RES.build = null; coachDraw(); }
  if (t.matches && t.matches('[data-rcsv]') && t.files[0]) { const f = t.files[0]; if (f.size > 4e6) { toast('That file is too large.', { type: 'err' }); return; } f.text().then(x => { const ta = $('#rb-v'); if (ta) ta.value = x; }); }
});
document.addEventListener('submit', async e => {
  const f = e.target, fid = f.getAttribute('id'); if (fid !== 'res-look' && fid !== 'res-build' && fid !== 'res-login' && fid !== 'res-create') return;
  e.preventDefault(); const D = Object.fromEntries(new FormData(f));
  if (fid === 'res-login' || fid === 'res-create') {
    const g = RES.lg; if (g.busy) return;
    g.schoolIn = String(D.school || '').slice(0, 80); g.sidIn = String(D.sid || '').slice(0, 30); if (fid === 'res-create') g.emailIn = String(D.email || '').slice(0, 80);
    const sid = Cloud.normSid(D.sid), fail = m => { g.msg = m; drawView(); const el = $('#rl-err'); if (el) el.focus && el.setAttribute('tabindex', '-1'); };
    const school = Cloud.schoolId(D.school);
    if (!school) return fail('Type your school’s name.');
    if (!sid) return fail('Enter your student ID.');
    if (fid === 'res-login') {
      if (lockLeft()) return; if (!D.pw) return fail('Enter your password.');
      g.busy = true; g.msg = ''; drawView();
      try { RES.rs = await Cloud.resSignIn(school, D.sid, D.pw); g.busy = false; noteAttempt(true);
        if (!RES.rs.verified) { g.mode = 'verify'; g.email = RES.rs.email; g.demo = Cloud.mode !== 'firebase'; drawView(); return; }
        resFetchAll(); } catch (x) { g.busy = false; noteAttempt(false); fail(x.message || 'Could not log in.'); }
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(D.email).trim())) return fail('Enter your school email address.');
    if (!D.pw || D.pw.length < 8) return fail('Use at least 8 characters for your password.');
    if (D.pw !== D.pw2) return fail('The two passwords are not the same.');
    g.busy = true; g.msg = ''; drawView();
    try { const r = await Cloud.resSignUp(school, D.sid, D.email, D.pw); g.busy = false; g.email = r.email; g.demo = Cloud.mode !== 'firebase';
      if (r.verified) { RES.rs = await Cloud.resSession(); g.mode = 'login'; resFetchAll(); } else { g.mode = 'verify'; drawView(); } }
    catch (x) { g.busy = false; fail(x.message || 'Could not create your login.'); }
    return;
  }
  if (fid === 'res-look') {
    if (RES.busy || lockLeft()) return;
    const g = RES.lg; g.schoolIn = String(D.school || '').slice(0, 80);
    const school = Cloud.schoolId(D.school); if (!school) { RES.oldMsg = 'Type your school’s name.'; drawView(); return; }
    RES.busy = true; RES.oldMsg = ''; RES.mine = null; drawView(); const out = []; let fail = '';
    try {
      const evs = (await Cloud.eventsList(school)).filter(e => e.kind === 'private');
      for (const ev of evs) { const rec = await lookupResult(ev, D.name, D.sid, D.dob, ''); if (rec) out.push({ ev, rec }); }
      if (!evs.length) fail = 'Your school has not published any results yet.';
    } catch (x) { fail = x.message || 'Could not check. Try again.'; }
    RES.busy = false; if (!fail) noteAttempt(!!out.length);
    if (out.length) { RES.mine = out; RES.mineMsg = ''; } else RES.oldMsg = fail || 'No result found for those details. Check the spelling of your name, your ID and your date of birth. If it still does not work, your result may not be published yet. Ask your PE teacher.';
    drawView(); return;
  }
  if (RES.busyBuild) return; RES.busyBuild = true; RES.build = null;
  const btn = f.querySelector('.btn-primary'), st = $('#res-stat'); if (btn) { btn.disabled = true; btn.textContent = 'Encrypting…'; } if (st) st.innerHTML = '';
  let res;
  try { res = D.kind === 'public' ? buildPublic(D) : await buildPrivate(D, (i, n) => { if (btn) btn.textContent = 'Encrypting ' + Math.round(i / n * 100) + '%'; }); } catch (x) { res = { errs: ['Something went wrong building the event.'] }; }
  if (res.errs) { RES.busyBuild = false; RES.build = { errs: res.errs }; if (btn) { btn.disabled = false; btn.textContent = 'Build and publish'; } if (st) st.innerHTML = resStat(); return; }
  try {
    res.ev.school = Cloud.user.school; await Cloud.putEvent(res.ev, res.rows || [], res.logins || []);
    RES.events = RES.events.filter(x => x.id !== res.ev.id).concat(res.ev); RES.codes = null;
    RES.build = { done: res.ev.title, sum: res.ev.kind === 'private' ? `${res.ev.n} students (${res.ev.logins} with an email, who can log in). Gold ${res.tally.gold}, silver ${res.tally.silver}, bronze ${res.tally.bronze}, no pin ${res.tally.none}.${res.ev.logins < res.ev.n ? ' Students without an email can only use the name, ID and date of birth lookup.' : ''}` : `${res.ev.cats.length} events.` };
    RES.busyBuild = false; coachDraw(); const s2 = $('#res-stat'); if (s2) s2.innerHTML = resStat(); toast('Event published.');
  } catch (x) { RES.busyBuild = false; RES.build = { errs: [x.message || 'Could not publish. Try again.'] }; coachDraw(); const s2 = $('#res-stat'); if (s2) s2.innerHTML = resStat(); }
}, true);
