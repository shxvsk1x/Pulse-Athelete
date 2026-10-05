/* =========================================================
   PULSE — accounts and sync
   One API, two backends:
   · firebase: real accounts, data in Firestore, coaches on their own devices
   · local:    demo mode when no Firebase config is set; same features, one browser
   ========================================================= */
const Cloud = (() => {
  const cfg = window.PULSE_CONFIG || {};
  const mode = cfg.firebase && cfg.firebase.apiKey ? 'firebase' : 'local';
  let me = null;               // signed-in user's profile
  let fb = null;               // { auth, db } in firebase mode
  const SDK = '10.14.1';

  const schoolName = id => ((cfg.schools || []).find(s => s.id === id) || {}).name || id || '';
  const err = msg => { const e = new Error(msg); e.friendly = true; return e; };
  const lsGet = k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const lsDel = k => { try { localStorage.removeItem(k); } catch (e) {} };
  const cleanEmail = e => String(e || '').trim().toLowerCase();
  const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  async function sha(s) {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
      return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return 'x' + h;
  }

  /* ---------------- LOCAL (demo) backend ---------------- */
  const L = {
    db() { return lsGet('pulse.cloud') || { users: {}, progress: {}, notes: {}, reviews: {} }; },
    put(db) { if (!lsSet('pulse.cloud', db)) throw err('This browser is out of storage space.'); },
    async init() { const uid = lsGet('pulse.cloud.session'); const u = uid && L.db().users[uid]; me = u ? L.pub(u) : null; },
    pub(u) { const { hash, ...rest } = u; return rest; },
    async signUp(d) {
      const db = L.db(), email = cleanEmail(d.email);
      if (Object.values(db.users).some(u => u.email === email)) throw err('An account with this email already exists. Log in instead.');
      if (d.role === 'coach' && String(d.coachCode || '').trim().toUpperCase() !== String(cfg.demoCoachCode || '').toUpperCase()) throw err('That coach access code is not right. Ask your school’s Pulse admin for it.');
      const uid = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const u = { uid, email, name: d.name, role: d.role, school: d.school || '', schoolName: schoolName(d.school), grade: d.grade || '', sports: d.sports || [], createdAt: Date.now(), hash: await sha(email + '|' + d.password) };
      db.users[uid] = u; L.put(db); lsSet('pulse.cloud.session', uid); me = L.pub(u); return me;
    },
    async signIn(email, password) {
      email = cleanEmail(email);
      const db = L.db(), u = Object.values(db.users).find(x => x.email === email);
      if (!u || u.hash !== await sha(email + '|' + password)) throw err('That email and password do not match an account on this device.');
      lsSet('pulse.cloud.session', u.uid); me = L.pub(u); return me;
    },
    async signOut() { lsDel('pulse.cloud.session'); me = null; },
    async resetPassword() { throw err('Password reset needs the online version of Pulse. In demo mode, make a new account instead.'); },
    async updateProfile(f) { const db = L.db(), u = db.users[me.uid]; Object.assign(u, f, f.school !== undefined ? { schoolName: schoolName(f.school) } : {}); L.put(db); me = L.pub(u); return me; },
    async loadState() { return lsGet('pulse.cloud.state.' + me.uid); },
    async saveState(st) { if (!lsSet('pulse.cloud.state.' + me.uid, st)) throw err('Could not save. Storage may be full.'); },
    async publishProgress(docs) {
      const db = L.db();
      for (const k of Object.keys(db.progress)) if (db.progress[k].uid === me.uid) delete db.progress[k];
      docs.forEach(d => db.progress[me.uid + '_' + d.sport] = Object.assign({}, d, { uid: me.uid }));
      L.put(db);
    },
    async coachRoster() {
      const db = L.db();
      return Object.values(db.progress).filter(p => p.school === me.school && (me.sports || []).includes(p.sport));
    },
    async putNote(id, d) { const db = L.db(); db.notes[id] = Object.assign({}, d, { uid: me.uid }); L.put(db); },
    async getNote(id) { return L.db().notes[id] || null; },
    async putReview(id, d) { const db = L.db(); db.reviews[id] = Object.assign({}, d, { by: me.uid, byName: me.name, at: Date.now() }); L.put(db); },
    async getReview(id) { return L.db().reviews[id] || null; },
    async myReviews() { const out = {}; Object.entries(L.db().reviews).forEach(([k, r]) => { if (r.uid === me.uid) out[k] = r; }); return out; }
  };

  /* ---------------- FIREBASE backend ---------------- */
  const loadScript = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(err('Could not reach the Pulse servers. Check your connection.')); document.head.appendChild(s); });
  const FBERR = {
    'auth/email-already-in-use': 'An account with this email already exists. Log in instead.',
    'auth/invalid-email': 'That email address does not look right.',
    'auth/weak-password': 'Use at least 6 characters for your password.',
    'auth/invalid-credential': 'That email and password do not match.',
    'auth/invalid-login-credentials': 'That email and password do not match.',
    'auth/wrong-password': 'That email and password do not match.',
    'auth/user-not-found': 'There is no account with that email.',
    'auth/too-many-requests': 'Too many tries. Wait a minute and try again.',
    'auth/network-request-failed': 'No connection. Check your internet and try again.',
    'permission-denied': 'Pulse was not allowed to do that.'
  };
  const fbErr = e => e && e.friendly ? e : err(FBERR[e && e.code] || (e && e.message) || 'Something went wrong.');
  const F = {
    async init() {
      await loadScript(`https://www.gstatic.com/firebasejs/${SDK}/firebase-app-compat.js`);
      await Promise.all([loadScript(`https://www.gstatic.com/firebasejs/${SDK}/firebase-auth-compat.js`), loadScript(`https://www.gstatic.com/firebasejs/${SDK}/firebase-firestore-compat.js`)]);
      firebase.initializeApp(cfg.firebase);
      fb = { auth: firebase.auth(), db: firebase.firestore() };
      const user = await new Promise(ok => { const off = fb.auth.onAuthStateChanged(u => { off(); ok(u); }); });
      me = user ? await F.profile(user) : null;
    },
    async profile(user) {
      const snap = await fb.db.doc('users/' + user.uid).get();
      if (!snap.exists) return null;
      const d = snap.data(); delete d.coachCode;
      return Object.assign({ uid: user.uid, email: user.email }, d);
    },
    async signUp(d) {
      let cred;
      try { cred = await fb.auth.createUserWithEmailAndPassword(cleanEmail(d.email), d.password); } catch (e) { throw fbErr(e); }
      const doc = { name: d.name, email: cleanEmail(d.email), role: d.role, school: d.school || '', schoolName: schoolName(d.school), grade: d.grade || '', sports: d.sports || [], createdAt: Date.now() };
      if (d.role === 'coach') doc.coachCode = String(d.coachCode || '').trim();
      try { await fb.db.doc('users/' + cred.user.uid).set(doc); }
      catch (e) {
        try { await cred.user.delete(); } catch (x) {}
        if (d.role === 'coach') throw err('That coach access code is not right for this school. Ask your school’s Pulse admin for it.');
        throw fbErr(e);
      }
      delete doc.coachCode; me = Object.assign({ uid: cred.user.uid }, doc); return me;
    },
    async signIn(email, password) {
      try { const c = await fb.auth.signInWithEmailAndPassword(cleanEmail(email), password); me = await F.profile(c.user); }
      catch (e) { throw fbErr(e); }
      if (!me) { await fb.auth.signOut(); throw err('This account was not set up properly. Make a new one.'); }
      return me;
    },
    async signOut() { await fb.auth.signOut(); me = null; },
    async resetPassword(email) { try { await fb.auth.sendPasswordResetEmail(cleanEmail(email)); } catch (e) { throw fbErr(e); } },
    async updateProfile(f) { const up = Object.assign({}, f); if (f.school !== undefined) up.schoolName = schoolName(f.school); try { await fb.db.doc('users/' + me.uid).update(up); } catch (e) { throw fbErr(e); } Object.assign(me, up); return me; },
    async loadState() { const s = await fb.db.doc('states/' + me.uid).get(); return s.exists ? JSON.parse(s.data().json) : null; },
    async saveState(st) { try { await fb.db.doc('states/' + me.uid).set({ json: JSON.stringify(st), updatedAt: Date.now() }); } catch (e) { throw fbErr(e); } },
    async publishProgress(docs) {
      const col = fb.db.collection('progress');
      const old = await col.where('uid', '==', me.uid).get();
      const keep = new Set(docs.map(d => me.uid + '_' + d.sport));
      const batch = fb.db.batch();
      old.forEach(doc => { if (!keep.has(doc.id)) batch.delete(doc.ref); });
      docs.forEach(d => batch.set(col.doc(me.uid + '_' + d.sport), Object.assign({}, d, { uid: me.uid })));
      await batch.commit();
    },
    async coachRoster() {
      const out = [];
      for (const sp of me.sports || []) {
        const q = await fb.db.collection('progress').where('school', '==', me.school).where('sport', '==', sp).get();
        q.forEach(d => out.push(d.data()));
      }
      return out;
    },
    async putNote(id, d) { try { await fb.db.doc('notes/' + id).set(Object.assign({}, d, { uid: me.uid })); } catch (e) { throw fbErr(e); } },
    async getNote(id) { const s = await fb.db.doc('notes/' + id).get(); return s.exists ? s.data() : null; },
    async putReview(id, d) { try { await fb.db.doc('reviews/' + id).set(Object.assign({}, d, { by: me.uid, byName: me.name, at: Date.now() })); } catch (e) { throw fbErr(e); } },
    async getReview(id) { const s = await fb.db.doc('reviews/' + id).get(); return s.exists ? s.data() : null; },
    async myReviews() { const q = await fb.db.collection('reviews').where('uid', '==', me.uid).get(); const out = {}; q.forEach(d => out[d.id] = d.data()); return out; }
  };

  const B = mode === 'firebase' ? F : L;
  const api = {
    mode, schoolName, validEmail,
    get user() { return me; },
    async init() { try { await B.init(); } catch (e) { console.warn(e); api.offline = true; me = null; } },
    signUp: d => B.signUp(d), signIn: (e, p) => B.signIn(e, p), signOut: () => B.signOut(), resetPassword: e => B.resetPassword(e),
    updateProfile: f => B.updateProfile(f), loadState: () => B.loadState(), saveState: s => B.saveState(s),
    publishProgress: d => B.publishProgress(d), coachRoster: () => B.coachRoster(),
    putNote: (i, d) => B.putNote(i, d), getNote: i => B.getNote(i), putReview: (i, d) => B.putReview(i, d), getReview: i => B.getReview(i), myReviews: () => B.myReviews()
  };
  return api;
})();
