/* =========================================================
   PULSE — Fuel: water first, meal plan with swaps, food guard, supplements
   ========================================================= */

/* ---------------- WATER ---------------- */
function waterCard(big = false) {
  const ds = waterDate(), t = targets(S.profile, !!sessionFor(parseIso(ds))), goal = t.water, ml = waterMl(ds);
  const pct = clamp(ml / goal, 0, 1), isToday = ds === today();
  const pace = isToday ? waterPace(goal) : goal, behind = isToday && ml < pace - 150 && ml < goal;
  const last = isToday ? lastDrinkAt() : null, mins = last ? Math.round((Date.now() - last) / 60000) : null;
  const glasses = S.glasses || [];
  const status = ml >= goal ? `<span class="pill good">${IC.check.replace('<svg', '<svg width="12" height="12"')} Target hit</span>`
    : behind ? `<span class="pill warn">${fmtMl(pace - ml)} behind</span>` : `<span class="pill line">On pace</span>`;
  return `<div class="card-h"><h3>${IC.drop.replace('<svg', '<svg class="h-ic"')} Water</h3>${status}</div>
    <div class="card-b water2 ${big ? 'big' : ''}">
      <div class="w-top">
        <div class="bottle" role="img" aria-label="${fmtMl(ml)} of ${fmtMl(goal)}"><i style="height:${pct * 100}%"></i><span>${Math.round(pct * 100)}%</span></div>
        <div style="min-width:0">
          <div class="kcal-big" style="font-size:${big ? 40 : 32}px">${fmtMl(ml)}</div>
          <div class="muted" style="font-size:13px">of ${fmtMl(goal)} today${S.profile.climate === 'hot' ? ' · includes extra for heat' : ''}${sessionFor(parseIso(ds)) ? ' · +500 ml for training' : ''}</div>
          ${isToday ? `<p class="w-nudge ${behind ? 'warn' : ''}">${ml >= goal ? 'Brilliant. Keep sipping around training and stop an hour before bed.' : behind ? `You should be near ${fmtMl(pace)} by now. Drink a glass now.` : mins != null ? `Last drink ${mins < 60 ? mins + ' min' : Math.round(mins / 60) + ' h'} ago.` : 'Start with a glass now. Even 2% dehydration makes training feel harder.'}</p>` : ''}
        </div>
      </div>
      <div class="w-quick" role="group" aria-label="Log water">
        ${glasses.map(g => `<button class="w-glass" data-act="drink" data-ml="${g.ml}" data-g="${esc(g.id)}" aria-label="Log ${esc(g.name)}, ${g.ml} ml">${g.img ? `<img src="${g.img}" alt="">` : `<span class="gi">${IC.glass}</span>`}<b>${g.ml} ml</b><span>${esc(g.name)}</span></button>`).join('')}
        <button class="w-glass" data-act="drink" data-ml="250"><span class="gi">${IC.glass}</span><b>250 ml</b><span>Glass</span></button>
        <button class="w-glass" data-act="drink" data-ml="500"><span class="gi">${IC.drop}</span><b>500 ml</b><span>Bottle</span></button>
        <button class="w-glass add" data-act="glass-new"><span class="gi">${IC.camera}</span><b>Add your glass</b><span>Photo + size</span></button>
      </div>
      <form class="w-ml" data-form="ml" novalidate><div class="input-wrap" style="flex:1"><input class="input num" id="ml-in" type="number" inputmode="numeric" min="10" max="3000" step="10" placeholder="Type an amount" aria-label="Water in millilitres"><span class="suffix">ml</span></div><button class="btn btn-primary" type="submit">${IC.plus}Add</button></form>
      <p class="w-why">${IC.info}<span><b>Dehydration is very common in athletes</b> and easy to miss: thirst shows up late. Drink steadily through the day, not all at once.</span></p>
      <div class="w-foot">${(S.log.drinks && S.log.drinks[ds] || []).length ? `<button class="btn btn-quiet btn-sm" data-act="drink-undo">${IC.reset}Undo last</button>` : '<span></span>'}<button class="btn btn-quiet btn-sm" data-act="water-remind">${IC.bell}${PREFS.remind ? `Reminders every ${PREFS.remind} min` : 'Set reminders'}</button></div>
    </div>`;
}
function addDrink(ml, gid) {
  ml = Math.round(+ml);
  if (!(ml >= 10 && ml <= 3000)) { toast('Enter an amount between 10 and 3000 ml.', { type: 'err' }); return; }
  const ds = waterDate(), d = S.log.drinks || (S.log.drinks = {}), arr = d[ds] || (d[ds] = []);
  const before = waterMl(ds), goal = targets(S.profile, !!sessionFor(parseIso(ds))).water;
  const entry = { ml, at: Date.now(), g: gid || null }; arr.push(entry);
  save(); const y = scrollY; refresh(); window.scrollTo(0, y);
  const now = waterMl(ds);
  if (before < goal && now >= goal) toast('<b>Water target hit.</b> Your muscles and brain thank you.', { icon: IC.drop });
  else toast(`<b>+${ml} ml.</b> ${fmtMl(Math.max(0, goal - now))} to go.`, { icon: IC.drop, action: { label: 'Undo', fn: () => { const i = arr.indexOf(entry); if (i >= 0) arr.splice(i, 1); save(); refresh(); } } });
  Reminders.reset();
  checkMilestones();
}
function waterDate() { return UI.view === 'fuel' && UI.fuelDate ? UI.fuelDate : today(); }

/* add your own glass: photo, then the size by typing it, measuring it or picking the closest */
function glassModal(edit) {
  const g = edit ? { ...edit } : { id: 'g' + Date.now().toString(36), name: '', ml: '', img: '' };
  let tab = 'ml';
  const body = () => `<div class="glass-form">
      <label class="glass-photo" tabindex="0">${g.img ? `<img src="${g.img}" alt="Your glass">` : `${IC.camera}<b>Take or choose a photo</b><span>of the glass or bottle you usually drink from</span>`}<input type="file" accept="image/*" capture="environment" id="glass-file" hidden></label>
      <div style="display:grid;gap:14px;min-width:0">
        <div class="field"><label for="glass-name">Name</label><input class="input" id="glass-name" maxlength="24" placeholder="e.g. Blue steel bottle" value="${esc(g.name)}"></div>
        <div class="field"><span class="flabel">How much does it hold?</span>
          <div class="seg sm full" role="tablist">${[['ml', 'I know'], ['measure', 'Measure it'], ['pick', 'Pick closest']].map(([v, l]) => `<button type="button" role="tab" data-gtab="${v}" aria-selected="${tab === v}">${l}</button>`).join('')}</div>
          <div id="glass-size">${sizeBody()}</div>
          <span class="error" id="glass-err" hidden></span></div>
      </div></div>`;
  const sizeBody = () => tab === 'ml' ? `<div class="input-wrap"><input class="input num" id="glass-ml" type="number" inputmode="numeric" min="50" max="2000" step="10" placeholder="e.g. 350" value="${g.ml}"><span class="suffix">ml</span></div><p class="hint" style="margin-top:6px">Bottles usually print it on the label or the bottom.</p>`
    : tab === 'measure' ? `<div class="grid-3" style="gap:8px">${[['h', 'Height'], ['t', 'Top width'], ['b', 'Bottom width']].map(([k, l]) => `<div class="field"><label for="gm-${k}" style="font-size:12px">${l}</label><div class="input-wrap"><input class="input num" id="gm-${k}" type="number" inputmode="decimal" min="2" max="40" step="0.5" placeholder="cm"><span class="suffix">cm</span></div></div>`).join('')}</div><p class="hint" style="margin-top:6px" id="gm-out">Measure the inside with a ruler. Pulse works out the volume.</p>`
    : `<div class="size-pick">${GLASS_SIZES.map(([n, ml]) => `<button type="button" class="chip" data-gsize="${ml}" aria-pressed="${+g.ml === ml}">${n} · ${ml} ml</button>`).join('')}</div>`;
  const m = openModal({
    title: edit ? 'Edit your glass' : 'Add your glass', sub: 'Glasses are not all the same size. Save yours once, then log it with one tap.', size: 620,
    body: body(),
    actions: [...(edit ? [{ label: 'Delete', kind: 'btn-quiet', fn: () => { S.glasses = S.glasses.filter(x => x.id !== g.id); save(); refresh(); toast('Glass removed.'); } }] : []), { label: 'Cancel' }, { label: 'Save glass', kind: 'btn-primary', fn: api => {
      g.name = $('#glass-name', api.el).value.trim() || 'My glass';
      if (tab === 'ml') g.ml = +($('#glass-ml', api.el) || {}).value || g.ml;
      const er = $('#glass-err', api.el);
      if (!(g.ml >= 50 && g.ml <= 2000)) { er.hidden = false; er.innerHTML = `${IC.alert}Set a size between 50 and 2000 ml.`; return false; }
      g.ml = Math.round(g.ml);
      S.glasses = S.glasses || []; const i = S.glasses.findIndex(x => x.id === g.id);
      if (i >= 0) S.glasses[i] = g; else S.glasses.push(g);
      save(); refresh(); toast(`<b>${esc(g.name)}</b> saved. Tap it to log ${g.ml} ml.`, { icon: IC.glass });
    } }],
    onOpen(el) { wire(el); }
  });
  function wire(el) {
    const f = $('#glass-file', el);
    f.onchange = async () => { try { g.img = await shrinkImage(f.files[0], 240, 0.7); $('.glass-photo', el).innerHTML = `<img src="${g.img}" alt="Your glass"><input type="file" accept="image/*" capture="environment" id="glass-file" hidden>`; wire(el); } catch (e) { toast(e.message, { type: 'err' }); } };
    $('.glass-photo', el).onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#glass-file', el).click(); } };
    $$('[data-gtab]', el).forEach(b => b.onclick = () => { const mi = $('#glass-ml', el); if (mi) g.ml = +mi.value || g.ml; tab = b.dataset.gtab; $$('[data-gtab]', el).forEach(x => x.setAttribute('aria-selected', x === b)); syncSegs(el); $('#glass-size', el).innerHTML = sizeBody(); wireSize(el); });
    syncSegs(el); wireSize(el);
  }
  function wireSize(el) {
    $$('[data-gsize]', el).forEach(b => b.onclick = () => { g.ml = +b.dataset.gsize; $$('[data-gsize]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); });
    const calc = () => { const h = +$('#gm-h', el).value, t = +$('#gm-t', el).value, b = +$('#gm-b', el).value || t; if (h > 0 && t > 0) { g.ml = glassVolume(h, t, b); $('#gm-out', el).innerHTML = `About <b>${g.ml} ml</b> when filled normally.`; } };
    $$('#gm-h, #gm-t, #gm-b', el).forEach(i => i.oninput = calc);
  }
  return m;
}

/* reminders: in-app nudges plus a system notification while Pulse is open */
const Reminders = {
  timer: null,
  start() { clearInterval(this.timer); if (!PREFS.remind) return; this.timer = setInterval(() => this.check(), 60000); },
  reset() { this.nudged = false; },
  check() {
    if (!S || !S.profile || S.sample || !PREFS.remind) return;
    const h = new Date().getHours(); if (h < 7 || h >= 21) return;
    const last = lastDrinkAt() || new Date().setHours(7, 0, 0, 0);
    if (Date.now() - last < PREFS.remind * 60000 || this.nudged) return;
    const goal = targets(S.profile, !!sessionFor(new Date())).water; if (waterMl(today()) >= goal) return;
    this.nudged = true;
    toast(`<b>Time for water.</b> ${fmtMl(goal - waterMl(today()))} to go today.`, { icon: IC.drop, ms: 12000, action: { label: '+250 ml', fn: () => addDrink(250) } });
    try { if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') new Notification('Pulse · time for water', { body: `${fmtMl(goal - waterMl(today()))} left to hit today’s target.`, icon: 'icon-192.png', tag: 'pulse-water' }); } catch (e) {}
  }
};
function remindModal() {
  openModal({
    title: 'Water reminders', sub: 'Pulse nudges you when you have gone too long without a drink, between 7 am and 9 pm.',
    body: `<div class="chips" id="rm-opts">${[[0, 'Off'], [45, 'Every 45 min'], [60, 'Every hour'], [90, 'Every 90 min'], [120, 'Every 2 hours']].map(([v, l]) => `<button type="button" class="chip" data-rm="${v}" aria-pressed="${(PREFS.remind || 0) === v}">${l}</button>`).join('')}</div>
      <p class="muted" style="font-size:13px;margin-top:14px">Reminders show while Pulse is open in a tab. Allow notifications to also get them when the tab is in the background.</p>`,
    actions: [{ label: 'Done', kind: 'btn-primary' }],
    onOpen(el) {
      $$('[data-rm]', el).forEach(b => b.onclick = async () => {
        PREFS.remind = +b.dataset.rm || 0; savePrefs(); $$('[data-rm]', el).forEach(x => x.setAttribute('aria-pressed', x === b));
        if (PREFS.remind && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) {} }
        Reminders.start(); refresh();
      });
    }
  });
}

/* ---------------- FUEL VIEW ---------------- */
VIEWS.fuel = () => {
  const p = S.profile;
  if (!UI.fuelDate) UI.fuelDate = today();
  const ds = UI.fuelDate, d = parseIso(ds), training = !!sessionFor(d), t = targets(p, training);
  const items = S.log.food[ds] || [], e = sumFoods(items), left = t.kcal - e.kcal;
  const label = ds === today() ? 'Today' : ds === iso(addDays(new Date(), -1)) ? 'Yesterday' : `${DAYS[wd(d)]} ${fmtDate(d)}`;
  return `<div class="ph"><div><div class="label">${training ? 'Training day targets' : 'Rest day targets'} · ${DIET_LABEL[p.diet]} · ${GOALS[p.goal].label}</div><h2 style="margin-top:8px">Fuel <em>by the gram.</em></h2></div>
    <div class="ph-actions"><div class="daynav"><button class="icon-btn" data-act="fuel-day" data-v="-1" aria-label="Previous day" ${ds <= iso(addDays(new Date(), -30)) ? 'disabled' : ''}>${IC.chevL}</button><span aria-live="polite">${label}</span><button class="icon-btn" data-act="fuel-day" data-v="1" aria-label="Next day" ${ds >= today() ? 'disabled' : ''}>${IC.chevR}</button></div></div></div>
    <div class="dash stagger">
      <section class="card water-card c-5">${waterCard(true)}</section>
      <section class="card card-pad c-7"><div class="fuel-top">
        ${ring(e.kcal, t.kcal, 132, 12, left < -150 ? 'var(--signal)' : 'var(--ink)', `<span class="big" style="font-size:28px" data-count="${Math.round(e.kcal)}">0</span><span class="sm">of ${fmtN(t.kcal)} kcal</span>`, `${fmtN(e.kcal)} of ${fmtN(t.kcal)} calories`)}
        <div><div style="display:flex;flex-wrap:wrap;gap:6px 22px;align-items:baseline;margin-bottom:18px"><div class="kcal-big">${left >= 0 ? fmtN(left) : '+' + fmtN(-left)}<small> kcal ${left >= 0 ? 'left' : 'over'}</small></div>
          <span class="muted" style="font-size:13px">${training ? 'Extra carbs for today’s session.' : 'Slightly lower on a rest day.'} <button type="button" class="link-tip" data-act="how-kcal">How is this worked out?</button></span></div>
          <div class="macros" style="grid-template-columns:repeat(3,minmax(0,1fr));display:grid;gap:18px">${[['Protein', e.p, t.protein, 'acc'], ['Carbs', e.c, t.carbs, ''], ['Fat', e.f, t.fat, '']].map(([n, v, m, cl]) => `<div class="macro"><div class="top"><b>${n}</b><span><strong>${fmtN(v)}</strong>/${m} g</span></div>${bar(v, m, cl)}</div>`).join('')}</div>
          ${p.kcalAdj ? `<p class="muted" style="font-size:12.5px;margin-top:14px">${IC.info.replace('<svg', '<svg width="13" height="13" style="vertical-align:-2px"')} Includes ${p.kcalAdj > 0 ? '+' : ''}${p.kcalAdj} kcal from your weekly weigh-in check.</p>` : ''}</div></div></section>
      <section class="c-12"><div class="sec-row"><div><h3 class="h-sec">Your meal plan</h3><p class="muted" style="font-size:13.5px">Built for <b>${GOALS[p.goal].label.toLowerCase()}</b> and sized to your ${fmtN(t.kcal)} kcal. Not feeling one? Swap it as many times as you like.</p></div></div>
        <div class="meal-grid">${['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(m => mealCard(p, ds, m, items)).join('')}</div></section>
      <section class="card c-7"><div class="card-h"><h3>Logged ${ds === today() ? 'today' : label.toLowerCase()}</h3><span class="label">${plural(items.length, 'item')}</span></div>
        <div class="card-b">${items.length ? `<div>${['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Other'].map(m => { const its = items.map((it, i) => ({ it, i })).filter(x => (x.it.meal || 'Other') === m); return its.length ? `<div class="label" style="margin:14px 0 2px">${m}</div>` + its.map(({ it, i }) => { const f = itemInfo(it); if (!f) return ''; const s = it.s || 1; return `<div class="log-item"><div style="min-width:0"><div class="nm">${esc(f.name)}</div><div class="mac">${fmtN(f.kcal * s)} kcal · P ${fmt1(f.p * s)} · C ${fmt1(f.c * s)} · F ${fmt1(f.f * s)}</div></div>
          <div class="stepper"><button data-act="serv" data-i="${i}" data-v="-0.5" aria-label="Less of ${esc(f.name)}">${IC.minus}</button><span>×${fmt1(s)}</span><button data-act="serv" data-i="${i}" data-v="0.5" aria-label="More of ${esc(f.name)}">${IC.plus}</button></div>
          <button class="icon-btn sm" data-act="food-del" data-i="${i}" aria-label="Remove ${esc(f.name)}">${IC.x}</button></div>`; }).join('') : ''; }).join('')}</div>`
          : `<div class="empty" style="padding:28px 8px"><div class="glyph">${IC.fuel}</div><h4>Nothing logged ${ds === today() ? 'yet' : 'for this day'}</h4><p>Log a meal from your plan above in one tap, or search for a food.</p></div>`}</div></section>
      <section class="card c-5" id="food-search">${foodSearchCard()}</section>
      <section class="card c-12" id="supps">${suppCard()}</section>
    </div>`;
};
function mealCard(p, ds, meal, items) {
  const sw = ((S.mealSwaps || {})[ds] || {})[meal] || 0, m = mealFor(p, ds, meal, sw), M = MEAL_META[meal];
  if (!m) return `<article class="meal-card ${M.tone}"><header><span class="mc-ic">${IC[M.ic]}</span><div><h4>${meal}</h4><span>${M.when}</span></div></header><p class="muted" style="font-size:13.5px">Nothing in Pulse’s list fits your diet and allergies for this meal. Search below to log your own.</p></article>`;
  const logged = items.some(it => it.idea === m.key);
  return `<article class="meal-card ${M.tone} ${logged ? 'logged' : ''}" data-meal="${meal}">
    <header><span class="mc-ic">${IC[M.ic]}</span><div><h4>${meal}</h4><span>${M.when}</span></div><span class="mc-n" title="Option ${m.i + 1} of ${m.n}">${m.i + 1}/${m.n}</span></header>
    <ul class="mc-foods">${m.ids.map(id => `<li><span>${esc(FOODS[id][0])}</span><span>${m.s !== 1 ? '×' + fmt1(m.s) + ' · ' : ''}${esc(FOODS[id][1])}</span></li>`).join('')}</ul>
    <div class="mc-mac"><b>${fmtN(m.t.kcal)}</b> kcal <i></i> <b>${fmtN(m.t.p)}</b> g protein <i></i> <b>${fmtN(m.t.c)}</b> g carbs</div>
    <p class="mc-why">${IC.target.replace('<svg', '<svg width="13" height="13"')}${esc(mealWhy(m, p.goal))}</p>
    <footer>${logged ? `<span class="pill good">${IC.check.replace('<svg', '<svg width="12" height="12"')} Logged</span>` : `<button class="btn btn-primary btn-sm" data-act="meal-log" data-m="${meal}">${IC.plus}Log this meal</button>`}<button class="btn btn-ghost btn-sm" data-act="meal-swap" data-m="${meal}" aria-label="Swap ${meal} for another option">${IC.shuffle}Swap</button></footer>
  </article>`;
}

/* ---------- add food, with the junk-food guard ---------- */
function foodSearchCard() {
  const r = foodResults(), p = S.profile, q = UI.foodQ.trim(), j = q.length > 2 ? junkCheck(q) : null;
  return `<div class="card-h"><h3>Add food</h3><button class="btn btn-quiet btn-sm" data-act="custom-food">${IC.plus}Custom</button></div>
    <div class="card-b"><div class="input-wrap has-ic">${IC.search.replace('<svg', '<svg class="prefix-ic"')}<input class="input" type="search" id="food-q" placeholder="Search ${Object.keys(FOODS).length} healthy foods" value="${esc(UI.foodQ)}" aria-label="Search foods" autocomplete="off"></div>
      <div class="toolbar">${[['all', 'All'], ['protein', 'High protein'], ['carbs', 'Carbs'], ['light', 'Light']].map(([v, l]) => `<button class="chip" data-act="food-filter" data-v="${v}" aria-pressed="${UI.foodFilter === v}">${l}</button>`).join('')}
        <select class="input" id="food-sort" aria-label="Sort foods">${[['match', 'Best match'], ['protein', 'Most protein'], ['kcal', 'Fewest kcal'], ['az', 'A to Z']].map(([v, l]) => `<option value="${v}" ${UI.foodSort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <label style="display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink-2);margin:10px 0 8px;cursor:pointer"><button type="button" class="switch" role="switch" aria-checked="${UI.dietOnly}" data-act="diet-only" aria-label="Only show foods that fit my diet"></button>Only foods that fit my diet</label>
      <div class="food-res" id="food-res">${j ? junkPanel(j, q) : r.length ? r.map(([id, f]) => { const why = foodWhyNot(id, p); return `<button class="food-row" data-act="food-add" data-id="${id}"><div style="min-width:0"><div class="nm">${esc(f[0])} ${why ? `<span class="pill warn" style="height:20px">${esc(why)}</span>` : ''}</div><div class="mac">${esc(f[1])} · ${foodMac(f)}</div></div><span class="add" aria-hidden="true">${IC.plus}</span></button>`; }).join('')
        : `<div class="empty" style="padding:24px 8px"><h4 style="font-size:15px">No foods match</h4><p style="font-size:13.5px">${UI.dietOnly ? 'Try turning off the diet filter, or ' : ''}add it as a custom food.</p><div class="acts"><button class="btn btn-ghost btn-sm" data-act="custom-food">${IC.plus}Add “${esc(UI.foodQ || 'custom food')}”</button></div></div>`}</div></div>`;
}
function junkPanel(j, name) {
  const p = S.profile, alt = junkAlt(j, p), f = FOODS[alt];
  return `<div class="junk"><div class="junk-h">${IC.ban}<b>${esc(cap(name))} is not on your plan</b></div>
    <p><b>Why:</b> ${esc(j.why)} ${esc(GOAL_HARM[p.goal])}</p>
    <p><b>What it does:</b> ${esc(j.fx)}</p>
    <div class="junk-alt"><div><span class="label">Try this instead</span><div class="nm">${esc(f[0])}</div><div class="mac">${esc(f[1])} · ${foodMac(f)}</div></div><button class="btn btn-accent btn-sm" data-act="junk-alt" data-id="${alt}">${IC.plus}Add ${esc(f[0].split(',')[0].toLowerCase())}</button></div></div>`;
}
const cap = s => String(s).charAt(0).toUpperCase() + String(s).slice(1);
function junkModal(j, name) {
  const p = S.profile, alt = junkAlt(j, p), f = FOODS[alt];
  openModal({
    title: `${esc(cap(name))} can’t go in your log`, sub: 'Pulse only tracks food that moves you towards your goal.',
    body: `<div class="junk" style="margin:0"><p><b>Why:</b> ${esc(j.why)} ${esc(GOAL_HARM[p.goal])}</p><p><b>What it does:</b> ${esc(j.fx)}</p>
      <div class="junk-alt"><div><span class="label">A better choice</span><div class="nm">${esc(f[0])}</div><div class="mac">${esc(f[1])} · ${foodMac(f)}</div></div></div></div>`,
    actions: [{ label: 'No thanks' }, { label: `Add ${esc(f[0].split(',')[0].toLowerCase())} instead`, kind: 'btn-primary', fn: () => { addFood(alt); UI.foodQ = ''; refresh(); toast(`Added <b>${esc(f[0])}</b>. Good swap.`); } }]
  });
}
function customFoodModal() {
  const nf = (k, l, s, ph) => `<div class="field" data-field="${k}"><label for="cf-${k}">${l}</label><div class="input-wrap"><input class="input num" id="cf-${k}" type="number" inputmode="decimal" min="0" step="1" placeholder="${ph}"><span class="suffix">${s}</span></div></div>`;
  const pre = UI.foodQ.trim(), j0 = pre && junkCheck(pre);
  if (j0) return junkModal(j0, pre);
  openModal({
    title: 'Add a custom food', sub: 'For healthy food that is not in the list. Check the label, or a rough guess is fine.',
    body: `<div style="display:grid;gap:16px"><div class="field" data-field="name"><label for="cf-name">Name</label><input class="input" id="cf-name" type="text" maxlength="40" placeholder="e.g. Mum’s aloo paratha" value="${esc(pre)}" autofocus></div>
      <div class="grid-2">${nf('kcal', 'Calories', 'kcal', '300')}${nf('p', 'Protein', 'g', '10')}${nf('c', 'Carbs', 'g', '40')}${nf('f', 'Fat', 'g', '10')}${nf('sug', 'Of which sugar', 'g', '5')}</div></div>`,
    actions: [{ label: 'Cancel' }, { label: 'Add food', kind: 'btn-primary', fn: (api) => {
      const m = api.el, g = k => m.querySelector('#cf-' + k).value.trim();
      $$('.field', m).forEach(f => { f.classList.remove('err'); const e = f.querySelector('.error'); e && e.remove(); });
      const j = junkCheck(g('name'));
      if (j) { setTimeout(() => junkModal(j, g('name')), 240); return; }
      const errs = {};
      if (!g('name')) errs.name = 'Give it a name.';
      if (g('kcal') === '' || +g('kcal') < 0 || +g('kcal') > 3000) errs.kcal = 'Enter 0 to 3000.';
      ['p', 'c', 'f', 'sug'].forEach(k => { if (g(k) !== '' && (+g(k) < 0 || +g(k) > 300)) errs[k] = '0 to 300 g.'; });
      if (Object.keys(errs).length) { Object.entries(errs).forEach(([k, msg]) => { const f = m.querySelector(`[data-field="${k}"]`); f.classList.add('err'); f.insertAdjacentHTML('beforeend', `<span class="error">${IC.alert}${msg}</span>`); }); m.querySelector('.field.err input').focus(); return false; }
      // label check: mostly sugar, or very fatty with almost no protein, is treated as junk
      const kc = +g('kcal'), sug = +g('sug') || 0, pr = +g('p') || 0, fat = +g('f') || 0;
      if ((sug * 4 > kc * 0.3 && sug >= 12) || (kc >= 200 && fat * 9 > kc * 0.55 && pr * 4 < kc * 0.08)) {
        const fake = { why: sug * 4 > kc * 0.3 ? `About ${Math.round(sug * 4 / kc * 100)}% of its calories come from sugar.` : 'Most of its calories come from fat, with almost no protein.', fx: 'Foods like this fill you up with energy your muscles cannot use, and make it harder to hit your protein.', alt: ['fruitbowl', 'greek', 'roastedchana', 'makhana'] };
        setTimeout(() => junkModal(fake, g('name')), 240); return;
      }
      const ds = UI.fuelDate || today(), arr = S.log.food[ds] || (S.log.food[ds] = []);
      arr.push({ custom: { name: g('name'), kcal: kc, p: pr, c: +g('c') || 0, f: fat }, s: 1, meal: ds === today() ? mealNow() : 'Other' });
      save(); UI.foodQ = ''; refresh(); toast(`Added <b>${esc(g('name'))}</b>.`);
    } }]
  });
}

/* ---------------- SUPPLEMENTS ---------------- */
const SUPP_STATUS = {
  active: ['good', 'Active'], 'need-note': ['warn', 'Needs a doctor’s note'], pending: ['warn', 'Waiting for coach'], rejected: ['bad', 'Not approved'], 'need-account': ['warn', 'Needs an account']
};
function suppCard() {
  const list = S.supps || [], ds = today(), minor = +S.profile.age < 18;
  return `<div class="card-h"><h3>${IC.pill.replace('<svg', '<svg class="h-ic"')} Supplements</h3><button class="btn btn-ghost btn-sm" data-act="supp-add">${IC.plus}Add supplement</button></div>
    <div class="card-b">${list.length ? `<ul class="supp-list">${list.map(sp => { const [k, l] = SUPP_STATUS[sp.status] || ['', sp.status]; const took = sp.log && sp.log[ds]; return `<li>
      <span class="supp-ic">${IC.pill}</span>
      <div style="min-width:0"><div class="nm">${esc(sp.name)} <span class="pill ${k}">${l}</span></div><div class="mac">${esc(sp.dose || '')}${sp.review && sp.review.byName ? ` · ${sp.status === 'active' ? 'Verified' : 'Reviewed'} by ${esc(sp.review.byName)}` : ''}${sp.status === 'rejected' && sp.review && sp.review.comment ? ` · “${esc(sp.review.comment)}”` : ''}</div></div>
      <div class="supp-acts">${sp.status === 'active' ? `<button class="chip sm" data-act="supp-took" data-id="${sp.id}" aria-pressed="${!!took}">${took ? IC.check.replace('<svg', '<svg width="13" height="13"') + 'Taken today' : 'Mark taken'}</button>` : sp.status === 'need-note' ? `<button class="btn btn-primary btn-sm" data-act="supp-note" data-id="${sp.id}">${IC.upload}Upload note</button>` : sp.status === 'need-account' ? `<a class="btn btn-primary btn-sm" href="#/signup">Make an account</a>` : sp.status === 'rejected' ? `<button class="btn btn-ghost btn-sm" data-act="supp-note" data-id="${sp.id}">Send a new note</button>` : `<span class="muted" style="font-size:12.5px">Sent ${fmtDate(new Date(sp.sentAt || sp.at))}</span>`}
        <button class="icon-btn sm" data-act="supp-del" data-id="${sp.id}" aria-label="Remove ${esc(sp.name)}">${IC.x}</button></div></li>`; }).join('')}</ul>`
      : `<div class="empty" style="padding:22px 8px"><div class="glyph">${IC.pill}</div><h4>No supplements</h4><p>Most athletes your age get everything from food. ${minor ? 'Supplements that can affect under-18s need a doctor’s note and a coach’s sign-off before Pulse adds them.' : ''}</p></div>`}
      ${minor ? `<p class="muted" style="font-size:12.5px;margin-top:12px">${IC.shield.replace('<svg', '<svg width="14" height="14" style="vertical-align:-2px"')} Because you are under 18, supplements with known side effects go through your doctor and one of your coaches first.</p>` : ''}</div>`;
}
function suppAddModal() {
  const p = S.profile;
  let pick = null;
  const rowsFor = q => SUPPS.filter(s => !q || s.n.toLowerCase().includes(q) || (SUPP_WORDS[s.id] || []).some(w => w.includes(q)));
  const list = q => rowsFor(q).map(s => { const r = suppRule(s, p); return `<button type="button" class="supp-opt" data-sid="${s.id}"><span><b>${esc(s.n)}</b><span class="d">${esc(s.note || s.fx || '')}</span></span><span class="pill ${{ ok: 'good', approval: 'warn', warn: 'warn', block: 'bad', never: 'bad' }[r]}">${{ ok: 'OK to add', approval: 'Doctor + coach', warn: 'Use with care', block: 'Not for under-18s', never: 'Banned' }[r]}</span></button>`; }).join('') || `<p class="muted" style="font-size:13.5px;padding:8px 2px">Not in the list. Pulse will treat “${esc(q)}” as a supplement that needs checking.</p><button type="button" class="btn btn-ghost btn-sm" data-sid="custom">Add “${esc(q)}”</button>`;
  openModal({
    title: 'Add a supplement', sub: 'Pick one from the list or type its name.', size: 600,
    body: `<div class="input-wrap has-ic">${IC.search.replace('<svg', '<svg class="prefix-ic"')}<input class="input" id="supp-q" type="search" placeholder="e.g. creatine, vitamin D, whey" autocomplete="off"></div><div class="supp-opts" id="supp-opts">${list('')}</div>`,
    onOpen(el, api) {
      const q = $('#supp-q', el), box = $('#supp-opts', el);
      const wire = () => $$('[data-sid]', box).forEach(b => b.onclick = () => {
        const s = b.dataset.sid === 'custom' ? (suppFind(q.value) || { id: 'custom', n: cap(q.value.trim()), risk: 'minor', custom: true, dose: 'As your doctor says', fx: 'Pulse does not know this product, so it needs checking before you take it.' }) : SUPPS.find(x => x.id === b.dataset.sid);
        api.close(); setTimeout(() => suppDecide(s), 240);
      });
      q.oninput = () => { box.innerHTML = list(q.value.trim().toLowerCase()); wire(); };
      wire();
    }
  });
}
function suppDecide(s) {
  const p = S.profile, r = suppRule(s, p);
  if (r === 'never' || r === 'block') return openModal({ title: `${esc(s.n)} can’t be added`, sub: r === 'never' ? 'Banned for every athlete.' : 'Not for anyone under 18.', body: `<div class="junk" style="margin:0"><p>${esc(s.fx)}</p><p>If you are trying to ${GOALS[p.goal].label.toLowerCase()}, the things that actually work are sleep, enough protein and following your plan. Ask Pulse or your coach how to speed up your progress safely.</p></div>`, actions: [{ label: 'Understood', kind: 'btn-primary' }] });
  const add = (status, extra = {}) => { const sp = Object.assign({ id: 'sp' + Date.now().toString(36), key: s.id, name: s.n, dose: s.dose || '', status, at: Date.now(), log: {} }, extra); S.supps = S.supps || []; S.supps.push(sp); save(); refresh(); return sp; };
  if (r === 'ok' || r === 'warn') {
    return openModal({ title: `Add ${esc(s.n)}?`, sub: s.dose ? `Usual use: ${esc(s.dose)}` : '', body: `<p style="font-size:14px">${esc(r === 'warn' ? s.fx : s.note)}</p>${r === 'warn' ? '<p class="muted" style="font-size:13px;margin-top:10px">Talk to a doctor before starting it.</p>' : ''}`, actions: [{ label: 'Cancel' }, { label: 'Add supplement', kind: 'btn-primary', fn: () => { add('active'); toast(`<b>${esc(s.n)}</b> added. Tick it off each day you take it.`, { icon: IC.pill }); } }] });
  }
  // under 18 with side effects: doctor's note, then a coach verifies
  const needAcc = !Cloud.user;
  openModal({
    title: `${esc(s.n)} needs a doctor first`, sub: 'This supplement can have side effects for people under 18.',
    body: `<div class="junk" style="margin:0 0 16px;background:var(--warn-bg)"><p>${esc(s.fx)}</p></div>
      <ol class="steps3"><li><b>See a doctor.</b> Ask whether ${esc(s.n.toLowerCase())} is safe for you and at what dose.</li><li><b>Get a signed note</b> saying you can take it, and upload a photo of it here.</li><li><b>A coach verifies it.</b> Any coach for ${S.profile.sports.length ? esc(S.profile.sports.map(x => SPORTS[x].split(' (')[0]).join(' or ')) : 'PE'} at your school can check and approve it. Then it shows up in your plan.</li></ol>
      ${needAcc ? `<p class="muted" style="font-size:13px;margin-top:14px">Coaches can only verify notes for students with an account. Make one first; your plan comes with you.</p>` : !S.profile.school ? `<p class="muted" style="font-size:13px;margin-top:14px">Add your school in Edit plan inputs so your coaches can see the request.</p>` : ''}`,
    actions: [{ label: 'Cancel' }, needAcc ? { label: 'Make an account', kind: 'btn-primary', fn: () => { add('need-account'); navigate('signup'); } } : { label: 'I have a note: upload it', kind: 'btn-primary', fn: () => { const sp = add('need-note'); setTimeout(() => noteModal(sp.id), 240); } }]
  });
}
function noteModal(id) {
  const sp = (S.supps || []).find(x => x.id === id); if (!sp) return;
  let img = '';
  openModal({
    title: 'Upload your doctor’s note', sub: `For ${esc(sp.name)}. Your coach will see this photo and these details, nothing else from your food log.`, size: 600,
    body: `<div class="glass-form"><label class="glass-photo note" tabindex="0">${IC.camera}<b>Photo of the note</b><span>Make sure the doctor’s name, signature and date are readable</span><input type="file" accept="image/*" capture="environment" id="note-file" hidden></label>
      <div style="display:grid;gap:14px;min-width:0"><div class="field"><label for="note-doc">Doctor’s name</label><input class="input" id="note-doc" maxlength="60" placeholder="Dr ..."></div>
        <div class="field"><label for="note-date">Date on the note</label><input class="input" id="note-date" type="date" max="${today()}"></div>
        <div class="field"><label for="note-dose">Dose the doctor gave</label><input class="input" id="note-dose" maxlength="60" placeholder="e.g. 3 g a day" value="${esc(sp.dose && !/doctor/i.test(sp.dose) ? sp.dose : '')}"></div>
        <label class="check-row"><input type="checkbox" id="note-ok"> <span>This note is real and was written for me by my doctor.</span></label>
        <span class="error" id="note-err" hidden></span></div></div>`,
    actions: [{ label: 'Cancel' }, { label: 'Send to my coaches', kind: 'btn-primary', fn: async (api, btn) => {
      const el = api.el, er = $('#note-err', el), doc = $('#note-doc', el).value.trim(), date = $('#note-date', el).value, dose = $('#note-dose', el).value.trim();
      const fail = m => { er.hidden = false; er.innerHTML = IC.alert + m; return false; };
      if (!img) return fail('Add a photo of the note.');
      if (!doc) return fail('Add the doctor’s name.');
      if (!date) return fail('Add the date on the note.');
      if (!$('#note-ok', el).checked) return fail('Confirm the note is real.');
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const p = S.profile;
        await Cloud.putNote(sp.id, { image: img, doctor: doc, date, dose, supplement: sp.name, studentName: p.name, grade: p.grade || '', school: p.school, sports: p.sports.length ? p.sports : ['general'], sentAt: Date.now() });
        Object.assign(sp, { status: 'pending', sentAt: Date.now(), dose: dose || sp.dose, review: null });
        save(); Sync.now(); refresh();
        toast('<b>Sent.</b> One of your coaches will check the note.', { icon: IC.shield });
      } catch (e) { btn.disabled = false; btn.textContent = 'Send to my coaches'; return fail(e.message || 'Could not send. Try again.'); }
    } }],
    onOpen(el) {
      const wire = () => { const f = $('#note-file', el); f.onchange = async () => { try { img = await shrinkImage(f.files[0], 1100, 0.72); $('.glass-photo', el).innerHTML = `<img src="${img}" alt="Doctor’s note"><input type="file" accept="image/*" capture="environment" id="note-file" hidden>`; wire(); } catch (e) { toast(e.message, { type: 'err' }); } }; };
      $('.glass-photo', el).onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#note-file', el).click(); } };
      wire();
    }
  });
}

/* ---------------- actions ---------------- */
Object.assign(ACT, {
  drink: el => addDrink(+el.dataset.ml, el.dataset.g),
  'drink-undo': () => { const arr = (S.log.drinks || {})[waterDate()] || []; const d = arr.pop(); if (!d) return; save(); refresh(); toast(`Removed ${d.ml} ml.`); },
  'glass-new': () => glassModal(),
  'water-remind': () => remindModal(),
  'meal-swap': el => {
    const m = el.dataset.m, ds = UI.fuelDate, all = S.mealSwaps || (S.mealSwaps = {}), day = all[ds] || (all[ds] = {});
    day[m] = (day[m] || 0) + 1;
    for (const k of Object.keys(all)) if (k < iso(addDays(new Date(), -14))) delete all[k];
    save(); const y = scrollY; refresh(); window.scrollTo(0, y);
    const card = $(`.meal-card[data-meal="${m}"]`); if (card) { card.classList.remove('swapped'); void card.offsetWidth; card.classList.add('swapped'); }
  },
  'meal-log': el => {
    const meal = el.dataset.m, ds = UI.fuelDate, m = mealFor(S.profile, ds, meal, ((S.mealSwaps || {})[ds] || {})[meal] || 0); if (!m) return;
    const arr = S.log.food[ds] || (S.log.food[ds] = []);
    m.ids.forEach(id => arr.push({ id, s: m.s, meal, idea: m.key }));
    save(); const y = scrollY; refresh(); window.scrollTo(0, y);
    toast(`<b>${meal} logged.</b> ${fmtN(m.t.kcal)} kcal · ${fmtN(m.t.p)} g protein`, { action: { label: 'Undo', fn: () => { S.log.food[ds] = (S.log.food[ds] || []).filter(it => it.idea !== m.key); save(); refresh(); } } });
    checkMilestones();
  },
  'junk-alt': el => { const id = el.dataset.id; addFood(id); UI.foodQ = ''; refresh(); toast(`Added <b>${esc(FOODS[id][0])}</b>. Good swap.`); },
  'supp-add': () => suppAddModal(),
  'supp-note': el => noteModal(el.dataset.id),
  'supp-took': el => { const sp = S.supps.find(x => x.id === el.dataset.id); if (!sp) return; sp.log = sp.log || {}; if (sp.log[today()]) delete sp.log[today()]; else sp.log[today()] = true; save(); const y = scrollY; refresh(); window.scrollTo(0, y); },
  'supp-del': el => { const i = S.supps.findIndex(x => x.id === el.dataset.id); if (i < 0) return; const [sp] = S.supps.splice(i, 1); save(); const y = scrollY; refresh(); window.scrollTo(0, y); toast(`Removed ${esc(sp.name)}.`, { action: { label: 'Undo', fn: () => { S.supps.splice(i, 0, sp); save(); refresh(); } } }); }
});

document.addEventListener('submit', e => {
  if (e.target.dataset.form !== 'ml') return;
  e.preventDefault();
  const v = +$('#ml-in').value;
  if (!v) { $('#ml-in').focus(); return; }
  addDrink(v);
});

/* ---------------- hydration reminder note ---------------- */
// dehydration is one of the most common problems in young athletes, so Pulse keeps a short note in view
const WATER_FACTS = [
  'Most young athletes start training already a little dehydrated, often without feeling thirsty.',
  'Losing just 2% of your body weight in sweat makes you weaker, slower and worse at decisions.',
  'Thirst kicks in late. By the time you feel it, you are already behind.',
  'Even mild dehydration makes training feel harder and causes headaches, cramps and tiredness.',
  'Dark yellow pee means drink more. Pale straw colour means you are on track.',
  'On hot days you can sweat out more than a litre in an hour of training.'
];
function waterFact() { const d = parseIso(today()); return WATER_FACTS[(d.getDate() + d.getMonth()) % WATER_FACTS.length]; }
function hydrationNote() {
  if (!S) return '';
  if (S.waterNoteHidden === today()) return '';
  const goal = targets(S.profile, !!sessionFor(new Date())).water, ml = waterMl(today()), pace = waterPace(goal);
  if (ml >= goal) return '';
  const behind = ml < pace - 150;
  return `<section class="c-12 hydra ${behind ? 'behind' : ''}" role="note" aria-label="Hydration reminder">
    <span class="hydra-ic">${IC.drop}</span>
    <div style="min-width:0"><b>${behind ? `Don’t forget your water: you’re ${fmtMl(pace - ml)} behind.` : 'Don’t miss out on water today.'}</b>
      <p>Dehydration is very common in athletes. ${esc(waterFact())}</p></div>
    <div class="hydra-acts"><button class="btn btn-primary btn-sm" data-act="drink" data-ml="250">${IC.plus}250 ml</button><button class="icon-btn sm" data-act="water-note-hide" aria-label="Hide the water reminder for today" data-tip="Hide for today">${IC.x}</button></div>
  </section>`;
}
/* one-line tip used next to sessions */
const sessionWaterTip = () => `<p class="water-tip">${IC.drop}<span><b>Bring a water bottle.</b> Sip 150–250 ml every 15–20 minutes while you train, then drink about 500 ml in the hour after.</span></p>`;
Object.assign(ACT, { 'water-note-hide': () => { S.waterNoteHidden = today(); save(); const y = scrollY; refresh(); window.scrollTo(0, y); toast('Water reminder hidden until tomorrow. Keep sipping!', { icon: IC.drop }); } });
