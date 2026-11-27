/* =========================================================
   PULSE — form guide: tap any exercise to watch the movement
   and read short steps underneath
   ========================================================= */
Object.assign(FORM, {
  'World’s greatest stretch': { v: 'kk8RnOLzngc', s: ['Step into a long lunge and put both hands on the floor inside your front foot.', 'Drop your inside elbow towards the floor, then rotate that arm up to the ceiling.', 'Return the hand, straighten the front leg to stretch the hamstring, then switch sides.'], x: 'Letting your back knee carry all your weight; keep the back leg active.' },
  'Acceleration sprints, walk back': { s: ['Start in a staggered stance with your front foot just behind the line.', 'Lean forward from the ankles and drive your arms hard for the first five steps, staying low.', 'Run tall through the finish, then walk back slowly so the next sprint is fresh.'], x: 'Standing up straight in the first few steps, which kills your acceleration.', a: 'run' },
  'Flying 10s': { s: ['Jog for about 20 m to build up speed.', 'When you cross the first cone, run as fast as you can for 10 m, tall and relaxed.', 'Slow down gradually and walk back before the next one.'], x: 'Tensing your face and shoulders. Fast running looks relaxed.', a: 'run' },
  'Run, bike or skip: 1 min hard, 1 min easy': { s: ['Warm up for 3 minutes at an easy pace.', 'Go hard for 1 minute, an effort you could not hold for 3.', 'Drop to an easy pace for 1 minute, then repeat 5 times.'], x: 'Starting the first interval too fast, which leaves nothing for the last ones.', a: 'run' },
  'EMOM: 10 squat jumps or swings + 5 push-ups': { s: ['Set a timer for 8 minutes. At the start of every minute, do 10 squat jumps or kettlebell swings, then 5 push-ups.', 'Rest for whatever is left of that minute.', 'If you run out of rest, drop the reps a little. Keep every rep clean.'], x: 'Letting your form fall apart when you get tired.', a: 'jump' },
  'One extra set of 3 on your first lift': { s: ['After your normal sets, add one more heavy set of 3 reps.', 'Choose a weight that leaves one or two reps in the tank (RPE 8.5).', 'Rest 3 minutes before it and keep the technique identical to your other sets.'], x: 'Adding weight so heavy that your form changes.', a: 'squat' },
  'Glute bridge': { v: 'Q_Bpj91Yiis', s: ['Lie on your back, knees bent, feet flat and hip-width.', 'Squeeze your glutes and lift your hips until your body is straight from knees to shoulders.', 'Pause for a second, then lower slowly.'], x: 'Arching your lower back instead of squeezing your glutes.' }
});

const formOf = n => FORM[n] || null;
const hasVideo = n => { const f = formOf(n); return !!(f && f.v && !BAD_VIDEOS.has(f.v)); };
/* videos that failed to load on this device: remembered for the visit so thumbnails and players do not keep retrying */
const BAD_VIDEOS = new Set();
/* warm-up lines like "Glute bridge + band pull-apart": link every part that has a guide */
const formLinks = txt => txt.split(' + ').map(part => { const k = Object.keys(FORM).find(n => n.toLowerCase() === part.toLowerCase()); return k ? formName(k, part) : esc(part); }).join(' + ');
const ytThumb = id => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
const FIGURE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13" cy="4.5" r="2"/><path d="M13 7.5 11 13l-3.5 2M11 13l3.5 2.5L14 20M13 7.5l3 3 3 .5M13 7.5l-3 2-3-.5"/></svg>';

/* small thumbnail button used in exercise rows. A guide with no video (or a dead one) still gets a button: the animated demo. */
function formThumb(n, cls = '') {
  const f = formOf(n); if (!f) return '';
  const vid = hasVideo(n);
  return `<button type="button" class="vthumb ${cls}" data-act="form" data-n="${esc(n)}" aria-label="${vid ? 'Watch how to do ' : 'See how to do '}${esc(n)}">${vid ? `<img src="${ytThumb(f.v)}" alt="" loading="lazy" data-vid="${f.v}" onerror="BAD_VIDEOS.add(this.dataset.vid);this.remove()"><span class="vplay">${PLAY}</span>` : `<span class="vfig">${FIGURE}</span>`}</button>`;
}
/* a plain exercise name that opens its guide when tapped */
function formName(n, label) {
  return formOf(n) ? `<button type="button" class="fname" data-act="form" data-n="${esc(n)}">${esc(label || n)}<span class="fname-ic">${PLAY}</span></button>` : esc(label || n);
}

/* ---------- the YouTube player, with automatic fallbacks ---------- */
let YT_READY = null;
function loadYT() {
  if (YT_READY) return YT_READY;
  YT_READY = new Promise((ok, no) => {
    if (window.YT && window.YT.Player) return ok(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { try { prev && prev(); } catch (e) {} ok(window.YT); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.async = true;
    s.onerror = () => { YT_READY = null; no(new Error('blocked')); };
    document.head.appendChild(s);
    setTimeout(() => { if (!(window.YT && window.YT.Player)) { YT_READY = null; no(new Error('timeout')); } }, 9000);
  });
  return YT_READY;
}

/* ---- is this video still there? Asks YouTube's public oEmbed endpoint. Network or CORS trouble counts as "unknown", never as broken. ---- */
const VID_STATE = {};   // id -> 'ok' | 'gone' | 'blocked' | 'unknown'
async function checkVideo(id) {
  if (!id) return 'unknown';
  if (VID_STATE[id]) return VID_STATE[id];
  const ctl = typeof AbortController === 'function' ? new AbortController() : null, to = setTimeout(() => ctl && ctl.abort(), 6000);
  try {
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id), ctl ? { signal: ctl.signal } : {});
    VID_STATE[id] = r.ok ? 'ok' : r.status === 404 ? 'gone' : (r.status === 401 || r.status === 403) ? 'blocked' : 'unknown';
  } catch (e) { VID_STATE[id] = 'unknown'; }
  clearTimeout(to);
  if (VID_STATE[id] === 'unknown') delete VID_STATE[id];   // try again next time
  return VID_STATE[id] || 'unknown';
}
/* #/videocheck: lists every exercise video and whether it is still playable */
function showVideoCheck() {
  const rows = Object.entries(FORM).filter(([, f]) => f.v).map(([n, f]) => ({ n, v: f.v }));
  setScreen('videocheck', `<main class="wrap" style="max-width:860px;margin:0 auto;padding:32px 16px"><a class="btn btn-quiet btn-sm" href="#/today">${IC.back}Back</a>
    <h1 style="margin:16px 0 6px">Video check</h1><p class="muted">Checks each exercise video against YouTube from this browser. Videos marked Gone or Blocked drop to the animated demo automatically. Send the list to fix them.</p>
    <p id="vc-sum" role="status" aria-live="polite" style="margin:14px 0;font-weight:600">Checking 0 of ${rows.length}…</p>
    <ul id="vc-list" class="supp-list">${rows.map((r, i) => `<li id="vc-${i}"><div style="min-width:0"><div class="nm">${esc(r.n)}</div><div class="mac">${esc(r.v)}</div></div><span class="pill">Waiting</span></li>`).join('')}</ul></main>`);
  let done = 0, ok = 0, bad = 0, unk = 0, i = 0;
  const lab = { ok: ['good', 'Works'], gone: ['bad', 'Gone'], blocked: ['warn', 'Blocked embed'], unknown: ['', 'Could not tell'] };
  const worker = async () => {
    while (i < rows.length && UI.screen === 'videocheck') {
      const k = i++, st = await checkVideo(rows[k].v), li = document.getElementById('vc-' + k); done++;
      if (st === 'ok') ok++; else if (st === 'unknown') unk++; else bad++;
      if (li) li.querySelector('.pill').outerHTML = `<span class="pill ${lab[st][0]}">${lab[st][1]}</span>`;
      const sm = document.getElementById('vc-sum'); if (sm) sm.textContent = done < rows.length ? `Checking ${done} of ${rows.length}…` : `${ok} work, ${bad} need replacing, ${unk} could not be checked.`;
    }
  };
  Promise.all([worker(), worker(), worker(), worker()]);
}
const YT_ERR = { 2: 'This video link is not valid.', 5: 'This video cannot play in your browser.', 100: 'This video has been removed.', 101: 'The owner does not allow this video to be shown inside other apps.', 150: 'The owner does not allow this video to be shown inside other apps.' };

function formModal(n) {
  const f = formOf(n); if (!f) return;
  const ex = EX.find(e => e.n === n);
  const q = n.replace(/\(.*?\)/g, '').trim();
  const search = 'https://www.youtube.com/results?search_query=' + encodeURIComponent('how to ' + q + ' proper form');
  const search2 = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q + ' exercise tutorial');
  const pat = ex ? ex.p : '';
  const vid = !!f.v && !BAD_VIDEOS.has(f.v);
  let tab = vid ? 'video' : 'demo', player = null, demo = null, gone = false, timer = 0;
  openModal({
    title: esc(n), sub: ex ? `${{ squat: 'Squat pattern', hinge: 'Hinge pattern', pushH: 'Horizontal push', pushV: 'Vertical push', pullH: 'Horizontal pull', pullV: 'Vertical pull', single: 'Single-leg', legiso: 'Leg isolation', core: 'Core', carry: 'Carry', power: 'Power', arms: 'Arms' }[ex.p] || ''} · ${['', 'Beginner-friendly', 'Some experience', 'Advanced'][ex.lvl]}` : 'Prep and mobility', size: 720,
    body: `<div class="seg sm full fseg" role="tablist" aria-label="How to see this exercise">${vid ? `<button type="button" role="tab" data-ft="video" aria-selected="${tab === 'video'}">Video</button>` : ''}<button type="button" role="tab" data-ft="demo" aria-selected="${tab === 'demo'}">Animated demo</button><button type="button" role="tab" data-ft="steps" aria-selected="false">Steps only</button></div>
      <div id="fnote" class="fnote" role="status" aria-live="polite" hidden></div>
      <div class="fpane" id="fp-video" ${tab === 'video' ? '' : 'hidden'}><div class="fvid" id="fvid"><button type="button" class="fvid-poster" id="fvid-go" aria-label="Play video of ${esc(n)}"><img src="https://i.ytimg.com/vi/${f.v || ''}/hqdefault.jpg" alt="" onerror="this.remove()"><span class="vplay lg">${PLAY}</span><span class="fvid-tag">Tap to play · captions on</span></button></div></div>
      <div class="fpane" id="fp-demo" ${tab === 'demo' ? '' : 'hidden'}><div class="fdemo" id="fdemo"></div><p class="muted fdemo-note">A simple animation of the movement, drawn in the app. It works without internet.</p></div>
      <div class="fsteps">
        <h4>How to do it</h4>
        <ol>${f.s.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
        <p class="favoid">${IC.alert}<span><b>Avoid:</b> ${esc(f.x)}</span></p>
        ${ex && ex.cue ? `<p class="fcue">${IC.target}<span><b>Key cue:</b> ${esc(ex.cue)}</span></p>` : ''}
        <div class="flinks">${vid ? `<a href="https://www.youtube.com/watch?v=${f.v}" target="_blank" rel="noopener">${IC.external}Watch on YouTube</a>` : ''}<a href="${search}" target="_blank" rel="noopener">${IC.search}Find another video</a><a href="${search2}" target="_blank" rel="noopener">${IC.search}Another search</a></div>
        <p class="muted" style="font-size:12px;margin-top:10px">Videos are from independent coaches on YouTube. Start light, and stop if anything hurts.</p>
      </div>`,
    onClose() { gone = true; clearTimeout(timer); demo && demo.stop(); try { player && player.destroy && player.destroy(); } catch (e) {} },
    onOpen(el) {
      const note = $('#fnote', el);
      const say = (msg, kind) => { note.hidden = !msg; note.className = 'fnote ' + (kind || ''); note.innerHTML = msg ? IC.alert + '<span>' + msg + '</span>' : ''; };
      const show = t => {
        tab = t;
        $$('[data-ft]', el).forEach(b => b.setAttribute('aria-selected', b.dataset.ft === t));
        $('#fp-video', el).hidden = t !== 'video'; $('#fp-demo', el).hidden = t !== 'demo';
        $('.fsteps', el).classList.toggle('only', t === 'steps');
        if (t === 'demo' && !demo) demo = DEMO.player($('#fdemo', el), n, f.a || pat, f.s);
        if (t === 'steps' && demo) { demo.stop(); demo = null; }
        if (t === 'video' && demo) { demo.stop(); demo = null; }
      };
      /* any problem with the video: remember it, say why, and move to the animation */
      const fail = why => {
        if (gone) return; clearTimeout(timer);
        if (f.v) BAD_VIDEOS.add(f.v);
        try { player && player.destroy && player.destroy(); } catch (e) {} player = null;
        const b = $('[data-ft="video"]', el); if (b) b.remove();
        $('#fvid', el) && ($('#fvid', el).innerHTML = '');
        say(esc(why) + ' Showing the animated demo and steps instead. You can also try the search links below.', 'warn');
        show('demo');
      };
      $$('[data-ft]', el).forEach(b => b.onclick = () => show(b.dataset.ft));
      show(tab);
      if (!vid) return;
      if (navigator.onLine === false) { fail('You are offline, so the video cannot load.'); return; }
      checkVideo(f.v).then(st => { if (gone) return; if (st === 'gone') fail('This video has been removed.'); else if (st === 'blocked') fail('The owner does not allow this video to be shown inside other apps.'); });
      $('#fvid-go', el).onclick = async () => {
        const box = $('#fvid', el);
        box.innerHTML = `<div class="fvid-load"><span class="spin lg"></span><span>Loading video…</span></div>`;
        timer = setTimeout(() => fail('The video is taking too long to load. It may be blocked on this network.'), 12000);
        try {
          const YTm = await loadYT(); if (gone) return;
          box.innerHTML = '<div id="yt-slot"></div>';
          player = new YTm.Player('yt-slot', {
            videoId: f.v, width: '100%', height: '100%',
            playerVars: { rel: 0, modestbranding: 1, playsinline: 1, autoplay: 1, cc_load_policy: 1, hl: 'en', cc_lang_pref: 'en', iv_load_policy: 3, origin: location.origin.startsWith('http') ? location.origin : undefined },
            host: 'https://www.youtube-nocookie.com',
            events: {
              onReady: () => { clearTimeout(timer); try { player.playVideo(); } catch (e) {} const fr = box.querySelector('iframe'); if (fr) fr.setAttribute('title', n + ' form video'); },
              onStateChange: e => { if (e.data === 1 || e.data === 3) clearTimeout(timer); },
              onError: e => fail(YT_ERR[e.data] || 'This video could not be played.')
            }
          });
        } catch (e) { fail('The video player could not be reached. YouTube may be blocked on this network.'); }
      };
    }
  });
}

Object.assign(ACT, { form: el => formModal(el.dataset.n) });
