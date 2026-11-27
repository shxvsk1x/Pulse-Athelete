/* =========================================================
   PULSE — habits: daily streak, more badges, reminders, calendar file, backups
   ========================================================= */

/* ---------- daily streak ---------- */
/* a day counts when you logged anything: a session, food, water, a check-in or a weigh-in. Rest days still count if you logged food or water. */
function activeDates(st = S) {
  const set = new Set(st.log.sessions.map(x => x.date));
  Object.entries(st.log.food || {}).forEach(([d, v]) => { if (v && v.length) set.add(d); });
  Object.entries(st.log.water || {}).forEach(([d, v]) => { if (v && (Array.isArray(v) ? v.length : +v > 0)) set.add(d); });
  Object.keys(st.log.check || {}).forEach(d => set.add(d));
  (st.log.weight || []).forEach(w => set.add(w.date));
  return set;
}
function dayStreak(st = S) {
  const act = activeDates(st); let n = 0;
  for (let i = 0; i < 400; i++) { const d = iso(addDays(new Date(), -i)); if (act.has(d)) n++; else if (i === 0) continue; else break; }
  return n;
}
function bestStreak(st = S) {
  const act = [...activeDates(st)].sort(); let best = 0, run = 0, prev = null;
  act.forEach(d => { run = prev && dayDiff(parseIso(prev), parseIso(d)) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  return best;
}
const NEXT_STREAK = [3, 7, 14, 30, 60, 100];
function streakCard() {
  if (!S || S.sample) return '';
  const n = dayStreak(), act = activeDates(), next = NEXT_STREAK.find(x => x > n);
  const dots = [...Array(14)].map((_, i) => { const d = iso(addDays(new Date(), -(13 - i))); return `<i class="${act.has(d) ? 'on' : ''}" title="${act.has(d) ? 'Logged' : 'Nothing logged'}"></i>`; }).join('');
  return `<section class="card card-pad c-12"><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><div style="min-width:120px"><span class="label">Daily streak</span><div style="font:700 34px var(--mono,monospace);line-height:1.1">${n}<small style="font-size:14px;margin-left:4px">${n === 1 ? 'day' : 'days'}</small></div></div>
    <div style="flex:1;min-width:200px"><div class="fr-strip" role="img" aria-label="Last 14 days">${dots}</div><p class="muted" style="font-size:13px">${n === 0 ? 'Log a meal, water or a session today to start a streak.' : next ? `${next - n} more ${next - n === 1 ? 'day' : 'days'} to the ${next}-day badge. Best so far: ${bestStreak()}.` : `Best so far: ${bestStreak()} days. Keep it going.`}</p></div></div></section>`;
}
[
  ['day3', 'Three days', 'Logged something three days in a row', () => dayStreak() >= 3],
  ['day7', 'One week straight', 'A 7-day streak', () => dayStreak() >= 7],
  ['day14', 'Fortnight', 'A 14-day streak', () => dayStreak() >= 14],
  ['day30', 'Thirty days', 'A 30-day streak', () => dayStreak() >= 30],
  ['fifty', 'Fifty sessions', '50 sessions logged', st => st.log.sessions.length >= 50],
  ['weeks4', 'Month of weeks', 'Four full weeks back to back', () => weekStreak() >= 4],
  ['comeback', 'Comeback', 'Trained within two days of a missed session', st => (st.moves && Object.values(st.moves).some(m => m && m.to && st.log.sessions.some(x => x.date === m.to)))],
  ['timed', 'Real work', 'Timed 50 sets', st => st.log.sessions.reduce((t, x) => t + ((x.setLog || []).length), 0) >= 50],
  ['mealpic', 'Show your plate', 'Photo-logged 10 meals', st => (st.mealPhotoCount || 0) >= 10]
].forEach(m => MILESTONES.push(m));

/* ---------- reminders (this device) ---------- */
const REM_KEY = 'pulse.rem';
const REM_DEFAULT = { on: false, train: '17:00', food: '20:30', weigh: '08:00', fired: {} };
const remGet = () => Object.assign({}, REM_DEFAULT, (() => { try { return JSON.parse(localStorage.getItem(REM_KEY)) || {}; } catch (e) { return {}; } })());
const remSet = r => { try { localStorage.setItem(REM_KEY, JSON.stringify(r)); } catch (e) {} };
const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
function remNotify(r, key, title, body) {
  const ds = today(); if (r.fired[key] === ds) return;
  r.fired[key] = ds; remSet(r);
  try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title, { body, tag: 'pulse-' + key, icon: 'favicon.ico' }); } catch (e) {}
  toast(`<b>${esc(title)}</b> ${esc(body)}`, { icon: IC.bell, ms: 9000 });
}
function remCheck() {
  const r = remGet(); if (!r.on || !S || !S.profile || S.sample) return;
  const hm = nowHM(), ds = today(), sess = sessionFor(new Date());
  if (sess && !loggedOn(ds).length && !S.active && hm >= r.train) remNotify(r, 'train', 'Time to train', `${sess.name} is on your plan today.`);
  if (hm >= r.food && !((S.log.food[ds] || []).length)) remNotify(r, 'food', 'Log your food', 'Nothing logged yet today. It takes a minute.');
  const mon = weekStart(new Date()), weighed = S.log.weight.some(w => w.date >= iso(mon));
  if (wd(new Date()) === wd(startOf(S.profile)) && !weighed && hm >= r.weigh) remNotify(r, 'weigh', 'Weigh-in day', 'Step on the scale and log it so Pulse can check your progress.');
}
setInterval(remCheck, 30000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') remCheck(); });

/* ---------- calendar file: training days as repeating events with an alarm ---------- */
function icsFile() {
  const p = S.profile, r = remGet(), [h, m] = r.train.split(':').map(Number), days = trainingDays(p), BY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  const first = wdi => { let d = new Date(); d.setHours(h, m, 0, 0); while (wd(d) !== wdi) d = addDays(d, 1); return d; };
  const f = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + 'T' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + '00';
  const ev = (uid, d, title, mins, desc) => `BEGIN:VEVENT\r\nUID:${uid}@pulse\r\nDTSTAMP:${f(new Date())}\r\nDTSTART:${f(d)}\r\nDTEND:${f(new Date(d.getTime() + mins * 60000))}\r\nRRULE:FREQ=WEEKLY;COUNT=12\r\nSUMMARY:${title}\r\nDESCRIPTION:${desc}\r\nBEGIN:VALARM\r\nTRIGGER:-PT30M\r\nACTION:DISPLAY\r\nDESCRIPTION:${title}\r\nEND:VALARM\r\nEND:VEVENT`;
  const body = days.map(i => ev('train' + i, first(i), 'Pulse training', +p.minutes || 45, 'Open Pulse for today\\\'s session.')).join('\r\n');
  const ws = new Date(); ws.setHours(8, 0, 0, 0); const weigh = ev('weigh', (() => { let d = ws; while (wd(d) !== wd(startOf(p))) d = addDays(d, 1); return d; })(), 'Pulse weigh-in', 10, 'Log your weight in Pulse.');
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Pulse//EN\r\n${body}\r\n${weigh}\r\nEND:VCALENDAR`;
}

/* ---------- backups and exports ---------- */
const BK = 'pulse.backups';
function autoBackup() {
  if (!REAL || !REAL.profile || (S && S.sample)) return;
  try {
    const all = JSON.parse(localStorage.getItem(BK) || '[]'), last = all[all.length - 1];
    if (last && Date.now() - last.at < 6 * 864e5) return;
    all.push({ at: Date.now(), json: JSON.stringify(REAL) }); while (all.length > 3) all.shift();
    localStorage.setItem(BK, JSON.stringify(all));
  } catch (e) { try { localStorage.removeItem(BK); } catch (x) {} }
}
const backups = () => { try { return JSON.parse(localStorage.getItem(BK) || '[]'); } catch (e) { return []; } };
function csvOf(rows) { return rows.map(r => r.map(x => `"${String(x == null ? '' : x).replace(/"/g, '""')}"`).join(',')).join('\n'); }
function exportCsv() {
  const L = S.log, rows = [['type', 'date', 'name', 'value', 'detail']];
  L.sessions.forEach(s => rows.push(['session', s.date, s.name, `${s.done}/${s.total} sets`, `RPE ${s.rpe}, ${s.mins} min` + Object.entries(s.kg || {}).map(([n, v]) => `; ${n} ${v} kg`).join('')]));
  L.weight.forEach(w => rows.push(['weight', w.date, '', w.kg, 'kg']));
  Object.entries(L.food).forEach(([d, items]) => (items || []).forEach(it => rows.push(['food', d, it.n || it.name || '', it.kcal || '', it.m || ''])));
  Object.entries(L.check || {}).forEach(([d, c]) => rows.push(['check-in', d, '', `sleep ${c.sleep}h`, `soreness ${c.sore}, energy ${c.energy}`]));
  dlFile('pulse-log.csv', csvOf(rows), 'text/csv');
}

/* ---------- profile cards ---------- */
function habitCards() {
  if (S.sample) return '';
  const r = remGet(), perm = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission, bk = backups();
  return `<section class="card c-6"><div class="card-h"><h3>Reminders</h3><span class="label">This device</span></div><div class="card-b settings">
      <div class="set-row"><div><b>Training, food and weigh-in reminders</b><span>${r.on ? (perm === 'granted' ? 'On. Works while Pulse is open in a tab or installed.' : perm === 'denied' ? 'On, but notifications are blocked in your browser. You still get in-app messages.' : 'On (in-app messages)') : 'Off'}</span></div><button class="switch" role="switch" aria-checked="${r.on}" data-act="rem-toggle" aria-label="Reminders"></button></div>
      <div class="set-row"><div><b>Training time</b><span>We nudge you on training days if nothing is logged</span></div><input class="input" type="time" style="width:auto" data-rem="train" value="${r.train}" aria-label="Training reminder time"></div>
      <div class="set-row"><div><b>Food log</b><span>If nothing is logged by then</span></div><input class="input" type="time" style="width:auto" data-rem="food" value="${r.food}" aria-label="Food reminder time"></div>
      <div class="set-row"><div><b>Phone calendar</b><span>Training days and weigh-in with an alarm 30 minutes before. Works even when Pulse is closed.</span></div><button class="btn btn-ghost btn-sm" data-act="ics">${IC.download}Add to calendar</button></div></div></section>
    <section class="card c-6"><div class="card-h"><h3>Backups</h3><span class="label">${bk.length ? plural(bk.length, 'backup') + ' on this device' : 'None yet'}</span></div><div class="card-b settings">
      <div class="set-row"><div><b>Automatic backup</b><span>Pulse keeps a copy on this device every week${bk.length ? '. Latest: ' + fmtDate(new Date(bk[bk.length - 1].at)) : ''}</span></div><button class="btn btn-ghost btn-sm" data-act="bk-now">Back up now</button></div>
      <div class="set-row"><div><b>Restore a backup</b><span>${bk.length ? 'Put your plan and logs back to a saved copy' : 'No backup yet'}</span></div><button class="btn btn-ghost btn-sm" data-act="bk-restore" ${bk.length ? '' : 'disabled'}>Restore</button></div>
      <div class="set-row"><div><b>Spreadsheet</b><span>Sessions, weigh-ins, food and check-ins as a CSV file</span></div><button class="btn btn-ghost btn-sm" data-act="export-csv">${IC.download}CSV</button></div></div></section>`;
}
const _profileView = VIEWS.profile;
VIEWS.profile = () => { const h = _profileView(), m = '<p class="muted c-12" style="font-size:12.5px;max-width:60em">Pulse gives general'; return h.includes(m) ? h.replace(m, habitCards() + m) : h; };

Object.assign(ACT, {
  'rem-toggle': async el => {
    const r = remGet(); r.on = !r.on;
    if (r.on && typeof Notification !== 'undefined' && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) {} }
    remSet(r); refresh(); toast(r.on ? 'Reminders on.' : 'Reminders off.');
  },
  ics: () => { dlFile('pulse-training.ics', icsFile(), 'text/calendar'); toast('Open the file to add your training days to your calendar.'); },
  'bk-now': () => { const all = backups(); all.push({ at: Date.now(), json: JSON.stringify(REAL) }); while (all.length > 3) all.shift(); try { localStorage.setItem(BK, JSON.stringify(all)); toast('Backed up on this device.'); } catch (e) { toast('Could not back up. Storage may be full.', { type: 'err' }); } refresh(); },
  'bk-restore': () => {
    const bk = backups(); if (!bk.length) return; const b = bk[bk.length - 1];
    confirmModal({ title: 'Restore your latest backup?', sub: `This puts your plan and logs back to how they were on ${fmtDate(new Date(b.at))}. Anything newer is replaced. Your current data is kept as another backup first.`, confirm: 'Restore', onConfirm: () => {
      const all = backups(); all.push({ at: Date.now(), json: JSON.stringify(REAL) }); while (all.length > 3) all.shift(); try { localStorage.setItem(BK, JSON.stringify(all)); } catch (e) {}
      S = REAL = migrateState(JSON.parse(b.json)); save(); Sync.now(); refresh(); toast('Restored.');
    } });
  },
  'export-csv': () => exportCsv()
});
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.rem; if (!k) return; const r = remGet(); r[k] = e.target.value || REM_DEFAULT[k]; r.fired = {}; remSet(r); toast('Reminder time saved.'); });
setTimeout(autoBackup, 4000);
