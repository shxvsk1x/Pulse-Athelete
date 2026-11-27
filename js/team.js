/* =========================================================
   PULSE — team view, coach messages, meal photos, admin, tidy-up
   ========================================================= */

/* ---------- flags + coach detail extras ---------- */
const _pb2 = progressBase;
progressBase = function (st) {
  const b = _pb2(st), pf = st.painFlags || {}, cut = iso(addDays(new Date(), -14));
  if (Object.keys(pf).some(a => pf[a] >= cut)) b.flags.push('Pain reported');
  return b;
};
const _cdc = coachDetailCards;
coachDetailCards = function (d) {
  const x = d.detail || {}, extra = [];
  if (x.pain && x.pain.length) extra.push(`<p style="margin:0 0 6px"><b>Reported pain (last 14 days):</b> ${x.pain.map(a => esc(a)).join(', ')}. Pulse swapped out exercises that load these areas.</p>`);
  if (x.mealPhotos) extra.push(`<p style="margin:0"><b>Meal photos:</b> logged ${plural(x.mealPhotos.week, 'meal photo')} this week, ${x.mealPhotos.total} in total. Coaches see the count only, never the photos.</p>`);
  const h = _cdc(d);
  return extra.length ? `<section class="card c-12"><div class="card-h"><h3>Pain and meal photos</h3></div><div class="card-b" style="font-size:14px">${extra.join('')}</div></section>` + h : h;
};

/* ---------- meal photos: optional, kept on the device, only a count is shared ---------- */
function mealPhotoCard() {
  if (S.sample) return '';
  const pics = (S.mealPics || []).slice(-6).reverse(), since = iso(addDays(new Date(), -7)), wk = (S.mealPics || []).filter(m => m.date >= since).length;
  return `<section class="card card-pad" style="margin-top:16px"><div class="card-h" style="padding:0 0 10px"><h3>Meal photos</h3><span class="label">Optional</span></div>
    <p class="muted" style="font-size:13.5px;margin:0 0 12px">Snap a meal to log it. Pulse keeps a small copy on this device and tells your coaches only how many times you did it, never the picture. ${S.mealPhotoCount ? `You have photo-logged <b>${S.mealPhotoCount}</b> ${S.mealPhotoCount === 1 ? 'meal' : 'meals'} (${wk} this week).` : ''}</p>
    ${pics.length ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">${pics.map(m => `<figure style="margin:0;text-align:center"><img src="${m.thumb}" alt="${esc(m.meal)} on ${esc(m.date)}" width="72" height="72" style="border-radius:10px;object-fit:cover"><figcaption class="muted" style="font-size:11px">${esc(m.meal)}</figcaption></figure>`).join('')}</div>` : ''}
    <label class="btn btn-ghost btn-sm" style="cursor:pointer">${IC.camera}Add a meal photo<input type="file" id="meal-file" accept="image/*" capture="environment" hidden></label></section>`;
}
const _fuel = VIEWS.fuel; VIEWS.fuel = () => _fuel() + mealPhotoCard();
function mealFromFile(file) {
  return new Promise((ok, no) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => { const c = document.createElement('canvas'), r = Math.min(1, 96 / Math.min(img.width, img.height)); c.width = Math.max(1, Math.round(img.width * r)); c.height = Math.max(1, Math.round(img.height * r)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.5)); };
    img.onerror = () => { URL.revokeObjectURL(url); no(new Error('That file is not a picture.')); };
    img.src = url;
  });
}
document.addEventListener('change', async e => {
  if (e.target.id !== 'meal-file' || !e.target.files[0]) return;
  try {
    const h = new Date().getHours(), meal = h < 10 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 18 ? 'Snack' : 'Dinner';
    const thumb = await mealFromFile(e.target.files[0]);
    S.mealPics = (S.mealPics || []).concat([{ date: today(), t: Date.now(), meal, thumb }]).slice(-12);
    S.mealPhotoCount = (S.mealPhotoCount || 0) + 1; save(); refresh(); toast(`${meal} photo logged. ${S.mealPhotoCount} so far.`);
  } catch (x) { toast(x.message || 'Could not read that picture.', { type: 'err' }); }
});

/* ---------- coach: team view ---------- */
function coachTeam() {
  const u = Cloud.user, all = COACH.roster, sports = u.sports || [];
  const sec = sp => {
    const list = all.filter(d => d.sports.includes(sp)); const name = sp === 'general' ? 'PE' : SPORTS[sp].split(' (')[0];
    return `<section class="card c-12"><div class="card-h"><h3>${esc(name)}</h3><span class="label">${plural(list.length, 'athlete')}${list.length ? ' · ' + Math.round(list.reduce((t, d) => t + d.adherence, 0) / list.length) + '% sessions done' : ''}</span></div><div class="card-b" style="overflow:auto">${list.length ? `<table class="tbl" style="width:100%;border-collapse:collapse;font-size:13.5px"><thead><tr style="text-align:left"><th>Name</th><th>Grade</th><th>This week</th><th>4 weeks</th><th>Meal photos</th><th>Flags</th></tr></thead><tbody>
      ${list.map(d => `<tr><td><a href="#/student?id=${encodeURIComponent(d.uid)}">${esc(d.name)}</a></td><td>${esc(d.grade || '–')}</td><td>${d.weeks[3].done}/${d.planned}</td><td>${d.adherence}%</td><td>${d.detail && d.detail.mealPhotos ? d.detail.mealPhotos.week : 0}</td><td>${d.flags.length ? d.flags.map(f => `<span class="pill warn">${esc(f)}</span>`).join(' ') : '<span class="muted">None</span>'}</td></tr>`).join('')}</tbody></table>` : `<p class="muted">No athletes yet.</p>`}</div></section>`;
  };
  return `<div class="ph"><div><div class="label">${esc(Cloud.schoolName(u.school))}</div><h2 style="margin-top:8px">Your <em>team.</em></h2><p>Everyone who plays your sports, side by side.</p></div><div class="ph-actions"><button class="btn btn-ghost" data-act="team-csv">${IC.download}Download CSV</button></div></div><div class="dash">${sports.map(sec).join('')}</div>`;
}
function teamCsv() {
  const rows = [['name', 'grade', 'sports', 'sessions this week', 'planned', 'adherence 4 weeks %', 'meal photos this week', 'flags']];
  COACH.roster.forEach(d => rows.push([d.name, d.grade || '', d.sports.join('/'), d.weeks[3].done, d.planned, d.adherence, d.detail && d.detail.mealPhotos ? d.detail.mealPhotos.week : 0, d.flags.join('; ')]));
  dlFile('pulse-team.csv', csvOf(rows), 'text/csv');
}

/* ---------- coach: messages ---------- */
function coachMessages() {
  const u = Cloud.user;
  if (!MSG.loaded) { msgLoad().then(() => { if (UI.coachView === 'messages') coachDraw(); }); return `<div class="empty" style="padding:60px 8px"><span class="spin lg"></span><h4>Loading messages…</h4></div>`; }
  Promise.all(MSG.list.filter(m => m.to === u.uid && !m.read).map(m => Cloud.gput('messages', m.id, { read: true }, true).then(() => { m.read = true; }).catch(() => {}))).catch(() => {});
  return `<div class="ph"><div><div class="label">${esc(Cloud.schoolName(u.school))}</div><h2 style="margin-top:8px">Messages to <em>students.</em></h2><p>Only you, other coaches at your school and the student can see these.</p></div>
    <div class="ph-actions"><select class="input" id="msg-new" style="width:auto"><option value="">New message to…</option>${COACH.roster.map(d => `<option value="${esc(d.uid)}" data-n="${esc(d.name)}">${esc(d.name)}${d.grade ? ' (grade ' + esc(d.grade) + ')' : ''}</option>`).join('')}</select></div></div>
    <div class="dash"><section class="card c-12"><div class="card-b">${MSG.list.length ? `<ul class="supp-list">${MSG.list.slice(0, 30).map(thread).join('')}</ul>` : `<div class="empty"><h4>No messages yet</h4><p>Pick a student above to write to them.</p></div>`}</div></section></div>`;
}
document.addEventListener('change', e => { if (e.target.id === 'msg-new' && e.target.value) { const o = e.target.selectedOptions[0]; msgModal(e.target.value, o.dataset.n); e.target.value = ''; } });
const _cs = coachStudent;
coachStudent = function () {
  const h = _cs(), d = COACH.roster.find(x => x.uid === UI.coachStu);
  if (!d || Cloud.user.role !== 'coach') return h;
  return h.replace('<div class="ph-actions">', `<div class="ph-actions"><button class="btn btn-primary btn-sm" data-act="msg-to" data-to="${esc(d.uid)}" data-name="${esc(d.name)}">${IC.chat}Message</button>`);
};
const _cacc = coachAccount; coachAccount = function () { return _cacc().replace(/(<p class="muted c-12"[^>]*>)/, `<section class="card c-12"><div class="card-b settings"><div class="set-row"><div><b>Report a problem</b><span>Anything unsafe or wrong. It goes to the Pulse admins.</span></div>${reportBtn({}, 'Report')}</div></div></section>$1`); };
const _tacc = trainerAccount; trainerAccount = function () { return _tacc().replace(/(<p class="muted c-12"[^>]*>)/, `<section class="card c-12"><div class="card-b settings"><div class="set-row"><div><b>Report a problem</b><span>Anything unsafe or wrong. It goes to the Pulse admins.</span></div>${reportBtn({}, 'Report')}</div></div></section>$1`); };

/* ---------- multi-school admin ---------- */
const AD = { ok: null, schools: [], coaches: [], students: [], reports: [], loading: false, err: '' };
async function adminLoad() {
  AD.loading = true;
  try {
    AD.ok = !!(await Cloud.gget('admins', Cloud.user.uid));
    if (AD.ok) { const [s, c, st, r] = await Promise.all([Cloud.gquery('schools', []), Cloud.gquery('users', [['role', 'coach']]), Cloud.gquery('users', [['role', 'student']]), Cloud.gquery('reports', [])]); AD.schools = s; AD.coaches = c; AD.students = st; AD.reports = r.sort((a, b) => b.at - a.at); }
    AD.err = '';
  } catch (e) { AD.err = e.message || 'Could not load.'; AD.ok = AD.ok === null ? false : AD.ok; }
  AD.loading = false; AD.done = true;
}
function coachAdmin() {
  const u = Cloud.user;
  if (!AD.done) { if (!AD.loading) adminLoad().then(() => { if (UI.coachView === 'admin') coachDraw(); }); return `<div class="empty" style="padding:60px 8px"><span class="spin lg"></span><h4>Checking access…</h4></div>`; }
  if (!AD.ok) return `<div class="ph"><div><div class="label">Admin</div><h2 style="margin-top:8px">Multi-school <em>admin.</em></h2><p>This page is for the people who run Pulse across schools. To be made an admin, send your account ID to the person who manages the Firebase project. They add it in the console under admins.</p></div></div>
    <div class="card"><div class="card-b"><span class="label">Your account ID</span><p><code id="adm-id" style="user-select:all;overflow-wrap:anywhere">${esc(u.uid)}</code></p></div></div>`;
  const nStu = id => AD.students.filter(s => s.school === id).length, nCo = id => AD.coaches.filter(c => c.school === id).length;
  const open = AD.reports.filter(r => r.status !== 'resolved');
  return `<div class="ph"><div><div class="label">Admin</div><h2 style="margin-top:8px">All <em>schools.</em></h2><p>${plural(AD.schools.length, 'school')}, ${plural(AD.coaches.length, 'coach', 'coaches')}, ${plural(AD.students.length, 'student')}.</p></div></div>
    <div class="dash"><section class="card c-12"><div class="card-h"><h3>Schools</h3></div><div class="card-b"><ul class="supp-list">${AD.schools.map(s => `<li><div style="min-width:0;flex:1"><div class="nm">${esc(s.name || s.id)} ${s.suspended ? '<span class="pill bad">Suspended</span>' : ''}</div><div class="mac">${plural(nCo(s.id), 'coach', 'coaches')} · ${plural(nStu(s.id), 'student')}</div></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" data-act="ad-code" data-id="${esc(s.id)}">Reset coach code</button><button class="btn btn-ghost btn-sm" data-act="ad-susp" data-id="${esc(s.id)}">${s.suspended ? 'Reinstate' : 'Suspend sign-ups'}</button></div></li>`).join('') || '<li class="muted">No schools yet.</li>'}</ul></div></section>
    <section class="card c-12"><div class="card-h"><h3>Reports</h3><span class="pill ${open.length ? 'acc' : ''}">${open.length} open</span></div><div class="card-b"><ul class="supp-list">${AD.reports.slice(0, 40).map(r => `<li><div style="min-width:0;flex:1"><div class="nm">${esc(r.kind)} <span class="muted" style="font-weight:400">· ${esc(r.byName)} (${esc(r.role)}${r.school ? ', ' + esc(Cloud.schoolName(r.school)) : ''})${r.aboutName ? ' · about ' + esc(r.aboutName) : ''}</span></div><div style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(r.text)}</div><div class="mac">${new Date(r.at).toLocaleString()}</div></div>${r.status === 'resolved' ? '<span class="pill good">Resolved</span>' : `<button class="btn btn-ghost btn-sm" data-act="ad-resolve" data-id="${esc(r.id)}">Mark resolved</button>`}</li>`).join('') || '<li class="muted">No reports.</li>'}</ul></div></section></div>`;
}
Object.assign(ACT, {
  'team-csv': () => teamCsv(),
  'ad-resolve': async el => { try { await Cloud.gput('reports', el.dataset.id, { status: 'resolved', resolvedBy: Cloud.user.uid, resolvedAt: Date.now() }, true); const r = AD.reports.find(x => x.id === el.dataset.id); if (r) r.status = 'resolved'; coachDraw(); } catch (e) { toast(e.message, { type: 'err' }); } },
  'ad-susp': async el => { const s = AD.schools.find(x => x.id === el.dataset.id); if (!s) return; try { await Cloud.gput('schools', s.id, { suspended: !s.suspended }, true); s.suspended = !s.suspended; coachDraw(); toast(s.suspended ? 'New coach sign-ups are blocked.' : 'Sign-ups reopened.'); } catch (e) { toast(e.message, { type: 'err' }); } },
  'ad-code': el => { const s = AD.schools.find(x => x.id === el.dataset.id); if (!s) return;
    openModal({ title: 'Reset coach code', sub: `New coach access code for ${esc(s.name || s.id)}. Existing coaches stay signed up. Share the new code with coaches who still need to join.`, body: `<div class="field"><label for="ad-new">New code (6 or more characters)</label><input class="input" id="ad-new" maxlength="40" autocomplete="off"></div><p class="err" id="ad-err" role="alert" hidden></p>`,
      actions: [{ label: 'Cancel' }, { label: 'Reset', kind: 'btn-primary', fn: async () => { const v = $('#ad-new').value.trim(), e = $('#ad-err'); if (v.length < 6) { e.hidden = false; e.textContent = 'At least 6 characters.'; return false; } try { await Cloud.gput('schools', s.id, { coachCode: v }, true); toast('Code reset.'); } catch (x) { e.hidden = false; e.textContent = x.message; return false; } } }] }); }
});
COACH_EXTRA.team = coachTeam; COACH_EXTRA.messages = coachMessages; COACH_EXTRA.admin = coachAdmin;
/* coach nav: students, lifts, team, messages, verify, results, admin, account */
{
  const old = Object.assign({}, COACH_VIEWS); Object.keys(COACH_VIEWS).forEach(k => delete COACH_VIEWS[k]);
  Object.assign(COACH_VIEWS, { students: old.students, team: ['Team', 'coach'], lifts: ['Lifts', 'medal'], messages: ['Messages', 'chat'], verify: old.verify, results: old.results, admin: ['Admin', 'lock'], account: old.account });
}

/* ---------- tidy: keep the saved state small, clear stale cloud leftovers ---------- */
function trimState(st) {
  if (!st || !st.log) return;
  const cut = iso(addDays(new Date(), -90));
  st.log.sessions.forEach(x => { if (x.date < cut && x.setLog) delete x.setLog; });
  if (st.chat && st.chat.length > 60) st.chat = st.chat.slice(-60);
  if (st.painLog && st.painLog.length > 40) st.painLog = st.painLog.slice(-40);
  Object.keys(st.painFlags || {}).forEach(a => { if (st.painFlags[a] < cut) delete st.painFlags[a]; });
  Object.keys(st.moves || {}).forEach(d => { if (d < cut) delete st.moves[d]; });
  let n = 0; try { n = JSON.stringify(st).length; } catch (e) {}
  if (n > 800000) { st.log.sessions.forEach(x => { delete x.setLog; }); st.mealPics = []; st.chat = (st.chat || []).slice(-10); }
}
const _syncNow = Sync.now; Sync.now = function () { try { trimState(REAL); } catch (e) {} return _syncNow.apply(this, arguments); };
async function cloudTidy() {
  const u = Cloud.user; if (!u || u.role !== 'student') return;
  try { const old = Date.now() - 30 * 864e5; (await Cloud.myLinks()).filter(l => l.status === 'pending' && (l.at || Date.now()) < old).forEach(l => Cloud.removeLink(l.id).catch(() => {})); } catch (e) {}
  try { (await Cloud.myFriendships()).filter(f => f.status === 'pending' && (f.at || Date.now()) < Date.now() - 30 * 864e5).forEach(f => Cloud.removeFriend(f.id).catch(() => {})); } catch (e) {}
}
setTimeout(() => { try { trimState(REAL); } catch (e) {} cloudTidy(); }, 8000);
