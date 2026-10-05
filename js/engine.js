/* Pulse — knowledge base and planning engine (shared by the app and the landing preview) */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round = (v, n = 0) => { const k = 10 ** n; return Math.round(v * k) / k; };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- dates ---------- */
const iso = d => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
const today = () => iso(new Date());
const parseIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const wd = d => (d.getDay() + 6) % 7; // 0 = Mon
const mondayOf = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - wd(x)); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_L = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const fmtDate = d => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });


/* =========================================================
   KNOWLEDGE BASE
   ========================================================= */
const GOALS = {
  muscle:   { label: 'Build muscle', line: 'Size and shape through moderate loads and volume.' },
  strength: { label: 'Get stronger', line: 'Heavier lifts, lower reps, longer rests.' },
  lean:     { label: 'Lean out', line: 'Keep muscle while trimming body fat.' },
  general:  { label: 'General fitness', line: 'A balanced mix of strength and conditioning.' },
  endurance:{ label: 'Build endurance', line: 'Higher reps, short rests, engine work.' },
  speed:    { label: 'Faster and more explosive', line: 'Jumps, throws and sprints on a strength base.' },
  mobility: { label: 'Mobility and injury prevention', line: 'Control through full range, tissue resilience.' }
};
const SPORTS = {
  football: 'Football', basketball: 'Basketball', cricket: 'Cricket', badminton: 'Badminton', tennis: 'Tennis',
  swimming: 'Swimming', athletics: 'Athletics (sprints and jumps)', running: 'Distance running', volleyball: 'Volleyball',
  hockey: 'Hockey', rugby: 'Rugby', kabaddi: 'Kabaddi and kho-kho', martial: 'Martial arts', gymnastics: 'Gymnastics'
};
const SPORT_PREP = {
  football:   [['Nordic hamstring curl', '3 × 4 slow'], ['Copenhagen plank', '2 × 20 s / side'], ['Lateral bound and stick', '3 × 4 / side']],
  basketball: [['Lateral bound and stick', '3 × 4 / side'], ['Single-leg calf raise', '2 × 15 / side'], ['Drop landing', '3 × 5']],
  cricket:    [['Rotational med-ball throw (or band rotation)', '3 × 6 / side'], ['Band external rotation', '2 × 15 / side'], ['Side plank with reach', '2 × 8 / side']],
  badminton:  [['Lateral lunge reach', '2 × 8 / side'], ['Split-step to lunge reaction', '4 × 20 s'], ['Band external rotation', '2 × 15 / side']],
  tennis:     [['Rotational med-ball throw (or band rotation)', '3 × 6 / side'], ['Band external rotation', '2 × 15 / side'], ['Lateral shuffle', '4 × 10 m']],
  swimming:   [['Band pull-apart', '2 × 20'], ['Prone Y-T-W raise', '2 × 8 each'], ['Streamline hollow hold', '3 × 20 s']],
  athletics:  [['A-skips', '3 × 20 m'], ['Pogo hops', '3 × 15'], ['Nordic hamstring curl', '3 × 4 slow']],
  running:    [['Single-leg calf raise', '3 × 15 / side'], ['Single-leg RDL (bodyweight)', '2 × 10 / side'], ['Hip airplane', '2 × 5 / side']],
  volleyball: [['Approach jump and stick', '3 × 4'], ['Drop landing', '3 × 5'], ['Band external rotation', '2 × 15 / side']],
  hockey:     [['Lateral bound and stick', '3 × 4 / side'], ['Copenhagen plank', '2 × 20 s / side'], ['Rotational med-ball throw (or band rotation)', '3 × 6 / side']],
  rugby:      [['Neck isometrics (4 ways)', '1 × 10 s each'], ['Nordic hamstring curl', '3 × 4 slow'], ['Bear crawl', '3 × 10 m']],
  kabaddi:    [['Sprawl to sprint', '5 × 5 m'], ['Lateral shuffle and cut', '4 × 10 m'], ['Copenhagen plank', '2 × 20 s / side']],
  martial:    [['90/90 hip switch', '2 × 8 / side'], ['Rotational med-ball throw (or band rotation)', '3 × 6 / side'], ['Neck isometrics (4 ways)', '1 × 10 s each']],
  gymnastics: [['Wrist prep circles and rocks', '1 × 60 s'], ['Hollow body hold', '3 × 20 s'], ['Scapular pull-up (or wall slide)', '2 × 10']]
};
const KIT = { barbell: 'Barbell + plates', rack: 'Squat rack', bench: 'Bench', dumbbell: 'Dumbbells', kettlebell: 'Kettlebell', cable: 'Cable machine', machine: 'Leg press / machines', pullup: 'Pull-up bar', band: 'Resistance bands', box: 'Plyo box / step', medball: 'Medicine ball' };
const allKit = () => [...new Set([...Object.keys(KIT), ...(typeof EQUIP !== 'undefined' ? EQUIP.flatMap(e => e.tags) : []), 'none'])];
const LEGACY_KIT = { machine: ['legpress', 'latpull', 'chestpress', 'rowmachine', 'legext', 'legcurl', 'shoulderpress'] };

// exercise: name, pattern, equipment alternatives (any one set satisfies), level 1–3, cue, avoid tags, unit
const EX = [];
const E = (n, p, eq, lvl, cue, avoid = [], unit = '') => EX.push({ n, p, eq, lvl, cue, avoid, unit });
// squat
E('Back squat', 'squat', [['barbell', 'rack']], 2, 'Brace hard, sit between the hips, drive the floor away.', ['back', 'knee']);
E('Goblet squat', 'squat', [['dumbbell'], ['kettlebell']], 1, 'Elbows inside the knees, chest tall.', []);
E('Front squat', 'squat', [['barbell', 'rack']], 3, 'Elbows high, stay upright.', ['back', 'knee', 'wrist']);
E('Leg press', 'squat', [['legpress']], 1, 'Feet shoulder-width, knees track over toes.', []);
E('Tempo bodyweight squat', 'squat', [['none']], 1, '3 seconds down, 1 second pause at the bottom.', []);
E('Box squat to bench', 'squat', [['bench'], ['box']], 1, 'Touch the box softly, stand tall.', []);
// hinge
E('Romanian deadlift', 'hinge', [['barbell']], 2, 'Soft knees, push hips back, bar close to legs.', ['back', 'hamstring']);
E('Dumbbell Romanian deadlift', 'hinge', [['dumbbell']], 1, 'Hips back until you feel the hamstrings.', ['back']);
E('Hip thrust', 'hinge', [['barbell', 'bench'], ['dumbbell', 'bench']], 1, 'Chin tucked, ribs down, squeeze at the top.', []);
E('Trap-bar or conventional deadlift', 'hinge', [['barbell']], 3, 'Wedge in, push the floor, lock out with glutes.', ['back']);
E('Kettlebell swing', 'hinge', [['kettlebell']], 2, 'Hike, snap the hips, float the bell.', ['back']);
E('Single-leg glute bridge', 'hinge', [['none']], 1, 'Drive through the heel, pause at the top.', []);
E('Band good morning', 'hinge', [['band']], 1, 'Long spine, hinge until hamstrings load.', []);
// horizontal push
E('Bench press', 'pushH', [['barbell', 'bench', 'rack']], 2, 'Shoulder blades pinned, bar to lower chest.', ['shoulder']);
E('Dumbbell bench press', 'pushH', [['dumbbell', 'bench']], 1, 'Control down, press up and slightly in.', []);
E('Push-up', 'pushH', [['none']], 1, 'Body in one line, chest to a fist from the floor.', ['wrist']);
E('Cable chest press', 'pushH', [['cable']], 1, 'Split stance, press and squeeze.', []);
E('Incline dumbbell press', 'pushH', [['dumbbell', 'bench']], 2, 'Bench at 30°, elbows at 45°.', ['shoulder']);
E('Feet-elevated push-up', 'pushH', [['bench'], ['box']], 2, 'Keep the hips level.', ['wrist', 'shoulder']);
// vertical push
E('Standing overhead press', 'pushV', [['barbell']], 2, 'Squeeze glutes, press up and back over the head.', ['shoulder', 'back']);
E('Seated dumbbell shoulder press', 'pushV', [['dumbbell', 'bench'], ['dumbbell']], 1, 'Ribs down, press without arching.', ['shoulder']);
E('Half-kneeling one-arm press', 'pushV', [['dumbbell'], ['kettlebell']], 1, 'Glute of the down knee on, press in a slight arc.', []);
E('Pike push-up', 'pushV', [['none']], 2, 'Hips high, head travels forward of the hands.', ['shoulder', 'wrist']);
E('Band overhead press', 'pushV', [['band']], 1, 'Stand on the band, press tall.', []);
// horizontal pull
E('Chest-supported dumbbell row', 'pullH', [['dumbbell', 'bench']], 1, 'Pull elbows to the hips, pause.', []);
E('Barbell row', 'pullH', [['barbell']], 2, 'Hinge to 45°, row to the belly button.', ['back']);
E('Seated cable row', 'pullH', [['cable']], 1, 'Tall chest, shoulder blades back then down.', []);
E('One-arm dumbbell row', 'pullH', [['dumbbell', 'bench'], ['dumbbell']], 1, 'Flat back, pull to the hip pocket.', []);
E('Band row', 'pullH', [['band']], 1, 'Squeeze the shoulder blades for one second.', []);
E('Inverted row (sturdy table)', 'pullH', [['none']], 1, 'Straight body, chest to the edge.', []);
// vertical pull
E('Pull-up', 'pullV', [['pullup']], 2, 'Full hang to chin over bar, no swinging.', ['shoulder']);
E('Lat pulldown', 'pullV', [['latpull'], ['cable']], 1, 'Pull the bar to the top of the chest.', []);
E('Band-assisted pull-up', 'pullV', [['pullup', 'band']], 1, 'Control the way down for 3 seconds.', []);
E('Eccentric pull-up', 'pullV', [['pullup']], 1, 'Jump up, lower for 4–5 seconds.', []);
E('Band lat pulldown', 'pullV', [['band']], 1, 'Anchor high, drive elbows down.', []);
E('Prone Y-T-W raise', 'pullV', [['none']], 1, 'Thumbs up, lift from the shoulder blades.', []);
// single leg
E('Bulgarian split squat', 'single', [['dumbbell', 'bench'], ['bench']], 2, 'Front shin vertical, back knee drops straight down.', ['knee']);
E('Reverse lunge', 'single', [['dumbbell'], ['none']], 1, 'Step back long, front heel stays down.', ['knee']);
E('Step-up', 'single', [['box'], ['bench']], 1, 'Whole foot on the box, no push from the back leg.', []);
E('Walking lunge', 'single', [['dumbbell'], ['none']], 1, 'Long steps, tall torso.', ['knee']);
E('Single-leg RDL', 'single', [['dumbbell'], ['kettlebell'], ['none']], 2, 'Hips square, reach long.', ['back']);
E('Lateral lunge', 'single', [['dumbbell'], ['none']], 1, 'Sit back into the hip, other leg straight.', []);
// core
E('Dead bug', 'core', [['none']], 1, 'Low back stays heavy on the floor.', [], 's');
E('Pallof press', 'core', [['band'], ['cable']], 1, 'Resist the twist, press out slowly.', []);
E('Side plank', 'core', [['none']], 1, 'Straight line from head to heels.', ['shoulder'], 's');
E('Hanging knee raise', 'core', [['pullup']], 2, 'No swing, curl the pelvis up.', ['shoulder']);
E('Plank walkout', 'core', [['none']], 2, 'Walk out slow, keep the hips still.', ['wrist', 'shoulder']);
E('Hollow body hold', 'core', [['none']], 2, 'Low back down, arms by the ears.', ['back'], 's');
// carry
E("Farmer's carry", 'carry', [['dumbbell'], ['kettlebell']], 1, 'Tall, quick short steps, crush the handles.', [], 'm');
E('Suitcase carry', 'carry', [['dumbbell'], ['kettlebell']], 1, 'One side loaded, do not lean.', [], 'm');
E('Bear crawl', 'carry', [['none']], 1, 'Knees an inch off the floor, opposite hand and foot.', ['wrist'], 'm');
// power
E('Box jump', 'power', [['box']], 1, 'Land soft and quiet, step down.', ['knee', 'ankle']);
E('Med-ball chest pass', 'power', [['medball']], 1, 'Explode off the chest into a wall.', ['shoulder']);
E('Broad jump', 'power', [['none']], 2, 'Big arm swing, stick the landing.', ['knee', 'ankle']);
E('Med-ball slam', 'power', [['medball']], 1, 'Reach tall, slam with the whole body.', ['back']);
E('Squat jump', 'power', [['none']], 1, 'Quarter dip, jump tall, land soft.', ['knee', 'ankle']);
E('Hang power clean', 'power', [['barbell']], 3, 'Jump and shrug, catch high on the shoulders.', ['back', 'wrist']);
E('Kettlebell swing (power)', 'power', [['kettlebell']], 2, 'Max hip snap each rep.', ['back']);
E('Plyo push-up', 'power', [['none']], 2, 'Explode off the floor, land soft.', ['wrist', 'shoulder']);
// arms
E('Dumbbell curl', 'arms', [['dumbbell']], 1, 'Elbows pinned, no swing.', []);
E('Cable triceps pressdown', 'arms', [['cable']], 1, 'Elbows tucked, lock out each rep.', []);
E('Band curl', 'arms', [['band']], 1, 'Slow lowering.', []);
E('Diamond push-up', 'arms', [['none']], 2, 'Hands close, elbows brush the ribs.', ['wrist']);
E('Overhead dumbbell triceps extension', 'arms', [['dumbbell']], 1, 'Elbows forward, stretch fully.', ['shoulder']);
E('Chin-up hold', 'arms', [['pullup']], 1, 'Chin over bar, hold strong.', [], 's');
E('Bench dip', 'arms', [['bench'], ['box']], 1, 'Shoulders down, elbows back.', ['shoulder']);

const COMPOUND = new Set(['squat', 'hinge', 'pushH', 'pushV', 'pullH', 'pullV']);
const TEMPLATES = {
  FA: { name: 'Full Body A', focus: 'Squat + push', slots: ['squat', 'pushH', 'pullH', 'hinge:2', 'core', 'carry', 'arms'] },
  FB: { name: 'Full Body B', focus: 'Hinge + pull', slots: ['hinge', 'pushV', 'pullV', 'single', 'core:1', 'carry:1', 'arms:1'] },
  FC: { name: 'Full Body C', focus: 'Single-leg + upper', slots: ['squat:1', 'pushH:1', 'pullV:1', 'single:1', 'core:2', 'hinge:2', 'arms'] },
  UA: { name: 'Upper A', focus: 'Horizontal push + pull', slots: ['pushH', 'pullH', 'pushV', 'pullV', 'arms', 'core', 'arms:1'] },
  UB: { name: 'Upper B', focus: 'Vertical push + pull', slots: ['pushV:1', 'pullV:1', 'pushH:1', 'pullH:1', 'arms:1', 'core:1', 'arms'] },
  LA: { name: 'Lower A', focus: 'Squat pattern', slots: ['squat', 'hinge', 'single', 'core', 'legiso', 'carry', 'hinge:2'] },
  LB: { name: 'Lower B', focus: 'Hinge pattern', slots: ['hinge:1', 'squat:1', 'single:1', 'core:2', 'legiso:1', 'carry:1', 'single:2'] },
  PU: { name: 'Push', focus: 'Chest, shoulders, triceps', slots: ['pushH', 'pushV', 'pushH:1', 'arms:1', 'core', 'pushV:1', 'core:1'] },
  PL: { name: 'Pull', focus: 'Back, biceps, grip', slots: ['pullV', 'pullH', 'hinge:2', 'arms', 'carry', 'pullH:1', 'core:1'] },
  LG: { name: 'Legs', focus: 'Squat, hinge, single-leg', slots: ['squat', 'hinge', 'single', 'legiso', 'core:2', 'carry', 'legiso:1'] },
  PU2:{ name: 'Push II', focus: 'Shoulders first', slots: ['pushV', 'pushH:1', 'pushH', 'arms:1', 'core:1', 'pushV:1', 'core'] },
  PL2:{ name: 'Pull II', focus: 'Vertical pull first', slots: ['pullH:1', 'pullV:1', 'hinge:1', 'arms', 'carry:1', 'pullV', 'core:2'] },
  LG2:{ name: 'Legs II', focus: 'Hinge first', slots: ['hinge', 'squat:1', 'single:1', 'legiso:1', 'core', 'carry:1', 'legiso'] }
};
const SPLITS = { 2: ['FA', 'FB'], 3: ['FA', 'FB', 'FC'], 4: ['UA', 'LA', 'UB', 'LB'], 5: ['UA', 'LA', 'PU', 'PL', 'LG'], 6: ['PU', 'PL', 'LG', 'PU2', 'PL2', 'LG2'] };
const DEFAULT_DAYS = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 4, 5], 6: [0, 1, 2, 3, 4, 5] };
const SCHEME = {
  muscle:   { comp: '8–12', acc: '10–15', rc: 90, ra: 60, rpe: 8 },
  strength: { comp: '4–6', acc: '8–10', rc: 150, ra: 75, rpe: 8 },
  lean:     { comp: '10–12', acc: '12–15', rc: 60, ra: 45, rpe: 7.5 },
  general:  { comp: '8–10', acc: '10–12', rc: 75, ra: 60, rpe: 7.5 },
  endurance:{ comp: '12–15', acc: '15–20', rc: 45, ra: 30, rpe: 7 },
  speed:    { comp: '4–6', acc: '8–10', rc: 120, ra: 60, rpe: 8 },
  mobility: { comp: '10–12', acc: '12', rc: 60, ra: 45, rpe: 6.5 }
};
const PHASES = [
  { n: 'Base', d: 'Groove technique', rpe: -0.5, set: 0 },
  { n: 'Build', d: 'Add load', rpe: 0, set: 0 },
  { n: 'Peak', d: 'Hardest week', rpe: 0.5, set: 1 },
  { n: 'Deload', d: 'Recover, absorb', rpe: -2, set: -1 }
];
const EXTRA_BLOCK = {
  muscle:   { t: 'Arm finisher', min: 6, items: 'arms' },
  strength: { t: 'Heavy top set', min: 5, text: [['One extra set of 3 on your first lift', '@ RPE 8.5']] },
  lean:     { t: 'Conditioning finisher', min: 8, text: [['EMOM: 10 squat jumps or swings + 5 push-ups', '8 min']] },
  general:  { t: 'Carry and core', min: 6, text: [["Farmer's carry or bear crawl", '3 × 30 m'], ['Dead bug', '2 × 10 / side']] },
  endurance:{ t: 'Tempo intervals', min: 10, text: [['Run, bike or skip: 1 min hard, 1 min easy', '× 5']] },
  speed:    { t: 'Sprint primer', min: 6, text: [['Acceleration sprints, walk back', '4 × 20 m'], ['Flying 10s', '3 × 10 m']] },
  mobility: { t: 'Mobility flow', min: 8, text: [['90/90 hip switch', '2 × 8 / side'], ['Couch stretch', '45 s / side'], ['Thoracic open book', '8 / side']] }
};
const INJ_WORDS = { knee: ['knee', 'acl', 'patella', 'meniscus'], shoulder: ['shoulder', 'rotator'], back: ['back', 'spine', 'disc', 'lumbar'], ankle: ['ankle', 'achilles'], wrist: ['wrist', 'hand'], hamstring: ['hamstring'] };

/* ---------- foods (per serving) ---------- */
// id: [name, serving, kcal, protein, carbs, fat, diet, allergens]
const FOODS = {
  oats: ['Oats', '50 g dry', 190, 7, 33, 3.5, 'vegan', ['gluten']],
  milk: ['Milk', '250 ml', 160, 8, 12, 8.5, 'veg', ['dairy']],
  curd: ['Curd (dahi)', '200 g', 120, 7, 9, 6, 'veg', ['dairy']],
  greek: ['Greek yogurt', '200 g', 146, 20, 8, 4, 'veg', ['dairy']],
  paneer: ['Paneer', '100 g', 265, 18, 3, 20, 'veg', ['dairy']],
  eggs: ['Eggs', '2 large', 145, 12.5, 1, 10, 'veg', ['egg']],
  chicken: ['Chicken breast, cooked', '150 g', 248, 46, 0, 5.5, 'meat', []],
  fish: ['Grilled fish', '150 g', 200, 33, 0, 7, 'fish', ['fish']],
  tuna: ['Tuna, canned in water', '100 g', 116, 26, 0, 1, 'fish', ['fish']],
  mutton: ['Mutton curry', '150 g', 300, 25, 4, 20, 'meat', []],
  dal: ['Dal, cooked', '1 bowl (200 g)', 230, 14, 34, 4, 'vegan', []],
  rajma: ['Rajma', '1 bowl (200 g)', 240, 15, 40, 2, 'vegan', []],
  chana: ['Chana masala', '1 bowl (200 g)', 270, 14, 45, 4, 'vegan', []],
  tofu: ['Tofu', '150 g', 216, 24, 5, 12, 'vegan', ['soy']],
  soya: ['Soya chunks', '50 g dry', 172, 26, 16, 0.5, 'vegan', ['soy']],
  rice: ['Rice, cooked', '1 cup (180 g)', 235, 4.5, 52, 0.5, 'vegan', []],
  roti: ['Roti', '2 medium', 240, 7, 44, 4, 'vegan', ['gluten']],
  poha: ['Poha', '1 plate', 270, 5, 50, 6, 'vegan', ['peanut']],
  idli: ['Idli with sambar', '3 idli', 280, 10, 54, 2, 'vegan', []],
  dosa: ['Dosa with sambar', '1 large', 350, 9, 55, 10, 'vegan', []],
  upma: ['Upma', '1 plate', 250, 6, 40, 7, 'vegan', ['gluten']],
  banana: ['Banana', '1 medium', 105, 1.3, 27, 0.4, 'vegan', []],
  apple: ['Apple', '1 medium', 95, 0.5, 25, 0.3, 'vegan', []],
  pb: ['Peanut butter', '2 tbsp', 190, 8, 6, 16, 'vegan', ['peanut']],
  almonds: ['Almonds', '25 g', 145, 5, 5, 12.5, 'vegan', ['nuts']],
  whey: ['Whey shake (water)', '1 scoop', 120, 24, 3, 1.5, 'veg', ['dairy']],
  pea: ['Pea protein shake', '1 scoop', 120, 22, 3, 2, 'vegan', []],
  sweetpotato: ['Sweet potato', '200 g', 172, 3, 40, 0.2, 'vegan', []],
  pasta: ['Pasta, cooked', '1 cup (200 g)', 310, 11, 62, 2, 'vegan', ['gluten']],
  bread: ['Whole-grain bread', '2 slices', 160, 8, 28, 2, 'vegan', ['gluten']],
  sabzi: ['Mixed veg sabzi', '1 bowl', 150, 4, 15, 8, 'vegan', []],
  salad: ['Salad with lemon', '1 bowl', 80, 3, 12, 2, 'vegan', []],
  sprouts: ['Sprouts chaat', '1 bowl', 140, 9, 22, 2, 'vegan', []],
  lassi: ['Sweet lassi', '300 ml', 250, 8, 38, 7, 'veg', ['dairy']],
  coconut: ['Coconut water', '1 glass', 45, 0.5, 11, 0, 'vegan', []],
  chikki: ['Peanut chikki', '1 piece', 140, 4, 16, 7, 'vegan', ['peanut']],
  hummus: ['Hummus with carrots', '4 tbsp', 170, 5, 14, 10, 'vegan', ['sesame']],
  khichdi: ['Moong dal khichdi', '1 bowl', 310, 12, 52, 6, 'vegan', []],
  wrap: ['Chicken wrap', '1 wrap', 420, 32, 40, 14, 'meat', ['gluten']],
  omelette: ['Veg omelette', '3 eggs', 240, 18, 4, 17, 'veg', ['egg']]
};
const MEALS = {
  Breakfast: [['oats', 'milk', 'banana'], ['eggs', 'bread', 'apple'], ['poha', 'curd'], ['idli', 'coconut'], ['greek', 'oats', 'almonds'], ['pea', 'oats', 'banana'], ['omelette', 'bread'], ['dosa', 'banana'], ['upma', 'sprouts']],
  Lunch: [['rice', 'dal', 'sabzi', 'curd'], ['roti', 'rajma', 'salad'], ['roti', 'paneer', 'sabzi'], ['rice', 'chicken', 'sabzi'], ['rice', 'fish', 'salad'], ['rice', 'chana', 'salad'], ['roti', 'tofu', 'sabzi'], ['khichdi', 'curd', 'salad'], ['rice', 'soya', 'sabzi']],
  Snack: [['whey', 'banana'], ['pea', 'banana'], ['sprouts', 'coconut'], ['pb', 'bread'], ['chikki', 'apple'], ['almonds', 'apple'], ['hummus', 'apple'], ['lassi']],
  Dinner: [['roti', 'dal', 'sabzi'], ['rice', 'soya', 'sabzi'], ['chicken', 'sweetpotato', 'salad'], ['fish', 'rice', 'salad'], ['paneer', 'roti', 'salad'], ['tofu', 'rice', 'sabzi'], ['mutton', 'roti', 'salad'], ['khichdi', 'sabzi'], ['pasta', 'tuna', 'salad']]
};
const DIET_OK = { all: ['vegan', 'veg', 'fish', 'meat'], pesc: ['vegan', 'veg', 'fish'], veg: ['vegan', 'veg'], vegan: ['vegan'] };
const DIET_LABEL = { all: 'Eats everything', pesc: 'Pescatarian', veg: 'Vegetarian', vegan: 'Vegan' };
const ALLERGY_WORDS = { dairy: ['dairy', 'milk', 'lactose', 'paneer', 'curd', 'cheese'], egg: ['egg'], gluten: ['gluten', 'wheat', 'celiac', 'coeliac'], peanut: ['peanut'], nuts: ['nut', 'almond', 'cashew'], soy: ['soy', 'soya', 'tofu'], fish: ['fish', 'seafood', 'tuna'], sesame: ['sesame'] };

/* =========================================================
   ENGINE
   ========================================================= */
function injuriesOf(p) { const t = (p.injuries || '').toLowerCase(); return Object.keys(INJ_WORDS).filter(k => INJ_WORDS[k].some(w => t.includes(w))); }
function allergensOf(p) { const t = (p.allergies || '').toLowerCase(); return Object.keys(ALLERGY_WORDS).filter(k => ALLERGY_WORDS[k].some(w => t.includes(w))); }
function kitOf(p) {
  if (p.where === 'none') return ['none'];
  if (Array.isArray(p.gear)) return [...new Set([...p.gear.flatMap(id => (EQUIP_BY_ID[id] || {}).tags || []), 'none'])];
  if (p.where === 'gym') return allKit();
  return [...new Set([...(p.equip || []).flatMap(k => LEGACY_KIT[k] || [k]), 'none'])];
}
const LVL = { beg: 1, int: 2, adv: 3 };
function candidates(pattern, p) {
  const kit = kitOf(p), inj = injuriesOf(p), lv = LVL[p.exp] || 1;
  const fits = e => e.eq.some(alt => alt.every(k => kit.includes(k)));
  let c = EX.filter(e => e.p === pattern && fits(e) && e.lvl <= lv && !e.avoid.some(a => inj.includes(a)));
  if (!c.length) c = EX.filter(e => e.p === pattern && fits(e) && !e.avoid.some(a => inj.includes(a)));
  // plan around the equipment the athlete picked: bodyweight moves only fill gaps the kit cannot cover
  const gear = e => e.eq.some(alt => !alt.includes('none') && alt.every(k => kit.includes(k)));
  if (kit.length > 1 && c.some(gear)) c = c.filter(gear);
  return c;
}
function trainingDays(p) {
  const n = +p.sessions;
  if (p.days && p.days.length === n) return [...p.days].sort((a, b) => a - b);
  return DEFAULT_DAYS[n];
}
function phaseIndex(dateObj) {
  const start = mondayOf(new Date(S.profile.createdAt));
  const w = Math.floor((mondayOf(dateObj) - start) / (7 * 864e5));
  return ((w % 4) + 4) % 4;
}
function blockWeek(dateObj) { const start = mondayOf(new Date(S.profile.createdAt)); return Math.floor((mondayOf(dateObj) - start) / (7 * 864e5)); }

function buildSession(p, tKey, sIdx, phaseI, swaps = {}) {
  const T = TEMPLATES[tKey], sc = SCHEME[p.goal], ph = PHASES[phaseI];
  const perTime = { 30: 4, 45: 5, 60: 6, 75: 7 }[p.minutes] || 5;
  const usePower = (p.goal === 'speed' || (p.sports || []).length > 0) && T.slots.some(s => /^(squat|hinge)/.test(s));
  let slots = T.slots.slice();
  // arms slots only count for muscle goals or upper/push/pull splits; otherwise fall back later
  if (!['muscle'].includes(p.goal) && /^F/.test(tKey)) slots = slots.filter(s => !s.startsWith('arms'));
  slots = slots.slice(0, usePower ? perTime - 1 : perTime);
  if (usePower) slots.unshift('power:' + (sIdx % 2));
  const used = new Set(), exs = [];
  slots.forEach((spec, i) => {
    const [pat, v] = spec.split(':');
    const c = candidates(pat, p); if (!c.length) return;
    const key = tKey + '|' + i;
    let k = ((+v || 0) + (swaps[key] || 0)) % c.length, guard = 0;
    while (used.has(c[k].n) && guard++ < c.length) k = (k + 1) % c.length;
    if (used.has(c[k].n)) return;
    const e = c[k]; used.add(e.n);
    const isC = COMPOUND.has(pat), isP = pat === 'power';
    const lv = LVL[p.exp] || 1;
    let sets = isP ? 3 : isC ? (lv === 1 ? 3 : lv === 2 ? 3 : 4) : (lv === 1 ? 2 : 3);
    if (ph.set > 0 && lv > 1 && isC) sets += 1;
    if (ph.set < 0) sets = Math.max(2, sets - 1);
    let reps = isP ? '3–5' : isC ? sc.comp : sc.acc;
    if (e.unit === 's') reps = p.goal === 'endurance' ? '40–60 s' : '30–45 s';
    if (e.unit === 'm') reps = '30 m';
    if (pat === 'core' && !e.unit) reps = '8–12';
    const rest = isP ? 90 : isC ? sc.rc : sc.ra;
    const rpe = clamp(sc.rpe + ph.rpe + (+p.rpeAdj || 0) - (isP ? 1 : 0), 5, 9.5);
    exs.push({ slot: i, key, pat, n: e.n, cue: e.cue, sets, reps, rest, rpe, alts: c.length });
  });
  const blocks = [];
  (p.extra || []).forEach((g, gi) => {
    const n = p.extra.length; if (n === 1 ? sIdx % 2 !== 0 : sIdx % 2 !== gi) return;
    const B = EXTRA_BLOCK[g]; if (!B) return;
    let items = B.text;
    if (B.items === 'arms') { const c = candidates('arms', p); items = c.slice(0, 2).map(e => [e.n, e.unit === 's' ? '2 × 20 s' : '2 × 12–15']); if (!items.length) items = [['Push-up to failure', '2 sets']]; }
    blocks.push({ t: B.t, min: B.min, items, why: GOALS[g].label });
  });
  const cm = typeof cardioOf === 'function' ? cardioOf(p) : null;
  blocks.forEach(b => { if (cm && b.t === 'Tempo intervals') b.items = [[`${cm}: 1 min hard, 1 min easy`, '× 5']]; if (cm && b.t === 'Conditioning finisher') b.items = [[`${cm}: 20 s all-out, 40 s easy`, '× 8']]; });
  if (p.goal === 'lean' || p.goal === 'endurance') blocks.push({ t: 'Finisher', min: 6, items: p.goal === 'lean' ? [[`${cm || 'Shuttle runs'}: 20 s hard, 40 s easy`, '× 6']] : [[`${cm ? cm + ', easy' : 'Easy aerobic flush'} (talk-test pace)`, '10 min']], why: GOALS[p.goal].label });
  if (p.goal === 'mobility' && !(p.extra || []).includes('mobility')) blocks.push({ t: 'Mobility flow', min: 8, items: EXTRA_BLOCK.mobility.text, why: 'Main goal' });
  let prep = null;
  if ((p.sports || []).length) { const sp = p.sports[sIdx % p.sports.length]; prep = { sport: SPORTS[sp], items: SPORT_PREP[sp].slice(0, 2) }; }
  const work = exs.reduce((t, e) => t + e.sets * (40 + e.rest), 0) / 60;
  const mins = Math.round(6 + work + blocks.reduce((t, b) => t + b.min, 0) + (prep ? 5 : 0) + 3);
  return { tKey, name: T.name, focus: T.focus, exs, blocks, prep, mins, phase: ph };
}
function sessionFor(dateObj) {
  const p = S.profile, days = trainingDays(p), w = wd(dateObj), idx = days.indexOf(w);
  if (idx < 0) return null;
  const split = SPLITS[p.sessions];
  return buildSession(p, split[idx % split.length], idx, phaseIndex(dateObj), S.swaps || {});
}

function targets(p, training = true) {
  const w = +p.weight, h = +p.height, a = +p.age;
  const bmr = 10 * w + 6.25 * h - 5 * a + (p.sex === 'f' ? -161 : 5);
  const af = { 2: 1.45, 3: 1.55, 4: 1.6, 5: 1.7, 6: 1.8 }[p.sessions] || 1.55;
  const adj = { muscle: 1.1, strength: 1.05, lean: a < 18 ? 0.92 : 0.85, general: 1, endurance: 1.1, speed: 1.05, mobility: 1 }[p.goal];
  const kcal = Math.round((bmr * af * adj + (+p.kcalAdj || 0)) / 10) * 10;
  const ppk = { muscle: 1.8, strength: 1.8, lean: 2.0, general: 1.5, endurance: 1.5, speed: 1.7, mobility: 1.4 }[p.goal];
  const protein = Math.round(w * ppk);
  const fat = Math.round(kcal * 0.27 / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const water = Math.round((w * 35 + (p.climate === 'hot' ? 750 : 0) + (training ? 500 : 0)) / 250) * 250;
  return { kcal, protein, carbs, fat, water, bmr: Math.round(bmr) };
}
function foodOk(id, p) { const f = FOODS[id]; return DIET_OK[p.diet].includes(f[6]) && !f[7].some(a => allergensOf(p).includes(a)); }
function mealPlan(p, dateStr) {
  const seed = parseIso(dateStr).getDate();
  const out = {};
  for (const [m, list] of Object.entries(MEALS)) {
    const ok = list.filter(c => c.every(id => foodOk(id, p)));
    out[m] = ok.length ? ok[(seed + m.length) % ok.length] : [];
  }
  return out;
}
const sumFoods = items => items.reduce((t, it) => { const f = it.custom || FOODS[it.id]; if (!f) return t; const s = it.s || 1; const k = it.custom ? [it.custom.kcal, it.custom.p, it.custom.c, it.custom.f] : [f[2], f[3], f[4], f[5]]; t.kcal += k[0] * s; t.p += k[1] * s; t.c += k[2] * s; t.f += k[3] * s; return t; }, { kcal: 0, p: 0, c: 0, f: 0 });
function readiness(c) { if (!c) return null; const s = (clamp(c.sleep, 4, 9) - 4) / 5 * 40 + (5 - c.sore) / 4 * 30 + (c.energy - 1) / 4 * 30; return Math.round(s); }
function readyBand(sc) { if (sc == null) return null; if (sc >= 70) return { k: 'good', t: 'Ready to train', d: 'Train as planned. Chase the top of your RPE range.' }; if (sc >= 45) return { k: 'warn', t: 'Train, but listen in', d: 'Do the session at the low end of the RPE range. Skip the finisher if you feel flat.' }; return { k: 'bad', t: 'Recovery day', d: 'Swap to 20 minutes of easy movement plus the mobility flow. Sleep and eat well tonight.' }; }
