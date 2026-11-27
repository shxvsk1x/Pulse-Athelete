/* =========================================================
   PULSE — personal trainers
   A trainer and a trainee prove they know each other in three steps:
     1. the trainee shows a short trainer code
     2. the trainer, signed in with a verified email, types it in
     3. the trainee sees the trainer's name and verified email and accepts
   Only then does the trainer see the trainee's progress (the same summary a school coach gets).
   Either side can end the link at any time and the trainer loses access straight away.
   ========================================================= */
const TR = { loaded: false, loading: false, err: '', links: [], code: '', busy: false };
const SEES = [['Sessions each week, how hard they felt, exercises, weights and set times', 1], ['Weigh-in trend against the goal', 1], ['Last 7 days of food, including anything eaten off plan', 1], ['Allergies, injuries and diet', 1], ['Your Ask Pulse chats, glass photos and friends', 0]];
const seesList = () => `<ul class="priv" style="margin:12px 0">${SEES.map(([b, on]) => `<li class="${on ? 'on' : ''}"><span>${on ? IC.check : IC.lock}</span>${esc(b)}</li>`).join('')}</ul>`;

async function trLoad(silent) {
  if (TR.loading || !Cloud.user) return; TR.loading = true; TR.err = '';
  try {
    const trainee = Cloud.user.role === 'student';
    const [code, links] = await Promise.all([trainee ? Cloud.trainerCode() : '', Cloud.myLinks()]);
    TR.code = code; TR.links = links; TR.loaded = true;
  } catch (e) { TR.err = e.message || 'Could not load.'; TR.loaded = true; }
  TR.loading = false;
  if (!silent) { if (UI.view === 'trainer' && UI.screen === 'app') refresh(); else if (UI.screen === 'coach') coachDraw(); }
}
const trReload = () => { TR.loaded = false; TR.loading = false; if (UI.screen === 'coach') coachRefresh(); else if (UI.view === 'trainer') refresh(); };

/* ---------- the athlete's side ---------- */
VIEWS.trainer = () => {
  const head = `<div class="ph"><div><div class="label">Personal trainer</div><h2 style="margin-top:8px">Your <em>trainer.</em></h2><p>Have a personal trainer? Link them here so they can follow your progress. They only see it once you both confirm.</p></div></div>`;
  const note = (t, p, acts = '') => `${head}<div class="dash"><section class="card c-12"><div class="acct"><span class="acct-ic">${IC.shield}</span><div><b>${t}</b><p>${p}</p></div>${acts ? `<div class="acct-acts">${acts}</div>` : ''}</div></section></div>`;
  if (S.sample) return note('Trainers need your own account', 'This is a sample athlete. Build your own plan and create an account to link a trainer.', '<a class="btn btn-primary" href="#/start">Build my plan</a>');
  if (!Cloud.user) return note('Create an account to link a trainer', 'A trainer link is tied to your account, so only you can approve it.', '<a class="btn btn-primary" href="#/signup">Create an account</a><a class="btn btn-ghost" href="#/login">Log in</a>');
  if (Cloud.user.role !== 'student') return note('This is for athletes', 'Trainers follow their clients from the Clients tab.');
  if (!TR.loaded && !TR.loading) trLoad();
  if (!TR.loaded) return `${head}<div class="empty" style="padding:70px 8px"><span class="spin lg"></span><h4>Loading…</h4></div>`;
  const incoming = TR.links.filter(l => l.status === 'pending'), active = TR.links.filter(l => l.status === 'accepted');
  return `${head}
    ${TR.err ? `<div class="card" style="margin-bottom:16px"><div class="acct"><span class="acct-ic">${IC.alert}</span><div><b>Could not reach your trainer links</b><p>${esc(TR.err)}</p></div><div class="acct-acts"><button class="btn btn-ghost" data-act="tr-reload">Try again</button></div></div></div>` : ''}
    <div class="dash stagger">
      ${incoming.length ? `<section class="card c-12"><div class="card-h"><h3>Waiting for your answer</h3><span class="pill acc">${incoming.length}</span></div><div class="card-b"><ul class="supp-list">${incoming.map(l => `<li><span class="avatar sm">${esc(initials(l.trainerName))}</span><div style="min-width:0"><div class="nm">${esc(l.trainerName)} wants to follow your progress</div><div class="mac">Verified email: ${esc(l.trainerEmail)}</div></div><button class="btn btn-ghost btn-sm" data-act="tr-decline" data-id="${esc(l.id)}">Decline</button><button class="btn btn-primary btn-sm" data-act="tr-accept" data-id="${esc(l.id)}">Accept</button></li>`).join('')}</ul>
        <p class="muted" style="font-size:13px;margin-top:12px">Only accept if you know this person and this is the email you expect. If you accept, they will see:</p>${seesList()}</div></section>` : ''}
      <section class="card c-6"><div class="card-h"><h3>Your trainer code</h3></div><div class="card-b">
        <div class="fr-code" aria-label="Your trainer code ${esc(showCode(TR.code))}">${esc(showCode(TR.code)) || '…'}</div>
        <p class="muted" style="font-size:13px;margin:8px 0 14px">Tell your trainer this code. They make a free Pulse trainer account, verify their email and enter it. Then you accept here.</p>
        <button class="btn btn-ghost btn-sm" data-act="tr-copy">Copy code</button></div></section>
      <section class="card c-6"><div class="card-h"><h3>What a trainer sees</h3></div><div class="card-b">${seesList()}<p class="muted" style="font-size:13px">Nothing is shared until you accept. You can end it at any time and they lose access straight away.${S.profile.school ? ' Your school coaches are separate and unchanged.' : ''}</p></div></section>
      <section class="card c-12"><div class="card-h"><h3>Your trainers</h3><button class="btn btn-quiet btn-sm" data-act="tr-reload">Refresh</button></div><div class="card-b">${active.length ? `<ul class="supp-list">${active.map(l => `<li><span class="avatar sm">${esc(initials(l.trainerName))}</span><div style="min-width:0"><div class="nm">${esc(l.trainerName)}</div><div class="mac">${esc(l.trainerEmail)} · can see your progress</div></div><button class="btn btn-ghost btn-sm" data-act="tr-remove" data-id="${esc(l.id)}">Remove access</button></li>`).join('')}</ul>` : `<p class="muted" style="font-size:13.5px">No trainer linked yet.</p>`}</div></section>
    </div>`;
};

/* ---------- the trainer's side ---------- */
function trainerClients() {
  const u = Cloud.user, all = COACH.roster, pend = TR.links.filter(l => l.status === 'pending');
  const verified = Cloud.mode === 'firebase' ? !!u.emailVerified : u.verified !== false;
  const verifyCard = verified ? '' : `<section class="card" style="margin-bottom:16px"><div class="acct"><span class="acct-ic">${IC.alert}</span><div><b>Verify your email first</b><p>We sent a link to <b>${esc(u.email)}</b>. Your clients see this verified email when you ask to follow them. Open the link, then tap the button.${Cloud.mode === 'firebase' ? ' Check spam if you cannot see it.' : ' Demo mode cannot send real email, so you can simulate the link.'}</p></div>
    <div class="acct-acts">${Cloud.mode === 'firebase' ? '<button class="btn btn-quiet" data-act="tv-resend">Send again</button>' : '<button class="btn btn-ghost" data-act="tv-demo">Simulate the email link</button>'}<button class="btn btn-primary" data-act="tv-check">I have verified</button></div></div></section>`;
  return `<div class="ph"><div><div class="label">Personal trainer</div><h2 style="margin-top:8px">Your <em>clients.</em></h2><p>You see a client’s progress only after they accept your request.</p></div></div>
    ${verifyCard}
    <div class="dash stagger" style="margin-bottom:16px">
      <section class="card c-12"><div class="card-h"><h3>Add a client</h3></div><div class="card-b">
        <form data-form="client-add" novalidate><div class="field"><label for="tc-in">Their trainer code <span class="hint">They find it in Pulse under Trainer</span></label><div style="display:flex;gap:8px"><div class="input-wrap" style="flex:1"><input class="input" id="tc-in" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="e.g. K7MQ-2XPD"></div><button class="btn btn-primary" type="submit" ${TR.busy || !verified ? 'disabled' : ''}>Send request</button></div><span class="error" id="tc-err" role="alert" hidden></span></div></form>
        ${pend.length ? `<p class="muted" style="font-size:13px;margin-top:12px">Waiting for: ${pend.map(l => `${esc(l.traineeName)} <button class="btn btn-quiet btn-sm" data-act="tr-remove" data-id="${esc(l.id)}">Cancel</button>`).join(' ')}</p>` : ''}</div></section>
    </div>
    ${all.length ? `<div class="stu-grid">${all.map(d => studentCard(d, { link: true })).join('')}</div>`
      : `<div class="card"><div class="empty"><div class="glyph">${IC.coach}</div><h4>No clients yet</h4><p>Ask your client for their trainer code, send the request, and they accept it in their Pulse app.</p><div class="acts"><button class="btn btn-ghost btn-sm" data-act="coach-reload">${IC.reset}Check again</button></div></div></div>`}`;
}
function trainerAccount() {
  const u = Cloud.user;
  return `<div class="ph"><div class="prof-head"><span class="avatar">${esc(initials(u.name))}</span><div><h2>${esc(u.name)}</h2><p style="margin-top:2px">${esc(u.email)}</p></div></div></div>
    <div class="dash"><section class="card c-7"><div class="card-h"><h3>Your clients</h3></div><div class="card-b">${COACH.roster.length ? `<ul class="supp-list">${TR.links.filter(l => l.status === 'accepted').map(l => `<li><span class="avatar sm">${esc(initials(l.traineeName))}</span><div style="min-width:0"><div class="nm">${esc(l.traineeName)}</div><div class="mac">Linked</div></div><button class="btn btn-ghost btn-sm" data-act="tr-remove" data-id="${esc(l.id)}">Stop following</button></li>`).join('')}</ul>` : '<p class="muted" style="font-size:13.5px">No clients yet.</p>'}</div></section>
      <section class="card c-5"><div class="card-h"><h3>Account</h3></div><div class="card-b settings">
        <div class="set-row"><div><b>Appearance</b><span>Light or dark</span></div><button class="btn btn-ghost btn-sm" data-act="theme">${isDark() ? IC.sun : IC.moon}Switch</button></div>
        <div class="set-row"><div><b>Sign out</b><span>On this device</span></div><button class="btn btn-ghost btn-sm" data-act="sign-out">${IC.logout}Sign out</button></div></div></section>
      <p class="muted c-12" style="font-size:12.5px;max-width:60em">You see a summary for clients who accepted your request: sessions, weigh-ins, food and health notes. Their chats and photos are not shared. Pulse gives general guidance, not medical advice. Keep clients’ information private.</p></div>`;
}

Object.assign(ACT, {
  'tr-reload': () => trReload(),
  'tr-copy': async () => {
    const t = showCode(TR.code); if (!t) return;
    try { await navigator.clipboard.writeText(t); toast('Code copied.'); } catch (e) { const i = $('.fr-code'); if (i) { const r = document.createRange(); r.selectNodeContents(i); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } toast('Press copy on your keyboard to copy the selected code.'); }
  },
  'tr-accept': async el => {
    el.disabled = true;
    try { await Cloud.acceptLink(el.dataset.id); toast('Trainer linked. They can now see your progress.'); TR.loaded = false; await trLoad(true); Sync.lastTr = ''; await Sync.now(); refresh(); }
    catch (e) { el.disabled = false; toast(e.message || 'Could not accept.', { type: 'err' }); }
  },
  'tr-decline': async el => { try { await Cloud.removeLink(el.dataset.id); toast('Request declined.'); trReload(); } catch (e) { toast(e.message || 'Could not decline.', { type: 'err' }); } },
  'tr-remove': el => {
    const l = TR.links.find(x => x.id === el.dataset.id); if (!l) return;
    const trainer = Cloud.user.role === 'trainer', who = trainer ? l.traineeName : l.trainerName;
    confirmModal({ title: l.status === 'pending' ? 'Cancel this request?' : trainer ? `Stop following ${who}?` : `Remove ${who}?`, sub: l.status === 'pending' ? '' : trainer ? 'You will no longer see their progress. They can send a new code later.' : 'They lose access to your progress straight away. You can link them again later.', confirm: l.status === 'pending' ? 'Cancel request' : 'Remove', danger: true, onConfirm: async () => {
      try {
        await Cloud.removeLink(l.id); TR.loaded = false;
        if (!trainer) { await trLoad(true); if (!TR.links.some(x => x.status === 'accepted')) { try { await Cloud.deleteTrainee(); Sync.lastTr = ''; } catch (e) {} } }
        toast(l.status === 'pending' ? 'Request cancelled.' : who + ' removed.'); trReload();
      } catch (e) { toast(e.message || 'Could not remove.', { type: 'err' }); }
    } });
  },
  'tv-check': async () => { try { const ok = await Cloud.emailVerified(); if (ok) toast('Email verified.'); else toast('Not verified yet. Open the link in the email first.', { type: 'err' }); coachDraw(); } catch (e) { toast(e.message, { type: 'err' }); } },
  'tv-resend': async () => { try { await Cloud.resendVerify(); toast('Verification email sent.'); } catch (e) { toast(e.message || 'Could not send it.', { type: 'err' }); } },
  'tv-demo': async () => { await Cloud.verifyNow(); await Cloud.emailVerified(); coachDraw(); toast('Email verified.'); }
});
document.addEventListener('submit', async e => {
  if (e.target.dataset.form !== 'client-add') return;
  e.preventDefault();
  const inp = $('#tc-in'), err = $('#tc-err'), say = m => { err.hidden = false; err.innerHTML = IC.alert + esc(m); inp.focus(); };
  err.hidden = true;
  const code = Cloud.cleanCode(inp.value);
  if (code.length !== 8) return say('Trainer codes have 8 letters and numbers, like K7MQ-2XPD.');
  TR.busy = true;
  try {
    const o = await Cloud.findTrainerCode(code);
    if (!o) { TR.busy = false; return say('No one has that code. Check it with your client.'); }
    await Cloud.requestTrainee(o);
    TR.busy = false; toast(`Request sent to ${o.name}. They need to accept it in Pulse.`); trReload();
  } catch (x) { TR.busy = false; say(x.message || 'Could not send the request.'); }
});
