/* =========================================================
   PULSE — form guide: tap any exercise to watch the movement
   and read short steps underneath
   ========================================================= */
Object.assign(FORM, {
  'World’s greatest stretch': { v: 'kk8RnOLzngc', s: ['Step into a long lunge and put both hands on the floor inside your front foot.', 'Drop your inside elbow towards the floor, then rotate that arm up to the ceiling.', 'Return the hand, straighten the front leg to stretch the hamstring, then switch sides.'], x: 'Letting your back knee carry all your weight; keep the back leg active.' },
  'Glute bridge': { v: 'Q_Bpj91Yiis', s: ['Lie on your back, knees bent, feet flat and hip-width.', 'Squeeze your glutes and lift your hips until your body is straight from knees to shoulders.', 'Pause for a second, then lower slowly.'], x: 'Arching your lower back instead of squeezing your glutes.' }
});
const formOf = n => FORM[n] || null;
/* warm-up lines like "Glute bridge + band pull-apart": link every part that has a guide */
const formLinks = txt => txt.split(' + ').map(part => { const k = Object.keys(FORM).find(n => n.toLowerCase() === part.toLowerCase()); return k ? formName(k, part) : esc(part); }).join(' + ');
const ytThumb = id => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';

/* small thumbnail button used in exercise rows */
function formThumb(n, cls = '') {
  const f = formOf(n); if (!f) return '';
  return `<button type="button" class="vthumb ${cls}" data-act="form" data-n="${esc(n)}" aria-label="Watch how to do ${esc(n)}"><img src="${ytThumb(f.v)}" alt="" loading="lazy" onerror="this.remove()"><span class="vplay">${PLAY}</span></button>`;
}
/* a plain exercise name that opens its guide when tapped */
function formName(n, label) {
  return formOf(n) ? `<button type="button" class="fname" data-act="form" data-n="${esc(n)}">${esc(label || n)}<span class="fname-ic">${PLAY}</span></button>` : esc(label || n);
}

function formModal(n) {
  const f = formOf(n); if (!f) return;
  const ex = EX.find(e => e.n === n);
  const search = 'https://www.youtube.com/results?search_query=' + encodeURIComponent('how to ' + n.replace(/\(.*?\)/g, '') + ' proper form');
  openModal({
    title: esc(n), sub: ex ? `${{ squat: 'Squat pattern', hinge: 'Hinge pattern', pushH: 'Horizontal push', pushV: 'Vertical push', pullH: 'Horizontal pull', pullV: 'Vertical pull', single: 'Single-leg', legiso: 'Leg isolation', core: 'Core', carry: 'Carry', power: 'Power', arms: 'Arms' }[ex.p] || ''} · ${['', 'Beginner-friendly', 'Some experience', 'Advanced'][ex.lvl]}` : 'Prep and mobility', size: 720,
    body: `<div class="fvid" id="fvid"><button type="button" class="fvid-poster" id="fvid-go" aria-label="Play video"><img src="https://i.ytimg.com/vi/${f.v}/hqdefault.jpg" alt="" onerror="this.remove()"><span class="vplay lg">${PLAY}</span><span class="fvid-tag">Tap to play</span></button></div>
      <div class="fsteps">
        <h4>How to do it</h4>
        <ol>${f.s.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
        <p class="favoid">${IC.alert}<span><b>Avoid:</b> ${esc(f.x)}</span></p>
        ${ex && ex.cue ? `<p class="fcue">${IC.target}<span><b>Key cue:</b> ${esc(ex.cue)}</span></p>` : ''}
        <div class="flinks"><a href="https://www.youtube.com/watch?v=${f.v}" target="_blank" rel="noopener">${IC.external}Watch on YouTube</a><a href="${search}" target="_blank" rel="noopener">${IC.search}Find another video</a></div>
        <p class="muted" style="font-size:12px;margin-top:10px">Videos are from independent coaches on YouTube. Start light, and stop if anything hurts.</p>
      </div>`,
    onOpen(el) {
      // the video loads only when played, so opening the guide stays fast and works offline
      const go = () => {
        $('#fvid', el).innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${f.v}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="${esc(n)} form video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        if (!navigator.onLine) $('#fvid', el).insertAdjacentHTML('beforeend', `<div class="fvid-off">${IC.alert}You are offline. The steps below still work.</div>`);
      };
      $('#fvid-go', el).onclick = go;
    }
  });
}

Object.assign(ACT, { form: el => formModal(el.dataset.n) });
