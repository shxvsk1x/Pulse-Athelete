/* =========================================================
   PULSE — friends
   A student shares a short friend code. When another student enters it and the first accepts, each can see
   the other's consistency and progress: streak, sessions, a 14-day strip, lift bests and whether their
   weight is moving the right way. Never food, never body weight, never chats. Sharing is opt-in and can be paused.
   ========================================================= */
const FR = { loaded: false, loading: false, err: '', ships: [], feeds: {}, code: '', busy: false };

/* the summary a student's friends can read */
function friendDoc(st) {
  const prev = S; S = st;
  try {
    const p = st.profile, planned = trainingDays(p).length, days = new Set(st.log.sessions.map(x => x.date));
    const strip = [...Array(14)].map((_, i) => { const d = iso(addDays(new Date(), -(13 - i))); return days.has(d) ? 1 : 0; });
    const from28 = iso(addDays(new Date(), -28)), done28 = st.log.sessions.filter(x => x.date >= from28).length;
    const joinedDays = dayDiff(new Date(p.createdAt || Date.now()), new Date());
    const best = {}; st.log.sessions.forEach(x => Object.entries(x.kg || {}).forEach(([n, v]) => { if (!best[n] || v > best[n]) best[n] = v; }));
    const last = st.log.sessions[st.log.sessions.length - 1];
    const ps = progressStatus(st);
    return {
      on: true, name: String(p.name || 'Friend').slice(0, 30), grade: String(p.grade || '').slice(0, 3), goal: p.goal, planned, strip,
      streak: weekStreak(), thisWeek: weekDone(weekStart(new Date())), adherence: planned ? Math.min(100, Math.round(done28 / (planned * 4) * 100)) : 0,
      total: st.log.sessions.length, last: last ? last.date : '', joinedDays,
      bests: Object.entries(best).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, v]) => [n.slice(0, 40), v]),
      weightStatus: ps.status || 'no-data', updatedAt: Date.now()
    };
  } finally { S = prev; }
}
function friendLevel(f) {
  if (!f || f.paused) return ['', 'Sharing paused'];
  const since = f.last ? dayDiff(parseIso(f.last), new Date()) : null;
  if (f.joinedDays < 7 && f.total < 2) return ['acc', 'Just started'];
  if (f.adherence >= 80 && (since == null || since <= 7)) return ['good', 'Consistent'];
  if (f.adherence >= 50 && (since == null || since <= 10)) return ['', 'Mostly consistent'];
  return ['warn', 'Not consistent lately'];
}
const showCode = c => c ? c.slice(0, 4) + '-' + c.slice(4) : '';
const otherSide = sh => sh.a === Cloud.user.uid ? { uid: sh.b, name: sh.bName } : { uid: sh.a, name: sh.aName };

async function friendsLoad() {
  if (FR.loading || !Cloud.user) return;
  FR.loading = true; FR.err = '';
  try {
    const [code, ships] = await Promise.all([Cloud.friendCode(), Cloud.myFriendships()]);
    FR.code = code; FR.ships = ships;
    const feeds = {};
    await Promise.all(ships.filter(s => s.status === 'accepted').map(async s => { const o = otherSide(s); try { feeds[o.uid] = await Cloud.getFeed(o.uid); } catch (e) { feeds[o.uid] = undefined; } }));
    FR.feeds = feeds; FR.loaded = true;
  } catch (e) { FR.err = e.message || 'Could not load friends.'; FR.loaded = true; }
  FR.loading = false;
  if (UI.view === 'friends' && UI.screen === 'app') refresh();
}

function friendCard(sh) {
  const o = otherSide(sh), f = FR.feeds[o.uid], [k, l] = friendLevel(f);
  const head = `<div class="stu-h"><span class="avatar sm">${esc(initials(o.name))}</span><div style="min-width:0"><b>${esc(o.name)}</b><span>${f && f.grade ? 'Grade ' + esc(f.grade) : 'Friend'}</span></div>
    <div class="fr-side">${f !== undefined ? `<span class="pill ${k}">${l}</span>` : ''}<button class="btn btn-quiet btn-sm" data-act="fr-remove" data-id="${esc(sh.id)}" aria-label="Remove ${esc(o.name)} as a friend">Remove</button></div></div>`;
  if (f === undefined) return `<div class="stu">${head}<p class="muted" style="font-size:13px">Could not load their progress. Try again in a moment.</p></div>`;
  if (!f) return `<div class="stu">${head}<p class="muted" style="font-size:13px">${esc(o.name)} has not turned on friends yet. Their progress shows here once they do.</p></div>`;
  if (f.paused) return `<div class="stu">${head}<p class="muted" style="font-size:13px">${esc(o.name)} has paused sharing for now.</p></div>`;
  const since = f.last ? dayDiff(parseIso(f.last), new Date()) : null;
  const [wk, wl] = f.weightStatus === 'on-track' ? ['good', 'Weight moving the right way'] : f.weightStatus === 'no-data' ? ['', 'No weigh-ins yet'] : ['warn', 'Weight needs attention'];
  return `<div class="stu">${head}
    <div class="fr-strip" role="img" aria-label="Last 14 days: ${f.strip.reduce((a, b) => a + b, 0)} days trained">${f.strip.map((v, i) => `<i class="${v ? 'on' : ''}" title="${v ? 'Trained' : 'Rest'}"></i>`).join('')}</div>
    <div class="stu-stats">
      <div><span class="label">This week</span><b>${f.thisWeek}<small>/${f.planned}</small></b>${bar(f.thisWeek, f.planned || 1, f.thisWeek >= f.planned ? 'acc' : '')}</div>
      <div><span class="label">4-wk sessions</span><b>${f.adherence}<small>%</small></b>${bar(f.adherence, 100, '')}</div>
      <div><span class="label">Streak</span><b>${f.streak}<small>${f.streak === 1 ? 'wk' : 'wks'}</small></b></div>
      <div><span class="label">Last trained</span><b style="font-size:17px">${since == null ? 'Not yet' : since === 0 ? 'Today' : since === 1 ? 'Yesterday' : since + ' days ago'}</b></div>
    </div>
    <div class="stu-flags">${f.bests.map(([n, v]) => `<span class="pill">${esc(n)} ${v} kg</span>`).join('')}<span class="pill ${wk}">${wl}</span></div>
    <p class="muted" style="font-size:12px;margin-top:8px">Updated ${fmtDate(new Date(f.updatedAt))}</p></div>`;
}

VIEWS.friends = () => {
  const head = `<div class="ph"><div><div class="label">Train together</div><h2 style="margin-top:8px">Your <em>friends.</em></h2><p>Add a friend and you can both see who has been showing up.</p></div></div>`;
  const note = (ic, t, p, acts = '') => `${head}<div class="dash"><section class="card c-12"><div class="acct"><span class="acct-ic">${IC[ic]}</span><div><b>${t}</b><p>${p}</p></div>${acts ? `<div class="acct-acts">${acts}</div>` : ''}</div></section></div>`;
  if (S.sample) return note('coach', 'Friends need your own account', 'This is a sample athlete. Build your own plan and create an account to add friends.', '<a class="btn btn-primary" href="#/start">Build my plan</a>');
  if (!Cloud.user) return note('coach', 'Create an account to add friends', 'Friends are linked through accounts. Your plan and logs come with you.', '<a class="btn btn-primary" href="#/signup">Create an account</a><a class="btn btn-ghost" href="#/login">Log in</a>');
  if (Cloud.user.role !== 'student') return note('coach', 'Friends are for students', 'Coaches follow students from the Students tab.');
  if (!S.friendsOn && S.friendsOn !== false) return `${head}<div class="dash"><section class="card c-12"><div class="card-h"><h3>Before you start</h3></div><div class="card-b">
      <p style="max-width:56em">When you turn on friends, anyone you accept as a friend can see your streak, how many sessions you did this week and over the last 4 weeks, a 14-day strip of the days you trained, your best lifts, and whether your weight is moving the right way.</p>
      <ul class="priv" style="margin:14px 0">${[['Shared', 'Streak, sessions and the days you trained', 1], ['Shared', 'Your best lifts', 1], ['Private', 'What you eat, your body weight and your chats with Ask Pulse', 0], ['Private', 'Anyone who is not a friend you accepted', 0]].map(([a, b, on]) => `<li class="${on ? 'on' : ''}"><span>${on ? IC.check : IC.lock}</span>${esc(b)}</li>`).join('')}</ul>
      <p class="muted" style="font-size:13px;margin-bottom:14px">Nobody becomes your friend unless you accept. You can pause sharing or remove a friend at any time.</p>
      <button class="btn btn-primary" data-act="fr-on">Turn on friends</button></div></section></div>`;
  if (!FR.loaded && !FR.loading) friendsLoad();
  if (!FR.loaded) return `${head}<div class="empty" style="padding:70px 8px"><span class="spin lg"></span><h4>Loading your friends…</h4></div>`;
  const me = Cloud.user.uid, incoming = FR.ships.filter(s => s.status === 'pending' && s.from !== me), outgoing = FR.ships.filter(s => s.status === 'pending' && s.from === me), friends = FR.ships.filter(s => s.status === 'accepted');
  const paused = S.friendsOn === false;
  return `${head}
    ${FR.err ? `<div class="card" style="margin-bottom:16px"><div class="acct"><span class="acct-ic">${IC.alert}</span><div><b>Could not reach friends</b><p>${esc(FR.err)}</p></div><div class="acct-acts"><button class="btn btn-ghost" data-act="fr-reload">Try again</button></div></div></div>` : ''}
    <div class="dash stagger">
      <section class="card c-6"><div class="card-h"><h3>Your friend code</h3></div><div class="card-b">
        <div class="fr-code" aria-label="Your friend code ${esc(showCode(FR.code))}">${esc(showCode(FR.code)) || '…'}</div>
        <p class="muted" style="font-size:13px;margin:8px 0 14px">Give this to a friend. They enter it here and you accept.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" data-act="fr-copy">Copy code</button><button class="btn btn-quiet btn-sm" data-act="${paused ? 'fr-resume' : 'fr-pause'}">${paused ? 'Resume sharing' : 'Pause sharing'}</button></div></div></section>
      <section class="card c-6"><div class="card-h"><h3>Add a friend</h3></div><div class="card-b">
        <form data-form="friend-add" novalidate><div class="field"><label for="fr-in">Their friend code</label><div style="display:flex;gap:8px"><div class="input-wrap" style="flex:1"><input class="input" id="fr-in" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. K7MQ-2XPD"></div><button class="btn btn-primary" type="submit" ${FR.busy ? 'disabled' : ''}>Send request</button></div><span class="error" id="fr-err" role="alert" hidden></span></div></form>
        ${outgoing.length ? `<p class="muted" style="font-size:13px;margin-top:12px">Waiting for ${outgoing.map(s => esc(otherSide(s).name)).join(', ')} to accept.</p>` : ''}</div></section>
      ${incoming.length ? `<section class="card c-12"><div class="card-h"><h3>Friend requests</h3><span class="pill acc">${incoming.length}</span></div><div class="card-b"><ul class="supp-list">${incoming.map(s => `<li><span class="avatar sm">${esc(initials(otherSide(s).name))}</span><div style="min-width:0"><div class="nm">${esc(otherSide(s).name)}</div><div class="mac">wants to be friends</div></div><button class="btn btn-ghost btn-sm" data-act="fr-remove" data-id="${esc(s.id)}" data-quiet="1">Decline</button><button class="btn btn-primary btn-sm" data-act="fr-accept" data-id="${esc(s.id)}">Accept</button></li>`).join('')}</ul></div></section>` : ''}
      <section class="c-12"><div class="sec-row"><div><h3 class="h-sec">Friends</h3><p class="muted" style="font-size:13.5px">${friends.length ? 'Who has been showing up.' : 'No friends yet.'}</p></div><button class="btn btn-quiet btn-sm" data-act="fr-reload">Refresh</button></div>
        ${friends.length ? `<div class="stu-grid">${friends.map(friendCard).join('')}</div>` : `<div class="card"><div class="empty"><div class="glyph">${IC.coach}</div><h4>Add your first friend</h4><p>Share your code or enter theirs above.</p></div></div>`}</section>
    </div>`;
};

function friendsReload() { FR.loaded = false; FR.loading = false; if (UI.view === 'friends') refresh(); }
Object.assign(ACT, {
  'fr-on': () => { if (!REAL || S.sample) return; REAL.friendsOn = true; save(); Sync.now(); refresh(); toast('Friends are on. Share your code to add someone.'); },
  'fr-pause': () => { REAL.friendsOn = false; save(); Sync.now(); refresh(); toast('Sharing paused. Friends see that you paused.'); },
  'fr-resume': () => { REAL.friendsOn = true; save(); Sync.now(); refresh(); toast('Sharing resumed.'); },
  'fr-reload': () => friendsReload(),
  'fr-copy': async el => {
    const t = showCode(FR.code); if (!t) return;
    try { await navigator.clipboard.writeText(t); toast('Code copied.'); }
    catch (e) { const i = $('.fr-code'); if (i) { const r = document.createRange(); r.selectNodeContents(i); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } toast('Press copy on your keyboard to copy the selected code.'); }
  },
  'fr-accept': async el => {
    el.disabled = true;
    try { await Cloud.acceptFriend(el.dataset.id); toast('Friend added.'); friendsReload(); } catch (e) { el.disabled = false; toast(e.message || 'Could not accept.', { type: 'err' }); }
  },
  'fr-remove': el => {
    const sh = FR.ships.find(s => s.id === el.dataset.id); if (!sh) return;
    const name = otherSide(sh).name, quiet = el.dataset.quiet === '1';
    const go = async () => { try { await Cloud.removeFriend(sh.id); toast(quiet ? 'Request declined.' : name + ' removed.'); friendsReload(); } catch (e) { toast(e.message || 'Could not remove.', { type: 'err' }); } };
    if (quiet) go(); else confirmModal({ title: `Remove ${name}?`, sub: 'You will stop seeing each other’s progress. You can add each other again later.', confirm: 'Remove', danger: true, onConfirm: go });
  }
});
document.addEventListener('submit', async e => {
  if (e.target.dataset.form !== 'friend-add') return;
  e.preventDefault();
  const inp = $('#fr-in'), err = $('#fr-err'), say = m => { err.hidden = false; err.innerHTML = IC.alert + esc(m); inp.focus(); };
  err.hidden = true;
  const code = Cloud.cleanCode(inp.value);
  if (code.length !== 8) return say('Friend codes have 8 letters and numbers, like K7MQ-2XPD.');
  if (code === FR.code) return say('That is your own code. Send it to a friend instead.');
  FR.busy = true;
  try {
    const o = await Cloud.findCode(code);
    if (!o) { FR.busy = false; return say('No one has that code. Check it with your friend.'); }
    if (o.uid === Cloud.user.uid) { FR.busy = false; return say('That is your own code.'); }
    await Cloud.requestFriend(o);
    FR.busy = false; toast(`Request sent to ${o.name}. They need to accept it.`); friendsReload();
  } catch (x) { FR.busy = false; say(x.message || 'Could not send the request.'); }
});
