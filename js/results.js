/* =========================================================
   PULSE — school events and results
   · Public events (inter-house, sports day): winners and house points, open to everyone.
   · Personal events (functional fitness test, bronze / silver / gold pins): each student's result
     is stored ENCRYPTED. The lookup key and the encryption key are both derived in the browser from
     full name + school ID + date of birth (+ an access code if the school uses one), so a result can
     only be opened by someone who knows all of those. Firestore rules also block listing the results.
   ========================================================= */
const TIERS = ['none', 'bronze', 'silver', 'gold'], TIER_L = { none: 'No pin yet', bronze: 'Bronze pin', silver: 'Silver pin', gold: 'Gold pin' };
const RES = { events: [], loaded: false, loading: false, err: '', sel: null, q: '', out: null, busy: false, kind: 'private', build: null, busyBuild: false, codes: null };
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
  if (o.codes === 'file' && col('code') < 0) errs.push('The header row needs a "code" column, or choose "Generate a code per student".');
  const ci = crit.map(c => head.indexOf(c.n.toLowerCase())); crit.forEach((c, i) => { if (ci[i] < 0) errs.push(`No column named "${c.n}" in the header row.`); });
  if (errs.length) return { errs };
  const ev = { id: o.id || rid(), title: o.title, date: o.date, kind: 'private', desc: o.desc || '', salt: b64(crypto.getRandomValues(new Uint8Array(12))), rule: o.rule === 'avg' ? 'avg' : 'min', needCode: o.codes !== 'none', crit, n: 0 };
  const seen = new Set(), sealed = [], codes = [], tally = { gold: 0, silver: 0, bronze: 0, none: 0 };
  for (let r = 1; r < rows.length; r++) {
    const R = rows[r], name = (R[col('name')] || '').trim(), id = (R[col('id')] || '').trim(), dob = (R[col('dob')] || '').trim();
    if (!name || !id) { errs.push(`Row ${r + 1}: name and id are required.`); continue; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || isNaN(new Date(dob))) { errs.push(`Row ${r + 1} (${name}): date of birth must look like 2009-05-14.`); continue; }
    const code = o.codes === 'gen' ? genCode() : o.codes === 'file' ? (R[col('code')] || '').trim() : '';
    if (o.codes === 'file' && !code) { errs.push(`Row ${r + 1} (${name}): code is empty.`); continue; }
    const key = [normName(name), normId(id), dob, normId(code)].join('|');
    if (seen.has(key)) { errs.push(`Row ${r + 1} (${name}): duplicate of an earlier row.`); continue; } seen.add(key);
    const scores = ci.map(i => { const v = (R[i] || '').trim(); return v === '' ? '' : +v; });
    if (scores.some(v => v !== '' && !isFinite(v))) { errs.push(`Row ${r + 1} (${name}): scores must be numbers (leave blank if not attempted).`); continue; }
    tally[TIERS[pinOf(ev, scores).pin]]++;
    sealed.push({ name, id, dob, code, rec: { name, scores, note: col('note') >= 0 ? (R[col('note')] || '').trim() : '' } });
    if (o.codes === 'gen') codes.push([name, id, code]);
  }
  if (errs.length) return { errs };
  const out = [];
  for (let i = 0; i < sealed.length; i++) { const s = sealed[i]; out.push(await sealRow(ev, s.name, s.id, s.dob, s.code, s.rec)); if (onProg) onProg(i + 1, sealed.length); }
  ev.n = out.length; return { ev, rows: out, tally, codes };
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

/* ---- student view ---- */
VIEWS.results = () => {
  if (!RES.loaded) { resLoad().then(resRedraw); return `<div class="empty" style="padding:80px 8px"><span class="spin lg"></span><h4>Loading school events…</h4></div>`; }
  const ev = RES.events.find(e => e.id === RES.sel); if (ev) return evDetail(ev);
  const q = normName(RES.q), L = RES.events.filter(e => !q || normName(e.title + ' ' + (e.desc || '')).includes(q));
  return `<div class="ph"><div><div class="label">${esc(Cloud.user && Cloud.user.schoolName || 'Your school')}</div><h2 style="margin-top:8px">School <em>results.</em></h2><p>Find winners from public events, or look up your own result from a fitness test. Personal results need your school ID.</p></div></div>
    ${RES.err ? `<div class="card"><div class="card-b"><p class="muted" role="alert">${esc(RES.err)}</p></div></div>` : ''}
    <div class="card" style="margin-bottom:16px"><div class="card-b"><div class="field"><label for="res-q">Search events</label><input class="input" id="res-q" type="search" value="${esc(RES.q)}" placeholder="e.g. track and field, fitness test" autocomplete="off"></div></div></div>
    ${L.length ? `<div class="stack">${L.map(e => `<button class="card res-ev" data-act="res-open" data-id="${esc(e.id)}" type="button"><div class="card-b" style="display:flex;justify-content:space-between;gap:12px;align-items:center;text-align:left"><div><h3 style="font-size:16px">${esc(e.title)}</h3><div class="muted" style="font-size:13px">${esc(fmtDY(e.date))}${e.desc ? ' · ' + esc(e.desc) : ''}</div></div><span class="pill ${e.kind === 'private' ? 'warn' : 'good'}">${e.kind === 'private' ? 'Personal · ID needed' : 'Public'}</span></div></button>`).join('')}</div>`
      : `<div class="card"><div class="empty"><div class="glyph">${IC.medal}</div><h4>${RES.events.length ? 'No events match' : 'No results yet'}</h4><p>${RES.events.length ? 'Try a different search.' : 'Your school will publish results here once they are ready.'}</p></div></div>`}`;
};
function evHead(ev) { return `<div class="ph"><div><div class="label">${esc(fmtDY(ev.date))}${ev.desc ? ' · ' + esc(ev.desc) : ''}</div><h2 style="margin-top:8px">${esc(ev.title)}</h2></div><div class="ph-actions"><button class="btn btn-ghost btn-sm" data-act="res-back">${IC.back}All events</button></div></div>`; }
function evDetail(ev) {
  if (ev.kind === 'public') {
    const q = normName(RES.q);
    return `${evHead(ev)}
      ${ev.houses && ev.houses.length ? `<div class="card" style="margin-bottom:16px"><div class="card-h"><h3>House points</h3><span class="label">5 · 3 · 1 for first to third</span></div><div class="card-b"><table class="res-t"><tr><th>House</th><th>Points</th></tr>${ev.houses.map((h, i) => `<tr><td>${i === 0 ? '<b>' : ''}${esc(h.name)}${i === 0 ? '</b>' : ''}</td><td>${h.pt}</td></tr>`).join('')}</table></div></div>` : ''}
      <div class="card" style="margin-bottom:16px"><div class="card-b"><div class="field"><label for="res-q">Find a winner or an event</label><input class="input" id="res-q" type="search" value="${esc(RES.q)}" placeholder="Name or event, e.g. 100m" autocomplete="off"></div></div></div>
      <div class="stack">${ev.cats.map(c => ({ c, pl: c.places.filter(p => !q || normName(c.name + ' ' + p.name + ' ' + p.house).includes(q)) })).filter(x => x.pl.length).map(({ c, pl }) => `<section class="card"><div class="card-h"><h3>${esc(c.name)}</h3></div><div class="card-b"><table class="res-t">${pl.map(p => `<tr><td style="width:3em"><b>${p.p === 1 ? '1st' : p.p === 2 ? '2nd' : p.p === 3 ? '3rd' : p.p + 'th'}</b></td><td>${esc(p.name)}</td><td class="muted">${esc(p.house)}</td><td class="muted">${esc(p.res)}</td></tr>`).join('')}</table></div></section>`).join('') || `<div class="card"><div class="empty"><h4>Nothing matches</h4><p>Try a different search.</p></div></div>`}</div>`;
  }
  const lk = lockLeft(), needLogin = Cloud.mode === 'firebase' && !Cloud.user;
  if (RES.out && RES.out.ok) return `${evHead(ev)}${resCard(ev, RES.out.rec)}`;
  return `${evHead(ev)}<div class="card"><div class="card-h"><h3>See your own result</h3></div><div class="card-b">
    <p class="muted" style="font-size:14px;margin-bottom:14px">This result is private. Enter the same details your school has on file. Pulse never shows anyone else's result, and results are stored encrypted, so they cannot be opened without these details.</p>
    ${needLogin ? `<p><b>Log in with your Pulse account to look up a personal result.</b></p><a class="btn btn-primary" href="#/login">Log in</a>` : `<form id="res-look" autocomplete="off" novalidate>
      <div class="field"><label for="rl-n">Full name</label><input class="input" id="rl-n" name="name" required maxlength="60" placeholder="As on your school record"></div>
      <div class="field" style="margin-top:12px"><label for="rl-i">School ID</label><input class="input" id="rl-i" name="sid" required maxlength="30" autocomplete="off" placeholder="Your school ID number"></div>
      <div class="field" style="margin-top:12px"><label for="rl-d">Date of birth</label><input class="input" id="rl-d" name="dob" type="date" required></div>
      ${ev.needCode ? `<div class="field" style="margin-top:12px"><label for="rl-c">Access code</label><input class="input" id="rl-c" name="code" required maxlength="20" autocomplete="off" placeholder="The code your PE teacher gave you"></div>` : ''}
      <div style="margin-top:16px"><button class="btn btn-primary" ${RES.busy || lk ? 'disabled' : ''}>${RES.busy ? 'Checking…' : 'Show my result'}</button></div>
      ${lk ? `<p class="muted" role="alert" style="margin-top:8px">Too many tries. Wait ${lk} seconds.</p>` : ''}
      ${RES.out && !RES.out.ok ? `<p role="alert" style="color:var(--bad);margin-top:10px">${esc(RES.out.msg)}</p>` : ''}</form>`}</div></div>`;
}
function resCard(ev, r) {
  const { pin, ts } = pinOf(ev, r.scores), saved = (S.pins || []).some(p => p.ev === ev.id);
  return `<div class="card"><div class="card-h"><div><span class="label">Result for</span><h3>${esc(r.name)}</h3></div>${pinPill(pin)}</div><div class="card-b">
    <table class="res-t"><tr><th>Test</th><th>Your result</th><th>Level</th><th>Next pin</th></tr>${ev.crit.map((c, i) => { const v = r.scores[i], t = ts[i], n = nextTarget(c, v, t); return `<tr><td>${esc(c.n)}</td><td>${v === '' ? 'Not attempted' : esc(v + ' ' + c.u)}</td><td>${t ? TIER_L[TIERS[t]].replace(' pin', '') : 'None'}</td><td class="muted">${n ? esc(n.goal + ' ' + c.u) + (n.gap != null ? ` (${+n.gap.toFixed(2)} to go)` : '') : 'Top level'}</td></tr>`; }).join('')}</table>
    <p class="muted" style="font-size:13px;margin-top:10px">${ev.rule === 'avg' ? 'Your pin is the average of your levels across all tests.' : 'Your pin is set by your lowest level across all tests.'}</p>
    ${r.note ? `<p style="margin-top:8px"><b>Note from your teacher:</b> ${esc(r.note)}</p>` : ''}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn btn-primary btn-sm" data-act="res-save">${saved ? 'Update saved result' : 'Save to my profile'}</button><button class="btn btn-ghost btn-sm" data-act="res-clear">Hide result</button></div></div></div>`;
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
      <div class="field" style="margin-top:12px"><label for="rb-o">Access codes<span class="hint">Codes make guessing much harder. Hand each student theirs in person. Without codes, anyone who knows a classmate's name, ID and birthday could see their result.</span></label><select class="input" id="rb-o" name="codes"><option value="gen">Generate a code per student (recommended)</option><option value="file">Use the "code" column in my table</option><option value="none">No codes. Name, ID and date of birth only</option></select></div>
      <div class="field" style="margin-top:12px"><label for="rb-v">Results table (CSV)<span class="hint">Columns: name, id, dob (YYYY-MM-DD), one column per test named exactly as above, optional note. Leave a score blank if not attempted.</span></label><textarea class="input" id="rb-v" name="csv" rows="7" placeholder="name,id,dob,Push-ups,1 km run,note&#10;Asha Rao,VV1042,2009-05-14,28,5.4,Great effort"></textarea></div>`
      : `<div class="field" style="margin-top:12px"><label for="rb-v">Results table (CSV)<span class="hint">Columns: category, place (1 to 8), name; optional house and result. House points are added up for you.</span></label><textarea class="input" id="rb-v" name="csv" rows="7" placeholder="category,place,name,house,result&#10;100m Under 16 Boys,1,Arjun Mehta,Red,12.4s"></textarea></div>`}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;align-items:center"><label class="btn btn-ghost btn-sm" style="cursor:pointer">${IC.upload}Load CSV from file<input type="file" accept=".csv,text/csv,text/plain" data-rcsv hidden></label><button class="btn btn-primary" ${RES.busyBuild ? 'disabled' : ''}>${RES.busyBuild ? 'Encrypting…' : 'Build and publish'}</button></div>
      <div id="res-stat" aria-live="polite">${resStat()}</div></form></div></div>`;
}
function resStat() {
  const b = RES.build; if (!b) return '';
  if (b.errs) return `<div role="alert" style="color:var(--bad);margin-top:10px">${b.errs.slice(0, 8).map(x => `<div>${esc(x)}</div>`).join('')}${b.errs.length > 8 ? `<div>and ${b.errs.length - 8} more</div>` : ''}</div>`;
  return `<div style="margin-top:12px;padding:12px;border:1px solid var(--line);border-radius:10px"><b>Published: ${esc(b.done)}</b><p class="muted" style="margin:.3em 0;font-size:13.5px">${esc(b.sum)}</p>${RES.codes && RES.codes.length ? `<p class="muted" style="font-size:13.5px">Download the access codes now. They are not stored anywhere and cannot be recovered.</p><button type="button" class="btn btn-accent btn-sm" data-act="res-codes">${IC.download}Download access codes</button>` : ''}</div>`;
}
const dlFile = (name, txt, type) => { const b = new Blob([txt], { type: type || 'text/plain' }), l = document.createElement('a'); l.href = URL.createObjectURL(b); l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(l.href), 2000); };

/* ---- actions ---- */
Object.assign(ACT, {
  'res-open': el => { RES.sel = el.dataset.id; RES.out = null; RES.q = ''; drawView(); },
  'res-back': () => { RES.sel = null; RES.out = null; RES.q = ''; drawView(); },
  'res-clear': () => { RES.out = null; drawView(); },
  'res-save': () => {
    const ev = RES.events.find(e => e.id === RES.sel); if (!ev || !RES.out || !RES.out.ok) return;
    const { pin } = pinOf(ev, RES.out.rec.scores); S.pins = (S.pins || []).filter(p => p.ev !== ev.id);
    S.pins.push({ ev: ev.id, title: ev.title, date: ev.date, pin, crit: ev.crit.map((c, i) => ({ n: c.n, u: c.u, v: RES.out.rec.scores[i] })) });
    save(); toast('Saved to your profile.'); drawView();
  },
  'res-del': el => confirmModal({ title: 'Delete this event?', sub: 'Students will no longer see these results. This cannot be undone.', confirm: 'Delete', danger: true, onConfirm: async () => {
    try { await Cloud.deleteEvent(el.dataset.id); RES.events = RES.events.filter(e => e.id !== el.dataset.id); toast('Event deleted.'); resRedraw(); } catch (e) { toast(e.message, { type: 'err' }); }
  } }),
  'res-codes': () => { if (RES.codes) dlFile('access-codes.csv', 'name,id,access code\n' + RES.codes.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv'); }
});
document.addEventListener('input', e => {
  if (e.target.id !== 'res-q') return; RES.q = e.target.value; const p = e.target.selectionStart; drawView(); const i = $('#res-q'); if (i) { i.focus(); try { i.setSelectionRange(p, p); } catch (x) {} }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches && t.matches('[data-rk]')) { RES.kind = t.value; RES.build = null; coachDraw(); }
  if (t.matches && t.matches('[data-rcsv]') && t.files[0]) { const f = t.files[0]; if (f.size > 4e6) { toast('That file is too large.', { type: 'err' }); return; } f.text().then(x => { const ta = $('#rb-v'); if (ta) ta.value = x; }); }
});
document.addEventListener('submit', async e => {
  const f = e.target, fid = f.getAttribute('id'); if (fid !== 'res-look' && fid !== 'res-build') return;
  e.preventDefault(); const D = Object.fromEntries(new FormData(f));
  if (fid === 'res-look') {
    const ev = RES.events.find(x => x.id === RES.sel); if (!ev || RES.busy || lockLeft()) return;
    RES.busy = true; RES.out = null; drawView(); let rec = null, fail = '';
    try { rec = await lookupResult(ev, D.name, D.sid, D.dob, D.code || ''); } catch (x) { fail = x.message || ''; }
    RES.busy = false; if (!fail) noteAttempt(!!rec);
    RES.out = rec ? { ok: 1, rec } : { ok: 0, msg: fail || ('No result found for those details. Check the spelling of your name, your ID and your date of birth' + (ev.needCode ? ' and your access code' : '') + '. If it still does not work, your result may not be published yet. Ask your PE teacher.') };
    drawView(); return;
  }
  if (RES.busyBuild) return; RES.busyBuild = true; RES.build = null; RES.codes = null;
  const btn = f.querySelector('.btn-primary'), st = $('#res-stat'); if (btn) { btn.disabled = true; btn.textContent = 'Encrypting…'; } if (st) st.innerHTML = '';
  let res;
  try { res = D.kind === 'public' ? buildPublic(D) : await buildPrivate(D, (i, n) => { if (btn) btn.textContent = 'Encrypting ' + Math.round(i / n * 100) + '%'; }); } catch (x) { res = { errs: ['Something went wrong building the event.'] }; }
  if (res.errs) { RES.busyBuild = false; RES.build = { errs: res.errs }; if (btn) { btn.disabled = false; btn.textContent = 'Build and publish'; } if (st) st.innerHTML = resStat(); return; }
  try {
    res.ev.school = Cloud.user.school; await Cloud.putEvent(res.ev, res.rows || []);
    RES.events = RES.events.filter(x => x.id !== res.ev.id).concat(res.ev); RES.codes = res.codes || null;
    RES.build = { done: res.ev.title, sum: res.ev.kind === 'private' ? `${res.ev.n} students. Gold ${res.tally.gold}, silver ${res.tally.silver}, bronze ${res.tally.bronze}, no pin ${res.tally.none}.` : `${res.ev.cats.length} events.` };
    RES.busyBuild = false; coachDraw(); const s2 = $('#res-stat'); if (s2) s2.innerHTML = resStat(); toast('Event published.');
  } catch (x) { RES.busyBuild = false; RES.build = { errs: [x.message || 'Could not publish. Try again.'] }; coachDraw(); const s2 = $('#res-stat'); if (s2) s2.innerHTML = resStat(); }
}, true);
