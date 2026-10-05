/* =========================================================
   PULSE — nutrition rules: goal-matched meals, junk-food guard,
   supplements and water helpers
   ========================================================= */

/* ---------- more whole foods ---------- */
Object.assign(FOODS, {
  moongchilla: ['Moong dal chilla', '2 pieces', 220, 14, 30, 5, 'vegan', []],
  besanchilla: ['Besan chilla', '2 pieces', 240, 12, 28, 8, 'vegan', []],
  paneerbhurji: ['Paneer bhurji', '150 g', 330, 22, 8, 23, 'veg', ['dairy']],
  eggbhurji: ['Egg bhurji', '3 eggs', 250, 18, 5, 18, 'veg', ['egg']],
  eggwhite: ['Egg white omelette', '5 whites', 90, 18, 1, 0.3, 'veg', ['egg']],
  tofubhurji: ['Tofu bhurji', '200 g', 260, 26, 8, 14, 'vegan', ['soy']],
  quinoa: ['Quinoa, cooked', '1 cup (185 g)', 222, 8, 39, 3.5, 'vegan', []],
  brownrice: ['Brown rice, cooked', '1 cup (195 g)', 218, 5, 46, 1.6, 'vegan', []],
  chickentikka: ['Chicken tikka', '150 g', 260, 38, 5, 9, 'meat', ['dairy']],
  chickensoup: ['Chicken clear soup', '1 bowl', 150, 18, 8, 5, 'meat', []],
  fishcurry: ['Fish curry', '1 bowl', 280, 28, 8, 15, 'fish', ['fish']],
  eggcurry: ['Egg curry', '2 eggs', 260, 14, 10, 18, 'veg', ['egg']],
  paneertikka: ['Paneer tikka', '150 g', 330, 24, 8, 22, 'veg', ['dairy']],
  palakpaneer: ['Palak paneer', '1 bowl', 290, 15, 10, 21, 'veg', ['dairy']],
  smoothie: ['Banana oat smoothie (milk)', '350 ml', 320, 13, 52, 8, 'veg', ['dairy', 'gluten']],
  soysmoothie: ['Banana oat smoothie (soy milk)', '350 ml', 300, 12, 50, 7, 'vegan', ['soy', 'gluten']],
  fruitbowl: ['Fruit bowl', '1 bowl', 120, 2, 30, 0.5, 'vegan', []],
  makhana: ['Roasted makhana', '30 g', 105, 3, 23, 0.2, 'vegan', []],
  roastedchana: ['Roasted chana', '40 g', 150, 8, 24, 2.5, 'vegan', []],
  peanuts: ['Peanuts, roasted', '30 g', 170, 7.5, 5, 14.5, 'vegan', ['peanut']],
  buttermilk: ['Buttermilk (chaas)', '300 ml', 60, 4, 6, 2, 'veg', ['dairy']],
  dalia: ['Vegetable dalia', '1 bowl', 250, 9, 45, 4, 'vegan', ['gluten']],
  dates: ['Dates', '3 pieces', 70, 0.6, 18, 0, 'vegan', []],
  orange: ['Orange', '1 medium', 62, 1.2, 15, 0.2, 'vegan', []],
  curdrice: ['Curd rice', '1 bowl', 280, 8, 45, 7, 'veg', ['dairy']],
  vegpulao: ['Veg pulao', '1 plate', 320, 7, 55, 8, 'vegan', []],
  dhokla: ['Dhokla', '4 pieces', 160, 6, 24, 4, 'vegan', []],
  soymilk: ['Soy milk, unsweetened', '250 ml', 100, 8, 4, 4.5, 'vegan', ['soy']],
  chickenrice: ['Chicken and veg rice bowl', '1 bowl', 480, 36, 58, 10, 'meat', []],
  rajmarice: ['Rajma chawal', '1 plate', 450, 17, 82, 4, 'vegan', []]
});

/* ---------- meal combos (each one a whole, balanced meal) ---------- */
const MEAL_POOL = {
  Breakfast: [['oats', 'milk', 'banana'], ['eggs', 'bread', 'apple'], ['poha', 'curd'], ['idli', 'eggwhite'], ['greek', 'oats', 'almonds'], ['pea', 'oats', 'banana'], ['omelette', 'bread'], ['dosa', 'curd'], ['upma', 'sprouts'],
    ['moongchilla', 'curd'], ['besanchilla', 'greek'], ['paneerbhurji', 'roti'], ['eggbhurji', 'bread', 'orange'], ['tofubhurji', 'roti'], ['smoothie', 'eggs'], ['soysmoothie', 'peanuts'], ['dalia', 'milk'], ['moongchilla', 'soymilk', 'apple'], ['oats', 'soymilk', 'almonds']],
  Lunch: [['rice', 'dal', 'sabzi', 'curd'], ['roti', 'rajma', 'salad'], ['roti', 'paneer', 'sabzi'], ['rice', 'chicken', 'sabzi'], ['rice', 'fish', 'salad'], ['rice', 'chana', 'salad'], ['roti', 'tofu', 'sabzi'], ['khichdi', 'curd', 'salad'], ['rice', 'soya', 'sabzi'],
    ['chickenrice', 'salad'], ['rajmarice', 'curd'], ['brownrice', 'chickentikka', 'salad'], ['quinoa', 'chana', 'salad'], ['roti', 'palakpaneer', 'salad'], ['brownrice', 'fishcurry'], ['roti', 'eggcurry', 'sabzi'], ['quinoa', 'tofu', 'sabzi'], ['vegpulao', 'curd', 'sprouts']],
  Snack: [['whey', 'banana'], ['pea', 'banana'], ['sprouts', 'coconut'], ['pb', 'bread'], ['almonds', 'apple'], ['hummus', 'apple'], ['greek', 'fruitbowl'], ['makhana', 'buttermilk'], ['roastedchana', 'orange'],
    ['dhokla', 'buttermilk'], ['peanuts', 'dates'], ['curd', 'fruitbowl'], ['soymilk', 'roastedchana'], ['eggs', 'orange'], ['smoothie'], ['whey', 'oats']],
  Dinner: [['roti', 'dal', 'sabzi'], ['rice', 'soya', 'sabzi'], ['chicken', 'sweetpotato', 'salad'], ['fish', 'rice', 'salad'], ['paneer', 'roti', 'salad'], ['tofu', 'rice', 'sabzi'], ['mutton', 'roti', 'salad'], ['khichdi', 'sabzi'], ['pasta', 'tuna', 'salad'],
    ['chickentikka', 'roti', 'salad'], ['paneertikka', 'quinoa', 'salad'], ['fishcurry', 'brownrice'], ['tofubhurji', 'roti', 'salad'], ['dal', 'brownrice', 'sabzi'], ['chickensoup', 'roti', 'sabzi'], ['eggcurry', 'rice', 'salad'], ['palakpaneer', 'roti'], ['curdrice', 'sprouts']]
};
const MEAL_META = {
  Breakfast: { ic: 'sunrise', tone: 'm-bf', share: 0.25, when: 'Within an hour of waking' },
  Lunch: { ic: 'today', tone: 'm-lu', share: 0.32, when: 'Midday' },
  Snack: { ic: 'apple', tone: 'm-sn', share: 0.13, when: 'Before or after training' },
  Dinner: { ic: 'moonmeal', tone: 'm-di', share: 0.30, when: 'Two hours before bed' }
};

/* how well a meal suits a goal: protein density matters for every goal,
   carbs for endurance and speed, energy density for muscle */
function mealScore(t, goal) {
  const pd = t.p * 4 / Math.max(1, t.kcal), cs = t.c * 4 / Math.max(1, t.kcal), fs = t.f * 9 / Math.max(1, t.kcal);
  const w = { muscle: [3, 0.5, 0.6], strength: [3, 0.5, 0.4], lean: [4, 0, -0.6], general: [2.5, 0.5, 0], endurance: [2, 1.6, 0], speed: [2.6, 1, 0], mobility: [2.4, 0.4, 0] }[goal] || [2.5, 0.5, 0];
  return w[0] * pd + w[1] * cs + w[2] * (t.kcal / 600) - (fs > 0.45 ? 0.5 : 0);
}
function mealOptions(p, meal) {
  const pool = MEAL_POOL[meal].filter(c => c.every(id => FOODS[id] && foodOk(id, p)));
  const minPd = { lean: 0.17, muscle: 0.14, strength: 0.14 }[p.goal] || 0.11;
  const rated = pool.map(c => { const t = sumFoods(c.map(id => ({ id, s: 1 }))); return { c, t, score: mealScore(t, p.goal) }; });
  let fit = rated.filter(r => r.t.p * 4 / r.t.kcal >= (meal === 'Snack' ? minPd - 0.05 : minPd));
  if (fit.length < 3) fit = rated;   // tiny diets: show everything that fits the diet
  return fit.sort((a, b) => b.score - a.score);
}
/* the meal shown for a day: a stable start per day, then each swap moves to the next option */
function mealFor(p, ds, meal, swaps = 0) {
  const opts = mealOptions(p, meal);
  if (!opts.length) return null;
  const seed = (parseIso(ds).getDate() * 7 + meal.length) % Math.min(opts.length, 4);   // start among the best few
  const i = (seed + swaps) % opts.length;
  const o = opts[i], T = targets(p, !!(S && S.profile === p && sessionFor(parseIso(ds))));
  const want = T.kcal * MEAL_META[meal].share;
  const s = clamp(Math.round(want / o.t.kcal * 2) / 2, 0.5, 2.5);
  return { meal, ids: o.c, s, t: { kcal: o.t.kcal * s, p: o.t.p * s, c: o.t.c * s, f: o.t.f * s }, i, n: opts.length, key: meal + ':' + o.c.join('+') };
}
function mealWhy(m, goal) {
  const pd = Math.round(m.t.p * 4 / m.t.kcal * 100);
  return { muscle: `${fmtN(m.t.p)} g protein with enough energy to grow`, strength: `${fmtN(m.t.p)} g protein to rebuild after heavy lifting`, lean: `${pd}% of its calories from protein, so you stay full`, general: `Balanced: ${fmtN(m.t.p)} g protein, ${fmtN(m.t.c)} g carbs`, endurance: `${fmtN(m.t.c)} g carbs to refill your energy stores`, speed: `${fmtN(m.t.p)} g protein plus fast-acting carbs`, mobility: `${fmtN(m.t.p)} g protein for tissue repair` }[goal];
}

/* ---------- junk-food guard ---------- */
// words → why it does not help, what it does to the body, and better swaps (first one that fits the diet is offered)
const JUNK = [
  { k: 'Chocolate and sweets', w: ['chocolate', 'choco', 'candy', 'toffee', 'kitkat', 'kit kat', 'dairy milk', 'snickers', '5 star', 'five star', 'munch', 'perk', 'gems', 'lollipop', 'gummy', 'gummies', 'marshmallow', 'nutella', 'sweets', 'mithai'],
    why: 'It is mostly added sugar and saturated fat, with almost no protein.', fx: 'Sugar spikes your blood glucose and then crashes it, leaving you tired and hungrier. Regular sweets add empty calories and harm your teeth.', alt: ['dates', 'almonds', 'fruitbowl'] },
  { k: 'Chips and fried snacks', w: ['chips', 'crisps', 'lays', "lay's", 'kurkure', 'bingo', 'pringles', 'nachos', 'doritos', 'cheetos', 'namkeen', 'bhujia', 'mixture', 'fryums'],
    why: 'They are deep-fried, very salty and give you almost nothing your muscles can use.', fx: 'High salt makes you retain water and raises blood pressure over time. Fried oils are linked to inflammation, which slows recovery.', alt: ['makhana', 'roastedchana', 'peanuts'] },
  { k: 'Fizzy drinks', w: ['soda', 'cola', 'coke', 'pepsi', 'sprite', 'fanta', 'thums up', 'thumbs up', 'mountain dew', '7up', 'limca', 'mirinda', 'soft drink', 'fizzy', 'iced tea', 'packaged juice', 'frooti', 'maaza', 'slice', 'tang'],
    why: 'One can has about 8 to 10 teaspoons of sugar and no nutrients.', fx: 'Liquid sugar does not fill you up, so the calories add on top of your meals. It also wears down tooth enamel and the caffeine in colas can disturb sleep.', alt: ['coconut', 'buttermilk', 'orange'] },
  { k: 'Energy drinks', w: ['energy drink', 'red bull', 'redbull', 'monster', 'sting', 'gatorade', 'pre workout drink', 'hell energy'],
    why: 'They carry a lot of caffeine and sugar. Doctors advise people under 18 not to drink them at all.', fx: 'High caffeine can cause a racing heart, anxiety and poor sleep, and poor sleep wipes out training gains.', alt: ['coconut', 'banana', 'buttermilk'] },
  { k: 'Pizza and burgers', w: ['pizza', 'burger', 'mcdonald', 'mcd', 'dominos', "domino's", 'kfc', 'subway cookie', 'fast food', 'hot dog', 'shawarma roll with mayo'],
    why: 'Refined flour, processed meat or cheese and lots of oil, with little fibre.', fx: 'They are very calorie-dense for how little protein and fibre they give, and the high fat sits in your stomach before training.', alt: ['chickenrice', 'wrap', 'paneertikka', 'rajmarice'] },
  { k: 'Fried food', w: ['fries', 'french fries', 'samosa', 'pakora', 'pakoda', 'bhaji', 'kachori', 'vada pav', 'bhature', 'puri', 'fried chicken', 'nuggets', 'chicken popcorn', 'spring roll', 'momos fried', 'fried momos', 'tikki'],
    why: 'Deep-frying soaks the food in oil and adds hundreds of calories with no extra protein.', fx: 'Reused frying oil contains trans fats, which raise bad cholesterol and slow recovery.', alt: ['sweetpotato', 'chickentikka', 'dhokla', 'sprouts'] },
  { k: 'Desserts and bakery', w: ['cake', 'pastry', 'donut', 'doughnut', 'brownie', 'muffin', 'cupcake', 'cookie', 'cookies', 'biscuit', 'biscuits', 'oreo', 'bourbon', 'hide and seek', 'ice cream', 'icecream', 'kulfi', 'sundae', 'jalebi', 'gulab jamun', 'rasgulla', 'ladoo', 'laddu', 'halwa', 'barfi', 'kaju katli', 'rasmalai', 'waffle', 'pancake syrup'],
    why: 'Sugar, refined flour and butter or ghee, with very little protein.', fx: 'Frequent desserts push you over your calories without feeding your muscles, and sugar highs end in energy crashes during training.', alt: ['greek', 'fruitbowl', 'dates'] },
  { k: 'Instant noodles', w: ['maggi', 'instant noodles', 'cup noodles', 'yippee', 'ramen', 'top ramen', 'cup noodle'],
    why: 'They are fried, made from refined flour and the seasoning is packed with salt.', fx: 'One packet has close to your whole day of salt and barely any protein.', alt: ['poha', 'upma', 'dalia'] },
  { k: 'Sugary coffee and shakes', w: ['milkshake', 'frappe', 'frappuccino', 'cold coffee', 'bubble tea', 'boba', 'thick shake', 'freakshake'],
    why: 'Café shakes often have more sugar than a can of cola.', fx: 'The sugar and cream add calories fast, and the caffeine can affect your sleep.', alt: ['smoothie', 'soysmoothie', 'buttermilk'] },
  { k: 'Alcohol', w: ['beer', 'vodka', 'whisky', 'whiskey', 'rum', 'wine', 'alcohol', 'breezer', 'cocktail'],
    why: 'Alcohol has no place in an athlete’s plan, and it is illegal below the legal drinking age.', fx: 'It dehydrates you, ruins sleep quality and directly blocks muscle repair for days.', alt: ['coconut', 'buttermilk'] }
];
function junkCheck(name) {
  const t = ' ' + String(name || '').toLowerCase().replace(/[^a-z0-9' ]+/g, ' ') + ' ';
  return JUNK.find(j => j.w.some(w => t.includes(' ' + w + ' ') || t.includes(' ' + w + 's '))) || null;
}
function junkAlt(j, p) { return j.alt.find(id => FOODS[id] && foodOk(id, p)) || 'fruitbowl'; }
const GOAL_HARM = {
  muscle: 'You are trying to build muscle, and that needs protein and good-quality energy.',
  strength: 'You are training to get stronger, and that depends on protein and recovery.',
  lean: 'You are trying to lean out, and these are the calories that make that hardest.',
  general: 'You are training to get fitter, and this works against that.',
  endurance: 'You are building endurance, which runs on steady energy, not sugar spikes.',
  speed: 'You are training to be faster, and extra fat and sugar slow that down.',
  mobility: 'You are working on injury prevention, and these foods feed inflammation.'
};

/* ---------- supplements ---------- */
// risk: ok = fine to add · minor = under-18s need a doctor's note + coach verification · block = Pulse will not add it for under-18s · never = banned for everyone
const SUPPS = [
  { id: 'whey', n: 'Whey protein', risk: 'ok', dose: '1 scoop (25 g) after training', note: 'Food first. Use it only when meals fall short of your protein target.' },
  { id: 'plantprotein', n: 'Plant protein (pea or soy)', risk: 'ok', dose: '1 scoop after training', note: 'Same as whey, for vegetarians or vegans.' },
  { id: 'multi', n: 'Multivitamin', risk: 'ok', dose: '1 tablet with breakfast', note: 'Covers gaps if your diet is limited. Not needed if you eat a varied diet.' },
  { id: 'omega3', n: 'Omega-3 (fish or algae oil)', risk: 'ok', dose: '1 capsule with a meal', note: 'Helpful if you rarely eat fish.' },
  { id: 'b12', n: 'Vitamin B12', risk: 'ok', dose: 'As on the label', note: 'Recommended for vegans and many vegetarians.' },
  { id: 'electrolytes', n: 'Electrolytes', risk: 'ok', dose: 'In water on long or hot sessions', note: 'Only for sessions over an hour or in heavy heat.' },
  { id: 'creatine', n: 'Creatine monohydrate', risk: 'minor', dose: '3–5 g a day', fx: 'There is limited research in under-18s. It can cause stomach upset, cramps and water weight, and paediatric groups advise against it without medical supervision.' },
  { id: 'caffeine', n: 'Caffeine / pre-workout', risk: 'minor', dose: 'As your doctor says', fx: 'Caffeine can raise heart rate and blood pressure, cause anxiety and wreck sleep. Pre-workouts often hide large doses.' },
  { id: 'vitd', n: 'Vitamin D3', risk: 'minor', dose: 'Only the dose your doctor gives', fx: 'Too much builds up in the body and can be toxic. The right dose depends on a blood test.' },
  { id: 'iron', n: 'Iron', risk: 'minor', dose: 'Only the dose your doctor gives', fx: 'Iron overdose is dangerous. Take it only if a blood test shows you are low.' },
  { id: 'calcium', n: 'Calcium', risk: 'minor', dose: 'Only the dose your doctor gives', fx: 'Too much can cause constipation and kidney stones, and it blocks iron absorption.' },
  { id: 'gainer', n: 'Mass gainer', risk: 'minor', dose: 'As your doctor says', fx: 'Most are mainly sugar. They can cause fat gain and stomach problems. Real food usually does the job better.' },
  { id: 'betaalanine', n: 'Beta-alanine', risk: 'minor', dose: 'As your doctor says', fx: 'Causes skin tingling and there is very little safety data for teenagers.' },
  { id: 'bcaa', n: 'BCAAs', risk: 'minor', dose: 'As your doctor says', fx: 'Not useful if you hit your protein target, and some products contain stimulants or sweeteners.' },
  { id: 'ashwagandha', n: 'Ashwagandha', risk: 'minor', dose: 'As your doctor says', fx: 'Can affect hormones and, rarely, the liver. Not studied in teenagers.' },
  { id: 'melatonin', n: 'Melatonin', risk: 'minor', dose: 'As your doctor says', fx: 'It is a hormone. Using it without supervision can disturb your natural sleep cycle.' },
  { id: 'fatburner', n: 'Fat burner', risk: 'block', fx: 'Fat burners are stimulant mixes linked to heart problems, anxiety and liver damage. Pulse will not add them for anyone under 18.' },
  { id: 'testbooster', n: 'Testosterone booster', risk: 'block', fx: 'These can disrupt your natural hormones while you are still growing. Pulse will not add them for anyone under 18.' },
  { id: 'sarms', n: 'SARMs or steroids', risk: 'never', fx: 'These are banned in all sport and can cause serious, permanent harm to your heart, liver and hormones.' }
];
const SUPP_WORDS = { creatine: ['creatine'], caffeine: ['caffeine', 'pre workout', 'preworkout', 'pre-workout', 'c4'], vitd: ['vitamin d', 'vit d', 'd3'], iron: ['iron', 'ferrous'], calcium: ['calcium'], gainer: ['gainer', 'mass'], betaalanine: ['beta alanine', 'beta-alanine'], bcaa: ['bcaa', 'eaa', 'amino'], ashwagandha: ['ashwagandha', 'ksm'], melatonin: ['melatonin', 'sleep aid'], fatburner: ['fat burner', 'fatburner', 'thermogenic', 'l carnitine', 'garcinia', 'cla'], testbooster: ['testosterone', 'test booster', 'tribulus', 'dhea'], sarms: ['sarm', 'steroid', 'anabolic', 'ostarine', 'rad 140', 'rad140', 'lgd', 'hgh', 'growth hormone', 'clenbuterol', 'trenbolone', 'dianabol'], whey: ['whey'], plantprotein: ['pea protein', 'plant protein', 'soy protein'], multi: ['multivitamin', 'multi vitamin'], omega3: ['omega', 'fish oil', 'algae oil'], b12: ['b12', 'b 12'], electrolytes: ['electrolyte', 'ors', 'salt tablet'] };
function suppFind(text) {
  const t = String(text || '').toLowerCase();
  const ord = ['sarms', 'testbooster', 'fatburner', 'creatine', 'caffeine', 'gainer', 'betaalanine', 'bcaa', 'ashwagandha', 'melatonin', 'vitd', 'iron', 'calcium', 'whey', 'plantprotein', 'multi', 'omega3', 'b12', 'electrolytes'];
  const id = ord.find(k => SUPP_WORDS[k].some(w => t.includes(w)));
  return id ? SUPPS.find(s => s.id === id) : null;
}
/* what a supplement needs for this athlete */
function suppRule(sp, p) {
  const minor = +p.age < 18;
  if (sp.risk === 'never') return 'never';
  if (sp.risk === 'block') return minor ? 'block' : 'warn';
  if (sp.risk === 'minor') return minor ? 'approval' : 'warn';
  return sp.custom ? (minor ? 'approval' : 'warn') : 'ok';
}

/* ---------- water ---------- */
function waterMl(ds) {
  const legacy = (S.log.water && S.log.water[ds] || 0) * 250;
  return legacy + ((S.log.drinks && S.log.drinks[ds]) || []).reduce((t, d) => t + d.ml, 0);
}
function lastDrinkAt() {
  const d = (S.log.drinks && S.log.drinks[today()]) || [];
  return d.length ? d[d.length - 1].at : null;
}
/* how much should be drunk by now: spread the target from 7 am to 9 pm */
function waterPace(target) {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  return Math.round(target * clamp((h - 7) / 14, 0, 1) / 50) * 50;
}
const fmtMl = ml => ml >= 1000 ? `${fmt1(ml / 1000)} L` : `${Math.round(ml)} ml`;
const GLASS_SIZES = [['Small glass', 200], ['Standard glass', 250], ['Mug', 300], ['Tall glass', 350], ['Bottle', 500], ['Sports bottle', 750], ['Large bottle', 1000]];
/* volume of a cup-shaped glass from its measurements: a cone frustum, filled to 90% */
function glassVolume(hCm, topCm, botCm) {
  const R = topCm / 2, r = (botCm || topCm) / 2;
  return Math.round(Math.PI * hCm / 3 * (R * R + R * r + r * r) * 0.9 / 10) * 10;
}

/* ---------- images (glass photos, doctor's notes) ---------- */
function shrinkImage(file, maxSide = 900, quality = 0.75) {
  return new Promise((ok, no) => {
    if (!file || !/^image\//.test(file.type)) return no(new Error('Choose a photo (JPG or PNG).'));
    const rd = new FileReader();
    rd.onerror = () => no(new Error('Could not read that photo.'));
    rd.onload = () => {
      const img = new Image();
      img.onerror = () => no(new Error('That photo could not be opened.'));
      img.onload = () => {
        const k = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/jpeg', quality));
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
}
