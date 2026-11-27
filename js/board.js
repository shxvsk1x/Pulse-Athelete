/* =========================================================
   PULSE — lift leaderboard. A lift only appears after a coach has verified it.
   Others see name, school, grade, exercise and weight. Never the video.
   ========================================================= */
const BD = { mine: [], rows: [], ex: '', scope: 'school', loaded: false, loading: false, err: '' };
/* only lifts where the number is a weight on a bar, dumbbell, kettlebell or machine */
const boardExercises = () => [...new Set(EX.filter(e => isLoaded(e) && e.eq.some(g => g.some(x => /barbell|dumbbell|kettlebell|machine|cable|trap/i.test(x))) && !/assisted|band|wheel|ladder/i.test(e.n)).map(e => e.n))].sort();
const kgFmt = n => (Math.round(n * 10) / 10) + ' kg';

async function boardLoad() {
  const u = Cloud.user; if (!u || BD.loading) return; BD.loading = true;
  try {
    BD.mine = (await Cloud.gquery('lifts', [['uid', u.uid]])).sort((a, b) => b.at - a.at);
    if (!BD.ex) BD.ex = (BD.mine.find(l => l.status === 'verified') || {}).ex || boardExercises().find(n => /squat|bench|deadlift/i.test(n)) || boardExercises()[0] || '';
    BD.rows = BD.ex ? await Cloud.gquery('board', [['ex', BD.ex]]) : [];
    BD.err = ''; BD.loaded = true;
  } catch (e) { BD.err = e.message || 'Could not load the leaderboard.'; BD.loaded = true; }
  BD.loading = false;
}
function boardRows() {
  const p = S.profile, u = Cloud.user;
  let r = BD.rows.slice();
  if (BD.scope === 'school') r = r.filter(x => x.school === p.school);
  else if (BD.scope === 'grade') r = r.filter(x => x.school === p.school && String(x.grade) === String(p.grade));
  else if (BD.scope === 'allgrade') r = r.filter(x => String(x.grade) === String(p.grade));
  return r.sort((a, b) => b.kg - a.kg || (b.reps || 1) - (a.reps || 1) || a.at - b.at);
}
const STATUS_PILL = { pending: ['', 'Waiting for coach'], verified: ['good', 'Verified'], rejected: ['bad', 'Not verified'] };

VIEWS.board = () => {
  const u = Cloud.user, p = S.profile;
  if (S.sample) return `<div class="ph"><div><div class="label">Leaderboard</div><h2 style="margin-top:8px">Heaviest <em>lifts.</em></h2><p>Create your own account to claim a lift and get on the board.</p></div></div>`;
  if (!u || u.role !== 'student') return `<div class="ph"><div><div class="label">Leaderboard</div><h2 style="margin-top:8px">Heaviest <em>lifts.</em></h2><p>Create an account and choose your school to join the leaderboard.</p></div><div class="ph-actions"><a class="btn btn-primary" href="#/signup">Create an account</a></div></div>`;
  if (!BD.loaded) { boardLoad().then(() => { if (UI.view === 'board') refresh(); }); return `<div class="empty" style="padding:80px 8px"><span class="spin lg"></span><h4>Loading the leaderboard…</h4></div>`; }
  const rows = boardRows(), exs = boardExercises();
  const scopes = [['school', 'My school'], ['grade', 'My grade'], ['allgrade', 'My grade, all schools'], ['all', 'All schools']];
  const blocked = !consentOK();
  return `<div class="ph"><div><div class="label">Verified lifts only</div><h2 style="margin-top:8px">Heaviest <em>lifts.</em></h2><p>A lift counts once a coach has seen you do it. Others see your name, school, grade and the weight. Never a video.</p></div>
      <div class="ph-actions"><button class="btn btn-primary" data-act="lift-claim" ${blocked ? 'disabled' : ''}>${IC.medal}Claim a lift</button></div></div>
    ${blocked ? consentBanner() : ''}
    <div class="dash stagger">
      <section class="card c-8"><div class="card-h"><h3>Leaderboard</h3><span class="label">${rows.length} ${rows.length === 1 ? 'lift' : 'lifts'}</span></div><div class="card-b">
        <div class="coach-filters" style="margin-bottom:12px"><select class="input" id="bd-ex" style="width:auto;max-width:100%" aria-label="Exercise">${exs.map(n => `<option ${n === BD.ex ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
          <div class="chips">${scopes.map(([k, l]) => `<button class="chip sm" data-act="bd-scope" data-v="${k}" aria-pressed="${BD.scope === k}">${l}</button>`).join('')}</div></div>
        ${BD.err ? `<p class="err">${esc(BD.err)}</p>` : rows.length ? `<ol class="lb">${rows.map((r, i) => `<li class="${r.uid === u.uid ? 'me' : ''}"><span class="rk">${i + 1}</span><div style="min-width:0;flex:1"><b>${esc(r.name)}${r.uid === u.uid ? ' (you)' : ''}</b><span class="muted" style="display:block;font-size:12.5px">${esc(Cloud.schoolName(r.school, r.schoolName))}${r.grade ? ' · Grade ' + esc(r.grade) : ''}</span></div><div style="text-align:right"><b>${kgFmt(r.kg)}</b>${r.reps > 1 ? `<span class="muted" style="display:block;font-size:12.5px">× ${r.reps}</span>` : ''}</div>${r.uid !== u.uid ? reportBtn({ kind: 'A leaderboard entry', about: r.uid, aboutName: r.name + ' · ' + r.ex }, '') : ''}</li>`).join('')}</ol>`
          : `<div class="empty"><h4>No verified lifts here yet</h4><p>Be the first. Claim a lift and ask your coach to verify it.</p></div>`}</div></section>
      <section class="card c-4"><div class="card-h"><h3>Your lifts</h3></div><div class="card-b">
        <div class="set-row" style="margin-bottom:10px"><div><b>Show my name on the board</b><span>Name, school, grade and weight. You can turn it off any time and your entries disappear.</span></div><button class="switch" role="switch" aria-checked="${!!S.boardConsent}" data-act="bd-toggle" aria-label="Show my name on the leaderboard"></button></div>
        ${BD.mine.length ? `<ul class="supp-list">${BD.mine.slice(0, 8).map(l => { const [c, t] = STATUS_PILL[l.status] || ['', l.status]; return `<li><div style="min-width:0"><div class="nm">${esc(l.ex)}</div><div class="mac">${kgFmt(l.kg)}${l.reps > 1 ? ' × ' + l.reps : ''} · ${l.method === 'video' ? 'video' : 'coach watched'}${l.status === 'rejected' && l.reason ? ' · ' + esc(l.reason) : ''}</div></div><span class="pill ${c}">${t}</span></li>`; }).join('')}</ul>` : `<p class="muted" style="font-size:13.5px">Nothing yet. Claim your first lift.</p>`}</div></section>
    </div>`;
};

function claimModal() {
  const exs = boardExercises(), p = S.profile;
  if (!p.school) { toast('Add your school in Profile first.', { type: 'err' }); return; }
  openModal({ title: 'Claim a lift', sub: 'Your coach has to verify it before it shows on the board.', size: 540,
    body: `<div class="field"><label for="lc-ex">Exercise</label><select class="input" id="lc-ex">${exs.map(n => `<option ${n === BD.ex ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
    <div style="display:flex;gap:10px;margin-top:10px"><div class="field" style="flex:1"><label for="lc-kg">Weight (kg)</label><input class="input" id="lc-kg" type="number" inputmode="decimal" min="1" max="600" step="0.5"></div><div class="field" style="flex:1"><label for="lc-reps">Reps</label><input class="input" id="lc-reps" type="number" inputmode="numeric" min="1" max="30" value="1"></div></div>
    <div class="field" style="margin-top:10px"><label>How will your coach check it?</label>
      <label class="chk"><input type="radio" name="lc-m" value="live" checked><span>My coach will watch me do it</span></label>
      <label class="chk"><input type="radio" name="lc-m" value="video"><span>I will send a video link (unlisted YouTube, Drive or similar). Only your coaches can see it.</span></label></div>
    <div class="field" id="lc-url-w" hidden><label for="lc-url">Video link</label><input class="input" id="lc-url" type="url" placeholder="https://" maxlength="300"></div>
    <label class="chk" style="margin-top:12px"><input type="checkbox" id="lc-ok" ${S.boardConsent ? 'checked' : ''}><span>Show my name, school, grade and this weight on the leaderboard once it is verified. My video is never shown to anyone except my coaches.</span></label><p class="err" id="lc-err" role="alert" hidden></p>`,
    onOpen: m => { m.querySelectorAll('[name=lc-m]').forEach(r => r.onchange = () => { $('#lc-url-w').hidden = m.querySelector('[name=lc-m]:checked').value !== 'video'; }); },
    actions: [{ label: 'Cancel' }, { label: 'Send to my coach', kind: 'btn-primary', fn: async () => {
      const u = Cloud.user, e = $('#lc-err'), kg = parseFloat($('#lc-kg').value), reps = parseInt($('#lc-reps').value, 10) || 1, method = document.querySelector('[name=lc-m]:checked').value, url = $('#lc-url').value.trim();
      const bad = m => { e.hidden = false; e.textContent = m; return false; };
      if (!(kg > 0 && kg <= 600)) return bad('Enter the weight in kg.');
      if (method === 'video' && !/^https:\/\/[^\s]+$/.test(url)) return bad('Paste a link that starts with https://');
      if (!$('#lc-ok').checked) return bad('Tick the box to say you are happy to be shown on the leaderboard. Without it we cannot add you.');
      const id = 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      try {
        await Cloud.gput('lifts', id, { uid: u.uid, name: u.name, school: p.school, schoolName: Cloud.schoolName(p.school, p.schoolName), grade: String(p.grade || ''), ex: $('#lc-ex').value, kg, reps, method, status: 'pending', consent: true, at: Date.now() });
        if (method === 'video') await Cloud.gput('liftProof', id, { uid: u.uid, school: p.school, url });
        S.boardConsent = true; save(); BD.loaded = false; toast('Sent. Your coach will verify it.'); if (UI.view === 'board') refresh();
      } catch (x) { return bad(x.message || 'Could not send.'); }
    } }] });
}
/* turning the board off, or withdrawing consent, removes every entry and stops pending ones from being posted */
async function boardWithdraw() {
  const u = Cloud.user; if (!u) return;
  const [b, l] = await Promise.all([Cloud.gquery('board', [['uid', u.uid]]), Cloud.gquery('lifts', [['uid', u.uid]])]);
  await Promise.all(b.map(x => Cloud.gdel('board', x.id)).concat(l.filter(x => x.consent).map(x => Cloud.gput('lifts', x.id, { consent: false }, true))));
}
/* turning it back on re-posts the best verified lift per exercise */
async function boardRepost() {
  const u = Cloud.user, p = S.profile, best = {};
  (await Cloud.gquery('lifts', [['uid', u.uid]])).filter(l => l.status === 'verified').forEach(l => { if (!best[l.ex] || l.kg > best[l.ex].kg) best[l.ex] = l; });
  await Promise.all(Object.values(best).map(l => Cloud.gput('lifts', l.id, { consent: true }, true).then(() => Cloud.gput('board', l.ex + '_' + u.uid, { ex: l.ex, uid: u.uid, liftId: l.id, name: u.name, school: l.school, schoolName: l.schoolName || '', grade: l.grade, kg: l.kg, reps: l.reps, at: l.at, verifiedBy: l.verifiedBy || '', consent: true }))));
}

/* ---------- coach: verify lifts ---------- */
const LF = { rows: [], loaded: false, loading: false, err: '' };
async function liftsLoad() { LF.loading = true; try { LF.rows = (await Cloud.gquery('lifts', [['school', Cloud.user.school]])).sort((a, b) => b.at - a.at); LF.err = ''; } catch (e) { LF.err = e.message; } LF.loaded = true; LF.loading = false; }
function coachLifts() {
  if (!LF.loaded) { if (!LF.loading) liftsLoad().then(() => { if (UI.coachView === 'lifts') coachDraw(); }); return `<div class="empty" style="padding:60px 8px"><span class="spin lg"></span><h4>Loading lifts…</h4></div>`; }
  const open = LF.rows.filter(l => l.status === 'pending'), done = LF.rows.filter(l => l.status !== 'pending').slice(0, 15);
  const row = l => `<li><span class="supp-ic">${IC.medal}</span><div style="min-width:0;flex:1"><div class="nm">${esc(l.name)} · ${esc(l.ex)}</div><div class="mac">${kgFmt(l.kg)}${l.reps > 1 ? ' × ' + l.reps : ''}${l.grade ? ' · grade ' + esc(l.grade) : ''} · ${l.method === 'video' ? 'sent a video' : 'will do it in front of you'}${l.consent ? '' : ' · does not want to be listed'}</div></div>
    ${l.status === 'pending' ? `<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-primary btn-sm" data-act="lift-review" data-id="${esc(l.id)}">Review</button></div>` : `<span class="pill ${STATUS_PILL[l.status][0]}">${STATUS_PILL[l.status][1]}</span>`}</li>`;
  return `<div class="ph"><div><div class="label">${esc(Cloud.schoolName(Cloud.user.school))}</div><h2 style="margin-top:8px">Verify <em>lifts.</em></h2><p>Only verify a lift you saw yourself, or a video where you can tell it is the student named. Videos stay with the coaches and are never shown on the board.</p></div></div>
    <div class="dash"><section class="card c-12"><div class="card-h"><h3>Waiting for you</h3><span class="pill ${open.length ? 'acc' : ''}">${open.length}</span></div><div class="card-b">${open.length ? `<ul class="supp-list">${open.map(row).join('')}</ul>` : `<p class="muted">Nothing waiting.</p>`}</div></section>
    ${done.length ? `<section class="card c-12"><div class="card-h"><h3>Recently decided</h3></div><div class="card-b"><ul class="supp-list">${done.map(row).join('')}</ul></div></section>` : ''}</div>`;
}
async function liftReview(id) {
  const l = LF.rows.find(x => x.id === id); if (!l) return; let proof = null;
  if (l.method === 'video') { try { proof = await Cloud.gget('liftProof', id); } catch (e) {} }
  openModal({ title: `${esc(l.name)}: ${esc(l.ex)} ${kgFmt(l.kg)}${l.reps > 1 ? ' × ' + l.reps : ''}`, sub: l.method === 'video' ? 'Watch the video, then decide.' : 'They said you will watch them do it. Verify only after you have seen it.', size: 540,
    body: `${l.method === 'video' ? (proof && /^https:\/\//.test(proof.url) ? `<p><a class="btn btn-ghost btn-sm" href="${esc(proof.url)}" target="_blank" rel="noopener noreferrer">${IC.external}Open the video</a></p>` : '<p class="muted">The video link could not be loaded.</p>') : ''}
    <label class="chk" style="margin-top:12px"><input type="checkbox" id="lv-ok"><span>I saw ${esc(l.name)} do this lift at this weight, and it is the person named.</span></label>
    <div class="field" style="margin-top:12px"><label for="lv-why">If you are rejecting it, say why (shown to the student)</label><input class="input" id="lv-why" maxlength="120" placeholder="e.g. depth was short, ask to redo"></div><p class="err" id="lv-err" role="alert" hidden></p>`,
    actions: [{ label: 'Close' }, { label: 'Reject', fn: async () => {
      const why = $('#lv-why').value.trim(), e = $('#lv-err'); if (!why) { e.hidden = false; e.textContent = 'Add a short reason.'; return false; }
      try { await Cloud.gput('lifts', id, { status: 'rejected', reason: why, verifiedBy: Cloud.user.uid, decidedAt: Date.now() }, true); l.status = 'rejected'; l.reason = why; coachDraw(); } catch (x) { e.hidden = false; e.textContent = x.message; return false; }
    } }, { label: 'Verify', kind: 'btn-primary', fn: async () => {
      const e = $('#lv-err'); if (!$('#lv-ok').checked) { e.hidden = false; e.textContent = 'Tick the box to confirm you saw it.'; return false; }
      try {
        const u = Cloud.user, now = Date.now();
        const fresh = await Cloud.gget('lifts', id); if (fresh && fresh.status !== 'pending') { toast('Someone already decided this.'); return; }
        await Cloud.gput('lifts', id, { status: 'verified', verifiedBy: u.uid, verifiedByName: u.name, decidedAt: now }, true); l.status = 'verified';
        if (fresh && fresh.consent !== false && l.consent) {
          const key = l.ex + '_' + l.uid, cur = await Cloud.gget('board', key);
          if (!cur || l.kg > cur.kg || (l.kg === cur.kg && l.reps > (cur.reps || 1))) await Cloud.gput('board', key, { ex: l.ex, uid: l.uid, liftId: id, name: l.name, school: l.school, schoolName: l.schoolName || '', grade: l.grade, kg: l.kg, reps: l.reps, at: now, verifiedBy: u.uid, consent: true });
        }
        coachDraw(); toast('Verified.');
      } catch (x) { e.hidden = false; e.textContent = x.message || 'Could not save.'; return false; }
    } }] });
}

Object.assign(ACT, {
  'lift-claim': () => claimModal(),
  'lift-review': el => liftReview(el.dataset.id),
  'bd-scope': el => { BD.scope = el.dataset.v; refresh(); },
  'bd-toggle': async () => {
    if (!consentOK()) { consentModal(); return; }
    S.boardConsent = !S.boardConsent; save();
    try { if (S.boardConsent) await boardRepost(); else await boardWithdraw(); BD.loaded = false; toast(S.boardConsent ? 'You are on the leaderboard again.' : 'Removed from the leaderboard.'); } catch (e) { toast(e.message || 'Could not update.', { type: 'err' }); }
    refresh();
  }
});
document.addEventListener('change', e => { if (e.target.id === 'bd-ex') { BD.ex = e.target.value; BD.loaded = false; refresh(); } });
COACH_EXTRA.lifts = coachLifts;
