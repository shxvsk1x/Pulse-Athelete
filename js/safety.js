/* =========================================================
   PULSE — safety: consent for under-18s, reports, coach <-> student messages
   ========================================================= */

/* ---------- consent for under-18s ---------- */
const minor = (st = S) => !!(st && st.profile && !st.sample && st.profile.age && +st.profile.age < 18);
const consentOK = (st = S) => !minor(st) || !!(st.consent && st.consent.parent && st.consent.verified);
/* nothing is shared with coaches or trainers until a parent or guardian agrees */
const _progressDocs = progressDocs;
progressDocs = function (st) { return consentOK(st) ? _progressDocs(st) : []; };
const _progressBase = progressBase;
progressBase = function (st) { const b = _progressBase(st); b.consent = st.consent ? { at: st.consent.at, by: 'parent' } : null; return b; };
const _coachDetail = coachDetail;
coachDetail = function (st, p) {
  const d = _coachDetail(st, p), pf = st.painFlags || {};
  d.pain = Object.keys(pf).filter(a => pf[a] >= iso(addDays(new Date(), -14)));
  const since = iso(addDays(new Date(), -7));
  d.mealPhotos = { week: (st.mealPics || []).filter(m => m.date >= since).length, total: st.mealPhotoCount || 0 };
  return d;
};

/* Consent is real only when a parent has approved from their own verified Pulse account (parentConsents/{child}). */
const PC = { t: 0 };
const maskEmail = e => String(e || '').replace(/^(.).*(@.*)$/, '$1•••$2');
async function consentSync(force) {
  const u = Cloud.user;
  if (!u || u.role !== 'student' || !minor() || (!force && Date.now() - PC.t < 120000)) return null;
  PC.t = Date.now();
  let d = null; try { d = await Cloud.gget('parentConsents', u.uid); } catch (e) { return null; }
  PC.doc = d;
  const was = consentOK();
  if (d && d.status === 'granted') { if (!was || !S.consent.verified) { S.consent = { at: d.at || Date.now(), by: 'parent', parent: d.parentName || 'Parent', verified: true, ver: 2 }; save(); Sync.lastTr = ''; Sync.now(); if (UI.view) refresh(); } }
  else if (S.consent) { delete S.consent; S.boardConsent = false; save(); Sync.now(); try { await boardWithdraw(); } catch (e) {} if (UI.view) refresh(); }
  return d;
}
async function consentModal() {
  const u = Cloud.user;
  if (!u || u.role !== 'student') { toast('Create your Pulse account first. A parent then approves it from their own email.', { type: 'err' }); return; }
  const d = await consentSync(true);
  const pending = d && d.status === 'pending', declined = d && (d.status === 'declined' || d.status === 'revoked');
  openModal({ title: 'Ask a parent or guardian', size: 520,
    sub: `${esc(S.profile.name || 'You')} is under 18. Until a parent or guardian approves, Pulse keeps everything on this device: nothing goes to coaches, a personal trainer, or the leaderboard.`,
    body: pending ? `<p>Waiting for approval from <b>${esc(maskEmail(d.parentEmail))}</b>.</p><ol class="muted" style="font-size:13.5px;padding-left:18px"><li>Your parent opens Pulse and taps <b>I’m a parent</b> on the sign-up page.</li><li>They sign up with that email and verify it from the link we email them.</li><li>They open Requests and approve.</li></ol><p class="muted" style="font-size:13px">Then tap Check now here.</p>`
      : `${declined ? `<p class="err">${d.status === 'revoked' ? 'Your parent withdrew approval.' : 'Your parent declined.'} You can ask again.</p>` : ''}<div class="field"><label for="cn-email">Parent or guardian’s email</label><input class="input" id="cn-email" type="email" autocomplete="off" placeholder="parent@example.com" maxlength="80"></div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">They need their own free Pulse parent account with this email, verified by a link we send. They can withdraw approval any time. Use their own email address, not yours.</p><p class="err" id="cn-err" role="alert" hidden></p>`,
    actions: pending ? [{ label: 'Close' }, { label: 'Cancel request', fn: async () => { try { await Cloud.gdel('parentConsents', u.uid); PC.doc = null; toast('Request cancelled.'); } catch (e) { toast(e.message, { type: 'err' }); } } }, { label: 'Check now', kind: 'btn-primary', fn: async () => { const x = await consentSync(true); toast(x && x.status === 'granted' ? 'Approved. Thank you.' : 'Not approved yet.'); } }]
      : [{ label: 'Cancel' }, { label: 'Send request', kind: 'btn-primary', fn: async () => {
        const em = $('#cn-email').value.trim().toLowerCase(), e = $('#cn-err');
        if (!Cloud.validEmail(em)) { e.hidden = false; e.textContent = 'Enter a valid email address.'; return false; }
        if (em === String(u.email).toLowerCase()) { e.hidden = false; e.textContent = 'That is your own email. Use your parent’s or guardian’s.'; return false; }
        try { if (d) await Cloud.gdel('parentConsents', u.uid); await Cloud.gput('parentConsents', u.uid, { child: u.uid, childName: u.name, school: u.school || '', parentEmail: em, status: 'pending', at: Date.now() }); PC.t = 0; toast('Request saved. Ask your parent to sign up as a parent with that email.'); }
        catch (x) { e.hidden = false; e.textContent = x.message || 'Could not send.'; return false; }
      } }] });
}
function consentBanner() {
  if (consentOK() || S.sample) return '';
  return `<section class="card card-pad c-12" style="border-color:var(--warn,#d9a400)"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="acct-ic">${IC.shield}</span><div style="flex:1;min-width:220px"><b>Parent or guardian consent needed</b><p class="muted" style="font-size:13.5px;margin-top:2px">Nothing is shared with coaches, trainers or the leaderboard until a parent or guardian agrees.</p></div><button class="btn btn-primary btn-sm" data-act="consent">Ask a parent</button></div></section>`;
}
const _today = VIEWS.today; VIEWS.today = () => { const h = _today(), b = consentBanner() + msgBanner(); if (!b) return h; const i = h.indexOf('<div class="dash'); return i < 0 ? b + h : h.replace(/(<div class="dash[^>]*>)/, '$1' + b); };
const _coachV = VIEWS.coach; VIEWS.coach = () => { const h = _coachV(), b = consentBanner() + inboxCard(); if (!b) return h; return h.replace(/(<div class="dash[^>]*>)/, '$1' + b); };

/* ---------- reports ---------- */
const REPORT_KINDS = ['A message I got', 'A person', 'A leaderboard entry', 'Something unsafe or inappropriate', 'A problem with my data or privacy', 'Something else'];
function reportModal(ctx = {}) {
  const u = Cloud.user;
  if (!u) { toast('Log in to send a report. It goes to your school’s admin.', { type: 'err' }); return; }
  const m = openModal({ title: 'Report a problem', sub: 'This goes to the Pulse admins, not to the person you are reporting. Tell us what happened.', size: 520,
    body: `<div class="field"><label for="rp-kind">What is it about?</label><select class="input" id="rp-kind">${REPORT_KINDS.map(k => `<option ${ctx.kind === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select></div>
    ${ctx.aboutName ? `<p class="muted" style="font-size:13px">About: <b>${esc(ctx.aboutName)}</b></p>` : ''}
    <div class="field" style="margin-top:10px"><label for="rp-text">What happened?</label><textarea class="input" id="rp-text" rows="4" maxlength="800"></textarea></div><p class="err" id="rp-err" role="alert" hidden></p>
    <p class="muted" style="font-size:12.5px;margin-top:8px">If someone is in danger right now, tell a trusted adult or call your local emergency number first.</p>`,
    actions: [{ label: 'Cancel' }, { label: 'Send report', kind: 'btn-primary', fn: async () => {
      const text = $('#rp-text').value.trim(), e = $('#rp-err');
      if (text.length < 5) { e.hidden = false; e.textContent = 'Please say a little more.'; return false; }
      try { await Cloud.gput('reports', 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), { by: u.uid, byName: u.name, role: u.role, school: u.school || '', kind: $('#rp-kind').value, about: ctx.about || '', aboutName: ctx.aboutName || '', text, at: Date.now(), status: 'open' }); toast('Report sent. Thank you.'); }
      catch (x) { e.hidden = false; e.textContent = x.message || 'Could not send. Try again.'; return false; }
    } }] });
}
const reportBtn = (ctx, label = 'Report') => `<button class="btn btn-quiet btn-sm" data-act="report" data-ctx='${esc(JSON.stringify(ctx || {}))}'>${IC.alert}${label}</button>`;

/* ---------- messages: coach <-> student of the same school ---------- */
const MSG = { list: [], loaded: false, t: 0 };
async function msgLoad() {
  const u = Cloud.user; if (!u || !u.school || MSG.loading) return; MSG.loading = true;
  try { const [a, b] = await Promise.all([Cloud.gquery('messages', [['to', u.uid]]), Cloud.gquery('messages', [['from', u.uid]])]); MSG.list = a.concat(b).sort((x, y) => y.at - x.at); MSG.loaded = true; MSG.t = Date.now(); } catch (e) { /* offline: keep what we have */ }
  MSG.loading = false;
}
const unread = () => MSG.list.filter(m => m.to === (Cloud.user && Cloud.user.uid) && !m.read).length;
function msgBanner() {
  if (!Cloud.user || Cloud.user.role !== 'student' || !consentOK()) return '';
  const n = unread(); if (!n) return '';
  return `<section class="card card-pad c-12"><div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><span class="acct-ic acc">${IC.chat}</span><div style="flex:1"><b>${plural(n, 'new message')} from your coach</b></div><a class="btn btn-primary btn-sm" href="#/coach">Read</a></div></section>`;
}
function msgModal(to, toName, replyTo) {
  const u = Cloud.user;
  const m = openModal({ title: 'Message ' + esc(toName), sub: u.role === 'coach' ? 'Only this student and coaches at your school can see it.' : 'Only your coach can see it. Keep it about training.', size: 500,
    body: `<div class="field"><label for="mg-text">Message</label><textarea class="input" id="mg-text" rows="4" maxlength="600"></textarea></div><p class="err" id="mg-err" role="alert" hidden></p>`,
    actions: [{ label: 'Cancel' }, { label: 'Send', kind: 'btn-primary', fn: async () => {
      const text = $('#mg-text').value.trim(), e = $('#mg-err');
      if (!text) { e.hidden = false; e.textContent = 'Write something first.'; return false; }
      try { await Cloud.gput('messages', 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), { school: u.school, from: u.uid, fromName: u.name, fromRole: u.role, to, toName, text, at: Date.now(), read: false }); toast('Sent.'); await msgLoad(); if (UI.screen === 'coach') coachDraw(); else refresh(); }
      catch (x) { e.hidden = false; e.textContent = x.message || 'Could not send.'; return false; }
    } }] });
}
function thread(m) { const u = Cloud.user; return `<li class="msg ${m.from === u.uid ? 'mine' : ''}"><div style="min-width:0;flex:1"><div class="nm">${m.from === u.uid ? 'You to ' + esc(m.toName) : esc(m.fromName)} <span class="muted" style="font-weight:400;font-size:12px">· ${new Date(m.at).toLocaleString('en', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}${m.to === u.uid && !m.read ? ' · new' : ''}</span></div><div style="white-space:pre-wrap;overflow-wrap:anywhere;margin-top:2px">${esc(m.text)}</div></div>
  ${m.from !== u.uid ? `<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-ghost btn-sm" data-act="msg-reply" data-to="${esc(m.from)}" data-name="${esc(m.fromName)}">Reply</button>${reportBtn({ kind: 'A message I got', about: m.from, aboutName: m.fromName }, 'Report')}</div>` : ''}</li>`; }
function inboxCard() {
  const u = Cloud.user; if (!u || u.role !== 'student' || !u.school || S.sample) return '';
  if (!MSG.loaded) { msgLoad().then(() => { if (UI.view === 'coach') refresh(); }); return ''; }
  const mine = MSG.list.slice(0, 12);
  Promise.all(MSG.list.filter(m => m.to === u.uid && !m.read).map(m => Cloud.gput('messages', m.id, { read: true }, true).then(() => { m.read = true; }).catch(() => {}))).catch(() => {});
  if (!mine.length) return '';
  return `<section class="card c-12"><div class="card-h"><h3>Messages</h3><span class="label">You and your coaches</span></div><div class="card-b"><ul class="supp-list">${mine.map(thread).join('')}</ul></div></section>`;
}
setInterval(() => { const u = Cloud.user; if (u && u.school && document.visibilityState === 'visible' && Date.now() - MSG.t > 110000) msgLoad().then(() => { if (u.role === 'student' && UI.view === 'today') refresh(); }); }, 60000);

/* ---------- profile: consent + report ---------- */
const _profile2 = VIEWS.profile;
VIEWS.profile = () => {
  const h = _profile2(), m = '<p class="muted c-12" style="font-size:12.5px;max-width:60em">Pulse gives general';
  if (S.sample) return h;
  const card = `<section class="card c-12"><div class="card-h"><h3>Safety and sharing</h3></div><div class="card-b settings">
    ${minor() ? `<div class="set-row"><div><b>Parent or guardian consent</b><span>${consentOK() ? 'Given' + (S.consent.parent ? ' by ' + esc(S.consent.parent) : '') + ' on ' + fmtDate(new Date(S.consent.at)) + '. Coaches at your school can follow your progress.' : 'Not given yet. Nothing is shared with coaches, trainers or the leaderboard.'}</span></div>${consentOK() ? '<button class="btn btn-ghost btn-sm" data-act="consent-withdraw">Withdraw</button>' : '<button class="btn btn-primary btn-sm" data-act="consent">Ask a parent</button>'}</div>` : ''}
    <div class="set-row"><div><b>Report a problem</b><span>A message, a person, a leaderboard entry, or anything that feels unsafe. It goes to the Pulse admins.</span></div>${reportBtn({}, 'Report')}</div></div></section>`;
  return h.includes(m) ? h.replace(m, card + m) : h;
};

Object.assign(ACT, {
  consent: () => consentModal(),
  'consent-withdraw': () => confirmModal({ title: 'Withdraw consent?', sub: 'Pulse stops sharing with coaches and trainers right away and removes any leaderboard entries. Your plan and logs stay on your own account.', confirm: 'Withdraw', onConfirm: async () => {
    delete S.consent; S.boardConsent = false; save(); Sync.lastTr = ''; try { await Cloud.gdel('parentConsents', Cloud.user.uid); PC.doc = null; } catch (e) {} try { if (typeof boardWithdraw === 'function') await boardWithdraw(); } catch (e) {} Sync.now(); refresh(); toast('Consent withdrawn. Nothing is shared now.'); } }),
  report: el => { let c = {}; try { c = JSON.parse(el.dataset.ctx || '{}'); } catch (e) {} reportModal(c); },
  'msg-reply': el => msgModal(el.dataset.to, el.dataset.name),
  'msg-to': el => msgModal(el.dataset.to, el.dataset.name)
});
/* trainer link must not be accepted by an under-18 without consent */
const _trAccept = ACT['tr-accept']; ACT['tr-accept'] = el => { if (!consentOK()) { consentModal(); return; } return _trAccept(el); };

setTimeout(() => consentSync(true), 2500); setInterval(() => consentSync(), 150000);
setTimeout(() => { if (Cloud.user && Cloud.user.school) msgLoad().then(() => { if (UI.view === 'today') refresh(); }); }, 3000);
