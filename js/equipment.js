/* =========================================================
   PULSE — gym equipment catalogue (drawings + what each piece unlocks)
   Each item: id, name, category, kit tags it provides, line drawing (64×64)
   ========================================================= */
const EQUIP_CATS = [
  ['free', 'Free weights'],
  ['bench', 'Benches, racks and bars'],
  ['legs', 'Leg machines'],
  ['upper', 'Upper-body machines'],
  ['cable', 'Cables and functional'],
  ['cardio', 'Cardio machines'],
  ['small', 'Small kit and mobility']
];
const EQUIP = [];
const Q = (id, name, cat, tags, art) => EQUIP.push({ id, name, cat, tags, art });

/* free weights */
Q('dumbbells', 'Dumbbells', 'free', ['dumbbell'], '<rect x="14" y="21" width="7" height="22" rx="2"/><rect x="43" y="21" width="7" height="22" rx="2"/><rect x="9" y="25" width="5" height="14" rx="1.5"/><rect x="50" y="25" width="5" height="14" rx="1.5"/><path d="M21 32h22"/>');
Q('adj-dumbbells', 'Adjustable dumbbells', 'free', ['dumbbell'], '<path d="M8 46h48l-4 8H12z"/><rect x="12" y="20" width="12" height="26" rx="2"/><rect x="40" y="20" width="12" height="26" rx="2"/><path d="M16 20v26M20 20v26M44 20v26M48 20v26M24 33h16"/>');
Q('barbell', 'Barbell and plates', 'free', ['barbell'], '<path d="M2 32h60"/><rect x="9" y="15" width="6" height="34" rx="2"/><rect x="15" y="20" width="4" height="24" rx="1.5"/><rect x="49" y="15" width="6" height="34" rx="2"/><rect x="45" y="20" width="4" height="24" rx="1.5"/>');
Q('ezbar', 'EZ curl bar', 'free', ['ezbar'], '<path d="M2 32h12l6-5 6 7 6-7 6 7 6-7 6 5h12"/><rect x="5" y="21" width="5" height="22" rx="2"/><rect x="54" y="21" width="5" height="22" rx="2"/>');
Q('trapbar', 'Trap (hex) bar', 'free', ['trapbar'], '<path d="M20 20h24l9 12-9 12H20l-9-12z"/><path d="M26 27v10M38 27v10M3 32h8M53 32h8"/><rect x="1" y="22" width="5" height="20" rx="1.5"/><rect x="58" y="22" width="5" height="20" rx="1.5"/>');
Q('kettlebells', 'Kettlebells', 'free', ['kettlebell'], '<path d="M22 30c0-14 20-14 20 0"/><circle cx="32" cy="40" r="14"/><path d="M24 53h16"/>');
Q('plates', 'Weight plates', 'free', ['plate'], '<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="15"/><circle cx="32" cy="32" r="4"/><path d="M24 14a20 20 0 0 1 16 0"/>');
Q('medball', 'Medicine ball', 'free', ['medball'], '<circle cx="32" cy="32" r="20"/><path d="M12 32h40M32 12c-9 7-9 33 0 40M32 12c9 7 9 33 0 40"/>');
Q('slamball', 'Slam ball', 'free', ['medball'], '<circle cx="32" cy="34" r="20"/><path d="M14 28c10 5 26 5 36 0M16 42c10-4 22-4 32 0"/><path d="M20 58h24"/>');
Q('sandbag', 'Sandbag', 'free', ['sandbag'], '<rect x="7" y="26" width="50" height="22" rx="11"/><path d="M21 26v-6h8v6M35 26v-6h8v6"/><path d="M15 37h34" stroke-dasharray="3 4"/>');
Q('vest', 'Weighted vest', 'free', ['vest'], '<path d="M23 8l-9 7v39h14V30M41 8l9 7v39H36V30M23 8c2 7 16 7 18 0M28 30h8"/><rect x="16" y="35" width="9" height="7" rx="1"/><rect x="39" y="35" width="9" height="7" rx="1"/>');

/* benches, racks and bars */
Q('flat-bench', 'Flat bench', 'bench', ['bench'], '<rect x="7" y="25" width="50" height="7" rx="3"/><path d="M14 32v18M50 32v18M9 50h10M45 50h10M32 32v8"/>');
Q('adj-bench', 'Adjustable incline bench', 'bench', ['bench', 'incline'], '<rect x="31" y="35" width="24" height="7" rx="3"/><rect x="8" y="23" width="27" height="7" rx="3" transform="rotate(-32 31 35)"/><path d="M37 42v10M51 42v10M33 52h22M30 40l-7 12"/>');
Q('decline-bench', 'Decline bench', 'bench', ['bench', 'decline'], '<rect x="9" y="28" width="42" height="7" rx="3" transform="rotate(16 30 31)"/><path d="M15 33v18M45 43v9M10 51h10M41 52h10M50 39l5-7"/><circle cx="56" cy="30" r="3.5"/>');
Q('squat-rack', 'Squat rack', 'bench', ['rack'], '<path d="M16 8v48M48 8v48M10 56h12M42 56h12M16 27h-5M48 27h5M3 22h58"/><rect x="5" y="16" width="4" height="12" rx="1"/><rect x="55" y="16" width="4" height="12" rx="1"/>');
Q('power-rack', 'Power rack / cage', 'bench', ['rack', 'pullup'], '<path d="M12 8h40M12 8v48M52 8v48M21 14v42M43 14v42M12 8l9 6M52 8l-9 6M6 56h52M6 32h52"/>');
Q('smith', 'Smith machine', 'bench', ['smith'], '<path d="M14 6v52M50 6v52M8 58h48M8 6h48M9 28h46"/><rect x="18" y="24" width="4" height="8" rx="1"/><rect x="42" y="24" width="4" height="8" rx="1"/>');
Q('dip-station', 'Dip station', 'bench', ['dip'], '<path d="M12 24h16M36 24h16M20 24v32M44 24v32M13 56h14M37 56h14M28 24v6M36 24v6"/>');
Q('pullup-bar', 'Pull-up bar', 'bench', ['pullup'], '<path d="M6 18h52M14 18V8M50 18V8M8 8h12M44 8h12M22 18v6M42 18v6"/><path d="M22 24c0 6 4 10 10 10s10-4 10-10" stroke-dasharray="2 3"/>');
Q('landmine', 'Landmine', 'bench', ['landmine'], '<rect x="5" y="48" width="15" height="6" rx="1"/><path d="M13 48l40-30"/><rect x="44" y="11" width="6" height="18" rx="2" transform="rotate(-37 47 20)"/>');
Q('preacher', 'Preacher curl bench', 'bench', ['preacher'], '<path d="M22 20h18l9 15H31z"/><path d="M34 35v19M25 54h18M18 44h18"/>');
Q('hyper', 'Back extension (Roman chair)', 'bench', ['hyper'], '<path d="M8 56h48M14 56l26-26"/><rect x="33" y="17" width="18" height="7" rx="3" transform="rotate(-45 42 21)"/><circle cx="20" cy="45" r="3"/><circle cx="26" cy="45" r="3"/>');
Q('ghd', 'Glute-ham developer', 'bench', ['ghd', 'hyper'], '<rect x="7" y="21" width="27" height="9" rx="4"/><path d="M14 30v24M30 30v24M9 54h25M34 26h15v24M45 50h11"/><circle cx="51" cy="21" r="3"/><circle cx="51" cy="30" r="3"/>');
Q('plyo-box', 'Plyo box', 'bench', ['box'], '<path d="M12 22l20-10 20 10v26L32 58 12 48z"/><path d="M12 22l20 10 20-10M32 32v26"/>');
Q('step', 'Step platform', 'bench', ['box'], '<rect x="7" y="29" width="50" height="8" rx="3"/><path d="M14 37v9h11v-9M39 37v9h11v-9"/>');

/* leg machines */
Q('leg-press', 'Leg press', 'legs', ['legpress'], '<path d="M6 56h52M18 56L52 22M44 14l14 14M10 40h14l6 16"/>');
Q('hack-squat', 'Hack squat', 'legs', ['hacksquat'], '<path d="M14 56L38 8M25 56L49 8M6 56h52M10 49h22"/><rect x="26" y="21" width="10" height="22" rx="3" transform="rotate(27 31 32)"/>');
Q('leg-ext', 'Leg extension', 'legs', ['legext'], '<path d="M16 40h22M16 40V14M38 40l10 10M24 40v16M12 56h38"/><circle cx="49" cy="51" r="4"/>');
Q('leg-curl', 'Leg curl', 'legs', ['legcurl'], '<rect x="5" y="27" width="40" height="7" rx="3"/><path d="M45 31l9-10M12 34v20M38 34v20M7 54h38"/><circle cx="55" cy="19" r="4"/>');
Q('calf-machine', 'Calf raise machine', 'legs', ['calf'], '<path d="M14 8v48M14 15h20M8 56h40"/><rect x="30" y="12" width="13" height="6" rx="3"/><rect x="25" y="47" width="19" height="6" rx="1"/><path d="M34 18v29" stroke-dasharray="2 3"/>');
Q('hip-ab', 'Hip abduction / adduction', 'legs', ['hipab'], '<path d="M16 44h20M16 44V18M26 44v12M14 56h24M36 44l12-14M36 44l16-4"/><rect x="45" y="22" width="6" height="12" rx="3" transform="rotate(40 48 28)"/>');
Q('glute-machine', 'Hip thrust machine', 'legs', ['glutemachine'], '<rect x="5" y="36" width="21" height="7" rx="3"/><path d="M26 40h20l8-12M10 43v12M51 32v23M5 55h50"/><rect x="33" y="21" width="17" height="6" rx="3"/>');
Q('belt-squat', 'Belt squat', 'legs', ['beltsquat'], '<rect x="9" y="44" width="46" height="8" rx="2"/><path d="M32 44V30M15 44V20h-4M49 44V20h4"/><path d="M24 22h16l-3 8H27z"/>');

/* upper-body machines */
Q('chest-press', 'Chest press machine', 'upper', ['chestpress'], '<rect x="44" y="8" width="12" height="48" rx="2"/><path d="M48 14v36M52 14v36M14 44h16M14 44V14M14 24h22M14 31h22M36 21v13M20 44v12M12 56h16"/>');
Q('pec-deck', 'Pec deck / reverse fly', 'upper', ['pecdeck'], '<path d="M32 46V12M24 46h16M32 46v10M26 56h12M17 21h10M37 21h10"/><rect x="10" y="13" width="7" height="23" rx="3"/><rect x="47" y="13" width="7" height="23" rx="3"/>');
Q('shoulder-press', 'Shoulder press machine', 'upper', ['shoulderpress'], '<rect x="44" y="8" width="12" height="48" rx="2"/><path d="M48 14v36M52 14v36M16 48h16M19 48V20M11 13h26M13 13v8M35 13v8M24 48v8M14 56h18"/>');
Q('lat-pulldown', 'Lat pulldown', 'upper', ['latpull'], '<path d="M32 6v18M50 6v50M32 6h18M10 28l6-4h32l6 4M22 52h16M30 52v4"/><rect x="20" y="41" width="20" height="5" rx="2"/>');
Q('row-machine', 'Seated row machine', 'upper', ['rowmachine'], '<path d="M7 50h21M18 50v6M40 30h12M46 30v-6M43 24h6M53 9v47M10 56h46"/><rect x="34" y="23" width="6" height="19" rx="3"/>');
Q('assist-machine', 'Assisted pull-up / dip', 'upper', ['assist'], '<path d="M14 6v50M50 6v50M14 10h36M8 56h48M18 14h-6M46 14h6M32 42v8"/><rect x="24" y="36" width="16" height="6" rx="2"/><path d="M20 26h8M36 26h8"/>');
Q('tbar', 'T-bar row', 'upper', ['tbar'], '<path d="M8 52l40-24M6 56h18M42 22l10 10"/><rect x="37" y="15" width="5" height="17" rx="2" transform="rotate(-30 40 23)"/><rect x="14" y="40" width="14" height="5" rx="2"/>');
Q('ab-machine', 'Ab crunch machine', 'upper', ['abmachine'], '<path d="M16 48h18M16 48V22M16 22c8-6 18-4 22 4M20 48v8M12 56h16"/><rect x="34" y="22" width="8" height="10" rx="3"/>');

/* cables and functional */
Q('cable-cross', 'Cable crossover / functional trainer', 'cable', ['cable'], '<path d="M10 6v50M54 6v50M6 56h52M10 6h44M16 21l10 13M48 21L38 34M23 34h5M36 34h5"/><circle cx="14" cy="18" r="3"/><circle cx="50" cy="18" r="3"/>');
Q('cable-stack', 'Single cable stack', 'cable', ['cable'], '<rect x="9" y="8" width="18" height="48" rx="2"/><path d="M13 30h10M13 35h10M13 40h10M13 45h10M27 14h15v8M42 22l-4 12M42 22l4 12"/><circle cx="42" cy="12" r="3"/>');
Q('bands', 'Resistance bands', 'cable', ['band'], '<path d="M14 17c4 19 12 31 18 31s14-12 18-31"/><rect x="8" y="10" width="12" height="6" rx="3"/><rect x="44" y="10" width="12" height="6" rx="3"/>');
Q('mini-bands', 'Mini loop bands', 'cable', ['miniband'], '<ellipse cx="25" cy="31" rx="16" ry="10"/><ellipse cx="39" cy="35" rx="16" ry="10"/>');
Q('trx', 'Suspension trainer (TRX)', 'cable', ['trx'], '<rect x="27" y="4" width="10" height="5" rx="1"/><path d="M32 9v7M32 16l-12 30M32 16l12 30M14 46h11M39 46h11M16 46v6h7v-6M41 46v6h7v-6"/>');
Q('rings', 'Gymnastic rings', 'cable', ['rings'], '<path d="M20 4v25M44 4v25"/><circle cx="20" cy="40" r="10"/><circle cx="44" cy="40" r="10"/>');
Q('ropes', 'Battle ropes', 'cable', ['ropes'], '<path d="M5 24c8-8 12 8 20 0s12 8 20 0 6 6 9 4M5 40c8-8 12 8 20 0s12 8 20 0 6 6 9 4"/><rect x="54" y="18" width="6" height="30" rx="2"/>');
Q('sled', 'Sled / prowler', 'cable', ['sled'], '<path d="M5 50h45l7-6M14 50V36h22v14M18 36V14M31 36V14M14 14h8M27 14h8"/>');
Q('abwheel', 'Ab wheel', 'cable', ['abwheel'], '<circle cx="32" cy="34" r="14"/><circle cx="32" cy="34" r="3"/><path d="M9 34h46"/>');

/* cardio */
Q('treadmill', 'Treadmill', 'cardio', ['treadmill'], '<path d="M5 50h40l11-4M8 55h44M46 46V15"/><rect x="37" y="9" width="17" height="7" rx="2"/>');
Q('bike', 'Stationary / spin bike', 'cardio', ['bike'], '<circle cx="17" cy="45" r="9"/><path d="M17 45l15-16h12M32 29l6 19M44 29l4-12h6M28 21h11M33 21v8M7 56h50"/>');
Q('airbike', 'Air bike', 'cardio', ['airbike'], '<circle cx="20" cy="38" r="14"/><path d="M20 24v28M6 38h28M10 28l20 20M30 28L10 48M34 38l10-6V20M42 18h10M44 32l4 18M38 54h20"/>');
Q('rower', 'Rowing machine', 'cardio', ['rower'], '<circle cx="12" cy="40" r="8"/><path d="M20 45h40M20 36l9-4M57 45v8M13 48v5"/><rect x="34" y="39" width="11" height="5" rx="2"/>');
Q('elliptical', 'Elliptical', 'cardio', ['elliptical'], '<path d="M6 55h52M14 55l6-10h22l8 10M24 45L32 16M32 16l3-7M40 45l-5-26M35 19l2-9"/><ellipse cx="31" cy="49" rx="10" ry="3"/>');
Q('stairs', 'Stair climber', 'cardio', ['stairs'], '<path d="M9 54h10V44h10V34h10V24h10V14M51 12v44M6 56h50M44 8h12"/>');
Q('skierg', 'Ski erg', 'cardio', ['skierg'], '<rect x="26" y="6" width="12" height="36" rx="2"/><path d="M30 42v12M34 42v12M20 56h24M26 12l-8 16M38 12l8 16M14 28h7M43 28h7"/>');

/* small kit and mobility */
Q('ball', 'Stability ball', 'small', ['ball'], '<circle cx="32" cy="31" r="22"/><path d="M15 22c10 6 24 6 34 0M14 57h36"/>');
Q('bosu', 'BOSU ball', 'small', ['bosu'], '<path d="M8 44a24 24 0 0 1 48 0z"/><path d="M5 49h54M18 30c8-4 20-4 28 0"/>');
Q('parallettes', 'Parallettes', 'small', ['parallettes'], '<path d="M7 28h22M35 28h22M10 28l-4 18M26 28l4 18M38 28l-4 18M54 28l4 18M3 46h8M26 46h8M30 46h8M54 46h8"/>');
Q('ladder', 'Agility ladder', 'small', ['ladder'], '<path d="M19 6L8 58M45 6l11 52M18 12h28M16 22h32M14 33h36M11 45h42"/>');
Q('cones', 'Cones', 'small', ['cones'], '<path d="M20 52l9-36 9 36M14 52h30M24 38h10M44 52l5-18 5 18M41 52h16"/>');
Q('hurdles', 'Mini hurdles', 'small', ['hurdles'], '<path d="M12 56V24h40v32M12 30h40M7 56h10M47 56h10"/>');
Q('rope', 'Jump rope', 'small', ['rope'], '<rect x="11" y="8" width="6" height="15" rx="3"/><rect x="47" y="8" width="6" height="15" rx="3"/><path d="M14 23c0 40 36 40 36 0"/>');
Q('roller', 'Foam roller', 'small', ['roller'], '<ellipse cx="14" cy="32" rx="6" ry="12"/><path d="M14 20h36M14 44h36M50 20a6 12 0 0 1 0 24M25 22v20M36 22v20" />');
Q('mat', 'Exercise mat', 'small', ['mat'], '<rect x="5" y="40" width="38" height="8" rx="2"/><circle cx="50" cy="38" r="10"/><circle cx="50" cy="38" r="5"/>');

const EQUIP_BY_ID = Object.fromEntries(EQUIP.map(e => [e.id, e]));
const equipArt = (e, size = 64) => `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${e.art}</svg>`;
const GYM_PRESETS = {
  school: ['dumbbells', 'barbell', 'kettlebells', 'medball', 'flat-bench', 'adj-bench', 'squat-rack', 'pullup-bar', 'plyo-box', 'bands', 'cable-stack', 'lat-pulldown', 'leg-press', 'treadmill', 'bike', 'rower', 'mat', 'cones', 'rope', 'ladder'],
  home: ['dumbbells', 'bands', 'mat', 'rope', 'pullup-bar'],
  gym: EQUIP.map(e => e.id)
};

/* ---------- new exercises unlocked by specific machines ---------- */
// squat
E('Hack squat', 'squat', [['hacksquat']], 1, 'Back flat on the pad, knees travel over the toes.', ['knee']);
E('Smith machine squat', 'squat', [['smith']], 1, 'Feet slightly in front of the bar, sit straight down.', ['knee']);
E('Belt squat', 'squat', [['beltsquat']], 1, 'Stay tall, push the platform away. Easy on the back.', []);
E('Landmine squat', 'squat', [['landmine', 'barbell']], 1, 'Hold the bar end at your chest, sit between the heels.', []);
E('Sandbag front squat', 'squat', [['sandbag']], 2, 'Hug the bag high, elbows down.', ['back']);
E('Weighted vest squat', 'squat', [['vest']], 1, 'Same as a bodyweight squat, just heavier. Full depth.', []);
// hinge
E('Hex bar deadlift', 'hinge', [['trapbar']], 1, 'Stand in the middle, push the floor away, hips and shoulders rise together.', ['back']);
E('Kettlebell deadlift', 'hinge', [['kettlebell']], 1, 'Bell between the feet, hips back, flat back.', []);
E('Back extension', 'hinge', [['hyper']], 1, 'Hinge at the hips, squeeze glutes to come up. Do not over-arch.', []);
E('Glute-ham raise', 'hinge', [['ghd']], 3, 'Knees on the pad, lower slowly with a straight body.', ['hamstring', 'knee']);
E('Hip thrust machine', 'hinge', [['glutemachine']], 1, 'Chin tucked, drive through the heels, pause at the top.', []);
E('Smith machine hip thrust', 'hinge', [['smith', 'bench']], 1, 'Upper back on the bench, bar over the hips.', []);
E('Cable pull-through', 'hinge', [['cable']], 1, 'Face away from the stack, hinge and snap the hips.', []);
// horizontal push
E('Machine chest press', 'pushH', [['chestpress']], 1, 'Handles at mid-chest, press and squeeze.', []);
E('Smith machine bench press', 'pushH', [['smith', 'bench']], 1, 'Bar to lower chest, elbows at 45°.', ['shoulder']);
E('Incline barbell press', 'pushH', [['barbell', 'incline', 'rack']], 2, 'Bench at 30°, bar to upper chest.', ['shoulder']);
E('Decline dumbbell press', 'pushH', [['dumbbell', 'decline']], 2, 'Feet hooked, press over the lower chest.', []);
E('Pec deck fly', 'pushH', [['pecdeck']], 1, 'Slight bend in the elbows, hug a tree.', []);
E('Cable fly', 'pushH', [['cable']], 1, 'Step forward, bring the hands together in an arc.', ['shoulder']);
E('Parallel-bar dip', 'pushH', [['dip']], 2, 'Lean forward slightly, lower until shoulders are level with elbows.', ['shoulder']);
E('Assisted dip', 'pushH', [['assist']], 1, 'Let the machine help, control the way down.', []);
E('Ring push-up', 'pushH', [['rings']], 2, 'Keep the rings close to the body, turn hands out at the top.', ['wrist']);
E('Suspension chest press', 'pushH', [['trx']], 1, 'Lean into the straps, body in one line.', []);
E('Parallette push-up', 'pushH', [['parallettes']], 1, 'Neutral wrists, go deeper than a floor push-up.', []);
// vertical push
E('Machine shoulder press', 'pushV', [['shoulderpress']], 1, 'Back on the pad, press without shrugging.', []);
E('Smith machine overhead press', 'pushV', [['smith', 'bench']], 2, 'Seat set so the bar starts at chin height.', ['shoulder']);
E('Landmine press', 'pushV', [['landmine', 'barbell']], 1, 'Press up and forward, shoulder-friendly.', []);
E('Kettlebell press', 'pushV', [['kettlebell']], 1, 'Bell rests on the forearm, press in a straight line.', ['shoulder']);
E('Arnold press', 'pushV', [['dumbbell']], 2, 'Palms face you at the bottom, rotate as you press.', ['shoulder']);
// horizontal pull
E('Machine row', 'pullH', [['rowmachine']], 1, 'Chest on the pad, pull elbows back and squeeze.', []);
E('T-bar row', 'pullH', [['tbar'], ['landmine', 'barbell']], 2, 'Flat back, row to the lower chest.', ['back']);
E('Suspension row', 'pullH', [['trx']], 1, 'Walk the feet forward to make it harder.', []);
E('Ring row', 'pullH', [['rings']], 1, 'Body straight, pull the rings to the ribs.', []);
E('Face pull', 'pullH', [['cable'], ['band']], 1, 'Pull to the forehead, thumbs back.', []);
E('Reverse pec deck', 'pullH', [['pecdeck']], 1, 'Face the pad, open the arms wide.', []);
E('Kettlebell row', 'pullH', [['kettlebell']], 1, 'Hinge, pull the bell to the hip.', []);
// vertical pull
E('Assisted pull-up', 'pullV', [['assist']], 1, 'Knees on the pad, full range every rep.', []);
E('Chin-up', 'pullV', [['pullup']], 2, 'Palms facing you, chest to the bar.', ['shoulder']);
E('Straight-arm pulldown', 'pullV', [['cable'], ['latpull']], 1, 'Arms long, sweep the bar to the thighs.', []);
// single leg
E('Smith machine split squat', 'single', [['smith']], 1, 'Long stance, drop the back knee.', ['knee']);
E('Weighted vest step-up', 'single', [['vest', 'box']], 1, 'Drive through the top foot only.', []);
E('Kettlebell reverse lunge', 'single', [['kettlebell']], 1, 'Hold the bell at the chest, step back long.', ['knee']);
E('Sandbag lunge', 'single', [['sandbag']], 2, 'Bag on one shoulder, switch halfway.', ['knee']);
// leg isolation
E('Leg extension', 'legiso', [['legext']], 1, 'Pause at the top for one second.', ['knee']);
E('Leg curl', 'legiso', [['legcurl']], 1, 'Curl fully, lower for three seconds.', []);
E('Standing calf raise', 'legiso', [['calf'], ['smith'], ['dumbbell'], ['none']], 1, 'Full stretch at the bottom, pause at the top.', []);
E('Hip abduction', 'legiso', [['hipab']], 1, 'Sit tall, push the pads out slowly.', []);
E('Stability ball hamstring curl', 'legiso', [['ball']], 1, 'Hips up, roll the ball in with the heels.', []);
E('Mini-band lateral walk', 'legiso', [['miniband']], 1, 'Half squat, small steps, knees out.', []);
E('Nordic hamstring curl', 'legiso', [['none']], 2, 'Lower as slowly as you can, push back up with the hands.', ['hamstring', 'knee']);
E('Wall sit', 'legiso', [['none']], 1, 'Thighs parallel to the floor, back flat on the wall.', ['knee'], 's');
// core
E('Ab wheel rollout', 'core', [['abwheel']], 2, 'Ribs down, roll out only as far as you can control.', ['back']);
E('Machine crunch', 'core', [['abmachine']], 1, 'Curl the ribs to the hips, slow on the way back.', []);
E('Cable crunch', 'core', [['cable']], 1, 'Kneel, curl down with the abs, not the arms.', []);
E('Stability ball rollout', 'core', [['ball']], 1, 'Forearms on the ball, roll out with a flat back.', []);
E('Suspension body saw', 'core', [['trx']], 2, 'Feet in the straps, rock back and forth from the forearms.', ['shoulder']);
E('Landmine rotation', 'core', [['landmine', 'barbell']], 2, 'Arms long, rotate through the hips.', ['back']);
E('Medicine ball Russian twist', 'core', [['medball']], 1, 'Lean back slightly, touch the ball to each side.', ['back']);
E('L-sit hold', 'core', [['parallettes'], ['dip']], 2, 'Straight arms, legs out in front.', ['wrist'], 's');
E('Hanging leg raise', 'core', [['pullup']], 3, 'Straight legs to hip height, no swing.', ['shoulder']);
// carry
E('Sled push', 'carry', [['sled']], 1, 'Low body angle, drive with short powerful steps.', [], 'm');
E('Sled drag', 'carry', [['sled']], 1, 'Walk backwards, stay low.', [], 'm');
E('Sandbag bear-hug carry', 'carry', [['sandbag']], 1, 'Hug the bag tight, walk tall.', [], 'm');
E('Trap bar carry', 'carry', [['trapbar']], 1, 'Stand up with the bar, walk with short steps.', [], 'm');
E('Plate pinch carry', 'carry', [['plate']], 1, 'Pinch plates smooth side out, walk tall.', [], 'm');
// power
E('Battle rope slams', 'power', [['ropes']], 1, 'Big arms, slam the ropes hard into the floor.', ['shoulder'], 's');
E('Sled sprint', 'power', [['sled']], 1, 'Light load, sprint hard for 10–15 m.', [], 'm');
E('Hurdle hops', 'power', [['hurdles']], 1, 'Quick, springy contacts over each hurdle.', ['knee', 'ankle']);
E('Agility ladder quick feet', 'power', [['ladder']], 1, 'Fast feet, light on the toes.', ['ankle'], 's');
E('Landmine push press', 'power', [['landmine', 'barbell']], 2, 'Dip and drive, press explosively.', ['shoulder']);
E('Sandbag clean', 'power', [['sandbag']], 2, 'Hips through, catch the bag on the chest.', ['back']);
E('Jump rope bursts', 'power', [['rope']], 1, 'Fast turns, stay on the balls of the feet.', ['ankle'], 's');
// arms
E('EZ-bar curl', 'arms', [['ezbar']], 1, 'Elbows still, squeeze at the top.', []);
E('Preacher curl', 'arms', [['preacher', 'ezbar'], ['preacher', 'dumbbell']], 1, 'Armpits on the pad, full stretch at the bottom.', []);
E('Cable curl', 'arms', [['cable']], 1, 'Constant tension, slow down.', []);
E('EZ-bar skull crusher', 'arms', [['ezbar', 'bench']], 2, 'Lower the bar behind the head, elbows in.', []);
E('Suspension biceps curl', 'arms', [['trx']], 1, 'Lean back, curl yourself up.', []);
E('Machine-assisted dip', 'arms', [['assist']], 1, 'Upright torso to hit the triceps.', []);

/* cardio machine for finishers, in order of preference */
const CARDIO_PREF = [['airbike', 'Air bike'], ['rower', 'Rower'], ['skierg', 'Ski erg'], ['bike', 'Bike'], ['treadmill', 'Treadmill'], ['stairs', 'Stair climber'], ['elliptical', 'Elliptical'], ['rope', 'Jump rope'], ['ropes', 'Battle ropes']];
function cardioOf(p) {
  const kit = kitOf(p);
  const m = CARDIO_PREF.find(([k]) => kit.includes(k));
  return m ? m[1] : null;
}
