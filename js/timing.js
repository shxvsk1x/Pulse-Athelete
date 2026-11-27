/* =========================================================
   PULSE — set timing log
   Every set is timed from the moment the athlete taps Start to the moment they tap Done. Each logged session keeps
   those times, so the athlete (and their coaches) can see how long each set took and whether the work really happened.
   ========================================================= */

/* the quickest a real set of this exercise could plausibly take: about 1.6 s a rep, or most of a timed hold */
function minPlausible(e) {
  const m = String(e.reps || '').match(/\d+/), lo = m ? +m[0] : 8;
  if (/\bs$/.test(e.reps)) return Math.max(10, Math.round(lo * 0.7));
  if (/\bm$/.test(e.reps)) return 4;
  return Math.max(5, Math.round(lo * 1.6));
}
/* the list saved with a session: one row per timed set, in the order they happened */
function buildSetLog(sess, a) {
  const rows = [];
  sess.exs.forEach(e => ((a.t && a.t[e.key]) || []).forEach((t, j) => { if (t && t.sec > 0) rows.push({ n: e.n, set: j + 1, of: e.sets, sec: t.sec, at: t.s, end: t.e, min: minPlausible(e) }); }));
  rows.sort((x, y) => x.at - y.at);
  rows.forEach((r, i) => { const prev = rows[i - 1], gap = prev ? Math.round((r.at - prev.end) / 1000) : null; r.rest = gap != null && gap >= 0 && gap <= 900 ? gap : null; });
  return rows.map(({ end, ...r }) => r);
}
/* totals for one session's set log */
function timingStats(entry) {
  const L = (entry && entry.setLog) || [];
  if (!L.length) return null;
  const work = L.reduce((t, r) => t + r.sec, 0), rests = L.filter(r => r.rest != null), short = L.filter(r => r.sec < r.min);
  return {
    sets: L.length, work, avg: Math.round(work / L.length), longest: Math.max(...L.map(r => r.sec)), shortest: Math.min(...L.map(r => r.sec)),
    avgRest: rests.length ? Math.round(rests.reduce((t, r) => t + r.rest, 0) / rests.length) : null, short: short.length,
    rushed: L.length >= 3 && short.length / L.length >= 0.4
  };
}
const secTxt = s => s == null ? '–' : s >= 120 ? mmss(s) : s + ' s';

/* the Progress page card: every day's sets, newest first */
function timingCard() {
  const days = {}, ss = S.log.sessions.filter(s => s.setLog && s.setLog.length);
  ss.forEach(s => (days[s.date] = days[s.date] || []).push(s));
  const dates = Object.keys(days).sort().reverse().slice(0, 14);
  const body = dates.length ? dates.map(d => {
    const list = days[d], dt = parseIso(d);
    return list.map(s => {
      const st = timingStats(s);
      return `<details class="tl-day"><summary><div class="dte"><b>${dt.getDate()}</b><span>${dt.toLocaleDateString('en', { month: 'short' })}</span></div>
        <div style="min-width:0"><div class="nm">${esc(s.name)}</div><div class="sub">${DAYS[wd(dt)]} · ${plural(st.sets, 'set')} timed · ${secTxt(st.avg)} per set · ${secTxt(st.work)} working${st.avgRest != null ? ' · ' + secTxt(st.avgRest) + ' rest between' : ''}</div></div>
        ${st.rushed ? `<span class="pill warn">Looks rushed</span>` : `<span class="pill good">${IC.check.replace('<svg', '<svg width="12" height="12"')} Real work</span>`}</summary>
        <div class="tl-rows" role="table" aria-label="Set times for ${esc(s.name)} on ${fmtDate(dt)}">${s.setLog.map(r => `<div class="tl-row ${r.sec < r.min ? 'short' : ''}" role="row"><span role="cell">${esc(r.n)}</span><span role="cell">Set ${r.set}</span><b role="cell">${secTxt(r.sec)}</b><span role="cell" class="r">${r.rest != null ? 'rest ' + secTxt(r.rest) : ''}</span>${r.sec < r.min ? `<span role="cell" class="pill warn">Very quick</span>` : ''}</div>`).join('')}
          ${st.rushed ? `<p class="muted" style="font-size:12.5px;margin-top:8px">Several sets took less time than a proper set of that exercise. Slow, controlled reps build more strength, and your coach can see this log.</p>` : ''}</div></details>`;
    }).join('');
  }).join('') : `<div class="empty" style="padding:24px 8px"><div class="glyph">${IC.clock}</div><h4>No timed sets yet</h4><p>In a live session, tap a set to start its timer and tap it again when you finish. Pulse keeps the time of every set here, day by day.</p></div>`;
  return `<section class="card c-12" id="timing-log"><div class="card-h"><h3>${IC.clock.replace('<svg', '<svg class="h-ic"')} Set timing log</h3><span class="label">Seconds per set · last 14 days with sessions</span></div><div class="card-b">${body}</div></section>`;
}
