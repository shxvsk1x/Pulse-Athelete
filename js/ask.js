/* =========================================================
   PULSE — Ask Pulse: a built-in coach for nutrition, diet and training.
   Rule-based (no AI service). It can change the plan, but only when the
   change helps the athlete progress; it says no to changes that do not.
   ========================================================= */
const ASK = { pending: {}, typing: false };
const ASK_SUGGEST = ['How much protein do I need?', 'What should I eat before training?', 'Make my workouts harder', 'Swap an exercise', 'Is creatine safe for me?', 'Can I eat pizza?', 'How much water should I drink?', 'I’m sore, should I train?'];

VIEWS.ask = () => {
  const chat = S.chat || [];
  return `<div class="ask">
    <div class="ask-head"><div><div class="label">Ask Pulse</div><h2 style="margin-top:6px">Your pocket <em>coach.</em></h2><p class="muted" style="font-size:14px">Ask about food, training, recovery or your plan. Pulse can change your plan when it helps you progress faster.</p></div>${chat.length ? `<button class="btn btn-quiet btn-sm" data-act="ask-clear">${IC.trash}Clear chat</button>` : ''}</div>
    <div class="ask-log" id="ask-log" aria-live="polite">
      ${chat.length ? chat.map(askBubble).join('') : askBubble({ who: 'bot', html: askIntro() })}
      ${ASK.typing ? `<div class="bub bot typing"><span></span><span></span><span></span></div>` : ''}
    </div>
    <div class="ask-sug">${ASK_SUGGEST.map(q => `<button class="chip sm" data-act="ask-q" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    <form class="ask-in" id="ask-form" novalidate><input class="input" id="ask-text" type="text" maxlength="300" placeholder="Ask anything about food or training…" autocomplete="off" aria-label="Your question"><button class="btn btn-primary" type="submit" aria-label="Send">${IC.send}</button></form>
    <p class="muted" style="font-size:12px;text-align:center;margin-top:8px">Pulse gives general guidance, not medical advice. For pain, illness or medicines, talk to a doctor.</p>
  </div>`;
};
function askIntro() {
  const p = S.profile;
  return `Hi ${esc(p.name)}. I know your plan: <b>${esc(GOALS[p.goal].label.toLowerCase())}</b>, ${p.sessions} sessions a week, ${esc({ all: 'any', pesc: 'pescatarian', veg: 'vegetarian', vegan: 'vegan' }[p.diet])} diet. Ask me anything, for example how much protein you need, what to eat before a match, or to make your sessions harder.`;
}
function askBubble(m) {
  const acts = m.acts && m.acts.length && ASK.pending[m.id] ? `<div class="bub-acts">${m.acts.map((a, i) => `<button class="btn ${i ? 'btn-ghost' : 'btn-primary'} btn-sm" data-act="ask-do" data-id="${m.id}" data-i="${i}">${esc(a)}</button>`).join('')}</div>` : '';
  return `<div class="bub ${m.who}">${m.who === 'bot' ? `<span class="bub-ic">${IC.mark}</span>` : ''}<div class="bub-t">${m.html}${acts}</div></div>`;
}
function askSend(text) {
  text = String(text || '').trim(); if (!text) return;
  S.chat = S.chat || [];
  S.chat.push({ who: 'me', html: esc(text), t: Date.now() });
  ASK.typing = true; askRedraw();
  setTimeout(() => {
    let r; try { r = askBot(text); } catch (e) { console.error(e); r = { html: 'Sorry, I got confused by that one. Try asking it another way.' }; }
    const id = 'a' + Date.now().toString(36);
    if (r.apply) ASK.pending[id] = r.apply;
    S.chat.push({ who: 'bot', html: r.html, t: Date.now(), id, acts: r.apply ? (r.acts || ['Apply change', 'Keep my plan']) : null });
    if (S.chat.length > 60) S.chat = S.chat.slice(-60);
    ASK.typing = false; save(); askRedraw();
  }, REDUCED ? 60 : 420 + Math.min(700, text.length * 8));
}
function askRedraw() {
  if (UI.view !== 'ask') return;
  const log = $('#ask-log'); if (!log) return;
  const chat = S.chat || [];
  log.innerHTML = (chat.length ? chat.map(askBubble).join('') : askBubble({ who: 'bot', html: askIntro() })) + (ASK.typing ? `<div class="bub bot typing"><span></span><span></span><span></span></div>` : '');
  log.lastElementChild && log.lastElementChild.scrollIntoView({ block: 'end', behavior: REDUCED ? 'auto' : 'smooth' });
  const clr = $('[data-act="ask-clear"]'); if (!clr && chat.length) { const h = $('.ask-head'); h && h.insertAdjacentHTML('beforeend', `<button class="btn btn-quiet btn-sm" data-act="ask-clear">${IC.trash}Clear chat</button>`); }
}

/* ---------- the brain ---------- */
const has = (t, ...ws) => ws.some(w => w instanceof RegExp ? w.test(t) : t.includes(w));
function dietFoods(ids, n = 3) { return ids.filter(id => FOODS[id] && foodOk(id, S.profile)).slice(0, n).map(id => FOODS[id][0].split(',')[0].toLowerCase()); }
const list = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
function planExercises() {
  const out = new Map(), p = S.profile, split = SPLITS[p.sessions];
  split.forEach((tk, i) => buildSession(p, tk, i, 1, S.swaps || {}).exs.forEach(e => { if (!out.has(e.n.toLowerCase())) out.set(e.n.toLowerCase(), []); out.get(e.n.toLowerCase()).push(e); }));
  return out;
}
function rebuildMsg() { UI.planWeek = UI.planDay = null; }

function askBot(raw) {
  const t = ' ' + raw.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9.%' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  const p = S.profile, T = targets(p, !!sessionFor(new Date())), minor = +p.age < 18, goalL = { muscle: 'build muscle', strength: 'get stronger', lean: 'lean out', general: 'get fitter', endurance: 'build endurance', speed: 'get faster and more explosive', mobility: 'move better and stay injury-free' }[p.goal];

  /* safety first: pain and injury */
  if (has(t, ' pain', 'hurts', ' hurt ', 'injur', 'sprain', 'swollen', 'swelling', 'popped', 'twisted', 'tweaked', 'dizzy', 'faint', 'chest pain')) {
    const part = Object.keys(INJ_WORDS).find(k => INJ_WORDS[k].some(w => t.includes(w)));
    const serious = has(t, 'chest pain', 'dizzy', 'faint', 'popped', 'swollen', 'swelling', "can't walk", 'cannot walk', 'numb');
    const html = `${serious ? '<b>Stop training and tell an adult or your coach now.</b> ' : '<b>Pain is a signal to stop, not to push through.</b> '}Sharp pain, swelling, pain that changes how you move or that is still there after 48 hours needs a doctor or physio. Muscle soreness a day or two after training is normal; pain during a movement is not.${part ? `<br><br>I can add your ${part} to your plan so Pulse steers around exercises that load it until it settles.` : ''}`;
    if (part && !injuriesOf(p).includes(part)) return { html, acts: [`Protect my ${part}`, 'Not now'], apply: () => { p.injuries = (p.injuries ? p.injuries + ', ' : '') + part; S.swaps = {}; rebuildMsg(); return `Done. Exercises that load your ${part} are out of your plan. Remove it from Edit plan inputs when it feels normal again, and see a physio if it does not improve.`; } };
    return { html };
  }

  /* eating less / skipping meals: never encourage it */
  if (has(t, 'starv', 'skip meal', 'skip breakfast', 'skip lunch', 'skip dinner', 'not eat', "don't eat", 'stop eating', 'crash diet', 'eat less', 'eat nothing', 'fasting', 'fast for', 'lose weight fast', 'lose weight quick', 'cut calories', 'only water')) {
    return { html: `I won’t help with eating less than your body needs. Under-eating while you train <b>slows growth, drains energy, weakens bones and shrinks muscle</b>, which is the opposite of what you are training for.<br><br>Your targets are already set so you make steady progress safely, and Pulse checks your weigh-ins every week and adjusts them if needed. If food or your body shape is on your mind a lot, it really helps to talk to a parent, your coach or a doctor.` };
  }

  /* junk food and bad habits */
  const j = junkCheck(raw);
  if (j || has(t, 'cheat meal', 'cheat day', 'junk', 'fast food', 'sugar')) {
    if (j) { const alt = FOODS[junkAlt(j, p)]; return { html: `<b>${esc(j.k)} won’t help you ${esc(goalL)}.</b> ${esc(j.why)}<br><br><b>What it does to your body:</b> ${esc(j.fx)}<br><br>${esc(GOAL_HARM[p.goal])} A better pick: <b>${esc(alt[0].toLowerCase())}</b> (${fmtN(alt[2])} kcal, ${fmt1(alt[3])} g protein). Pulse won’t log ${esc(j.k.toLowerCase())}, but it will happily log that.`, acts: [`Log ${alt[0].split(',')[0].toLowerCase()}`, 'No thanks'], apply: () => { const id = junkAlt(j, p); UI.fuelDate = today(); addFood(id); return `Logged ${esc(FOODS[id][0].toLowerCase())}. Good swap.`; } }; }
    return { html: `Junk food is built to be eaten fast and in large amounts: lots of sugar, salt and frying oil, very little protein or fibre. It leads to <b>energy crashes, slower recovery and fat gain</b>, and it pushes out the food your muscles actually need.<br><br>You don’t need a “cheat day”. If you want a treat, make it a better version: ${list(dietFoods(['greek', 'fruitbowl', 'dates', 'makhana', 'smoothie']))}. Hitting your meal plan most days is what gets results.` };
  }
  if (has(t, 'all nighter', 'stay up', 'staying up', 'sleep late', 'sleep less', 'less sleep', 'no sleep', "don't sleep", 'only sleep')) return { html: `Cutting sleep is the fastest way to lose progress. Muscle repair and growth hormone release happen mostly in deep sleep, and teenagers need <b>8 to 10 hours</b>. Short sleep makes you slower, weaker, hungrier for sugar and more likely to get injured.<br><br>Try: same bedtime every night, phone away 30 minutes before bed, no caffeine after lunch.` };
  if (has(t, 'vape', 'vaping', 'smok', 'cigarette', 'hookah')) return { html: `Smoking and vaping damage your lungs and blood vessels, cut how much oxygen reaches your muscles and are addictive. For an athlete that means <b>less endurance and slower recovery</b>, straight away. If you want help quitting, talk to a doctor, school counsellor or someone you trust.` };
  if (has(t, 'twice a day', 'every day', 'train daily', 'no rest', 'without rest', '7 days', 'seven days')) return { html: `More is not better. Muscles grow <b>between</b> sessions, not during them. Training hard every day without rest raises injury risk and stalls progress. Your ${p.sessions} sessions a week already give each muscle enough work and enough recovery. On rest days, walk, stretch or do light skill work for your sport.` };

  /* supplements */
  const sp = suppFind(raw);
  if (sp || has(t, 'supplement', 'steroid')) {
    if (!sp) return { html: `Most athletes your age don’t need supplements; food covers almost everything. A few (like protein powder or B12 for vegans) are fine. Others can have side effects for under-18s, so Pulse asks for a <b>doctor’s note and a coach’s sign-off</b> first. Add one from <b>Fuel → Supplements</b> and Pulse will tell you what it needs.` };
    const r = suppRule(sp, p);
    const how = { ok: `It is fine to add. ${esc(sp.note || '')}`, warn: `${esc(sp.fx)} Check with a doctor before you start.`, approval: `${esc(sp.fx)}<br><br>Because you are under 18, Pulse needs a <b>doctor’s note</b> saying you can take it, verified by one of your coaches, before it goes in your plan. Add it from Fuel → Supplements.`, block: esc(sp.fx), never: esc(sp.fx) }[r];
    return { html: `<b>${esc(sp.n)}.</b> ${how}`, acts: r === 'never' || r === 'block' ? null : ['Go to supplements'], apply: r === 'never' || r === 'block' ? null : () => { setTimeout(() => navigate('fuel'), 200); return 'Opening Fuel. Scroll to Supplements.'; } };
  }

  /* plan edits */
  const lvlFix = has(t, 'harder', 'more intense', 'too easy', 'not hard', 'push me', 'intensity up', 'more difficult', 'heavier');
  const easier = has(t, 'easier', 'too hard', 'less intense', 'too difficult', 'too tough', 'tone it down', 'lighter');
  if (lvlFix) {
    const r = acwr(), cur = +p.rpeAdj || 0;
    if (r && r > 1.4) return { html: `Not this week. Your training load is already climbing fast (acute : chronic ${fmt1(r)}), and pushing harder now raises injury risk without speeding up progress. Hit this week as planned and ask me again next week.` };
    if (cur >= 1) return { html: `Your sessions are already set at the hardest level Pulse uses for your experience. To keep progressing, add 2.5 kg or 1–2 reps when every set feels like RPE 7 or less. That is progressive overload, and it is what drives results.` };
    return { html: `I can make your working sets aim <b>half a point harder on the RPE scale</b>. That means finishing sets with 1–2 reps in the tank instead of 2–3. It fits your goal to ${esc(goalL)} and your load looks safe.`, apply: () => { p.rpeAdj = round(cur + 0.5, 1); rebuildMsg(); return 'Done. Your sessions now aim half a point harder. Keep your form tight, and log how each session felt so Pulse can keep an eye on your load.'; } };
  }
  if (easier) {
    const rds = Object.entries(S.log.check).filter(([d]) => d >= iso(addDays(new Date(), -5))).map(([, c]) => readiness(c));
    const low = rds.length && rds.reduce((a, b) => a + b, 0) / rds.length < 50;
    const recent = S.log.sessions.slice(-4), rpe = recent.length ? recent.reduce((a, s) => a + s.rpe, 0) / recent.length : 0;
    if (low || rpe >= 8.6) return { html: `You’re right to ask. ${low ? 'Your readiness has been low this week' : `Your last sessions averaged RPE ${fmt1(rpe)}, which is very hard`}. I can lower the target by half a point so you recover and keep making progress.`, apply: () => { p.rpeAdj = round((+p.rpeAdj || 0) - 0.5, 1); rebuildMsg(); return 'Done. Sessions aim half a point easier. Pulse will look again at your next weekly check.'; } };
    return { html: `I’d rather not. Your readiness and session ratings say you are handling the plan well, and that challenge is exactly what drives your progress. If one day feels rough, do the morning check-in: when readiness is low, Pulse tells you to drop to the low end of the range for that day.` };
  }
  const days = t.match(/ (\d) (days|sessions|times|day)/) || t.match(/(two|three|four|five|six) (days|sessions|times)/);
  if (days && has(t, 'train', 'session', 'day', 'week', 'change', 'want', 'can')) {
    const n = +days[1] || { two: 2, three: 3, four: 4, five: 5, six: 6 }[days[1]];
    if (n === p.sessions) return { html: `You’re already on ${n} sessions a week.` };
    if (n < 2 || n > 6) return { html: `Pulse plans between 2 and 6 sessions a week. ${n > 6 ? 'More than six leaves no time to recover, which is when you actually get fitter.' : ''}` };
    const since = iso(addDays(new Date(), -28)), done = S.log.sessions.filter(s => s.date >= since).length / 4;
    if (n > p.sessions) {
      if (p.exp === 'beg' && n > 4) return { html: `As someone newer to lifting, 3 or 4 sessions gives you the fastest progress: enough practice, enough recovery. ${n} would add fatigue without adding much muscle or strength. I can move you to 4 if you like.`, apply: p.sessions < 4 ? () => { p.sessions = 4; p.days = []; rebuildMsg(); return 'Done. You’re on 4 sessions a week now. Check the Plan tab for your new days.'; } : null };
      if (done < p.sessions * 0.75 && S.log.sessions.length > 3) return { html: `Right now you’re averaging ${fmt1(done)} of your ${p.sessions} planned sessions a week. Adding more won’t help until those happen. Nail your current plan for two weeks and ask again.` };
      return { html: `Going to <b>${n} sessions a week</b> fits your goal and your training history. Pulse will rebuild your split; your logs and history stay.`, apply: () => { p.sessions = n; p.days = []; rebuildMsg(); return `Done. Your plan now has ${n} sessions a week. Check the Plan tab for your new days.`; } };
    }
    if (n < 3 && ['muscle', 'strength', 'speed'].includes(p.goal) && done >= 2.5) return { html: `Two sessions a week would noticeably slow you down. You’re managing ${fmt1(done)} a week right now, so you can handle more. If time is tight, I can shorten your sessions instead.`, acts: ['Make sessions 45 min', 'Keep my plan'], apply: () => { p.minutes = 45; rebuildMsg(); return 'Done. Sessions are now about 45 minutes.'; } };
    return { html: `Doing ${n} sessions you actually finish beats ${p.sessions} you miss. ${S.log.sessions.length ? `You’re averaging ${fmt1(done)} a week, so ${n} is realistic.` : ''} Pulse will rebuild your split around it.`, apply: () => { p.sessions = n; p.days = []; rebuildMsg(); return `Done. Your plan now has ${n} sessions a week.`; } };
  }
  if (has(t, 'swap', 'replace', 'change exercise', "don't like", 'hate', 'instead of', "can't do", 'cannot do', 'alternative to')) {
    const ex = planExercises(); let hit = null;
    for (const [n, arr] of ex) if (t.includes(' ' + n + ' ') || t.includes(n.replace(/s$/, ''))) { hit = arr; break; }
    if (!hit) { const words = t.split(' ').filter(w => w.length > 3); for (const [n, arr] of ex) if (words.some(w => n.includes(w) && !['swap', 'replace', 'exercise', 'instead', 'like', 'hate', 'with', 'than'].includes(w))) { hit = arr; break; } }
    if (!hit) return { html: `Which exercise? Your plan has: ${[...ex.values()].slice(0, 14).map(a => '<b>' + esc(a[0].n) + '</b>').join(', ')}. Say “swap ${esc([...ex.values()][0][0].n.toLowerCase())}”, for example. You can also tap the swap button next to any exercise in the Plan tab.` };
    const e = hit[0];
    if (e.alts < 2) return { html: `<b>${esc(e.n)}</b> is the only option for that slot with the equipment you picked. Add more equipment in Edit plan inputs and Pulse will have alternatives.` };
    const keys = hit.map(x => x.key), probe = Object.assign({}, S.swaps); keys.forEach(k => probe[k] = (probe[k] || 0) + 1);
    const next = buildSession(p, keys[0].split('|')[0], 0, 1, probe).exs.find(x => x.key === keys[0]);
    return { html: `I can swap <b>${esc(e.n)}</b> for <b>${esc(next ? next.n : 'another option')}</b>. It trains the same movement, so your progress is not affected.`, acts: ['Swap it', 'Keep it'], apply: () => { keys.forEach(k => S.swaps[k] = (S.swaps[k] || 0) + 1); rebuildMsg(); return `Done. ${esc(e.n)} is now ${esc(next ? next.n : 'swapped')} everywhere in your plan.`; } };
  }
  const goalTo = Object.entries(GOALS).find(([k, g]) => t.includes(g.label.toLowerCase()) || t.includes(' ' + k + ' '));
  if (goalTo && has(t, 'goal', 'switch', 'change', 'want to', 'focus')) {
    if (goalTo[0] === p.goal) return { html: `Your main goal is already ${esc(goalTo[1].label.toLowerCase())}.` };
    return { html: `Switching your main goal to <b>${esc(goalTo[1].label.toLowerCase())}</b> changes your reps, rest times and food targets. ${esc(goalTo[1].line)}`, apply: () => { p.goal = goalTo[0]; p.extra = (p.extra || []).filter(x => x !== goalTo[0]); p.kcalAdj = 0; p.rpeAdj = 0; rebuildMsg(); return `Done. Your goal is now ${esc(goalTo[1].label.toLowerCase())}, and your sessions and food targets have been rebuilt.`; } };
  }
  if (has(t, 'more calories', 'eat more', 'bulk', 'gain weight', 'put on weight', 'increase calories')) {
    if (['muscle', 'strength'].includes(p.goal) || has(t, 'underweight', 'skinny')) {
      const ps = progressStatus();
      if (ps.status === 'on-track' || ps.status === 'above') return { html: `Your weight is already moving at the right speed for building muscle. Eating more right now would add fat, not muscle. Pulse checks every week and adds food if you stall.` };
      return { html: `You can add <b>150 kcal a day</b> (about a banana and a glass of milk, or a handful of peanuts). That helps ${esc(goalL)} without much fat gain.`, apply: () => { p.kcalAdj = clamp((+p.kcalAdj || 0) + 150, -450, 450); return `Done. Your daily target is now ${fmtN(targets(p, true).kcal)} kcal on training days.`; } };
    }
    return { html: `For your goal to ${esc(goalL)}, extra food would mostly add fat. If you want to gain muscle, ask me to change your goal to build muscle.` };
  }
  if (has(t, 'vegan', 'vegetarian', 'pescatarian', 'eat meat', 'stop eating meat') && has(t, 'now', 'became', 'went', 'switch', 'change', "i'm", 'i am')) {
    const d = has(t, 'vegan') ? 'vegan' : has(t, 'pescatarian') ? 'pesc' : has(t, 'eat meat') && !has(t, 'stop') ? 'all' : 'veg';
    if (d === p.diet) return { html: `Your plan is already ${esc(DIET_LABEL[d].toLowerCase())}.` };
    return { html: `I can switch your meal plan to <b>${esc(DIET_LABEL[d].toLowerCase())}</b>. Your protein target stays the same; Pulse will use ${list(dietFoods(['dal', 'tofu', 'soya', 'chana', 'paneer', 'greek', 'eggs'].filter(id => DIET_OK[d].includes(FOODS[id][6]))))} to hit it.`, apply: () => { p.diet = d; return `Done. Your meal plan is now ${esc(DIET_LABEL[d].toLowerCase())}.`; } };
  }

  /* information */
  if (has(t, 'protein')) {
    const per = Math.round(T.protein / 4);
    return { html: `Your target is <b>${T.protein} g of protein a day</b>, about ${per} g at each of 4 meals. That is ${({ muscle: 1.8, strength: 1.8, lean: 2.0, general: 1.5, endurance: 1.5, speed: 1.7, mobility: 1.4 })[p.goal]} g per kg of body weight, which suits your goal to ${esc(goalL)}.<br><br>Good sources that fit your diet: ${list(dietFoods(['chicken', 'fish', 'eggs', 'paneer', 'greek', 'tofu', 'soya', 'dal', 'chana', 'sprouts'], 5))}. Today you’ve had <b>${fmtN(sumFoods(S.log.food[today()] || []).p)} g</b>.` };
  }
  if (has(t, 'water', 'hydrat', 'drink', 'thirst')) {
    const ml = waterMl(today()), m = t.match(/(\d{2,4}) ?ml/) || t.match(/(\d(?:\.\d)?) ?l(?:itre|iter)?s? /);
    if (m && has(t, 'drank', 'had', 'log', 'add', 'drink')) { const v = m[0].includes('ml') ? +m[1] : Math.round(+m[1] * 1000); return { html: `Log <b>${v} ml</b> of water?`, acts: [`Log ${v} ml`, 'Cancel'], apply: () => { addDrink(v); return `Logged. You’re on ${fmtMl(waterMl(today()))} of ${fmtMl(T.water)} today.`; } }; }
    return { html: `Your target today is <b>${fmtMl(T.water)}</b>${sessionFor(new Date()) ? ', including 500 ml extra for training' : ''}. You’ve had <b>${fmtMl(ml)}</b> so far.<br><br>Why it matters: losing just 2% of your body weight in sweat makes you weaker, slower and worse at decisions in a match. Easy wins: a glass when you wake up, one with every meal, sips every 15–20 minutes while training, and 500 ml in the hour after. Pale yellow pee means you are on track.` };
  }
  if (has(t, 'calorie', 'kcal', 'how much should i eat', 'how much food')) {
    const e = sumFoods(S.log.food[today()] || []);
    return { html: `Today’s target is <b>${fmtN(T.kcal)} kcal</b> (${T.protein} g protein, ${T.carbs} g carbs, ${T.fat} g fat). You’ve logged ${fmtN(e.kcal)} kcal so far, so ${T.kcal - e.kcal >= 0 ? `<b>${fmtN(T.kcal - e.kcal)} kcal</b> to go` : `you’re ${fmtN(e.kcal - T.kcal)} over`}.${minor && p.goal === 'lean' ? ' Because you are under 18, Pulse keeps any deficit small so your growth is not affected.' : ''}` };
  }
  if (has(t, 'before training', 'before workout', 'before a match', 'before match', 'before the gym', 'pre workout', 'pre-workout', 'before practice', 'before game')) return { html: `Eat a normal meal <b>2–3 hours before</b>, or a light carb snack <b>30–60 minutes before</b>. Keep it low in fat and fibre so it sits easy. Good picks for you: ${list(dietFoods(['banana', 'oats', 'idli', 'poha', 'bread', 'dates', 'curd'], 4))}. Have a glass of water with it.` };
  if (has(t, 'after training', 'after workout', 'post workout', 'after the gym', 'after match', 'after practice', 'recovery meal')) return { html: `Within two hours, have <b>${Math.round(p.weight * 0.3)}–${Math.round(p.weight * 0.4)} g of protein plus carbs</b>, and drink 500 ml of water. Easy options: ${list(dietFoods(['chicken', 'paneer', 'greek', 'eggs', 'dal', 'tofu', 'soya', 'whey', 'pea'], 3))} with ${list(dietFoods(['rice', 'roti', 'banana', 'sweetpotato'], 2))}.` };
  if (has(t, 'sore', 'doms', 'stiff', 'aching', 'achy')) {
    const c = S.log.check[today()];
    return { html: `Soreness 1–2 days after a session is normal (it’s called DOMS) and it is fine to train. Warm up well and it usually eases. Light movement, sleep, protein and water help most.${c && c.sore >= 4 ? ' You rated soreness high today, so keep effort at the low end of your RPE range.' : ''} If it is sharp, one-sided or around a joint, that is pain, not soreness: rest it and get it checked.` };
  }
  if (has(t, 'sleep', 'tired', 'exhausted', 'fatigue', 'no energy', 'low energy')) return { html: `Most energy problems come down to <b>sleep, food and water</b>. Teenagers need 8–10 hours of sleep; your check-ins average ${(() => { const c = Object.values(S.log.check).slice(-7); return c.length ? fmt1(c.reduce((a, x) => a + x.sleep, 0) / c.length) + ' h' : 'not enough data yet'; })()}. Also check you are hitting your calories (${fmtN(T.kcal)} kcal) and water (${fmtMl(T.water)}). If you feel tired all the time even with good sleep and food, see a doctor; low iron or vitamin D are common in athletes.` };
  if (has(t, 'today', 'workout', 'session', 'what should i do', 'training plan')) {
    const s = sessionFor(new Date());
    if (!s) { const nx = nextSessionFrom(new Date()); return { html: `Today is a rest day. A 20-minute walk and some mobility is perfect.${nx ? ` Next up: <b>${esc(nx.sess.name)}</b> on ${DAYS_L[wd(nx.date)]}.` : ''}` }; }
    return { html: `Today is <b>${esc(s.name)}</b> (${esc(s.focus.toLowerCase())}, about ${s.mins} minutes, ${esc(s.phase.n)} week): ${s.exs.map(e => `${esc(e.n)} ${e.sets}×${esc(e.reps)}`).join(', ')}.`, acts: ['Start session', 'Not yet'], apply: () => { setTimeout(() => startSession(), 200); return 'Starting your session. Tick off each set as you go.'; } };
  }
  const exm = [...EX].sort((a, b) => b.n.length - a.n.length).find(e => t.includes(' ' + e.n.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ') + ' ') || t.includes(e.n.toLowerCase()));
  if (exm) { const f = formOf(exm.n); return { html: `<b>${esc(exm.n)}:</b> ${f ? f.s.map(esc).join(' ') + ' <b>Avoid:</b> ' + esc(f.x) : esc(exm.cue)}`, acts: f ? ['Watch the form video', 'No thanks'] : null, apply: f ? () => { setTimeout(() => formModal(exm.n), 150); return `Opening the ${esc(exm.n.toLowerCase())} video.`; } : null }; }
  if (has(t, 'lose fat', 'lose weight', 'get lean', 'abs', 'six pack', 'belly', 'tummy')) return { html: `Fat loss comes from a <b>small, steady calorie deficit</b>, lots of protein, lifting to keep muscle, and sleep. You can’t burn fat from one spot with crunches; abs show when overall body fat drops.${p.goal !== 'lean' ? ' If this is your main aim, ask me to change your goal to lean out.' : ' That is exactly what your plan does, and the weekly weigh-in keeps it on track.'}` };
  if (has(t, 'build muscle', 'gain muscle', 'get bigger', 'get big', 'bigger arms', 'get strong', 'stronger')) return { html: `Muscle and strength come from four things: <b>progressive overload</b> (a little more weight or reps over time), <b>enough protein</b> (${T.protein} g a day for you), <b>enough food</b>, and <b>sleep</b>. Log your weights in each session and try to beat them by a rep or 2.5 kg every week or two.` };
  if (has(t, 'faster', 'speed', 'sprint', 'explosive', 'jump higher', 'vertical')) return { html: `Speed comes from <b>strength plus practice moving fast</b>. Your plan puts jumps and throws first in a session, when you are fresh, then strength work. Keep sprints short (10–30 m) with full rest, and stay rested on the days you do them.` };
  if (has(t, 'taller', 'grow', 'height', 'stunt')) return { html: `Lifting with good technique does <b>not</b> stunt growth; that is a myth. Height is mostly genetic, but you give yourself the best chance with enough sleep, enough food (especially protein and calcium) and not under-eating.` };
  if (has(t, 'warm up', 'warmup', 'stretch')) return { html: `Every session starts with a 6-minute RAMP warm-up: raise your heart rate, activate glutes and upper back, mobilise hips and spine, then a couple of lighter sets of your first lift. Save long static stretches for after training or rest days.` };
  if (has(t, 'motivat', 'lazy', "don't feel like", 'give up', 'bored', 'cant be bothered', "can't be bothered")) return { html: `Totally normal. Make it small: commit to the warm-up and the first exercise only. Most days you’ll finish once you start. You’re on a ${weekStreak()}-week streak of full weeks${weekStreak() ? ', so protect it' : ''}. Progress comes from showing up, not from perfect sessions.` };
  if (has(t, 'hello', ' hi ', 'hey', 'help', 'what can you')) return { html: askIntro() + `<br><br>I can also change your plan: swap exercises, make sessions harder, change your training days, switch your diet or goal. I’ll only do it if it helps you progress.` };
  if (has(t, 'thank', 'thanks', 'cool', 'great', 'nice')) return { html: `Any time. Go get it, ${esc(p.name)}.` };
  return { html: `I’m not sure about that one. I’m best at questions about <b>food, water, training, recovery and your plan</b>. Try one of the suggestions below, or ask your coach for anything else.` };
}

Object.assign(ACT, {
  'ask-q': el => askSend(el.dataset.q),
  'ask-do': el => {
    const id = el.dataset.id, i = +el.dataset.i, fn = ASK.pending[id]; delete ASK.pending[id];
    const m = S.chat.find(x => x.id === id); if (m) m.acts = null;
    if (!fn) return;
    if (i === 0) { const msg = fn(); S.chat.push({ who: 'bot', html: msg || 'Done.', t: Date.now() }); toast('Plan updated.', { icon: IC.check }); }
    else S.chat.push({ who: 'bot', html: 'No problem, your plan stays as it is.', t: Date.now() });
    save(); askRedraw(); checkMilestones();
  },
  'ask-clear': () => { S.chat = []; ASK.pending = {}; save(); refresh(); }
});
document.addEventListener('submit', e => { if (e.target.id !== 'ask-form') return; e.preventDefault(); const i = $('#ask-text'); const v = i.value; i.value = ''; askSend(v); i.focus(); });
