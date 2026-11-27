/* =========================================================
   PULSE — "I ate something else": food check
   Look a food up (or type its numbers), see its macros, and get an honest verdict for the athlete's goal:
   why it is good and what it gives the body, or why to skip it next time. Logged either way, because the
   log should show what really happened.
   ========================================================= */

/* name | serving | kcal | protein | carbs | fat | sugar | fibre | level (G good, O okay, A avoid) | why | other names */
const FOOD_DB_TXT = `
Samosa|1 piece (100 g)|262|4|24|17|2|2|A|Deep-fried pastry. Most of its calories come from oil and refined flour, with very little protein.|samosa,samosas
Kachori|1 piece|230|4|24|13|2|2|A|Deep-fried dough. Lots of oil, little protein or fibre.|kachori,kachauri
Vada pav|1 piece|290|6|40|12|3|3|A|Fried potato in a refined-flour bun. It fills you up with oil and starch, not protein.|vada pav,vadapav,wada pav
Pakora|100 g|280|7|28|15|2|3|A|Deep-fried in reused oil, which carries trans fats that slow recovery.|pakora,pakoda,bhajiya,bhaji fried
French fries|medium (115 g)|365|4|48|17|0|4|A|Deep-fried and salty: starch and oil with almost nothing else.|french fries,fries,chips fried,finger chips
Potato chips|30 g pack|160|2|15|10|0.5|1|A|Fried, salty and easy to eat far too many. Almost no protein or fibre.|chips,crisps,lays,kurkure,bingo,nachos
Instant noodles|1 pack (70 g)|310|7|44|12|2|2|A|Fried noodles with a seasoning packed with salt: close to a day of sodium and very little protein.|maggi,instant noodles,top ramen,yippee,cup noodles
Burger|1 burger|450|22|40|22|8|2|A|A lot of refined flour, fat and salt. The protein is decent, but a regular habit adds fat quickly.|burger,cheeseburger,mcaloo,zinger
Pizza slice|1 slice|285|12|36|10|4|2|O|Cheese gives some protein and calcium, but the base is refined flour and the salt is high. Thin crust with vegetables is the better version.|pizza
Cola|1 can (330 ml)|140|0|35|0|35|0|A|About 9 teaspoons of sugar and nothing else. Liquid sugar does not fill you up, so it adds on top of your meals.|cola,coke,pepsi,thums up,sprite,fanta,soda,soft drink,mirinda,limca,7up
Energy drink|1 can (250 ml)|110|0|27|0|27|0|A|Sugar plus a large dose of caffeine. Doctors advise people under 18 to avoid them: poor sleep, racing heart.|energy drink,red bull,monster,sting
Packaged fruit juice|1 glass (200 ml)|90|0.5|22|0|20|0|A|Most of the fibre is gone, leaving sugar water. Eat the whole fruit instead.|packaged juice,frooti,maaza,slice,real juice,fruit juice
Chocolate bar|1 bar (45 g)|240|3|27|13|25|1|A|Mostly sugar and saturated fat. It gives a short spike then a crash, with almost no protein.|chocolate,dairy milk,kitkat,kit kat,snickers,5 star,five star,munch,perk,nutella
Dark chocolate|20 g (2 squares)|120|1.5|9|9|5|2|O|70% or darker has magnesium and antioxidants and far less sugar. Fine in small amounts.|dark chocolate,70% chocolate
Ice cream|1 scoop (100 g)|200|3|24|11|21|0|A|Sugar and cream: calories that do not feed your muscles.|ice cream,icecream,kulfi,gelato,sundae
Gulab jamun|2 pieces|300|4|45|12|35|0|A|Fried dough soaked in sugar syrup: more than 8 teaspoons of sugar in two pieces.|gulab jamun,gulabjamun
Jalebi|2 pieces|150|1|30|4|20|0|A|Fried and dipped in syrup. Almost pure sugar and oil.|jalebi
Laddu|1 piece|190|3|25|9|18|1|A|Sugar and ghee. A treat, not fuel.|laddu,ladoo,motichoor,besan ladoo
Cake or pastry|1 slice|350|4|50|15|35|1|A|Sugar, refined flour and butter. High in calories, low in everything your muscles need.|cake,pastry,brownie,cupcake,muffin,donut,doughnut
Sweet biscuits|3 biscuits|150|2|22|6|10|0.5|A|Refined flour and sugar. Easy to eat many without feeling full.|biscuit,biscuits,cookie,cookies,oreo,bourbon,hide and seek,parle g,good day
Milkshake|1 glass (300 ml)|350|9|55|11|48|0|A|More sugar than a can of cola, plus cream. The protein from milk does not make up for it.|milkshake,thick shake,shake
Cold coffee (café style)|1 glass (300 ml)|250|6|38|8|32|0|A|Café cold coffees are mostly sugar and cream, with caffeine that can disturb your sleep.|cold coffee,frappe,frappuccino,iced coffee
Tea with sugar|1 cup|60|1|12|1.5|10|0|O|Small sugar and a little caffeine. Fine once or twice a day. Cut the sugar for a better version.|chai,tea,masala chai,milk tea
Black coffee|1 cup|5|0.3|0|0|0|0|O|Almost no calories. Caffeine can help alertness, but keep it to one cup, and not late in the day, because sleep is where you grow.|coffee,black coffee,americano
Green tea|1 cup|2|0|0|0|0|0|G|No calories, antioxidants (catechins) and counts towards your fluids. A good swap for sugary drinks.|green tea
Fried chicken|2 pieces|450|30|18|28|0|1|A|The protein is good, but the batter and deep-frying add a lot of fat. Grilled or tikka gives you the protein without the oil.|fried chicken,kfc,chicken fry,crispy chicken
Chicken nuggets|6 pieces|280|14|18|17|0|1|A|Processed chicken in a fried coating. Less protein than real chicken and more fat.|nuggets,chicken nuggets,popcorn chicken
Momos (fried)|6 pieces|360|10|40|18|2|2|A|Frying doubles the fat of the steamed version.|fried momos,momos fried,kurkure momos
Momos (steamed)|6 pieces|200|7|34|4|2|3|O|Steamed, so much lighter than fried. The wrapper is refined flour, and spicy mayo adds a lot of fat, so go for chutney.|momos,momo,steamed momos
Chole bhature|1 plate|560|14|70|25|6|9|A|The chole is great (protein, fibre, iron), but the deep-fried bhature adds hundreds of calories of oil.|chole bhature,chhole bhature
Pav bhaji|1 plate|400|9|55|16|8|6|O|Plenty of vegetables, but the butter and refined-flour pav make it heavy. Ask for less butter.|pav bhaji,pavbhaji
Pani puri|6 pieces|180|3|30|6|4|2|O|Fried shells, but small. Fine as an occasional treat. Choose a clean vendor, because unsafe water is the real risk.|pani puri,golgappa,gol gappa,puchka
Bhel puri|1 plate|220|5|38|6|5|3|O|Puffed rice and sev: light, though refined and salty. Add chopped onion, tomato and sprouts to improve it.|bhel,bhel puri,sev puri
Aloo paratha|1 with butter|300|7|42|12|2|3|O|Good carbs for energy but a lot of butter or oil. One is a fine meal; use curd on the side, not more butter.|aloo paratha,paratha,parantha,stuffed paratha
Plain paratha|1|260|5|34|11|1|2|O|Refined or whole-wheat flour cooked in ghee or oil. A roti has half the fat.|plain paratha
Butter chicken|1 bowl|380|28|10|26|6|1|O|Excellent protein, but cream and butter make it rich. Tandoori or tikka gives the same protein with less fat.|butter chicken,murgh makhani
Chicken curry|1 bowl|250|25|8|14|3|1.5|G|High protein with iron, zinc and B vitamins for recovery. Ask for less oil if you can.|chicken curry,chicken masala
Chicken biryani|1 plate|480|24|58|16|3|3|O|Good protein and carbs together, so it fuels training. Large portions and oil add up, so have a small plate with raita.|biryani,chicken biryani,mutton biryani
Veg biryani|1 plate|420|9|62|15|4|4|O|Mostly rice and oil, with little protein. Add raita or dal for protein.|veg biryani,vegetable biryani
Paneer butter masala|1 bowl|400|14|12|33|7|2|O|Protein and calcium from paneer, but the cream and butter make it very rich. Palak paneer is the lighter choice.|paneer butter masala,shahi paneer,paneer makhani,kadhai paneer
Fried rice|1 plate|350|8|55|12|2|2|O|Carbs for energy, but fried in oil with little protein. Add egg, tofu or chicken.|fried rice,veg fried rice,egg fried rice
Hakka noodles|1 plate|400|9|60|14|3|3|O|Refined noodles tossed in oil and sauces. Okay now and then, better with extra vegetables and a protein.|noodles,hakka noodles,chowmein,chow mein
Grilled veg sandwich|1|250|8|34|9|4|3|O|Fine as a quick meal. Choose brown bread and skip the mayo.|sandwich,veg sandwich,grilled sandwich
Cornflakes with milk|1 bowl|230|7|40|4|12|1|O|Quick carbs, but the flakes are refined and often sweetened. Oats are the better breakfast.|cornflakes,corn flakes,frosties,chocos,kelloggs
Muesli with milk|1 bowl|260|9|42|6|14|4|O|Fibre and some protein, but many brands add a lot of sugar. Check the label.|muesli,granola
Granola bar|1 bar|120|2|18|5|9|1|O|Often a candy bar in disguise. A handful of nuts and a fruit is better.|granola bar,cereal bar,energy bar
Protein bar|1 bar|200|20|20|7|5|3|O|Handy when you cannot get a meal. Check that sugar is low and the label is lab-tested.|protein bar,yoga bar,rite bar
Honey|1 tbsp|64|0|17|0|17|0|O|Still sugar, with a few trace minerals. Fine as a spoonful in oats or tea.|honey,shehad
Ghee|1 tsp|45|0|0|5|0|0|O|A little ghee is fine and adds flavour. It is pure fat, so calories add up quickly.|ghee,desi ghee
Butter|1 tbsp|100|0.1|0|11|0|0|O|Pure fat. A thin scrape on toast is fine; a lot is not.|butter,makhan
Cheese slice|1 slice|70|4|1|5.5|0.5|0|O|Protein and calcium, but also salt and saturated fat. Paneer or curd is the better pick.|cheese,cheese slice,amul cheese,mozzarella
Papaya|1 cup (140 g)|60|1|15|0.4|11|2.5|G|Vitamin C and vitamin A for immunity, and papain, which helps digestion. Gentle on the stomach.|papaya,papita
Watermelon|1 cup (150 g)|45|1|11|0.2|9|0.6|G|About 92% water, so it hydrates you, with lycopene, vitamin C and some potassium. Great after training.|watermelon,tarbooj
Mango|1 cup (165 g)|100|1.4|25|0.6|23|2.6|O|Vitamin A and C, but 23 g of natural sugar. One cup is fine; it is not a free-for-all.|mango,aam
Grapes|1 cup (150 g)|100|1|27|0.2|23|1.4|O|Quick energy and antioxidants, but easy to overeat. Pair with a handful of nuts.|grapes,angoor
Guava|1 medium|112|4|23|1.6|15|9|G|One of the best sources of vitamin C (more than an orange) and 9 g of fibre, so it keeps you full.|guava,amrud
Pomegranate|1/2 cup seeds|72|1.5|16|1|12|3.5|G|Antioxidants that may help muscle soreness, plus vitamin C and potassium.|pomegranate,anar
Pineapple|1 cup (165 g)|82|1|22|0.2|16|2.3|G|Vitamin C and manganese for bones and recovery, and bromelain, an enzyme that helps digestion.|pineapple,ananas
Strawberries|1 cup (150 g)|48|1|11.5|0.5|7|3|G|Low in sugar for a fruit and rich in vitamin C and antioxidants.|strawberry,strawberries
Cucumber|1 cup|16|0.7|3.8|0.1|1.7|0.5|G|Almost all water, so it hydrates you with hardly any calories. Good with salt and lemon on a hot day.|cucumber,kheera,kakdi
Carrot|1 medium|25|0.6|6|0.1|3|1.7|G|Beta-carotene (vitamin A) for eyes and immunity, plus fibre.|carrot,gajar
Spinach (palak)|1 cup cooked|41|5|7|0.5|0.8|4|G|Iron, folate, magnesium and vitamin K, all useful for energy, muscles and bones.|spinach,palak,saag
Broccoli|1 cup|55|3.7|11|0.6|2|5|G|Vitamin C, vitamin K and 5 g of fibre, with very few calories.|broccoli
Boiled egg|1 large|78|6|0.6|5|0.6|0|G|A complete protein with choline, vitamin B12 and vitamin D. One of the best foods for recovery.|boiled egg,egg,anda,hard boiled egg
Walnuts|30 g (a handful)|196|4.5|4|19.5|0.7|2|G|Plant omega-3 fats for recovery and brain health. A handful only, because the calories add up.|walnut,walnuts,akhrot
Cashews|30 g (a handful)|165|5|9|13|1.5|1|G|Healthy fats, magnesium and zinc. Keep to a handful.|cashew,cashews,kaju
Raisins|1 small box (28 g)|85|0.9|22|0.1|17|1|O|Quick carbs for before training and iron, but sugary. A small box is plenty.|raisins,kishmish
Sattu drink|1 glass|150|8|25|2|3|5|G|Roasted gram flour: plant protein and fibre, cooling in summer and a traditional pre-workout drink.|sattu,sattu drink
Ragi porridge|1 bowl|180|4|36|1|6|4|G|Finger millet is rich in calcium and iron, which is useful for growing bones.|ragi,ragi porridge,nachni,ragi malt
Bajra roti|1 roti|150|4|29|2|0|3.5|G|Pearl millet has iron, magnesium and fibre, and keeps you full longer than white flour.|bajra,bajra roti
Jowar roti|1 roti|140|4|29|1|0|3|G|Sorghum is high in fibre, gluten-free and gives steady energy.|jowar,jowar roti,sorghum
Sambar|1 bowl|130|6|20|3|4|5|G|Lentils and vegetables: protein, fibre, iron and potassium in one bowl.|sambar
Rasam|1 bowl|50|2|8|1|2|1|G|Light and hydrating, with tomato, pepper and tamarind. A good start to a meal.|rasam
Boiled corn|1 cob|125|4.5|27|1.8|5|3.5|G|Fibre, B vitamins and lutein. Better than buttered or fried corn.|corn,boiled corn,bhutta,sweet corn
Boiled potato|1 medium|130|3|30|0.2|1|2.5|G|Potassium and vitamin C, and good carbs before training when boiled, not fried.|potato,aloo boiled,boiled potato
Dahi vada|1 plate|230|9|30|8|8|2|O|Curd gives protein and probiotics, but the vada is deep-fried and the chutneys add sugar.|dahi vada,dahi bhalla
Chana chaat|1 bowl|200|10|30|4|4|8|G|Chickpeas give protein, fibre and iron. Lemon and onion keep it light.|chana chaat,chaat chana
Lemon water (sweetened)|1 glass|30|0|8|0|6|0|O|Hydrates you. The sugar is small; skip it or use less for the best version.|nimbu pani,lemon water,shikanji,lemonade
`;
const FOOD_DB = FOOD_DB_TXT.trim().split('\n').map(l => {
  const [n, srv, kcal, p, c, f, sug, fib, lv, why, al] = l.split('|');
  return { name: n, srv, kcal: +kcal, p: +p, c: +c, f: +f, sug: +sug, fib: +fib, lv: { G: 'good', O: 'ok', A: 'avoid' }[lv], why, names: (al || '').split(',').map(x => x.trim()).filter(Boolean) };
});
/* typical numbers for a junk food Pulse recognises by category but has no entry for */
const JUNK_DEFAULT = {
  'Chocolate and sweets': { srv: '1 bar', kcal: 210, p: 3, c: 24, f: 11, sug: 22, fib: 1 }, 'Chips and fried snacks': { srv: '1 small pack', kcal: 160, p: 2, c: 15, f: 10, sug: 1, fib: 1 },
  'Fizzy drinks': { srv: '1 can (330 ml)', kcal: 140, p: 0, c: 35, f: 0, sug: 35, fib: 0 }, 'Energy drinks': { srv: '1 can (250 ml)', kcal: 110, p: 0, c: 27, f: 0, sug: 27, fib: 0 },
  'Pizza and burgers': { srv: '1 serving', kcal: 450, p: 18, c: 45, f: 22, sug: 6, fib: 2 }, 'Fried food': { srv: '1 serving', kcal: 300, p: 5, c: 28, f: 18, sug: 1, fib: 2 },
  'Desserts and bakery': { srv: '1 serving', kcal: 320, p: 4, c: 45, f: 14, sug: 28, fib: 1 }, 'Instant noodles': { srv: '1 pack', kcal: 310, p: 7, c: 44, f: 12, sug: 2, fib: 2 },
  'Sugary coffee and shakes': { srv: '1 glass', kcal: 320, p: 8, c: 48, f: 10, sug: 40, fib: 0 }, 'Alcohol': { srv: '1 drink', kcal: 150, p: 1, c: 10, f: 0, sug: 3, fib: 0 }
};
/* what the healthy foods already in Pulse give the body, where there is something worth saying */
const FOOD_NUT = {
  oats: 'Beta-glucan fibre lowers cholesterol and keeps you full, and oats give steady slow-release energy.', milk: 'Calcium and vitamin D for bones, plus whey and casein protein.', curd: 'Probiotics for your gut, plus calcium and protein.', greek: 'Double the protein of normal curd with calcium and probiotics.',
  paneer: 'Casein protein digests slowly, and it has calcium and phosphorus for bones.', eggs: 'Complete protein with choline, vitamin B12 and vitamin D.', chicken: 'Very lean protein with niacin and vitamin B6 for energy.', fish: 'Protein plus omega-3 fats and vitamin D, good for recovery.',
  dal: 'Plant protein, iron, folate and fibre.', rajma: 'Plant protein, iron, folate and a lot of fibre.', chana: 'Plant protein, iron and fibre.', tofu: 'Complete plant protein with calcium and iron.', soya: 'The most protein of any plant food, plus iron.',
  banana: 'Potassium for muscle function and cramp prevention, and quick carbs for energy.', apple: 'Fibre (pectin) and vitamin C, a snack that keeps you full.', orange: 'Vitamin C for immunity and iron absorption.', almonds: 'Vitamin E, magnesium and healthy fats.',
  sweetpotato: 'Slow carbs with beta-carotene (vitamin A) and potassium.', sprouts: 'Protein and fibre with extra vitamin C and folate from sprouting.', salad: 'Hydrating and packed with vitamins for very few calories.', coconut: 'Potassium and electrolytes, lighter than a sports drink.',
  dates: 'Quick natural sugars with potassium and iron, useful before training.', makhana: 'Light and low in fat, with magnesium and potassium.', roastedchana: 'Protein and fibre in a crunchy snack.', quinoa: 'A complete plant protein with iron and magnesium.', brownrice: 'More fibre and magnesium than white rice.'
};
const GOAL_GOOD = {
  muscle: 'Good for building muscle.', strength: 'Helps you recover and get stronger.', lean: 'Fits a leaner body: filling for the calories.', general: 'Good for overall fitness.', endurance: 'Supports steady energy for long efforts.', speed: 'Supports speed and recovery.', mobility: 'Helps your body recover and stay supple.'
};
const normFood = s => String(s || '').toLowerCase().replace(/[^a-z0-9% ]+/g, ' ').replace(/\s+/g, ' ').trim();

/* find foods that match what the athlete typed: Pulse's own healthy list first, then the wider list */
function lookupFoods(q) {
  q = normFood(q); if (q.length < 2) return [];
  const toks = q.split(' ').filter(t => t.length > 1), out = [];
  const score = names => {
    let best = 0;
    names.forEach(nm => {
      nm = normFood(nm);
      if (nm === q) best = Math.max(best, 100);
      else if (nm.startsWith(q)) best = Math.max(best, 80);
      else if (nm.includes(q)) best = Math.max(best, 60 + q.length / nm.length * 20);
      else if (toks.length > 1 && toks.every(t => nm.includes(t))) best = Math.max(best, 45);
      else if (toks.length === 1 && nm.split(' ').some(w => w.startsWith(toks[0]))) best = Math.max(best, 50);
    });
    return best;
  };
  Object.entries(FOODS).forEach(([id, f]) => { const sc = score([f[0], id]); if (sc) out.push({ sc: sc + 1, id, name: f[0], srv: f[1], kcal: f[2], p: f[3], c: f[4], f: f[5], sug: null, fib: null, lv: 'good', own: true }); });
  FOOD_DB.forEach(d => { const sc = score([d.name, ...d.names]); if (sc) out.push(Object.assign({ sc }, d)); });
  return out.sort((a, b) => b.sc - a.sc).slice(0, 6);
}

/* judge a food from its numbers (per portion eaten) when there is no hand-written note for it */
function rateMacros(m) {
  const k = Math.max(1, +m.kcal || 0), p = +m.p || 0, f = +m.f || 0, sug = m.sug == null || m.sug === '' ? null : +m.sug, fib = m.fib == null || m.fib === '' ? null : +m.fib;
  const pd = p * 4 / k, fatShare = f * 9 / k, sugShare = sug != null ? sug * 4 / k : 0;
  const good = [], bad = []; let score = 0;
  if (pd >= 0.2 && p >= 10) { good.push(`${fmt1(p)} g of protein, which repairs and builds muscle`); score += 2; }
  else if (p >= 6 && pd >= 0.12) { good.push(`A useful ${fmt1(p)} g of protein`); score += 1; }
  if (fib != null && fib >= 3) { good.push(`${fmt1(fib)} g of fibre, which keeps you full and your digestion healthy`); score += 1; }
  if (sug != null && (sug >= 15 || (sug >= 10 && sugShare > 0.3))) { bad.push(`${fmt1(sug)} g of sugar, about ${Math.max(1, Math.round(sug / 4))} teaspoons`); score -= 2.5; }
  else if (sug != null && sug >= 8) { bad.push(`${fmt1(sug)} g of sugar`); score -= 1; }
  if (k >= 180 && fatShare > 0.5 && pd < 0.1) { bad.push('Most of its calories come from fat, with very little protein'); score -= 2; }
  if (k >= 350 && pd < 0.07) { bad.push('A lot of calories for very little protein'); score -= 1.5; }
  if (k <= 130 && (sug == null || sug <= 15) && fib != null && fib >= 2) { good.push('Light on calories for how much it fills you'); score += 1; }
  const lv = score >= 1.5 ? 'good' : score <= -1.5 ? 'avoid' : 'ok';
  return { lv, good, bad };
}
/* the full verdict shown to the athlete, for one portion with the numbers as entered */
function judgeFood(m, goal, extra = {}) {
  const r = rateMacros(m), lv = extra.lv || r.lv;
  const lines = [];
  const k = Math.max(1, +m.kcal || 0), pd = Math.round((+m.p || 0) * 4 / k * 100);
  let head, sub;
  if (lv === 'good') { head = 'Good choice'; sub = 'Have it again.'; }
  else if (lv === 'ok') { head = 'Fine now and then'; sub = 'Not a daily food.'; }
  else { head = 'Better to skip next time'; sub = 'Pulse suggests not having this again.'; }
  const why = extra.why || (lv === 'avoid' ? (r.bad.join('. ') || 'It adds calories without much your body can use') + '.' : lv === 'good' ? (r.good.join('. ') || 'It fits your goal') + '.' : (r.bad[0] ? r.bad[0] + '. ' : '') + (r.good[0] ? r.good[0] + '.' : 'It is neither helping nor hurting much.'));
  const goalLine = lv === 'avoid' ? GOAL_HARM[goal] : lv === 'good' ? GOAL_GOOD[goal] : '';
  return { lv, head, sub, why, goalLine, protein: pd, good: r.good, bad: r.bad, nut: extra.nut || '' };
}
/* an item from the log: its verdict, remembered from when it was added */
const offPlanItems = (from, to) => { const out = []; Object.entries(S.log.food).forEach(([d, arr]) => { if (d >= from && d <= to) arr.forEach(it => { if (it.off && it.custom) out.push(Object.assign({ date: d }, it)); }); }); return out.sort((a, b) => a.date < b.date ? 1 : -1); };
const timesEaten = (name, days = 14) => { const key = normFood(name), from = iso(addDays(new Date(), -days)); return offPlanItems(from, today()).filter(it => normFood(it.custom.name) === key).length; };

const LV_UI = { good: ['good', 'Good choice'], ok: ['warn', 'Fine now and then'], avoid: ['bad', 'Skip next time'] };
function verdictHTML(v, name, repeats) {
  const [cls] = LV_UI[v.lv];
  return `<div class="fv ${v.lv}" role="status" aria-live="polite"><div class="fv-h"><span class="pill ${cls}">${v.lv === 'good' ? IC.check.replace('<svg', '<svg width="12" height="12"') : IC.alert.replace('<svg', '<svg width="12" height="12"')} ${v.head}</span><span class="muted">${esc(v.sub)}</span></div>
    <p><b>${v.lv === 'avoid' ? 'Why:' : v.lv === 'good' ? 'Why it is good:' : 'The detail:'}</b> ${esc(v.why)}${v.goalLine ? ' ' + esc(v.goalLine) : ''}</p>
    ${v.nut ? `<p><b>What it gives you:</b> ${esc(v.nut)}</p>` : ''}
    ${v.lv === 'avoid' && repeats >= 1 ? `<p class="fv-rep">${IC.alert.replace('<svg', '<svg width="14" height="14"')}You have already logged ${esc(name)} ${repeats === 1 ? 'once' : repeats + ' times'} in the last 2 weeks. Try to make this the last one.</p>` : ''}</div>`;
}

function foodCheckModal(pre = '') {
  const p = S.profile;
  let picked = null, srv = 1;
  const nf = (k, l, s, ph, ph2) => `<div class="field" data-field="${k}"><label for="fc-${k}">${l}</label><div class="input-wrap"><input class="input num" id="fc-${k}" type="number" inputmode="decimal" min="0" step="any" placeholder="${ph}" aria-describedby="fc-help"><span class="suffix">${s}</span></div></div>`;
  openModal({
    title: 'I ate something else', sub: 'Type what you ate. Pulse fills in the macros if it knows the food, and tells you straight whether it helps you.', size: 640,
    body: `<div style="display:grid;gap:14px">
      <div class="field" data-field="name"><label for="fc-name">What did you eat?</label><input class="input" id="fc-name" type="text" maxlength="48" placeholder="e.g. samosa, papaya, aloo paratha" autocomplete="off" value="${esc(pre)}"><span class="hint" id="fc-help">Pick a match below, or type the numbers yourself from the label.</span></div>
      <div class="fc-sug" id="fc-list" role="listbox" aria-label="Matching foods"></div>
      <div class="fc-serv"><span class="flabel">How many portions?</span><div class="stepper"><button type="button" id="fc-less" aria-label="Fewer portions">${IC.minus}</button><span id="fc-s" aria-live="polite">×1</span><button type="button" id="fc-more" aria-label="More portions">${IC.plus}</button></div><span class="muted" id="fc-srv"></span></div>
      <div class="grid-2" id="fc-nums">${nf('kcal', 'Calories', 'kcal', '300')}${nf('p', 'Protein', 'g', '10')}${nf('c', 'Carbs', 'g', '40')}${nf('f', 'Fat', 'g', '10')}${nf('sug', 'Sugar (optional)', 'g', '5')}${nf('fib', 'Fibre (optional)', 'g', '3')}</div>
      <div id="fc-out"></div><span class="error" id="fc-err" hidden></span></div>`,
    actions: [{ label: 'Cancel' }, { label: 'Add to my log', kind: 'btn-primary', fn: api => commit(api) }],
    onOpen(el) {
      const $f = k => $('#fc-' + k, el), vals = () => ({ kcal: $f('kcal').value, p: $f('p').value, c: $f('c').value, f: $f('f').value, sug: $f('sug').value, fib: $f('fib').value });
      const per = () => { const v = vals(); return { kcal: (+v.kcal || 0) * srv, p: (+v.p || 0) * srv, c: (+v.c || 0) * srv, f: (+v.f || 0) * srv, sug: v.sug === '' ? null : +v.sug * srv, fib: v.fib === '' ? null : +v.fib * srv }; };
      const judge = () => {
        const v = vals(), out = $('#fc-out', el);
        if (v.kcal === '' || +v.kcal < 0) { out.innerHTML = ''; return null; }
        const m = per(), extra = picked ? { lv: picked.lv, why: picked.why, nut: picked.own ? (FOOD_NUT[picked.id] || '') : '' } : {};
        // a hand-written note only applies while the numbers are still the food's own; if the athlete changes them, judge the new numbers
        if (picked && !sameNums(v, picked)) { extra.lv = null; extra.why = null; }
        const j = judgeFood(m, p.goal, { lv: extra.lv || undefined, why: extra.why || undefined, nut: extra.nut });
        if (picked && picked.own && !j.nut) j.nut = '';
        out.innerHTML = verdictHTML(j, $('#fc-name', el).value.trim() || 'this', timesEaten($('#fc-name', el).value));
        return j;
      };
      const sameNums = (v, d) => +v.kcal === d.kcal && +v.p === d.p && +v.c === d.c && +v.f === d.f;
      const fill = d => {
        picked = d; $('#fc-name', el).value = d.name;
        $f('kcal').value = d.kcal; $f('p').value = d.p; $f('c').value = d.c; $f('f').value = d.f; $f('sug').value = d.sug == null ? '' : d.sug; $f('fib').value = d.fib == null ? '' : d.fib;
        $('#fc-srv', el).textContent = d.srv ? 'One portion = ' + d.srv : ''; $("#fc-list", el).innerHTML = ''; judge();
      };
      const suggest = () => {
        const q = $('#fc-name', el).value, list = lookupFoods(q), box = $("#fc-list", el);
        const j = q.trim().length > 2 ? junkCheck(q) : null;
        const extra = j && !list.some(x => x.lv === 'avoid') && JUNK_DEFAULT[j.k] ? [Object.assign({ name: cap(q.trim()), lv: 'avoid', why: j.why + ' ' + j.fx, names: [] }, JUNK_DEFAULT[j.k])] : [];
        box.innerHTML = [...list, ...extra].map((d, i) => `<button type="button" class="fc-opt" data-i="${i}" role="option"><span><b>${esc(d.name)}</b><span>${esc(d.srv)} · ${fmtN(d.kcal)} kcal · P ${fmt1(d.p)} · C ${fmt1(d.c)} · F ${fmt1(d.f)}</span></span><span class="pill ${LV_UI[d.lv][0]}">${d.lv === 'good' ? 'Good' : d.lv === 'ok' ? 'Okay' : 'Skip'}</span></button>`).join('');
        $$('.fc-opt', box).forEach(b => b.onclick = () => fill([...list, ...extra][+b.dataset.i]));
      };
      $('#fc-name', el).oninput = () => { picked = null; $('#fc-srv', el).textContent = ''; suggest(); judge(); };
      ['kcal', 'p', 'c', 'f', 'sug', 'fib'].forEach(k => $f(k).oninput = () => judge());
      const setSrv = d => { srv = clamp(Math.round((srv + d) * 2) / 2, 0.5, 10); $('#fc-s', el).textContent = '×' + fmt1(srv); judge(); };
      $('#fc-less', el).onclick = () => setSrv(-0.5); $('#fc-more', el).onclick = () => setSrv(0.5);
      if (pre) suggest();
      el._judge = judge; el._per = per; el._vals = vals; el._picked = () => picked; el._srv = () => srv;
    }
  });
  async function commit(api) {
    const el = api.el, er = $('#fc-err', el), name = $('#fc-name', el).value.trim(), v = el._vals();
    const fail = (m, k) => { er.hidden = false; er.innerHTML = IC.alert + m; const f = k && $('#fc-' + k, el); f && f.focus(); return false; };
    if (!name) return fail('Type what you ate.', 'name');
    if (v.kcal === '' || !(+v.kcal >= 0) || +v.kcal > 4000) return fail('Enter the calories (0 to 4000). A rough guess from the label is fine.', 'kcal');
    for (const [k, l] of [['p', 'Protein'], ['c', 'Carbs'], ['f', 'Fat'], ['sug', 'Sugar'], ['fib', 'Fibre']]) if (v[k] !== '' && !(+v[k] >= 0 && +v[k] <= 500)) return fail(l + ' should be between 0 and 500 g.', k);
    const j = el._judge(), s = el._srv(), ds = UI.fuelDate || today(), arr = S.log.food[ds] || (S.log.food[ds] = []);
    const repeats = timesEaten(name);
    arr.push({ custom: { name: name.slice(0, 48), kcal: +v.kcal || 0, p: +v.p || 0, c: +v.c || 0, f: +v.f || 0, sug: v.sug === '' ? null : +v.sug, fib: v.fib === '' ? null : +v.fib }, s, meal: ds === today() ? mealNow() : 'Other', off: 1, v: j ? j.lv : 'ok', why: j ? j.why : '' });
    save(); UI.foodQ = ''; refresh();
    if (j && j.lv === 'avoid') toast(`<b>${esc(cap(name))} logged.</b> Pulse suggests skipping it next time: ${esc(j.why)}`, { icon: IC.alert, ms: 9000 });
    else if (j && j.lv === 'good') toast(`<b>${esc(cap(name))} logged.</b> ${esc(j.why)}`, { icon: IC.check, ms: 7000 });
    else toast(`<b>${esc(cap(name))} logged.</b> Fine now and then.`, { icon: IC.check });
    checkMilestones();
  }
}

/* a short summary at the top of the log: what was eaten off the plan this week */
function offPlanSummary(ds) {
  const to = ds || today(), from = iso(addDays(parseIso(to), -6)), list = offPlanItems(from, to);
  if (!list.length) return '';
  const avoid = list.filter(x => x.v === 'avoid'), by = {};
  avoid.forEach(x => { const k = normFood(x.custom.name); (by[k] = by[k] || { name: x.custom.name, n: 0 }).n++; });
  const rep = Object.values(by).sort((a, b) => b.n - a.n);
  return `<div class="offsum" role="note"><div><b>Off the plan this week</b><span>${plural(list.length, 'food')} · ${list.filter(x => x.v === 'good').length} good · ${list.filter(x => x.v === 'ok').length} okay · ${avoid.length} to skip</span></div>
    ${rep.length ? `<p>${IC.alert.replace('<svg', '<svg width="14" height="14"')}<span>${rep.slice(0, 3).map(r => `<b>${esc(cap(r.name))}</b>${r.n > 1 ? ' (' + r.n + '×)' : ''}`).join(', ')} ${rep.length === 1 && rep[0].n === 1 ? 'is' : 'are'} worth leaving out next week.</span></p>` : `<p>${IC.check.replace('<svg', '<svg width="14" height="14"')}<span>Nothing you need to cut out. Nice.</span></p>`}</div>`;
}
Object.assign(ACT, { 'off-plan': () => foodCheckModal(UI.foodQ.trim()) });
