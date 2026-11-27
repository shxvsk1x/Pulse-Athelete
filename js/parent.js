/* =========================================================
   PULSE — parent account: verify email, approve or withdraw a child's consent
   ========================================================= */
const PR = { rows: [], loaded: false, loading: false, err: '' };
async function parentLoad() {
  PR.loading = true;
  try { PR.rows = (await Cloud.gquery('parentConsents', [['parentEmail', String(Cloud.user.email).toLowerCase()]])).sort((a, b) => b.at - a.at); PR.err = ''; }
  catch (e) { PR.err = e.message || 'Could not load.'; }
  PR.loaded = true; PR.loading = false;
}
const parentVerified = () => Cloud.mode === 'firebase' ? !!Cloud.user.emailVerified : Cloud.user.verified !== false;
function parentRequests() {
  const u = Cloud.user, ok = parentVerified();
  if (ok && !PR.loaded) { if (!PR.loading) parentLoad().then(() => { if (UI.coachView === 'requests') coachDraw(); }); return `<div class="empty" style="padding:60px 8px"><span class="spin lg"></span><h4>Loading…</h4></div>`; }
  const verifyCard = ok ? '' : `<section class="card" style="margin-bottom:16px"><div class="acct"><span class="acct-ic">${IC.alert}</span><div><b>Verify your email first</b><p>We sent a link to <b>${esc(u.email)}</b>. Open it, then tap the button. Pulse only accepts approvals from a verified email.</p>
    <div class="acct-acts">${Cloud.mode === 'firebase' ? '<button class="btn btn-quiet" data-act="tv-resend">Send again</button>' : '<button class="btn btn-ghost" data-act="pv-demo">Simulate the email link</button>'}<button class="btn btn-primary" data-act="pv-check">I have verified</button></div></div></div></section>`;
  const pill = { pending: ['', 'Waiting for you'], granted: ['good', 'Approved'], declined: ['bad', 'Declined'], revoked: ['bad', 'Withdrawn'] };
  const row = r => `<li><span class="supp-ic">${IC.shield}</span><div style="min-width:0;flex:1"><div class="nm">${esc(r.childName)}</div><div class="mac">${new Date(r.at).toLocaleDateString()} · <span class="pill ${pill[r.status][0]}">${pill[r.status][1]}</span></div></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${r.status === 'granted' ? `<button class="btn btn-ghost btn-sm" data-act="pr-set" data-id="${esc(r.id)}" data-s="revoked">Withdraw approval</button>` : r.status === 'pending' ? `<button class="btn btn-primary btn-sm" data-act="pr-approve" data-id="${esc(r.id)}">Review</button>` : ''}</div></li>`;
  return `<div class="ph"><div><div class="label">Parent or guardian</div><h2 style="margin-top:8px">Your child’s <em>approval.</em></h2><p>A student under 18 can share progress with coaches only after you approve it here. You can withdraw at any time.</p></div></div>
    ${verifyCard}<div class="dash"><section class="card c-12"><div class="card-h"><h3>Requests to ${esc(u.email)}</h3><button class="btn btn-quiet btn-sm" data-act="pr-reload">${IC.reset}Refresh</button></div><div class="card-b">
    ${!ok ? '<p class="muted">Verify your email to see requests.</p>' : PR.err ? `<p class="err">${esc(PR.err)}</p>` : PR.rows.length ? `<ul class="supp-list">${PR.rows.map(row).join('')}</ul>` : '<div class="empty"><h4>No requests yet</h4><p>Ask your child to open Pulse, go to Profile, and tap Ask a parent. They need to use this email address.</p></div>'}</div></section>
    <section class="card c-12"><div class="card-h"><h3>What approving means</h3></div><div class="card-b"><ul class="priv"><li><span>Shared</span> Coaches at your child’s school, for the sports they play, can see a progress summary: sessions, weigh-ins, food and health notes they chose to log.</li><li><span>Shared</span> A verified lift can appear on the school leaderboard with their name, school, grade and weight, only if your child also agrees there.</li><li><span>Never</span> Their video, meal photos or Ask Pulse chats.</li></ul></div></section></div>`;
}
function parentAccount() {
  const u = Cloud.user;
  return `<div class="ph"><div class="prof-head"><span class="avatar">${esc(initials(u.name))}</span><div><h2>${esc(u.name)}</h2><p style="margin-top:2px">${esc(u.email)}</p></div></div></div>
    <div class="dash"><section class="card c-7"><div class="card-h"><h3>Account</h3></div><div class="card-b settings">
      <div class="set-row"><div><b>Appearance</b><span>Light or dark</span></div><button class="btn btn-ghost btn-sm" data-act="theme">${isDark() ? IC.sun : IC.moon}Switch</button></div>
      <div class="set-row"><div><b>Report a problem</b><span>It goes to the Pulse admins.</span></div>${reportBtn({}, 'Report')}</div>
      <div class="set-row"><div><b>Sign out</b><span>On this device</span></div><button class="btn btn-ghost btn-sm" data-act="sign-out">${IC.logout}Sign out</button></div></div></section></div>`;
}
COACH_EXTRA.requests = parentRequests; COACH_EXTRA.pacct = parentAccount;
Object.assign(ACT, {
  'pv-check': async () => { try { const ok = await Cloud.emailVerified(); toast(ok ? 'Email verified.' : 'Not verified yet. Open the link in the email first.', ok ? {} : { type: 'err' }); PR.loaded = false; coachDraw(); } catch (e) { toast(e.message, { type: 'err' }); } },
  'pv-demo': async () => { await Cloud.verifyNow(); await Cloud.emailVerified(); PR.loaded = false; coachDraw(); toast('Email verified.'); },
  'pr-reload': () => { PR.loaded = false; coachDraw(); },
  'pr-set': async el => { try { await Cloud.gput('parentConsents', el.dataset.id, { status: el.dataset.s, at: Date.now() }, true); PR.loaded = false; coachDraw(); toast('Updated. Coaches lose access the next time your child opens Pulse.'); } catch (e) { toast(e.message || 'Could not update.', { type: 'err' }); } },
  'pr-approve': el => {
    const r = PR.rows.find(x => x.id === el.dataset.id); if (!r) return;
    openModal({ title: `Approve ${esc(r.childName)}?`, size: 520, sub: 'Only approve if you are this child’s parent or legal guardian.',
      body: `<label class="chk"><input type="checkbox" id="pa-ok"><span>I am ${esc(r.childName)}’s parent or guardian. I agree that Pulse may share a progress summary with coaches at their school, and that I can withdraw this at any time.</span></label><p class="err" id="pa-err" role="alert" hidden></p>`,
      actions: [{ label: 'Close' }, { label: 'Decline', fn: async () => { try { await Cloud.gput('parentConsents', r.id, { status: 'declined', at: Date.now() }, true); PR.loaded = false; coachDraw(); } catch (e) { toast(e.message, { type: 'err' }); } } },
        { label: 'Approve', kind: 'btn-primary', fn: async () => { const e = $('#pa-err'); if (!$('#pa-ok').checked) { e.hidden = false; e.textContent = 'Tick the box to confirm.'; return false; }
          try { await Cloud.gput('parentConsents', r.id, { status: 'granted', parentUid: Cloud.user.uid, parentName: Cloud.user.name, at: Date.now() }, true); PR.loaded = false; coachDraw(); toast('Approved. Thank you.'); } catch (x) { e.hidden = false; e.textContent = x.message || 'Could not save.'; return false; } } }] });
  }
});
