/* =========================================================
   PULSE — UI kit: icons, toasts, modals, palette, charts
   ========================================================= */

const svg = (d, w = 1.7) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const IC = {
  mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12.5h4l2.2-5.5 3.6 11 2.6-7.5 1.6 2h5"/></svg>',
  today: svg('<circle cx="12" cy="12" r="3.6"/><path d="M12 3v1.6M12 19.4V21M4.6 4.6l1.2 1.2M18.2 18.2l1.2 1.2M3 12h1.6M19.4 12H21M4.6 19.4l1.2-1.2M18.2 5.8l1.2-1.2"/>'),
  plan: svg('<rect x="3.5" y="4.5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2"/>'),
  session: svg('<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>'),
  fuel: svg('<path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z"/><path d="M8.5 8c0-1.3.9-1.8.9-3.2M12 8c0-1.3.9-1.8.9-3.2M15.5 8c0-1.3.9-1.8.9-3.2"/>'),
  progress: svg('<path d="M3.5 20.5h17"/><path d="M5 15.5l4.5-4.5 3.5 3 6.5-6.5"/><path d="M15 7.5h4.5V12"/>'),
  profile: svg('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
  swap: svg('<path d="M7 4 3.5 7.5 7 11M3.5 7.5H16a4 4 0 0 1 4 4M17 20l3.5-3.5L17 13M20.5 16.5H8a4 4 0 0 1-4-4"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 2),
  minus: svg('<path d="M5 12h14"/>', 2),
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>', 2),
  check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 2.4),
  arrow: '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>', 2),
  chevL: svg('<path d="m14.5 6-6 6 6 6"/>', 2),
  chevR: svg('<path d="m9.5 6 6 6-6 6"/>', 2),
  chevD: svg('<path d="m6 9.5 6 6 6-6"/>', 2),
  moon: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>'),
  system: svg('<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  flame: svg('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.5 3.7-8.8.4 1.9 1.4 3 2.6 3.6.3-2.6 1.6-4.8 3.6-6.6.2 3.2 3.1 5.7 3.1 10.1C18.5 18.4 15.9 21 12 21Z"/>'),
  drop: svg('<path d="M12 3.5s6.5 6.6 6.5 11a6.5 6.5 0 0 1-13 0c0-4.4 6.5-11 6.5-11Z"/>'),
  bolt: svg('<path d="M13 2.5 4.5 13.5H12l-1 8 8.5-11H12l1-8Z"/>'),
  play: svg('<path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8Z"/>'),
  skip: svg('<path d="M5 5.5v13l9-6.5-9-6.5ZM18.5 5.5v13"/>'),
  trash: svg('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.9 12.2a1.5 1.5 0 0 0 1.5 1.3h6.2a1.5 1.5 0 0 0 1.5-1.3L17.5 7"/>'),
  download: svg('<path d="M12 3.5v12M7 10.5l5 5 5-5M4.5 20.5h15"/>'),
  upload: svg('<path d="M12 15.5v-12M7 8.5l5-5 5 5M4.5 20.5h15"/>'),
  reset: svg('<path d="M4 4.5v5h5"/><path d="M5.1 14.5A7.5 7.5 0 1 0 6.3 7L4 9.5"/>'),
  medal: svg('<circle cx="12" cy="14.5" r="5.5"/><path d="M8.5 3.5 10.5 9M15.5 3.5 13.5 9M7 3.5h10"/><path d="m12 12 .9 1.7 1.9.3-1.4 1.3.3 1.9-1.7-.9-1.7.9.3-1.9-1.4-1.3 1.9-.3L12 12Z"/>', 1.4),
  info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>'),
  alert: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5.5M12 16.2v.2"/>', 2),
  menu: svg('<path d="M4 8h16M4 16h16"/>'),
  bed: svg('<path d="M3 18.5V6.5M3 14h18v4.5M21 14v-2.5a3 3 0 0 0-3-3h-7.5V14"/><circle cx="6.8" cy="11" r="1.8"/>'),
  target: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>'),
  list: svg('<path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>', 2),
  shuffle: svg('<path d="M3.5 7h3.2c2 0 3.3 1 4.4 2.8l1.8 3.4c1 1.9 2.4 3.8 4.4 3.8h3.2M17.5 4.5 20.5 7l-3 2.5M17.5 14.5l3 2.5-3 2.5M3.5 17h3.2c1.2 0 2.1-.6 2.9-1.5M14.4 8.5c.8-.9 1.7-1.5 2.9-1.5"/>'),
  edit: svg('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>'),
  leaf: svg('<path d="M5 19c0-8 5-13.5 14.5-14-.3 9.5-6 14.5-14 14.5Z"/><path d="M5 19c3-4 6-6.5 9.5-8.5"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
  scale: svg('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0L12 12.5"/>'),
  heart: svg('<path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z"/>'),
  kbd: svg('<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7.5 14h9"/>', 2),
  external: svg('<path d="M14 4.5h5.5V10M19.5 4.5 11 13M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/>'),
  sparkline: svg('<path d="M3 16l4-5 4 3 4-7 6 9"/>')
};

/* ---------- small helpers ---------- */
const fmtN = n => Math.round(n).toLocaleString('en');
const fmt1 = n => (Math.round(n * 10) / 10).toLocaleString('en', { maximumFractionDigits: 1 });
const plural = (n, w, p = w + 's') => `${n} ${n === 1 ? w : p}`;
const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const hms = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const initials = n => (String(n || '?').trim()[0] || '?').toUpperCase();
const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Late night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const raf2 = fn => requestAnimationFrame(() => requestAnimationFrame(fn));

function ring(val, max, size, stroke, color, center, label = '') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, pct = max > 0 ? clamp(val / max, 0, 1) : 0;
  return `<div class="ring" style="width:${size}px;height:${size}px" role="img" aria-label="${esc(label)}"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle class="trk" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/><circle class="val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-off="${c * (1 - pct)}"/></svg><div class="ctr">${center}</div></div>`;
}
function bar(val, max, cls = '') {
  const pct = max > 0 ? clamp(val / max, 0, 1) * 100 : 0;
  return `<div class="bar ${cls} ${val > max * 1.08 && max > 0 ? 'over' : ''}"><i data-w="${pct}"></i></div>`;
}

/* animate rings, bars, counters and segmented thumbs after a render */
function animateIn(root = document) {
  raf2(() => {
    $$('.ring .val[data-off]', root).forEach(c => { c.style.strokeDashoffset = c.dataset.off; });
    $$('.bar i[data-w]', root).forEach(b => { b.style.width = b.dataset.w + '%'; });
  });
  $$('[data-count]', root).forEach(countUp);
  syncSegs(root);
}
function countUp(el) {
  const to = +el.dataset.count, dec = +(el.dataset.dec || 0);
  if (REDUCED || !isFinite(to)) { el.textContent = to.toLocaleString('en', { maximumFractionDigits: dec }); return; }
  const from = +(el.dataset.from || 0), t0 = performance.now(), dur = 900;
  const step = t => { const k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = (from + (to - from) * e).toLocaleString('en', { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function syncSegs(root = document) {
  $$('.seg', root).forEach(seg => {
    let th = seg.querySelector('.thumb');
    const sel = seg.querySelector('[aria-checked="true"],[aria-selected="true"]');
    if (!th) { th = document.createElement('span'); th.className = 'thumb'; th.style.transition = 'none'; seg.prepend(th); raf2(() => th.style.transition = ''); }
    if (!sel) { th.style.opacity = 0; return; }
    th.style.opacity = 1; th.style.width = sel.offsetWidth + 'px'; th.style.transform = `translateX(${sel.offsetLeft}px)`;
  });
}
addEventListener('resize', () => syncSegs());

/* ---------- toasts ---------- */
function toast(msg, opts = {}) {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast' + (opts.type === 'err' ? ' err' : '');
  el.innerHTML = `<span class="ti">${opts.type === 'err' ? IC.alert : opts.icon || IC.check}</span><span class="msg">${msg}</span>${opts.action ? `<button type="button">${esc(opts.action.label)}</button>` : ''}`;
  let done = false;
  const close = () => { if (done) return; done = true; el.classList.add('out'); setTimeout(() => el.remove(), 260); };
  if (opts.action) el.querySelector('button').onclick = () => { opts.action.fn(); close(); };
  box.appendChild(el);
  while (box.children.length > 3) box.firstElementChild.remove();
  setTimeout(close, opts.ms || (opts.action ? 6000 : 3200));
  return close;
}

/* ---------- modal ---------- */
let modalStack = [];
function openModal({ title, sub = '', body = '', actions = [], onOpen, size, label }) {
  const layer = $('#layer');
  const prev = document.activeElement;
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true');
  if (size) m.style.width = `min(${size}px, calc(100% - 32px))`;
  const id = 'm' + Math.random().toString(36).slice(2, 7);
  m.setAttribute('aria-labelledby', id);
  m.innerHTML = `<div class="modal-h"><div><h3 id="${id}">${title}</h3>${sub ? `<p>${sub}</p>` : ''}</div><button class="icon-btn sm" data-close aria-label="Close">${IC.x}</button></div>
    <div class="modal-b">${body}</div>
    ${actions.length ? `<div class="modal-f">${actions.map((a, i) => `<button class="btn ${a.kind || 'btn-ghost'}" data-i="${i}" type="button">${a.label}</button>`).join('')}</div>` : ''}`;
  layer.append(scrim, m);
  document.body.style.overflow = 'hidden';
  const api = {
    el: m,
    close() {
      if (api.closed) return; api.closed = true;
      scrim.classList.add('out'); m.classList.add('out');
      setTimeout(() => { scrim.remove(); m.remove(); }, 230);
      modalStack = modalStack.filter(x => x !== api);
      if (!modalStack.length && !$('.cmdk')) document.body.style.overflow = '';
      if (prev && prev.focus) prev.focus({ preventScroll: true });
    }
  };
  modalStack.push(api);
  scrim.onclick = api.close;
  m.querySelector('[data-close]').onclick = api.close;
  $$('.modal-f [data-i]', m).forEach(b => b.onclick = async () => {
    const a = actions[+b.dataset.i];
    if (a.fn) { const r = await a.fn(api, b); if (r === false) return; }
    if (a.close !== false) api.close();
  });
  m.addEventListener('keydown', e => trapFocus(e, m));
  animateIn(m);
  if (onOpen) onOpen(m, api);
  setTimeout(() => { const f = m.querySelector('[autofocus]') || m.querySelector('.modal-b input, .modal-b button, .modal-f .btn:last-child'); f && f.focus(); }, 30);
  return api;
}
function confirmModal({ title, sub, confirm = 'Confirm', danger = false, onConfirm }) {
  return openModal({ title, sub, actions: [{ label: 'Cancel' }, { label: confirm, kind: danger ? 'btn-danger' : 'btn-primary', fn: onConfirm }] });
}
function trapFocus(e, root) {
  if (e.key !== 'Tab') return;
  const f = $$('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', root).filter(x => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------- command palette ---------- */
let cmdk = null;
function openCmdk(initial = '') {
  if (cmdk) return;
  const prev = document.activeElement;
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const box = document.createElement('div'); box.className = 'cmdk'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Command menu');
  box.innerHTML = `<div class="cmdk-in">${IC.search}<input type="text" placeholder="Search pages, actions or foods…" aria-label="Search commands" role="combobox" aria-expanded="true" aria-controls="cmdk-list" autocomplete="off" spellcheck="false"><span class="kbd">esc</span></div>
    <div class="cmdk-list" id="cmdk-list" role="listbox"></div>
    <div class="cmdk-foot"><span><span class="kbd">↑</span><span class="kbd">↓</span> move</span><span><span class="kbd">↵</span> select</span><span><span class="kbd">esc</span> close</span></div>`;
  $('#layer').append(scrim, box);
  document.body.style.overflow = 'hidden';
  const input = box.querySelector('input'), list = box.querySelector('.cmdk-list');
  let items = [], sel = 0;
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    const all = commands(q);
    items = all.filter(c => !q || c.always || (c.label + ' ' + (c.k || '')).toLowerCase().includes(q));
    sel = clamp(sel, 0, Math.max(0, items.length - 1));
    if (!items.length) { list.innerHTML = `<div class="cmdk-empty">Nothing matches “${esc(input.value)}”.<br>Try “water”, “fuel” or a food like “paneer”.</div>`; return; }
    let g = '', html = '';
    items.forEach((c, i) => {
      if (c.group !== g) { g = c.group; html += `<div class="cmdk-g label">${esc(g)}</div>`; }
      html += `<button class="cmdk-item" role="option" id="ck${i}" data-i="${i}" aria-selected="${i === sel}">${c.icon || IC.arrow}<span>${c.label}</span>${c.hint ? `<span class="r">${esc(c.hint)}</span>` : ''}</button>`;
    });
    list.innerHTML = html;
    input.setAttribute('aria-activedescendant', 'ck' + sel);
    const cur = list.querySelector('[aria-selected="true"]'); cur && cur.scrollIntoView({ block: 'nearest' });
  };
  const run = i => { const c = items[i]; if (!c) return; close(); setTimeout(() => c.run(), 10); };
  const close = () => {
    if (!cmdk) return; cmdk = null;
    scrim.classList.add('out'); box.classList.add('out');
    setTimeout(() => { scrim.remove(); box.remove(); }, 160);
    if (!modalStack.length) document.body.style.overflow = '';
    prev && prev.focus && prev.focus({ preventScroll: true });
  };
  input.addEventListener('input', () => { sel = 0; draw(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, items.length); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % Math.max(1, items.length); draw(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') e.preventDefault();
  });
  list.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) run(+b.dataset.i); });
  list.addEventListener('mousemove', e => { const b = e.target.closest('[data-i]'); if (b && +b.dataset.i !== sel) { sel = +b.dataset.i; $$('.cmdk-item', list).forEach(x => x.setAttribute('aria-selected', x === b)); } });
  scrim.onclick = close;
  cmdk = { close };
  input.value = initial; draw();
  input.focus();
}

/* ---------- charts ---------- */
function chartTip(chart) {
  let tip = chart.querySelector('.tip');
  if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; chart.appendChild(tip); }
  return tip;
}
function bindChartTips(root = document) {
  $$('.chart', root).forEach(ch => {
    const tip = chartTip(ch);
    const show = el => {
      const a = el.dataset.anchor === 'prev' ? el.previousElementSibling : el;
      const r = a.getBoundingClientRect(), cr = ch.getBoundingClientRect();
      tip.innerHTML = el.dataset.tip;
      tip.style.left = clamp(r.left + r.width / 2 - cr.left, 60, cr.width - 60) + 'px';
      tip.style.top = (r.top - cr.top) + 'px';
      tip.classList.add('on');
    };
    $$('[data-tip]', ch).forEach(el => {
      el.addEventListener('mouseenter', () => show(el));
      el.addEventListener('focus', () => show(el));
      el.addEventListener('mouseleave', () => tip.classList.remove('on'));
      el.addEventListener('blur', () => tip.classList.remove('on'));
      el.addEventListener('click', () => show(el));
    });
  });
}
/* weekly load bars. weeks: [{label, load, cur, hot, sessions}] */
function loadChartSVG(weeks) {
  const W = 640, H = 220, pl = 36, pb = 26, pt = 10;
  const raw = Math.max(400, ...weeks.map(w => w.load)) * 1.08;
  const mag = Math.pow(10, Math.floor(Math.log10(raw / 4))), unit = [1, 2, 2.5, 5, 10].map(m => m * mag).find(u => u * 4 >= raw);
  const max = unit * 4;
  const step = (W - pl) / weeks.length, bw = Math.min(46, step * 0.56);
  const ticks = [0, 1, 2, 3, 4].map(k => k * unit);
  const y = v => pt + (H - pt - pb) * (1 - v / max);
  let g = `<g class="grid">${ticks.map(t => `<line x1="${pl}" x2="${W}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  g += `<g class="axis">${ticks.map(t => `<text x="${pl - 8}" y="${y(t) + 3.5}" text-anchor="end">${t >= 1000 ? (t / 1000).toFixed(1) + 'k' : t}</text>`).join('')}</g>`;
  weeks.forEach((w, i) => {
    const x = pl + step * i + (step - bw) / 2, h = Math.max(w.load ? 3 : 0, H - pb - y(w.load));
    g += `<g class="col"><rect class="bar-r grow ${w.cur ? 'cur' : ''} ${w.hot ? 'hot' : ''}" x="${x}" y="${H - pb - h}" width="${bw}" height="${h}" rx="5" style="animation-delay:${i * 45}ms"/>
      <rect class="hit" x="${pl + step * i}" y="${pt}" width="${step}" height="${H - pt - pb}" tabindex="0" data-tip="<b>${fmtN(w.load)} AU</b> <span class='muted'>· ${plural(w.sessions, 'session')}</span><br><span class='muted'>${esc(w.range)}</span>" data-anchor="prev" aria-label="${esc(w.range)}: ${fmtN(w.load)} load units"/>
      <text class="axis" x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" style="fill:var(--ink-3);font:500 10.5px var(--mono)">${esc(w.label)}</text></g>`;
  });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly training load, last ${weeks.length} weeks">${g}</svg></div>`;
}
/* body weight line. pts: [{date, kg}] */
function weightChartSVG(pts) {
  const W = 640, H = 200, pl = 40, pb = 26, pt = 14, pr = 10;
  const ks = pts.map(p => p.kg), lo = Math.floor(Math.min(...ks) - 0.6), hi = Math.ceil(Math.max(...ks) + 0.6);
  const t0 = parseIso(pts[0].date).getTime(), t1 = Math.max(t0 + 864e5, parseIso(pts[pts.length - 1].date).getTime());
  const x = d => pl + (W - pl - pr) * ((parseIso(d).getTime() - t0) / (t1 - t0));
  const y = v => pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo || 1));
  const ticks = [lo, (lo + hi) / 2, hi];
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.date).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
  const area = path + ` L${x(pts[pts.length - 1].date)},${H - pb} L${x(pts[0].date)},${H - pb} Z`;
  let g = `<defs><linearGradient id="wgrad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".45"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>`;
  g += `<g class="grid">${ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  g += `<g class="axis">${ticks.map(t => `<text x="${pl - 8}" y="${y(t) + 3.5}" text-anchor="end">${fmt1(t)}</text>`).join('')}`;
  const lab = [pts[0], pts[pts.length - 1]];
  g += lab.map((p, i) => `<text x="${x(p.date)}" y="${H - 6}" text-anchor="${i ? 'end' : 'start'}">${fmtDate(parseIso(p.date))}</text>`).join('') + '</g>';
  g += `<path class="area" d="${area}" style="animation:fade .9s var(--ease) both"/><path class="line drawl" d="${path}"/>`;
  g += pts.map(p => `<circle class="pt" cx="${x(p.date)}" cy="${y(p.kg)}" r="3.5"/><circle class="hit" cx="${x(p.date)}" cy="${y(p.kg)}" r="12" tabindex="0" data-tip="<b>${fmt1(p.kg)} kg</b> <span class='muted'>· ${fmtDate(parseIso(p.date))}</span>" aria-label="${fmt1(p.kg)} kilograms on ${fmtDate(parseIso(p.date))}"/>`).join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Body weight over time">${g}</svg></div>`;
}

/* ---------- soft chime for the rest timer ---------- */
let audioCtx = null;
function primeAudio() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {} }
function chime() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [784, 1175].forEach((f, i) => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain(), s = t + i * 0.14;
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.18, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.6);
    o.connect(g).connect(audioCtx.destination); o.start(s); o.stop(s + 0.65);
  });
}
