/* =========================================================
   PULSE — smarter training
   · automatic progression: the next weight comes from how the last session went
   · pain-aware swaps: tell Pulse something hurts and it plans around that area for two weeks
   · guided warm-up and cool-down timers
   · missed a day? make it up, make it lighter, or skip it
   ========================================================= */

/* ---------- automatic progression ---------- */
const hist = name => S.log.sessions.filter(s => s.kg && +s.kg[name] > 0);
/* what to lift next, with the reason in plain words. Null when there is nothing to go on yet. */
function progressionFor(e) {
  if (!isLoaded(e)) return null;
  const h = hist(e.n); if (!h.length) return null;
  const l = h[h.length - 1], kg = +l.kg[e.n], p = h[h.length - 2], big = COMPOUND.has(e.pat), step = big ? 2.5 : 1;
  const full = l.done >= l.total, snap = x => Math.round(x * 2) / 2;
  if (p && l.rpe >= 9 && p.rpe >= 9) return { kind: 'down', kg: snap(kg * 0.9), note: `Your last two sessions felt very hard (RPE ${p.rpe} and ${l.rpe}). A lighter ${snap(kg * 0.9)} kg lets you recover and come back stronger.` };
  if (full && l.rpe <= 8) return { kind: 'up', kg: snap(kg + step), note: `You did every set at ${fmt1(kg)} kg last time and it felt manageable (RPE ${l.rpe}). Try ${fmt1(snap(kg + step))} kg.` };
  if (!full) return { kind: 'hold', kg, note: `You did ${l.done} of ${l.total} sets last time. Repeat ${fmt1(kg)} kg and finish every set before going heavier.` };
  return { kind: 'hold', kg, note: `Last time at ${fmt1(kg)} kg was hard (RPE ${l.rpe}). Repeat it and aim to feel it is easier before going up.` };
}
const progNote = e => { const g = progressionFor(e); return g ? `<div class="prog ${g.kind}">${g.kind === 'up' ? '▲' : g.kind === 'down' ? '▼' : '='} <b>${fmt1(g.kg)} kg suggested.</b> ${esc(g.note)}</div>` : ''; };

/* ---------- pain flags ---------- */
const PAIN_AREAS = { knee: 'Knee', shoulder: 'Shoulder', back: 'Lower back', ankle: 'Ankle or foot', wrist: 'Wrist or hand', hamstring: 'Hamstring' };
const PAIN_DAYS = 14;
function painActive() { return Object.entries((S && S.painFlags) || {}).filter(([, d]) => dayDiff(parseIso(d), new Date()) <= PAIN_DAYS).map(([area, date]) => ({ area, date })); }
function painBanner() {
  const act = painActive(); if (!act.length) return '';
  return `<div class="card" style="margin-bottom:16px"><div class="acct"><span class="acct-ic">${IC.alert}</span><div><b>Pulse is planning around: ${act.map(a => PAIN_AREAS[a.area].toLowerCase()).join(', ')}</b><p>Exercises that load ${act.length > 1 ? 'those areas' : 'that area'} are swapped out for ${PAIN_DAYS} days. If pain lasts or gets worse, see a doctor or physio and tell your coach.</p></div><div class="acct-acts">${act.map(a => `<button class="btn btn-ghost btn-sm" data-act="pain-clear" data-a="${a.area}">Clear ${PAIN_AREAS[a.area].toLowerCase()}</button>`).join('')}</div></div></div>`;
}
function painModal(key) {
  const sess = activeSession(), e = sess && sess.exs.find(x => x.key === key); if (!e) return;
  let pick = '';
  openModal({
    title: `Something hurts during ${e.n}?`, sub: 'Stop the set. Pulse swaps this exercise and plans around that area for two weeks. This is not a diagnosis.',
    body: `<div class="chips" id="pn-ch">${Object.entries(PAIN_AREAS).map(([k, l]) => `<button type="button" class="chip" data-pn="${k}" aria-pressed="false">${l}</button>`).join('')}</div><span class="error" id="pn-err" hidden></span><p class="muted" style="font-size:13px;margin-top:12px">Sharp, sudden or lasting pain needs a doctor or physio. Your coaches can see that you flagged it.</p>`,
    onOpen(el) { el.querySelectorAll('[data-pn]').forEach(b => b.addEventListener('click', () => { pick = b.dataset.pn; el.querySelectorAll('[data-pn]').forEach(x => x.setAttribute('aria-pressed', x === b)); })); },
    actions: [{ label: 'Cancel' }, { label: 'Swap it', kind: 'btn-primary', fn: api => {
      if (!pick) { const er = $('#pn-err', api.el); er.hidden = false; er.innerHTML = IC.alert + 'Pick where it hurts.'; return false; }
      const before = e.n; S.painFlags = S.painFlags || {}; S.painFlags[pick] = today();
      S.painLog = (S.painLog || []).concat([{ date: today(), area: pick, ex: before }]).slice(-20);
      const now = activeSession(), after = now && now.exs.find(x => x.key === key);
      save(); const y = scrollY; refresh(); window.scrollTo(0, y);
      toast(after && after.n !== before ? `<b>Swapped ${esc(before)} for ${esc(after.n)}.</b> Pulse will avoid ${PAIN_AREAS[pick].toLowerCase()} for ${PAIN_DAYS} days.` : `Noted. Pulse will avoid ${PAIN_AREAS[pick].toLowerCase()} exercises for ${PAIN_DAYS} days. Skip ${esc(before)} if it still hurts.`, { ms: 8000 });
    } }]
  });
}

/* ---------- guided warm-up and cool-down ---------- */
const WARM = [['Raise: easy jog, skips or bike', 120, 'Get warm and breathing a little harder.'], ['Glute bridge', 45, 'Squeeze at the top. 10 slow reps.'], ['Band pull-apart', 45, 'Pull to your chest, shoulder blades together.'], ['World’s greatest stretch', 60, 'Each side. Hips low, rotate and reach.'], ['Bodyweight squat to stand', 45, 'Hands on toes, sit deep, chest up.'], ['Potentiate: 2 fast reps of your first lift', 30, 'Light weight, move it fast and crisp.']];
const COOL = [['Walk it off', 120, 'Slow walk, long breaths in through the nose.'], ['Couch stretch', 90, 'Each side, 45 seconds. Squeeze the glute.'], ['Hamstring stretch', 60, 'Each leg 30 seconds. Soft knee, tall back.'], ['Thoracic open book', 60, 'Each side. Follow your hand with your eyes.'], ['Child’s pose and slow breathing', 90, 'Breathe out longer than you breathe in.']];
let RT = null;
function routine(kind) {
  const steps = kind === 'cool' ? COOL : WARM, total = steps.reduce((t, s) => t + s[1], 0);
  RT = { kind, steps, i: 0, left: steps[0][1], run: false, t: null };
  const draw = () => {
    const box = $('#rt-box'); if (!box) { clearInterval(RT && RT.t); return; }
    const s = RT.steps[RT.i], done = RT.i >= RT.steps.length;
    box.innerHTML = done ? `<div class="empty" style="padding:20px 8px"><div class="glyph">${IC.check}</div><h4>${kind === 'cool' ? 'Cooled down' : 'Warmed up'}</h4><p>${kind === 'cool' ? 'Eat, drink and sleep well tonight.' : 'You are ready. Start your first set.'}</p></div>`
      : `<div class="label">Step ${RT.i + 1} of ${RT.steps.length}</div><h3 style="margin:6px 0">${esc(s[0])}</h3><p class="muted">${esc(s[2])}</p>
        <div class="fr-code" id="rt-time" style="margin:16px 0" aria-live="off">${mmss(RT.left)}</div>
        <div class="live-progress"><i style="width:${(1 - RT.left / s[1]) * 100}%"></i></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn btn-primary" data-rt="go">${RT.run ? 'Pause' : 'Start'}</button><button class="btn btn-ghost" data-rt="skip">Next step</button></div>`;
    box.querySelectorAll('[data-rt]').forEach(b => b.addEventListener('click', () => { if (b.dataset.rt === 'go') RT.run = !RT.run; else { RT.i++; if (RT.i < RT.steps.length) RT.left = RT.steps[RT.i][1]; } draw(); }));
  };
  openModal({ title: kind === 'cool' ? 'Cool-down' : 'Guided warm-up', sub: `${Math.round(total / 60)} minutes, ${steps.length} steps. Pulse counts it down for you.`, body: '<div id="rt-box"></div>', actions: [{ label: 'Close' }], onOpen() {
    draw();
    RT.t = setInterval(() => {
      if (!$('#rt-box')) { clearInterval(RT.t); return; }
      if (!RT.run || RT.i >= RT.steps.length) return;
      RT.left--; if (RT.left <= 0) { if (navigator.vibrate) navigator.vibrate([60, 40, 60]); RT.i++; if (RT.i < RT.steps.length) RT.left = RT.steps[RT.i][1]; RT.run = RT.i < RT.steps.length; draw(); }
      else { const t = $('#rt-time'); if (t) t.textContent = mmss(RT.left); const bar = $('#rt-box .live-progress i'); if (bar) bar.style.width = (1 - RT.left / RT.steps[RT.i][1]) * 100 + '%'; }
    }, 1000);
  } });
}
const routineBtns = () => `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-ghost btn-sm" data-act="rt-warm">${IC.clock}Guided warm-up</button><button class="btn btn-ghost btn-sm" data-act="rt-cool">${IC.clock}Cool-down timer</button></div>`;

/* ---------- missed days ---------- */
/* planned days since the plan began (last 7 days) with nothing logged, that the athlete has not already moved or skipped */
function missedDays() {
  if (!S || !S.profile || S.sample) return [];
  const days = trainingDays(S.profile), mv = S.moves || {}, out = [], start = startOf(S.profile);
  for (let i = 1; i <= 7; i++) {
    const d = addDays(new Date(), -i); d.setHours(0, 0, 0, 0); const ds = iso(d);
    if (d < start || !days.includes(wd(d)) || mv[ds]) continue;
    if (S.log.sessions.some(x => x.date === ds || x.from === ds)) continue;
    // a session done later in the same week counts as made up if the week still has its planned total
    const wk = weekStart(d), planned = days.length;
    if (weekDone(wk) >= planned) continue;
    const mdl = sessionFor(d); if (mdl) out.push({ ds, date: d, name: mdl.name });
  }
  return out.reverse();
}
const missedCard = () => { const m = missedDays(); return m.length ? `<section class="card c-12"><div class="acct"><span class="acct-ic">${IC.alert}</span><div><b>You missed ${m.length === 1 ? m[0].name : m.length + ' sessions'}</b><p>No stress. Make it up, do a lighter version, or skip it, and Pulse adjusts your week.</p></div><div class="acct-acts"><a class="btn btn-primary" href="#/missed">Sort my week</a></div></section>` : ''; };
function makeUpSlots() {
  const days = trainingDays(S.profile), mv = S.moves || {}, taken = new Set(Object.values(mv).map(x => x && x.to).filter(Boolean)), out = [];
  for (let i = 0; i <= 6; i++) { const d = addDays(new Date(), i); d.setHours(0, 0, 0, 0); const ds = iso(d); if (days.includes(wd(d)) || taken.has(ds) || S.log.sessions.some(x => x.date === ds)) continue; out.push({ ds, d }); }
  return out;
}
const MS = { sel: null, text: '', reply: '' };
VIEWS.missed = () => {
  const m = missedDays(), slots = makeUpSlots();
  const head = `<div class="ph"><div><div class="label">Plan changes</div><h2 style="margin-top:8px">Missed a <em>day?</em></h2><p>Pick what you want to do. You can also tell Pulse in your own words.</p></div></div>`;
  if (!m.length) return `${head}<div class="card"><div class="empty"><div class="glyph">${IC.check}</div><h4>Nothing missed</h4><p>You are up to date. Come back here if a session slips.</p><div class="acts"><a class="btn btn-primary btn-sm" href="#/today">Back to today</a></div></div></div>`;
  const sel = m.find(x => x.ds === MS.sel) || m[m.length - 1];
  return `${head}<div class="dash">
    <section class="card c-5"><div class="card-h"><h3>Which session?</h3></div><div class="card-b"><div class="opt-list" role="radiogroup">${m.map(x => `<button type="button" class="opt" role="radio" data-act="ms-pick" data-d="${x.ds}" aria-checked="${x.ds === sel.ds}"><span class="rad"></span><span><b>${esc(x.name)}</b><span class="d">${DAYS_L[wd(x.date)]} ${fmtDate(x.date)}</span></span><span></span></button>`).join('')}</div></div></section>
    <section class="card c-7"><div class="card-h"><h3>What do you want to do with ${esc(sel.name)}?</h3></div><div class="card-b">
      ${slots.length ? `<p class="label" style="margin-bottom:8px">Make it up on a rest day</p><div class="chips">${slots.map(s => `<button class="chip" data-act="ms-move" data-d="${sel.ds}" data-to="${s.ds}">${DAYS[wd(s.d)]} ${s.d.getDate()}</button>`).join('')}</div>
      <p class="label" style="margin:14px 0 8px">Or a lighter version (one set fewer, a little easier)</p><div class="chips">${slots.map(s => `<button class="chip" data-act="ms-move" data-d="${sel.ds}" data-to="${s.ds}" data-light="1">${DAYS[wd(s.d)]} ${s.d.getDate()} · lighter</button>`).join('')}</div>` : `<p class="muted" style="font-size:14px">There is no free rest day in the next week, so Pulse cannot fit a make-up session in without doubling up. You can still skip it.</p>`}
      <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost" data-act="ms-skip" data-d="${sel.ds}">${IC.skip}Skip it, carry on</button></div>
      <form class="ask-in" id="ms-form" style="margin-top:18px" novalidate><input class="input" id="ms-text" maxlength="200" placeholder="Or say it: “make it up Saturday”, “just skip it”" value="${esc(MS.text)}"><button class="btn btn-primary">Ask Pulse</button></form>
      ${MS.reply ? `<p style="margin-top:12px" role="status">${MS.reply}</p>` : ''}
      <p class="muted" style="font-size:12.5px;margin-top:12px">Pulse never stacks two hard sessions on one day. Skipping once does not hurt your progress.</p></div></section></div>`;
};
function msApply(ds, to, light) {
  S.moves = S.moves || {}; S.moves[ds] = to === 'skip' ? { skip: true, at: Date.now() } : { to, light: !!light, at: Date.now() };
  save();
}
function msParse(txt) {
  const t = txt.toLowerCase(), m = missedDays(); if (!m.length) return 'You have nothing missed.';
  const sel = m.find(x => x.ds === MS.sel) || m[m.length - 1], slots = makeUpSlots();
  if (/\b(skip|forget|ignore|drop|leave it|no need)\b/.test(t)) { msApply(sel.ds, 'skip'); return `Skipped ${esc(sel.name)}. Your plan carries on as normal.`; }
  const light = /\b(light|lighter|easy|easier|short|shorter|gentle|tired|sore)\b/.test(t);
  const names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], dayHit = names.findIndex(n => t.includes(n) || t.includes(n.slice(0, 3)));
  const wantsMake = /\b(make|catch|replace|do it|redo|add)\b/.test(t) || dayHit >= 0 || light;
  if (wantsMake) {
    const pick = dayHit >= 0 ? slots.find(s => wd(s.d) === dayHit) : slots[0];
    if (!pick) return dayHit >= 0 ? `${DAYS_L[dayHit]} is already a training day or taken. Try one of the rest days above.` : 'There is no free rest day in the next week, so I cannot fit it in without doubling up. I can skip it instead.';
    msApply(sel.ds, pick.ds, light); return `Done. ${esc(sel.name)} is now ${light ? 'a lighter session' : 'a session'} on <b>${DAYS_L[wd(pick.d)]} ${fmtDate(pick.d)}</b>.`;
  }
  return 'I can make it up on a rest day, make it lighter, or skip it. Try “make it up Saturday” or “skip it”.';
}

/* sessionFor, extended: a missed session that was moved lands on its new day, and a lighter one has an easier set count */
const _sessionFor = sessionFor;
sessionFor = function (dateObj) {
  const own = _sessionFor(dateObj), mv = (S && S.moves) || {};
  if (own) return own;
  const ds = iso(dateObj), from = Object.keys(mv).find(k => mv[k] && mv[k].to === ds && !S.log.sessions.some(x => x.from === k));
  if (!from) return null;
  const orig = _sessionFor(parseIso(from)); if (!orig) return null;
  if (mv[from].light) { orig.exs = orig.exs.map(e => Object.assign({}, e, { sets: Math.max(2, e.sets - 1), rpe: Math.max(5, e.rpe - 1) })); orig.name += ' (lighter)'; orig.mins = Math.max(20, orig.mins - 8); }
  orig.movedFrom = from; return orig;
};

Object.assign(ACT, {
  pain: el => painModal(el.dataset.key),
  'pain-clear': el => { if (S.painFlags) { delete S.painFlags[el.dataset.a]; save(); refresh(); toast('Cleared. Pulse can use those exercises again.'); } },
  'rt-warm': () => routine('warm'), 'rt-cool': () => routine('cool'),
  'ms-pick': el => { MS.sel = el.dataset.d; MS.reply = ''; refresh(); },
  'ms-move': el => { msApply(el.dataset.d, el.dataset.to, el.dataset.light === '1'); MS.reply = ''; toast('Plan updated.'); refresh(); },
  'ms-skip': el => { msApply(el.dataset.d, 'skip'); toast('Skipped. Carry on.'); refresh(); }
});
document.addEventListener('submit', e => { if (e.target.id !== 'ms-form') return; e.preventDefault(); const v = $('#ms-text').value.trim(); if (!v) return; MS.text = ''; MS.reply = msParse(v); refresh(); });
const _viewSession = VIEWS.session;
VIEWS.session = () => (S.active ? '' : painBanner()) + _viewSession();
