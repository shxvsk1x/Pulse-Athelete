/* =========================================================
   PULSE — animated movement demos
   A stick figure moves between a start and an end position. It is drawn in the app, so it works offline and
   is always there when a video cannot load. Each position is a handful of numbers; the limbs are worked out
   with two-bone inverse kinematics, so every frame keeps real body proportions.
   ========================================================= */
const DEMO = (() => {
  const L = { th: 44, sh: 44, to: 46, ua: 28, fa: 28 };
  const G = 186;                       // ground line
  const rad = d => d * Math.PI / 180;
  /* knee or elbow for a two-bone limb from p0 to p1; side = +1 or -1 picks which way it bends */
  function ik(p0, p1, l1, l2, side) {
    let dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy) || 0.001;
    const max = l1 + l2 - 0.01;
    if (d > max) { dx *= max / d; dy *= max / d; d = max; p1 = [p0[0] + dx, p0[1] + dy]; }
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const mx = p0[0] + dx * a / d, my = p0[1] + dy * a / d;
    return { mid: [mx + side * (dy / d) * h, my - side * (dx / d) * h], end: p1 };
  }
  /* a pose: hip [x,y], torso lean in degrees from upright (positive leans right), ankle [x,y] (and ankle2 for a second foot),
     wr = wrist offset from the shoulder, or w = absolute wrist, ks / es = which way the knee and elbow bend, hd = head tilt */
  function solve(P) {
    const hip = P.hip, th = rad(P.torso);
    const sh = [hip[0] + L.to * Math.sin(th), hip[1] - L.to * Math.cos(th)];
    const head = [sh[0] + 15 * Math.sin(th + rad(P.hd || 0)), sh[1] - 15 * Math.cos(th + rad(P.hd || 0))];
    const leg = (a) => ik(hip, a, L.th, L.sh, P.ks == null ? 1 : P.ks);
    const l1 = leg(P.ankle), l2 = P.ankle2 ? leg(P.ankle2) : l1;
    const w = P.w ? P.w : [sh[0] + P.wr[0], sh[1] + P.wr[1]];
    const arm = ik(sh, w, L.ua, L.fa, P.es == null ? -1 : P.es);
    return { hip, sh, head, knee: l1.mid, ank: l1.end, knee2: l2.mid, ank2: l2.end, elb: arm.mid, wri: arm.end, bar: P.bar || null, barR: P.barR || 11 };
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  function mix(A, B, t) {
    const o = {};
    for (const k of Object.keys(A)) {
      const a = A[k], b = B[k] == null ? A[k] : B[k];
      o[k] = Array.isArray(a) ? lerp2(a, b, t) : typeof a === 'number' ? lerp(a, b, t) : a;
    }
    for (const k of Object.keys(B)) if (!(k in o)) o[k] = B[k];
    return o;
  }

  /* ---- positions: [start, end, extras]. x = 120 is the middle of the picture, feet are on the ground at y = 186 ---- */
  const stand = { hip: [118, 98], torso: 0, ankle: [118, G], wr: [3, 54], ks: 1, es: -1 };
  const ANIM = {
    squat: { label: 'Back squat', a: Object.assign({}, stand, { wr: [-6, 6], bar: 'sh' }),
      b: { hip: [96, 140], torso: 38, ankle: [118, G], wr: [-6, 6], ks: 1, es: -1, bar: 'sh' } },
    goblet: { label: 'Goblet squat', a: Object.assign({}, stand, { wr: [12, 22], bar: 'wr', barR: 8 }),
      b: { hip: [98, 142], torso: 24, ankle: [118, G], wr: [12, 22], ks: 1, es: -1, bar: 'wr', barR: 8 } },
    bwsquat: { label: 'Bodyweight squat', a: Object.assign({}, stand, { wr: [30, 4] }),
      b: { hip: [98, 140], torso: 30, ankle: [118, G], wr: [34, 2], ks: 1, es: -1 } },
    hinge: { label: 'Hinge', a: Object.assign({}, stand, { wr: [4, 52], bar: 'wr' }),
      b: { hip: [84, 104], torso: 72, ankle: [118, G], wr: [-4, 52], ks: 1, es: -1, bar: 'wr' } },
    swing: { label: 'Swing', a: { hip: [90, 108], torso: 64, ankle: [116, G], wr: [-4, 40], ks: 1, es: -1, bar: 'wr', barR: 8 },
      b: { hip: [116, 98], torso: 6, ankle: [118, G], wr: [46, 0], ks: 1, es: -1, bar: 'wr', barR: 8 } },
    bench: { label: 'Bench press', props: [{ t: 'rect', x: 66, y: 158, w: 110, h: 8 }, { t: 'line', x1: 76, y1: 166, x2: 76, y2: G, w: 5 }, { t: 'line', x1: 168, y1: 166, x2: 168, y2: G, w: 5 }],
      a: { hip: [84, 152], torso: 90, ankle: [41, G], ks: -1, wr: [0, -56], es: 1, bar: 'wr' },
      b: { hip: [84, 152], torso: 90, ankle: [41, G], ks: -1, wr: [-2, -12], es: 1, bar: 'wr' } },
    pushup: { label: 'Push-up', a: { hip: [114, 147], torso: 66, ankle: [34, G - 3], ks: -1, w: [160, G - 2], es: -1 },
      b: { hip: [121, 171], torso: 82, ankle: [34, G - 3], ks: -1, w: [160, G - 2], es: -1 } },
    ohpress: { label: 'Overhead press', a: Object.assign({}, stand, { wr: [10, -6], bar: 'wr', barR: 9 }), b: Object.assign({}, stand, { wr: [4, -54], bar: 'wr', barR: 9 }) },
    row: { label: 'Row', a: { hip: [86, 104], torso: 66, ankle: [118, G], ks: 1, wr: [-2, 54], es: -1, bar: 'wr', barR: 9 },
      b: { hip: [86, 104], torso: 66, ankle: [118, G], ks: 1, wr: [-30, 22], es: -1, bar: 'wr', barR: 9 } },
    pullup: { label: 'Pull-up', props: [{ t: 'line', x1: 80, y1: 22, x2: 176, y2: 22, w: 6 }],
      a: { hip: [124, 120], torso: 4, ankle: [112, 160], ks: -1, w: [128, 24], es: -1 },
      b: { hip: [124, 84], torso: 10, ankle: [110, 126], ks: -1, w: [128, 24], es: -1 } },
    pulldown: { label: 'Pulldown', props: [{ t: 'line', x1: 100, y1: 20, x2: 156, y2: 20, w: 6 }, { t: 'rect', x: 84, y: 140, w: 40, h: 8 }],
      a: { hip: [104, 134], torso: -6, ankle: [138, G], ks: 1, w: [132, 28], es: -1 },
      b: { hip: [104, 134], torso: -14, ankle: [138, G], ks: 1, w: [128, 72], es: -1 } },
    lunge: { label: 'Lunge', a: { hip: [112, 98], torso: 0, ankle: [140, G], ankle2: [88, G], ks: 1, wr: [4, 52], es: -1 },
      b: { hip: [112, 142], torso: 4, ankle: [150, G], ankle2: [72, G - 3], ks: 1, wr: [4, 52], es: -1 } },
    stepup: { label: 'Step-up', props: [{ t: 'rect', x: 120, y: 156, w: 60, h: 30 }],
      a: { hip: [106, 112], torso: 8, ankle: [140, 156], ankle2: [96, G], ks: 1, wr: [4, 52], es: -1 },
      b: { hip: [140, 74], torso: 2, ankle: [140, 156], ankle2: [128, 128], ks: 1, wr: [4, 52], es: -1 } },
    legext: { label: 'Leg extension', props: [{ t: 'rect', x: 70, y: 140, w: 52, h: 8 }, { t: 'rect', x: 62, y: 70, w: 8, h: 78 }],
      a: { hip: [92, 134], torso: -6, ankle: [136, 178], ks: 1, wr: [-4, 40], es: -1 }, b: { hip: [92, 134], torso: -6, ankle: [180, 134], ks: 1, wr: [-4, 40], es: -1 } },
    legcurl: { label: 'Leg curl', a: { hip: [118, 98], torso: 0, ankle: [118, G], ankle2: [116, G - 2], ks: 1, wr: [3, 54], es: -1 },
      b: { hip: [118, 98], torso: 0, ankle: [118, G], ankle2: [86, 120], ks: 1, wr: [3, 54], es: -1 } },
    calf: { label: 'Calf raise', a: Object.assign({}, stand, { ankle: [118, G] }), b: Object.assign({}, stand, { hip: [118, 90], ankle: [118, G - 8] }) },
    plank: { label: 'Plank', a: { hip: [114, 147], torso: 66, ankle: [34, G - 3], ks: -1, w: [160, G - 2], es: -1 }, b: { hip: [114, 150], torso: 66, ankle: [34, G - 3], ks: -1, w: [160, G - 2], es: -1 }, hold: true },
    crunch: { label: 'Crunch', a: { hip: [112, 178], torso: 90, ankle: [52, G], ks: -1, wr: [-6, -8], es: 1 },
      b: { hip: [112, 178], torso: 52, ankle: [52, G], ks: -1, wr: [-6, -8], es: 1, hd: -8 } },
    bridge: { label: 'Glute bridge', a: { hip: [112, 178], torso: 90, ankle: [52, G], ks: -1, wr: [-20, 8], es: 1 },
      b: { hip: [122, 146], torso: 128, ankle: [66, G], ks: -1, wr: [-20, 8], es: 1 } },
    carry: { label: 'Carry', a: { hip: [118, 98], torso: 2, ankle: [130, G], ankle2: [106, G - 4], ks: 1, wr: [2, 54], es: -1, bar: 'wr', barR: 8 },
      b: { hip: [118, 98], torso: 2, ankle: [106, G - 4], ankle2: [130, G], ks: 1, wr: [2, 54], es: -1, bar: 'wr', barR: 8 } },
    jump: { label: 'Jump', a: { hip: [100, 136], torso: 34, ankle: [118, G], ks: 1, wr: [-30, 14], es: -1 }, b: { hip: [118, 52], torso: 0, ankle: [118, 126], ks: 1, wr: [14, -46], es: -1 } },
    slam: { label: 'Slam', a: { hip: [118, 98], torso: -4, ankle: [118, G], ks: 1, wr: [10, -54], es: -1, bar: 'wr', barR: 10 }, b: { hip: [104, 120], torso: 42, ankle: [118, G], ks: 1, wr: [26, 50], es: -1, bar: 'wr', barR: 10 } },
    curl: { label: 'Curl', a: Object.assign({}, stand, { wr: [4, 54], bar: 'wr', barR: 6 }), b: Object.assign({}, stand, { wr: [22, -6], bar: 'wr', barR: 6 }) },
    triceps: { label: 'Triceps', a: Object.assign({}, stand, { wr: [26, -2], bar: 'wr', barR: 6 }), b: Object.assign({}, stand, { wr: [6, 54], bar: 'wr', barR: 6 }) },
    run: { label: 'Run', a: { hip: [118, 100], torso: 12, ankle: [150, G - 10], ankle2: [94, G], ks: 1, wr: [30, 6], es: -1 }, b: { hip: [118, 100], torso: 12, ankle: [94, G], ankle2: [150, G - 10], ks: 1, wr: [-30, 12], es: -1 } },
    lateral: { label: 'Lateral lunge', a: { hip: [118, 98], torso: 0, ankle: [90, G], ankle2: [146, G], ks: 1, wr: [20, 10], es: -1 }, b: { hip: [96, 134], torso: 22, ankle: [76, G], ankle2: [160, G], ks: 1, wr: [20, 10], es: -1 } },
    stretch: { label: 'Stretch', a: { hip: [112, 150], torso: 2, ankle: [158, G], ankle2: [50, G - 6], ks: 1, wr: [30, 20], es: -1 }, b: { hip: [118, 140], torso: -8, ankle: [158, G], ankle2: [50, G - 6], ks: 1, wr: [-12, -52], es: -1 } }
  };
  const PAT = { squat: 'squat', hinge: 'hinge', pushH: 'bench', pushV: 'ohpress', pullH: 'row', pullV: 'pullup', single: 'lunge', legiso: 'legext', core: 'crunch', carry: 'carry', power: 'jump', arms: 'curl' };
  /* pick the picture for an exercise from its movement pattern, then refine from its name */
  function keyFor(name, pat) {
    const n = String(name || '').toLowerCase();
    const has = re => re.test(n);
    if (has(/bridge|hip thrust/)) return 'bridge';
    if (has(/couch stretch|open book|greatest stretch|90\/90|stretch|mobility|cat|thoracic/)) return 'stretch';
    if (has(/sprint|run|jog|skip|shuffle|bike|rower|row machine/) && !has(/row\b.*(cable|barbell|dumbbell)/)) return has(/shuffle/) ? 'lateral' : 'run';
    if (has(/swing|clean|snatch/)) return 'swing';
    if (has(/slam|chest pass|throw/)) return 'slam';
    if (has(/lateral lunge|side lunge|cossack/)) return 'lateral';
    if (has(/calf|heel raise|tibialis/)) return 'calf';
    if (has(/step-up|step up/)) return 'stepup';
    if (has(/push-up|pushup|press-up|burpee/)) return 'pushup';
    if (has(/plank|hold|bird dog|dead bug|hollow|bear crawl|pallof|carry.*bear|wall sit|l-sit|farmer/) && !has(/carry\b/)) return 'plank';
    if (has(/pulldown|pull-down|pull down|lat /)) return 'pulldown';
    if (has(/goblet/)) return 'goblet';
    if (has(/bodyweight squat|tempo|box squat|air squat|sissy|wall sit/)) return 'bwsquat';
    if (has(/leg curl|nordic|hamstring curl|ball hamstring/)) return 'legcurl';
    if (has(/leg extension|knee extension/)) return 'legext';
    if (has(/tricep|pushdown|skull|kickback|dip|close-grip/)) return 'triceps';
    if (pat === 'carry') return 'carry';
    return PAT[pat] || 'squat';
  }
  function frame(A, B, t) { return solve(mix(A, B, t)); }
  /* the picture, as SVG markup, for one frame */
  function svgFrame(key, t, uid) {
    const D = ANIM[key] || ANIM.squat, f = frame(D.a, D.b, t), p = pt => pt[0].toFixed(1) + ',' + pt[1].toFixed(1);
    const line = (a, b, cls) => `<line class="${cls}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;
    const props = (D.props || []).map(q => q.t === 'rect' ? `<rect class="dm-prop" x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" rx="3"/>` : `<line class="dm-prop" x1="${q.x1}" y1="${q.y1}" x2="${q.x2}" y2="${q.y2}" stroke-width="${q.w || 5}"/>`).join('');
    const foot = (k, a) => line(k, a, 'dm-limb');
    let bar = '';
    if (f.bar) { const c = f.bar === 'sh' ? [f.sh[0] - 6, f.sh[1] - 2] : f.wri; bar = `<circle class="dm-bar" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${f.barR}"/><circle class="dm-bar-in" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="2.2"/>`; }
    return `<line class="dm-ground" x1="8" y1="${G + 4}" x2="232" y2="${G + 4}"/>${props}
      <g class="dm-far">${line(f.hip, f.knee2, 'dm-limb')}${line(f.knee2, f.ank2, 'dm-limb')}${line(f.ank2, [f.ank2[0] + 9, f.ank2[1]], 'dm-limb')}</g>
      ${line(f.hip, f.knee, 'dm-limb')}${line(f.knee, f.ank, 'dm-limb')}${line(f.ank, [f.ank[0] + 9, f.ank[1]], 'dm-limb')}
      ${line(f.hip, f.sh, 'dm-torso')}<circle class="dm-head" cx="${f.head[0].toFixed(1)}" cy="${f.head[1].toFixed(1)}" r="9"/>
      ${line(f.sh, f.elb, 'dm-limb')}${line(f.elb, f.wri, 'dm-limb')}${bar}`;
  }
  const svgWrap = (inner, label, cls = '') => `<svg class="dm-svg ${cls}" viewBox="0 -24 240 224" role="img" aria-label="${label}">${inner}</svg>`;
  const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  /* a player: animates between start and end, with a pause button; reduced-motion users get the two end positions side by side */
  function player(el, name, pat, steps) {
    const key = keyFor(name, pat), D = ANIM[key] || ANIM.squat;
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const desc = `Animated stick figure showing ${name}. ${steps && steps[0] ? steps[0] : ''}`;
    if (reduce) {
      el.innerHTML = `<div class="dm-pair"><figure>${svgWrap(svgFrame(key, 0), 'Start position of ' + name)}<figcaption>Start</figcaption></figure><figure>${svgWrap(svgFrame(key, 1), 'End position of ' + name)}<figcaption>${D.hold ? 'Hold' : 'End'}</figcaption></figure></div>`;
      return { stop() {} };
    }
    el.innerHTML = `<div class="dm-stage">${svgWrap('', desc, 'dm-live')}<div class="dm-cap"><span id="dm-phase">Start</span><button type="button" class="btn btn-quiet btn-sm" id="dm-toggle" aria-pressed="false">Pause</button></div></div>`;
    const svgEl = el.querySelector('.dm-live'), ph = el.querySelector('#dm-phase'), tg = el.querySelector('#dm-toggle');
    let raf = 0, paused = false, t0 = performance.now(), off = 0;
    const CYC = D.hold ? 2600 : 3400;
    const draw = tm => { svgEl.innerHTML = svgFrame(key, tm); };
    const loop = now => {
      const c = ((now - t0 + off) % CYC) / CYC;           // 0..1 across a full cycle
      let tm, label;
      if (D.hold) { tm = (Math.sin(c * Math.PI * 2 - Math.PI / 2) + 1) / 2 * 0.25; label = 'Hold steady and breathe'; }
      else if (c < 0.14) { tm = 0; label = 'Start'; }
      else if (c < 0.5) { tm = ease((c - 0.14) / 0.36); label = 'Move'; }
      else if (c < 0.64) { tm = 1; label = 'Finish position'; }
      else { tm = 1 - ease((c - 0.64) / 0.36); label = 'Return'; }
      draw(tm); if (ph.textContent !== label) ph.textContent = label;
      raf = requestAnimationFrame(loop);
    };
    tg.onclick = () => {
      paused = !paused; tg.setAttribute('aria-pressed', paused); tg.textContent = paused ? 'Play' : 'Pause';
      if (paused) { cancelAnimationFrame(raf); off += performance.now() - t0; } else { t0 = performance.now(); raf = requestAnimationFrame(loop); }
    };
    draw(0); raf = requestAnimationFrame(loop);
    return { stop() { cancelAnimationFrame(raf); } };
  }
  return { player, keyFor, svgFrame, svgWrap, ANIM };
})();
