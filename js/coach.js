/* =========================================================
   PULSE — weekly weigh-ins, automatic plan adjustment,
   the student's Coach tab and the coach dashboard
   ========================================================= */

/* ---------------- weekly weigh-in ---------------- */
const daysBetween = (a, b) => Math.round((parseIso(b) - parseIso(a)) / 864e5);
function lastWeighIn(st = S) { const w = st.log.weight; return w.length ? w[w.length - 1] : null; }
function weighInDue() {
  if (!S || S.sample) return false;
  const lw = lastWeighIn();
  return (!lw || daysBetween(lw.date, today()) >= 7) && S.weighSnooze !== today();
}
function weighInCard() {
  if (!weighInDue()) return '';
  const lw = lastWeighIn(), n = lw ? daysBetween(lw.date, today()) : null;
  return `<section class="card c-12 weigh-card"><div class="weigh-in">
      <span class="wi-ic">${IC.scale}</span>
      <div style="min-width:0"><div class="label">Weekly check</div><h3>Time for your weigh-in</h3><p>${n ? `It has been ${n} days since your last one. ` : ''}Weigh yourself in the morning, after the toilet and before eating. Pulse compares it with your goal and adjusts your plan if progress has stalled.</p></div>
      <form class="wi-form" data-form="weight" novalidate><div class="input-wrap"><input class="input num" id="w-in" type="number" step="0.1" min="30" max="200" inputmode="decimal" placeholder="${lw ? fmt1(lw.kg) : '60'}" aria-label="Weight in kilograms"><span class="suffix">kg</span></div><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-quiet btn-sm" type="button" data-act="weigh-snooze">Tomorrow</button><span class="error" id="w-err" hidden></span></form>
    </div></section>`;
}
function logWeighIn(kg) {
  upsertWeight(today(), kg); S.profile.weight = kg; S.weighSnooze = null;
  const r = evaluateProgress();
  save(); const y = scrollY; refresh(); window.scrollTo(0, y);
  if (r && r.changed) setTimeout(() => toast(`<b>${fmt1(kg)} kg logged. Your plan was adjusted.</b> See what changed on Today.`, { icon: IC.target, ms: 7000, action: UI.view !== 'today' ? { label: 'View', fn: () => navigate('today') } : null }), 150);
  else toast(`<b>${fmt1(kg)} kg logged.</b> ${r && r.status === 'on-track' ? 'You are on track for your goal.' : 'Food targets updated to match.'}`, { icon: IC.scale });
  checkMilestones();
}

/* weekly rate of change (% of body weight) from a least-squares line through the last 4 weeks */
function weightTrend(st = S) {
  const from = iso(addDays(new Date(), -28)), w = st.log.weight.filter(x => x.date >= from);
  if (w.length < 2) return null;
  const span = daysBetween(w[0].date, w[w.length - 1].date); if (span < 10) return { early: true, n: w.length, span };
  const xs = w.map(x => daysBetween(w[0].date, x.date)), ys = w.map(x => x.kg), n = w.length;
  const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  const slope = xs.reduce((t, x, i) => t + (x - mx) * (ys[i] - my), 0) / (xs.reduce((t, x) => t + (x - mx) ** 2, 0) || 1);
  return { kgWeek: slope * 7, pctWeek: slope * 7 / my * 100, span, n };
}
/* healthy weekly change for each goal, as % of body weight. Under-18s get gentler targets. */
function goalBand(p) {
  const minor = +p.age < 18;
  return {
    muscle: [0.1, minor ? 0.4 : 0.5], strength: [-0.15, 0.4], speed: [-0.2, 0.3], lean: minor ? [-0.5, -0.15] : [-0.8, -0.25],
    general: [-0.3, 0.3], endurance: [-0.3, 0.25], mobility: [-0.3, 0.3]
  }[p.goal] || [-0.3, 0.3];
}
function progressStatus(st = S) {
  const t = weightTrend(st); if (!t) return { status: 'no-data' }; if (t.early) return { status: 'early' };
  const [lo, hi] = goalBand(st.profile);
  return { status: t.pctWeek < lo ? 'below' : t.pctWeek > hi ? 'above' : 'on-track', t, lo, hi };
}
const STATUS_TXT = { 'on-track': ['good', 'On track'], below: ['warn', 'Behind target'], above: ['warn', 'Ahead of target'], early: ['', 'Too early to tell'], 'no-data': ['', 'No weigh-ins yet'] };
function statusFor(goal, s) {
  if (s === 'below') return goal === 'lean' ? ['warn', 'Not losing'] : ['warn', 'Not gaining'];
  if (s === 'above') return goal === 'lean' ? ['warn', 'Losing too fast'] : ['warn', 'Gaining too fast'];
  return STATUS_TXT[s] || ['', s];
}
/* the weekly check: adjust calories (and sometimes intensity) when progress stalls */
function evaluateProgress() {
  const p = S.profile, ps = progressStatus(); if (ps.status === 'no-data' || ps.status === 'early') return ps;
  const last = (S.adjust || [])[S.adjust.length - 1];
  if (last && daysBetween(last.date, today()) < 13) return Object.assign(ps, { changed: false, text: 'Last change was recent, so Pulse is giving it time to work.' });
  if (ps.status === 'on-track') return ps;
  const minor = +p.age < 18, adj = +p.kcalAdj || 0, T = targets(p, true);
  const since14 = iso(addDays(new Date(), -14)), done = S.log.sessions.filter(s => s.date >= since14).length, planned = trainingDays(p).length * 2;
  const adherence = done / planned, recent = S.log.sessions.slice(-6), rpe = recent.length ? recent.reduce((t, s) => t + s.rpe, 0) / recent.length : 0;
  const notes = []; let delta = 0, rpeUp = 0;
  const wantsLoss = p.goal === 'lean';
  if (ps.status === 'below') delta = wantsLoss ? -150 : 150;
  else delta = wantsLoss ? 150 : -100;
  // limits: never more than ±450 kcal from the formula; under-18s never drop below 1.4 × resting energy
  let next = clamp(adj + delta, -450, 450);
  if (minor && T.kcal + (next - adj) < T.bmr * 1.4) next = adj + Math.max(0, Math.round((T.bmr * 1.4 - T.kcal) / 10) * 10);
  delta = next - adj;
  if (delta) notes.push(`${delta > 0 ? 'Added' : 'Removed'} ${Math.abs(delta)} kcal a day (${delta > 0 ? 'mostly carbs' : 'mostly from carbs and fat, protein stays the same'}).`);
  if (ps.status === 'below' && ['muscle', 'strength', 'speed'].includes(p.goal) && adherence >= 0.8 && rpe && rpe < 7 && (+p.rpeAdj || 0) < 1) { rpeUp = 0.5; notes.push('Your sessions felt easy, so working sets now aim half a point harder on RPE.'); }
  if (adherence < 0.6) notes.push(`You logged ${done} of ${planned} planned sessions in the last two weeks. Hitting your sessions matters more than any food change.`);
  if (!delta && !rpeUp) return Object.assign(ps, { changed: false, text: notes.join(' ') || 'Your plan is already at its safe limit. Keep going and talk to your coach.' });
  p.kcalAdj = next; if (rpeUp) p.rpeAdj = (+p.rpeAdj || 0) + rpeUp;
  const why = ps.status === 'below' ? (wantsLoss ? 'Your weight has not dropped over the last few weeks.' : 'Your weight has not gone up over the last few weeks.') : (wantsLoss ? 'You are losing weight faster than is healthy.' : 'You are gaining faster than muscle can be built, so the extra is mostly fat.');
  const text = why + ' ' + notes.join(' ');
  S.adjust = S.adjust || []; S.adjust.push({ date: today(), text, kcal: delta, rpe: rpeUp, rate: round(ps.t.pctWeek, 2), seen: false });
  return Object.assign(ps, { changed: true, text });
}
function adjustCard() {
  const a = (S.adjust || [])[S.adjust.length - 1];
  if (!a || a.seen || S.sample || daysBetween(a.date, today()) > 7) return '';
  return `<section class="card c-12 adjust-card"><div class="weigh-in"><span class="wi-ic acc">${IC.target}</span><div style="min-width:0"><div class="label">Plan adjusted · ${fmtDate(parseIso(a.date))}</div><h3>Pulse tuned your plan</h3><p>${esc(a.text)}</p></div><button class="btn btn-ghost btn-sm" data-act="adjust-seen">Got it</button></div></section>`;
}

/* ---------------- what coaches see ---------------- */
function progressDocs(st) {
  const prev = S; S = st;
  try {
    const p = st.profile, planned = trainingDays(p).length, mon = mondayOf(new Date());
    const weeks = [3, 2, 1, 0].map(k => { const m = addDays(mon, -7 * k); return { label: fmtDate(m), done: weekDone(m) }; });
    const since28 = iso(addDays(new Date(), -28)), done28 = st.log.sessions.filter(s => s.date >= since28).length;
    const recent = st.log.sessions.slice(-6), avgRpe = recent.length ? round(recent.reduce((t, s) => t + s.rpe, 0) / recent.length, 1) : null;
    const joined = iso(new Date(p.createdAt || Date.now())), last7 = [...Array(7)].map((_, i) => iso(addDays(new Date(), -i))).filter(d => d >= joined);
    const rd = last7.map(d => st.log.check[d]).filter(Boolean).map(readiness);
    const waterPct = last7.map(d => waterMl(d) / targets(p, !!sessionFor(parseIso(d))).water).filter((v, i) => i > 0 || v > 0);
    const protDays = last7.filter(d => (st.log.food[d] || []).length).map(d => sumFoods(st.log.food[d]).p / targets(p).protein);
    const ps = progressStatus(st), lw = lastWeighIn(st), r = acwr();
    const avg = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100) : null;
    const flags = [];
    if (!lw || daysBetween(lw.date, today()) > 10) flags.push('No weigh-in for over 10 days');
    if (ps.status === 'below' || ps.status === 'above') flags.push(statusFor(p.goal, ps.status)[1]);
    if (done28 < planned * 4 * 0.6 && daysBetween(iso(new Date(p.createdAt)), today()) > 10) flags.push('Missing sessions');
    if (r && r > 1.5) flags.push('Training load spike');
    if (rd.length >= 3 && rd.reduce((a, b) => a + b, 0) / rd.length < 45) flags.push('Low readiness');
    const wp = avg(waterPct); if (wp != null && wp < 70) flags.push('Not drinking enough water');
    const pp = avg(protDays); if (pp != null && protDays.length >= 3 && pp < 70) flags.push('Low protein');
    const adj = (st.adjust || [])[(st.adjust || []).length - 1];
    const base = {
      name: p.name, grade: p.grade || '', school: p.school, sports: p.sports.length ? p.sports : ['general'], goal: p.goal, age: p.age, planned,
      weeks, adherence: Math.min(100, Math.round(done28 / (planned * 4) * 100)), streak: weekStreak(), lastSession: (st.log.sessions[st.log.sessions.length - 1] || {}).date || '', avgRpe,
      weight: { now: lw ? lw.kg : p.weight, lastDate: lw ? lw.date : '', status: ps.status, rate: ps.t ? round(ps.t.pctWeek, 2) : null, kgWeek: ps.t ? round(ps.t.kgWeek, 2) : null, series: st.log.weight.slice(-10).map(x => [x.date, x.kg]) },
      readiness: rd.length ? Math.round(rd.reduce((a, b) => a + b, 0) / rd.length) : null, water: wp, protein: pp, acwr: r ? round(r, 2) : null,
      flags, lastAdjust: adj ? { date: adj.date, text: adj.text } : null,
      supps: (st.supps || []).filter(sp => ['pending', 'active', 'rejected'].includes(sp.status)).map(sp => ({ id: sp.id, name: sp.name, status: sp.status, sentAt: sp.sentAt || null, verified: !!sp.review })),
      updatedAt: st.updatedAt || Date.now()
    };
    if (!p.school) return [];
    return base.sports.map(sport => Object.assign({}, base, { sport }));
  } finally { S = prev; }
}
/* one student's card, as a coach sees it */
function studentCard(d, opts = {}) {
  const [k, l] = statusFor(d.goal, d.weight.status), wk = d.weeks[d.weeks.length - 1];
  return `<${opts.link ? `a href="#/student?id=${encodeURIComponent(d.uid)}"` : 'div'} class="stu ${opts.link ? 'link' : ''}">
    <div class="stu-h"><span class="avatar sm">${esc(initials(d.name))}</span><div style="min-width:0"><b>${esc(d.name)}</b><span>${d.grade ? 'Grade ' + esc(d.grade) + ' · ' : ''}${esc(d.sports.map(s => s === 'general' ? 'PE' : SPORTS[s].split(' (')[0]).join(', '))} · ${esc(GOALS[d.goal].label)}</span></div><span class="pill ${k}">${l}</span></div>
    <div class="stu-stats">
      <div><span class="label">This week</span><b>${wk.done}<small>/${d.planned}</small></b>${bar(wk.done, d.planned, wk.done >= d.planned ? 'acc' : '')}</div>
      <div><span class="label">4-wk sessions</span><b>${d.adherence}<small>%</small></b>${bar(d.adherence, 100, '')}</div>
      <div><span class="label">Weight</span><b>${fmt1(d.weight.now)}<small>kg</small></b><span class="sub">${d.weight.kgWeek != null ? `${d.weight.kgWeek >= 0 ? '+' : ''}${fmt1(d.weight.kgWeek)} kg/wk` : d.weight.lastDate ? 'Weighed ' + fmtDate(parseIso(d.weight.lastDate)) : '–'}</span></div>
      <div><span class="label">Water</span><b>${d.water != null ? d.water : '–'}<small>%</small></b>${bar(d.water || 0, 100, '')}</div>
    </div>
    ${d.flags.length ? `<div class="stu-flags">${d.flags.map(f => `<span class="pill warn">${esc(f)}</span>`).join('')}</div>` : `<div class="stu-flags"><span class="pill good">${IC.check.replace('<svg', '<svg width="12" height="12"')} No concerns</span></div>`}
    ${d.supps.some(s => s.status === 'pending' && !(COACH.pending.find(x => x.s.id === s.id) || {}).review) ? `<div class="stu-flags"><span class="pill acc">${IC.pill.replace('<svg', '<svg width="12" height="12"')} Doctor’s note to verify</span></div>` : ''}
  </${opts.link ? 'a' : 'div'}>`;
}

/* ---------------- student's Coach tab ---------------- */
VIEWS.coach = () => {
  const p = S.profile, u = Cloud.user;
  const preview = (progressDocs(S)[0]) || progressDocsPreview();
  const sp = p.sports.length ? p.sports : ['general'];
  const who = sp.map(s => s === 'general' ? 'PE' : SPORTS[s].split(' (')[0]).join(' and ');
  const pend = (S.supps || []).filter(x => ['need-note', 'pending', 'rejected', 'need-account'].includes(x.status) || x.review);
  let top;
  if (S.sample) top = `<div class="acct"><span class="acct-ic">${IC.coach}</span><div><b>This is how Aarav’s coaches see him</b><p>In your own plan, the coaches for each sport you play at your school can follow your progress here.</p></div></div>`;
  else if (!u) top = `<div class="acct"><span class="acct-ic">${IC.coach}</span><div><b>Let your coaches follow your progress</b><p>Coaches can only see students with an account. Your plan, logs and history move into the account with you.</p></div><div class="acct-acts"><a class="btn btn-primary" href="#/signup">Create an account</a><a class="btn btn-ghost" href="#/login">Log in</a></div></div>`;
  else if (!p.school) top = `<div class="acct"><span class="acct-ic">${IC.coach}</span><div><b>Add your school</b><p>Coaches find you by school and sport. Add your school and grade so they can see your progress.</p></div><div class="acct-acts"><a class="btn btn-primary" href="#/start">${IC.edit}Add school</a></div></div>`;
  else top = `<div class="acct"><span class="acct-ic acc">${IC.shield}</span><div><b>${esc(who)} coaches at ${esc(Cloud.schoolName(p.school))} can see your progress</b><p>Grade ${esc(p.grade || '–')}. Play another sport? Add it in Edit plan inputs and that coach will see you too.</p></div><div class="acct-acts"><a class="btn btn-ghost" href="#/start">${IC.edit}Change sports</a></div></div>`;
  return `<div class="ph"><div><div class="label">Coach access</div><h2 style="margin-top:8px">Your <em>coaches.</em></h2><p>Coaches see how you are doing, not everything you do.</p></div></div>
    <div class="dash stagger">
      <section class="card c-12">${top}</section>
      <section class="card c-7"><div class="card-h"><h3>What your coaches see</h3><span class="label">Live preview</span></div><div class="card-b">${studentCard(preview)}</div></section>
      <section class="card c-5"><div class="card-h"><h3>What stays private</h3></div><div class="card-b"><ul class="priv">
        ${[['Shared', 'Sessions done each week and how hard they felt', 1], ['Shared', 'Your weigh-in trend against your goal', 1], ['Shared', 'Water, protein and readiness as percentages', 1], ['Shared', 'Supplements and doctor’s notes you send for checking', 1], ['Private', 'Your food log and meal plan', 0], ['Private', 'Your exercises, weights and injury notes', 0], ['Private', 'Your glass photos and chat with Ask Pulse', 0]].map(([a, b, on]) => `<li class="${on ? 'on' : ''}"><span>${on ? IC.check : IC.lock}</span>${esc(b)}</li>`).join('')}</ul></div></section>
      <section class="card c-6"><div class="card-h"><h3>Supplement checks</h3><a class="btn btn-quiet btn-sm" href="#/fuel">Fuel ${IC.arrow}</a></div><div class="card-b">${pend.length ? `<ul class="supp-list">${pend.map(x => { const [k, l] = SUPP_STATUS[x.status] || ['', x.status]; return `<li><span class="supp-ic">${IC.pill}</span><div><div class="nm">${esc(x.name)}</div><div class="mac">${x.review ? `${x.status === 'active' ? 'Verified' : 'Declined'} by ${esc(x.review.byName)}${x.review.comment ? ' · “' + esc(x.review.comment) + '”' : ''}` : x.sentAt ? 'Sent ' + fmtDate(new Date(x.sentAt)) : 'Not sent yet'}</div></div><span class="pill ${k}">${l}</span></li>`; }).join('')}</ul>` : `<p class="muted" style="font-size:13.5px">Nothing waiting. If you are under 18, supplements that can have side effects need a doctor’s note, and one of your coaches checks it here.</p>`}</div></section>
      <section class="card c-6"><div class="card-h"><h3>Weekly weigh-ins</h3><span class="label">${(S.adjust || []).length} adjustments</span></div><div class="card-b">${(() => { const ps = progressStatus(), [k, l] = statusFor(p.goal, ps.status), lw = lastWeighIn(); return `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><span class="pill ${k}">${l}</span><span class="muted" style="font-size:13px">${lw ? 'Last weigh-in ' + fmtDate(parseIso(lw.date)) : 'No weigh-ins yet'}${ps.t ? ` · ${ps.t.kgWeek >= 0 ? '+' : ''}${fmt1(ps.t.kgWeek)} kg a week` : ''}</span></div>`; })()}
        ${(S.adjust || []).length ? `<ul class="hist">${S.adjust.slice(-3).reverse().map(a => `<li style="grid-template-columns:44px minmax(0,1fr)"><div class="dte"><b>${parseIso(a.date).getDate()}</b><span>${parseIso(a.date).toLocaleDateString('en', { month: 'short' })}</span></div><div class="sub" style="font-size:13px;color:var(--ink-2)">${esc(a.text)}</div></li>`).join('')}</ul>` : `<p class="muted" style="font-size:13.5px">Weigh in once a week. If your weight stops moving towards your goal, Pulse adjusts your food targets and tells you and your coaches what changed.</p>`}</div></section>
    </div>`;
};
function progressDocsPreview() {
  const p = S.profile;
  return { name: p.name, grade: p.grade || '', sports: p.sports.length ? p.sports : ['general'], goal: p.goal, planned: trainingDays(p).length, weeks: [{ done: weekDone(mondayOf(new Date())) }], adherence: 0, weight: { now: p.weight, status: 'no-data', kgWeek: null, lastDate: '' }, water: null, flags: [], supps: [] };
}

/* ---------------- coach dashboard ---------------- */
const COACH = { roster: [], pending: [], loaded: false, loading: false, err: '', f: { sport: 'all', grade: 'all', q: '' } };
const COACH_VIEWS = { students: ['Students', 'coach'], verify: ['Verify notes', 'shield'], account: ['Account', 'profile'] };
async function coachLoad() {
  COACH.loading = true;
  try {
    const raw = await Cloud.coachRoster(), by = {};
    raw.forEach(d => { if (!by[d.uid]) by[d.uid] = Object.assign({}, d); });
    COACH.roster = Object.values(by).sort((a, b) => b.flags.length - a.flags.length || a.name.localeCompare(b.name));
    const pend = [];
    COACH.roster.forEach(d => (d.supps || []).filter(s => s.status === 'pending').forEach(s => pend.push({ stu: d, s })));
    await Promise.all(pend.map(async x => { try { x.review = await Cloud.getReview(x.s.id); if (x.review && x.review.at < (x.s.sentAt || 0)) x.review = null; } catch (e) {} }));
    COACH.pending = pend; COACH.err = ''; COACH.loaded = true;
  } catch (e) { COACH.err = e.message || 'Could not load your students.'; }
  COACH.loading = false;
}
async function coachRefresh(silent) { if (UI.screen !== 'coach') return; if (!silent) { COACH.loaded = false; coachDraw(); } await coachLoad(); coachDraw(); }
function showCoachApp(path) {
  const { q } = parseHash();
  const view = COACH_VIEWS[path] || path === 'student' ? path : 'students';
  if (path !== view) history.replaceState(null, '', '#/' + view);
  const u = Cloud.user, first = UI.screen !== 'coach';
  UI.coachView = view; UI.coachStu = q.get('id');
  if (first) {
    setScreen('coach', `<div class="app-wrap"><div class="app">
      <aside class="side" aria-label="Main">
        <a class="brand" href="#/students"><span class="brand-mark">${IC.mark}</span>Pulse <span class="pill line" style="margin-left:4px">Coach</span></a>
        <nav class="side-nav">${Object.entries(COACH_VIEWS).map(([v, [t, ic]]) => `<a href="#/${v}" data-cnav="${v}">${IC[ic]}<span>${t}</span><span class="badge" ${v === 'verify' ? 'id="v-badge"' : ''}></span></a>`).join('')}</nav>
        <div class="side-block"><b>${esc(u.name)}</b><div class="muted" style="font-size:12.5px;margin-top:4px">${esc(Cloud.schoolName(u.school))}</div><div class="muted" style="font-size:12.5px">${esc((u.sports || []).map(s => s === 'general' ? 'PE' : SPORTS[s].split(' (')[0]).join(', '))}</div></div>
        <div class="side-foot"><span class="save-state"><span class="dot"></span>${Cloud.mode === 'firebase' ? 'Coach account' : 'Coach · demo mode'}</span><button class="icon-btn sm" data-act="theme" data-theme-ic aria-label="Toggle dark mode">${isDark() ? IC.sun : IC.moon}</button></div>
      </aside>
      <div class="main"><header class="topbar" id="topbar"><a class="brand" href="#/students"><span class="brand-mark">${IC.mark}</span>Pulse</a><h1 class="pg" id="pg-title"></h1>
        <div class="topbar-r"><button class="icon-btn" data-act="coach-reload" aria-label="Refresh" data-tip="Refresh">${IC.reset}</button><button class="icon-btn" data-act="theme" data-theme-ic aria-label="Toggle dark mode">${isDark() ? IC.sun : IC.moon}</button><a class="top-avatar" href="#/account" aria-label="Account">${esc(initials(u.name))}</a></div></header>
        <main class="content" id="main" tabindex="-1"></main></div></div>
      <nav class="tabbar" aria-label="Main" style="grid-template-columns:repeat(3,1fr)">${Object.entries(COACH_VIEWS).map(([v, [t, ic]]) => `<a href="#/${v}" data-cnav="${v}">${IC[ic]}<span>${t.split(' ')[0]}</span></a>`).join('')}</nav></div>`);
  }
  coachDraw();
  if (!COACH.loaded && !COACH.loading) coachLoad().then(coachDraw);
}
function coachDraw() {
  if (UI.screen !== 'coach') return;
  const v = UI.coachView;
  $$('[data-cnav]').forEach(a => a.dataset.cnav === (v === 'student' ? 'students' : v) ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  const open = COACH.pending.filter(x => !x.review).length;
  $$('#v-badge').forEach(b => b.innerHTML = open ? `<span class="pill acc">${open}</span>` : '');
  $('#pg-title').textContent = v === 'student' ? 'Student' : COACH_VIEWS[v][0];
  document.title = ($('#pg-title').textContent) + ' · Pulse Coach';
  const c = $('#main');
  c.innerHTML = !COACH.loaded ? `<div class="empty" style="padding:80px 8px"><span class="spin lg"></span><h4>Loading your students…</h4></div>`
    : COACH.err ? `<div class="card"><div class="empty"><div class="glyph">${IC.alert}</div><h4>Could not load</h4><p>${esc(COACH.err)}</p><div class="acts"><button class="btn btn-primary btn-sm" data-act="coach-reload">Try again</button></div></div></div>`
    : ({ students: coachStudents, student: coachStudent, verify: coachVerify, account: coachAccount }[v])();
  animateIn(c); bindChartTips(c);
}
function coachStudents() {
  const u = Cloud.user, f = COACH.f, all = COACH.roster;
  const list = all.filter(d => (f.sport === 'all' || d.sports.includes(f.sport)) && (f.grade === 'all' || d.grade === f.grade) && (!f.q || d.name.toLowerCase().includes(f.q.toLowerCase())));
  const onTrack = all.filter(d => d.weight.status === 'on-track').length, attn = all.filter(d => d.flags.length).length;
  const avgAd = all.length ? Math.round(all.reduce((t, d) => t + d.adherence, 0) / all.length) : 0;
  const grades = [...new Set(all.map(d => d.grade).filter(Boolean))].sort((a, b) => a - b);
  const open = COACH.pending.filter(x => !x.review).length;
  return `<div class="ph"><div><div class="label">${esc(Cloud.schoolName(u.school))}</div><h2 style="margin-top:8px">Your <em>athletes.</em></h2><p>${(u.sports || []).map(s => s === 'general' ? 'PE' : SPORTS[s].split(' (')[0]).join(', ')} · students who play these sports and have shared with Pulse.</p></div>
      ${open ? `<div class="ph-actions"><a class="btn btn-accent" href="#/verify">${IC.shield}${plural(open, 'note')} to verify</a></div>` : ''}</div>
    <div class="stats stagger" style="margin-bottom:16px">
      <div><span class="label">Students</span><b>${all.length}</b><span class="delta">across your sports</span></div>
      <div><span class="label">Sessions done</span><b>${avgAd}<small>%</small></b><span class="delta">average, last 4 weeks</span></div>
      <div><span class="label">On track</span><b>${onTrack}<small>/ ${all.length}</small></b><span class="delta">weight moving with goal</span></div>
      <div><span class="label">Need a check-in</span><b>${attn}</b><span class="delta ${attn ? 'hot' : ''}">with at least one flag</span></div>
    </div>
    ${all.length ? `<div class="coach-filters"><div class="input-wrap has-ic" style="flex:1;min-width:180px">${IC.search.replace('<svg', '<svg class="prefix-ic"')}<input class="input" type="search" id="cf-q" placeholder="Search students" value="${esc(f.q)}"></div>
      <div class="chips">${['all', ...(u.sports || [])].map(s => `<button class="chip sm" data-act="cf-sport" data-v="${s}" aria-pressed="${f.sport === s}">${s === 'all' ? 'All sports' : s === 'general' ? 'PE' : esc(SPORTS[s].split(' (')[0])}</button>`).join('')}</div>
      ${grades.length > 1 ? `<select class="input" id="cf-grade" style="width:auto"><option value="all">All grades</option>${grades.map(g => `<option value="${g}" ${f.grade === g ? 'selected' : ''}>Grade ${g}</option>`).join('')}</select>` : ''}</div>
      <div class="stu-grid">${list.map(d => studentCard(d, { link: true })).join('') || `<div class="card c-12"><div class="empty"><h4>No students match</h4><p>Try a different filter.</p></div></div>`}</div>`
    : `<div class="card"><div class="empty"><div class="glyph">${IC.coach}</div><h4>No students yet</h4><p>Students appear here once they create a Pulse account, choose ${esc(Cloud.schoolName(u.school))} and pick a sport you coach. Share the app link with your team.</p><div class="acts"><button class="btn btn-ghost btn-sm" data-act="coach-reload">${IC.reset}Check again</button></div></div></div>`}`;
}
function coachStudent() {
  const d = COACH.roster.find(x => x.uid === UI.coachStu);
  if (!d) return `<div class="card"><div class="empty"><h4>Student not found</h4><p>They may have changed school or sport.</p><div class="acts"><a class="btn btn-ghost btn-sm" href="#/students">Back to students</a></div></div></div>`;
  const [k, l] = statusFor(d.goal, d.weight.status), pts = (d.weight.series || []).map(([date, kg]) => ({ date, kg }));
  const pend = COACH.pending.filter(x => x.stu.uid === d.uid);
  return `<div class="ph"><div class="prof-head"><span class="avatar">${esc(initials(d.name))}</span><div><h2>${esc(d.name)}</h2><p style="margin-top:2px">${d.grade ? 'Grade ' + esc(d.grade) + ' · ' : ''}${d.age} yrs · ${esc(GOALS[d.goal].label)} · ${esc(d.sports.map(s => s === 'general' ? 'PE' : SPORTS[s].split(' (')[0]).join(', '))}</p></div></div>
      <div class="ph-actions"><a class="btn btn-ghost btn-sm" href="#/students">${IC.back}All students</a></div></div>
    <div class="stats stagger" style="margin-bottom:16px">
      <div><span class="label">This week</span><b>${d.weeks[3].done}<small>/ ${d.planned}</small></b><span class="delta">sessions</span></div>
      <div><span class="label">Last 4 weeks</span><b>${d.adherence}<small>%</small></b><span class="delta">of planned sessions</span></div>
      <div><span class="label">Avg effort</span><b>${d.avgRpe != null ? fmt1(d.avgRpe) : '–'}<small>RPE</small></b><span class="delta">last 6 sessions</span></div>
      <div><span class="label">Streak</span><b>${d.streak}<small>wks</small></b><span class="delta">full weeks in a row</span></div>
    </div>
    <div class="dash">
      <section class="card c-7"><div class="card-h"><h3>Weigh-ins</h3><span class="pill ${k}">${l}</span></div><div class="card-b">${pts.length > 1 ? weightChartSVG(pts) : `<div class="empty" style="padding:24px 8px"><div class="glyph">${IC.scale}</div><h4>Not enough weigh-ins</h4><p>Pulse reminds students to weigh in every week.</p></div>`}
        <p class="muted" style="font-size:13px;margin-top:12px">${d.weight.kgWeek != null ? `${d.weight.kgWeek >= 0 ? '+' : ''}${fmt1(d.weight.kgWeek)} kg a week (${d.weight.rate >= 0 ? '+' : ''}${fmt1(d.weight.rate)}% of body weight). ` : ''}${d.weight.lastDate ? 'Last weigh-in ' + fmtDate(parseIso(d.weight.lastDate)) + '.' : ''}</p>
        ${d.lastAdjust ? `<div class="acwr" style="margin-top:12px">${IC.target.replace('<svg', '<svg width="20" height="20"')}<p><b>Plan adjusted ${fmtDate(parseIso(d.lastAdjust.date))}.</b> ${esc(d.lastAdjust.text)}</p></div>` : ''}</div></section>
      <section class="card c-5"><div class="card-h"><h3>Sessions per week</h3><span class="label">Planned ${d.planned}</span></div><div class="card-b"><div class="wk-bars">${d.weeks.map(w => `<div><i style="height:${clamp(w.done / d.planned, 0, 1.2) * 100}%" class="${w.done >= d.planned ? 'full' : ''}"></i><b>${w.done}</b><span>${esc(w.label)}</span></div>`).join('')}</div></div></section>
      <section class="card c-6"><div class="card-h"><h3>Daily habits</h3><span class="label">Last 7 days</span></div><div class="card-b"><div class="macros">${[['Water vs target', d.water], ['Protein vs target', d.protein], ['Readiness', d.readiness]].map(([n, v]) => `<div class="macro"><div class="top"><b>${n}</b><span><strong>${v != null ? v : '–'}</strong>${v != null ? (n === 'Readiness' ? ' / 100' : '%') : ''}</span></div>${bar(v || 0, 100, n === 'Water vs target' ? 'acc' : '')}</div>`).join('')}</div>${d.acwr ? `<p class="muted" style="font-size:12.5px;margin-top:14px">Acute : chronic load ${fmt1(d.acwr)}${d.acwr > 1.5 ? ' · spike, injury risk is higher this week' : ''}</p>` : ''}</div></section>
      <section class="card c-6"><div class="card-h"><h3>Flags and supplements</h3></div><div class="card-b">
        <div class="stu-flags" style="margin:0 0 14px">${d.flags.length ? d.flags.map(f => `<span class="pill warn">${esc(f)}</span>`).join('') : `<span class="pill good">No concerns</span>`}</div>
        ${d.supps.length ? `<ul class="supp-list">${d.supps.map(s => { const p = pend.find(x => x.s.id === s.id), st = p && p.review ? (p.review.decision === 'approve' ? ['good', 'Verified by ' + p.review.byName] : ['bad', 'Declined by ' + p.review.byName]) : SUPP_STATUS[s.status]; return `<li><span class="supp-ic">${IC.pill}</span><div><div class="nm">${esc(s.name)}</div></div><span class="pill ${st[0]}">${esc(st[1])}</span>${p && !p.review ? `<button class="btn btn-primary btn-sm" data-act="coach-review" data-id="${s.id}">Review note</button>` : ''}</li>`; }).join('')}</ul>` : '<p class="muted" style="font-size:13.5px">No supplements.</p>'}</div></section>
      <p class="muted c-12" style="font-size:12.5px">Coaches see progress summaries only. ${esc(d.name)}’s food log, meal plan and exercise details stay private. Updated ${fmtDate(new Date(d.updatedAt))}.</p>
    </div>`;
}
function coachVerify() {
  const open = COACH.pending.filter(x => !x.review), done = COACH.pending.filter(x => x.review);
  const row = x => `<li><span class="supp-ic">${IC.pill}</span><div style="min-width:0"><div class="nm">${esc(x.s.name)} · ${esc(x.stu.name)}</div><div class="mac">${x.stu.grade ? 'Grade ' + esc(x.stu.grade) + ' · ' : ''}${x.stu.age} yrs · sent ${x.s.sentAt ? fmtDate(new Date(x.s.sentAt)) : ''}${x.review ? ` · ${x.review.decision === 'approve' ? 'verified' : 'declined'} by ${esc(x.review.byName)}` : ''}</div></div>${x.review ? `<span class="pill ${x.review.decision === 'approve' ? 'good' : 'bad'}">${x.review.decision === 'approve' ? 'Verified' : 'Declined'}</span>` : `<button class="btn btn-primary btn-sm" data-act="coach-review" data-id="${x.s.id}">Review note</button>`}</li>`;
  return `<div class="ph"><div><div class="label">Supplements for under-18s</div><h2 style="margin-top:8px">Verify <em>doctors’ notes.</em></h2><p>Students under 18 need a doctor’s note before Pulse adds supplements that can have side effects. Any coach for one of their sports can check it. Once one coach decides, the request is closed.</p></div></div>
    <div class="dash"><section class="card c-12"><div class="card-h"><h3>Waiting for you</h3><span class="pill ${open.length ? 'acc' : ''}">${open.length}</span></div><div class="card-b">${open.length ? `<ul class="supp-list">${open.map(row).join('')}</ul>` : `<p class="muted" style="font-size:13.5px">Nothing to check right now.</p>`}</div></section>
    ${done.length ? `<section class="card c-12"><div class="card-h"><h3>Recently decided</h3><span class="label">Waiting for the student’s app to update</span></div><div class="card-b"><ul class="supp-list">${done.map(row).join('')}</ul></div></section>` : ''}</div>`;
}
function coachAccount() {
  const u = Cloud.user;
  return `<div class="ph"><div class="prof-head"><span class="avatar">${esc(initials(u.name))}</span><div><h2>${esc(u.name)}</h2><p style="margin-top:2px">${esc(u.email)} · ${esc(Cloud.schoolName(u.school))}</p></div></div></div>
    <div class="dash"><section class="card c-7"><div class="card-h"><h3>Sports you coach</h3><span class="label">Students who play these appear on your list</span></div><div class="card-b"><div class="chips">${[['general', 'PE / general fitness'], ...Object.entries(SPORTS)].map(([v, l]) => `<button class="chip" data-act="coach-sport" data-v="${v}" aria-pressed="${(u.sports || []).includes(v)}"><span class="ck">${IC.check}</span>${esc(l.split(' (')[0])}</button>`).join('')}</div></div></section>
      <section class="card c-5"><div class="card-h"><h3>Account</h3></div><div class="card-b settings">
        <div class="set-row"><div><b>Appearance</b><span>Light or dark</span></div><button class="btn btn-ghost btn-sm" data-act="theme">${isDark() ? IC.sun : IC.moon}Switch</button></div>
        <div class="set-row"><div><b>Sign out</b><span>On this device</span></div><button class="btn btn-ghost btn-sm" data-act="sign-out">${IC.logout}Sign out</button></div></div></section>
      <p class="muted c-12" style="font-size:12.5px;max-width:60em">You see progress summaries for students at your school who play a sport you coach. Their food logs, meal plans and exercise details are not shared. Verifying a doctor’s note confirms you have seen a genuine note; it is not medical advice.</p></div>`;
}
function reviewModal(id) {
  const x = COACH.pending.find(p => p.s.id === id); if (!x) return;
  const m = openModal({
    title: `${esc(x.s.name)} for ${esc(x.stu.name)}`, sub: `${x.stu.age} years old · ${x.stu.grade ? 'grade ' + esc(x.stu.grade) : ''}`, size: 640,
    body: `<div id="rv-body"><div class="empty" style="padding:40px 8px"><span class="spin lg"></span><p>Loading the note…</p></div></div>`,
    actions: [{ label: 'Decline', kind: 'btn-ghost', fn: api => decide(api, 'decline') }, { label: 'Verify note', kind: 'btn-primary', fn: api => decide(api, 'approve') }],
    async onOpen(el) {
      let n = null; try { n = await Cloud.getNote(id); } catch (e) {}
      $('#rv-body', el).innerHTML = n ? `<div class="note-view"><a href="${n.image}" target="_blank" rel="noopener" class="note-img"><img src="${n.image}" alt="Doctor’s note"></a>
        <dl class="kv" style="padding-top:0">${[['Doctor', n.doctor], ['Date on note', n.date ? fmtDate(parseIso(n.date)) : '–'], ['Dose', n.dose || 'Not given'], ['Supplement', n.supplement]].map(([a, b]) => `<div><span>${a}</span><span>${esc(b)}</span></div>`).join('')}</dl></div>
        <div class="field" style="margin-top:14px"><label for="rv-c">Note to the student <span class="hint">Required if you decline</span></label><textarea class="input" id="rv-c" rows="2" maxlength="200" placeholder="e.g. Note is unsigned, please ask your doctor to sign it"></textarea></div>
        <p class="muted" style="font-size:12.5px;margin-top:10px">Verify only if the note looks genuine, names this supplement and is recent. If anything is unclear, decline and say why.</p><span class="error" id="rv-err" hidden></span>`
        : `<div class="empty"><h4>Note not found</h4><p>The student may have withdrawn the request.</p></div>`;
    }
  });
  async function decide(api, decision) {
    const c = ($('#rv-c', api.el) || {}).value || '', er = $('#rv-err', api.el);
    if (decision === 'decline' && !c.trim()) { er.hidden = false; er.innerHTML = IC.alert + 'Tell the student why, so they can fix it.'; $('#rv-c', api.el).focus(); return false; }
    try {
      const n = await Cloud.getNote(id);
      await Cloud.putReview(id, { uid: x.stu.uid, school: n ? n.school : x.stu.school, sports: n ? n.sports : x.stu.sports, decision, comment: c.trim(), supplement: x.s.name, studentName: x.stu.name });
      x.review = { decision, byName: Cloud.user.name, at: Date.now() };
      coachDraw(); toast(decision === 'approve' ? `<b>Verified.</b> ${esc(x.stu.name)} will see it next time they open Pulse.` : 'Declined. The student will see your note.', { icon: IC.shield });
    } catch (e) { if (er) { er.hidden = false; er.innerHTML = IC.alert + esc(e.message || 'Could not save. Try again.'); } return false; }
  }
  return m;
}

Object.assign(ACT, {
  'weigh-snooze': () => { S.weighSnooze = today(); save(); refresh(); toast('Pulse will remind you tomorrow.'); },
  'adjust-seen': () => { const a = S.adjust[S.adjust.length - 1]; if (a) a.seen = true; save(); refresh(); },
  'coach-reload': () => coachRefresh(),
  'cf-sport': el => { COACH.f.sport = el.dataset.v; coachDraw(); },
  'coach-review': el => reviewModal(el.dataset.id),
  'coach-sport': async el => {
    const u = Cloud.user, v = el.dataset.v, sp = (u.sports || []).slice(), i = sp.indexOf(v);
    if (i >= 0) { if (sp.length === 1) { toast('Keep at least one sport.', { type: 'err' }); return; } sp.splice(i, 1); } else sp.push(v);
    try { await Cloud.updateProfile({ sports: sp }); el.setAttribute('aria-pressed', i < 0); COACH.loaded = false; coachLoad(); toast('Sports updated.'); } catch (e) { toast(e.message, { type: 'err' }); }
  }
});
document.addEventListener('input', e => { if (e.target.id === 'cf-q') { COACH.f.q = e.target.value; const pos = e.target.selectionStart; coachDraw(); const i = $('#cf-q'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } } });
document.addEventListener('change', e => { if (e.target.id === 'cf-grade') { COACH.f.grade = e.target.value; coachDraw(); } });
