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

  /* schools: anyone can type their school's name. The id is a tidy version of the name, so "Vasant Valley School" and "vasant valley" land on the same school. */
  const dirCache = {};      // id -> name, for schools other people have set up
  const slug = n => String(n || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(w => w && w !== 'school' && w !== 'the').join('-').slice(0, 60);
  const pretty = id => String(id || '').split('-').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  const knownSchools = () => { const m = {}; (cfg.schools || []).forEach(s => m[s.id] = s.name); Object.keys(dirCache).forEach(k => { if (!m[k]) m[k] = dirCache[k]; }); return m; };
  const schoolName = (id, fb) => id ? (knownSchools()[id] || (me && me.school === id && me.schoolName) || fb || pretty(id)) : '';
  const schoolId = name => { const s = slug(name); if (!s) return ''; const m = knownSchools(); if (m[s]) return s; const hit = Object.keys(m).find(k => slug(m[k]) === s); return hit || s; };
  const isKnown = id => !!knownSchools()[id];
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

  const normSid = x => String(x || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const rkey = (school, sid) => school + '_' + normSid(sid);          // one results login per student ID per school
  const okEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  const pairId = (x, y) => x < y ? x + '_' + y : y + '_' + x;
  const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O/1/I so a code is easy to read out
  const newCode = free => { for (let i = 0; i < 20; i++) { let c = ''; const r = crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(8)) : Array.from({ length: 8 }, () => Math.floor(Math.random() * 256)); for (let k = 0; k < 8; k++) c += CODE_CHARS[r[k] % CODE_CHARS.length]; if (free(c)) return c; } throw err('Could not make a friend code. Try again.'); };
  const cleanCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  /* ---------------- LOCAL (demo) backend ---------------- */
  const L = {
    db() { const d = lsGet('pulse.cloud') || { users: {}, progress: {}, notes: {}, reviews: {} }; d.events = d.events || {}; d.results = d.results || {}; d.friends = d.friends || { codes: {}, ships: {}, feed: {} }; d.rlog = d.rlog || { logins: {}, rows: {} }; d.dir = d.dir || {}; d.schools = d.schools || {}; d.trn = d.trn || { codes: {}, links: {}, feed: {} }; return d; },
    /* generic documents for newer features: reports, messages, lifts, board, admins */
    gdb() { const d = L.db(); d.gen = d.gen || {}; return d; },
    async gput(col, id, data, merge) { const db = L.gdb(), k = col + '/' + id; db.gen[k] = merge ? Object.assign({}, db.gen[k], data) : Object.assign({}, data); L.put(db); },
    async gget(col, id) { const v = L.gdb().gen[col + '/' + id]; return v ? Object.assign({ id }, v) : null; },
    async gdel(col, id) { const db = L.gdb(); delete db.gen[col + '/' + id]; L.put(db); },
    async gquery(col, conds) { const out = []; Object.entries(L.gdb().gen).forEach(([k, v]) => { if (k.indexOf(col + '/') !== 0) return; if ((conds || []).every(([f, val]) => v[f] === val)) out.push(Object.assign({ id: k.slice(col.length + 1) }, v)); }); return out; },
    put(db) { if (!lsSet('pulse.cloud', db)) throw err('This browser is out of storage space.'); },
    async init() { const uid = lsGet('pulse.cloud.session'); const u = uid && L.db().users[uid]; me = u ? L.pub(u) : null; },
    pub(u) { const { hash, ...rest } = u; return rest; },
    async signUp(d) {
      const db = L.db(), email = cleanEmail(d.email);
      if (Object.values(db.users).some(u => u.email === email)) throw err('An account with this email already exists. Log in instead.');
      if (d.role === 'coach') {
        const id = d.school, code = String(d.coachCode || '').trim(), known = (cfg.schools || []).some(s => s.id === id) || db.dir[id];
        if (known) { const want = (db.schools[id] && db.schools[id].code) || cfg.demoCoachCode || ''; if (code.toUpperCase() !== String(want).toUpperCase()) throw err('That coach access code is not right for this school. Ask the coach who set the school up on Pulse.'); }
        else { if (code.length < 6) throw err('Your school is new on Pulse. Choose a coach access code of at least 6 characters. Other coaches will need it to join.'); db.schools[id] = { code, name: d.schoolName || pretty(id) }; db.dir[id] = { name: d.schoolName || pretty(id) }; }
      }
      const uid = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const u = { uid, email, name: d.name, role: d.role, school: d.school || '', schoolName: d.schoolName || schoolName(d.school), verified: !['trainer', 'parent'].includes(d.role), grade: d.grade || '', sports: d.sports || [], createdAt: Date.now(), hash: await sha(email + '|' + d.password) };
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
    async updateProfile(f) { const db = L.db(), u = db.users[me.uid]; Object.assign(u, f, f.school !== undefined ? { schoolName: f.schoolName || schoolName(f.school) } : {}); L.put(db); me = L.pub(u); return me; },
    async schoolList() { const db = L.db(); Object.keys(db.dir).forEach(k => dirCache[k] = db.dir[k].name); return knownSchools(); },
    async schoolCode() { const db = L.db(); const c = db.schools[me.school]; return c ? c.code : (cfg.demoCoachCode || ''); },
    async emailVerified() { const u = L.db().users[me.uid]; me = L.pub(u); return !!u.verified; },
    async verifyNow() { const db = L.db(); db.users[me.uid].verified = true; L.put(db); me = L.pub(db.users[me.uid]); return true; },
    async resendVerify() { return true; },
    /* personal trainers */
    async trainerCode() { const db = L.db(), u = db.users[me.uid]; if (u.trainerCode && db.trn.codes[u.trainerCode]) return u.trainerCode; const code = newCode(c => !db.trn.codes[c]); db.trn.codes[code] = { uid: me.uid, name: me.name }; u.trainerCode = code; L.put(db); me = L.pub(u); return code; },
    async findTrainerCode(code) { const c = L.db().trn.codes[code]; return c ? { uid: c.uid, name: c.name } : null; },
    async requestTrainee(o) {
      const db = L.db(), id = me.uid + '_' + o.uid, u = db.users[me.uid];
      if (me.role !== 'trainer') throw err('Only trainer accounts can ask to follow a client.');
      if (!u.verified) throw err('Verify your email first. Your client sees it on your request.');
      if (db.trn.links[id]) throw err(db.trn.links[id].status === 'accepted' ? 'This client is already linked to you.' : 'You already asked this client. They need to accept.');
      db.trn.links[id] = { trainer: me.uid, trainee: o.uid, trainerName: me.name, trainerEmail: me.email, traineeName: o.name, status: 'pending', at: Date.now() }; L.put(db);
    },
    async myLinks() { return Object.entries(L.db().trn.links).filter(([, v]) => v.trainer === me.uid || v.trainee === me.uid).map(([id, v]) => Object.assign({ id }, v)); },
    async acceptLink(id) { const db = L.db(), v = db.trn.links[id]; if (!v || v.trainee !== me.uid) throw err('That request is no longer there.'); v.status = 'accepted'; L.put(db); },
    async removeLink(id) { const db = L.db(), v = db.trn.links[id]; if (v && (v.trainee === me.uid || v.trainer === me.uid)) { delete db.trn.links[id]; L.put(db); } },
    async publishTrainee(doc) { const db = L.db(); db.trn.feed[me.uid] = Object.assign({}, doc, { uid: me.uid }); L.put(db); },
    async deleteTrainee() { const db = L.db(); delete db.trn.feed[me.uid]; L.put(db); },
    async traineeRoster() { const db = L.db(); return Object.values(db.trn.links).filter(v => v.trainer === me.uid && v.status === 'accepted').map(v => db.trn.feed[v.trainee]).filter(Boolean); },
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
      if (me.role === 'trainer') return L.traineeRoster();
      return Object.values(db.progress).filter(p => p.school === me.school && (me.sports || []).includes(p.sport));
    },
    async putNote(id, d) { const db = L.db(); db.notes[id] = Object.assign({}, d, { uid: me.uid }); L.put(db); },
    async getNote(id) { return L.db().notes[id] || null; },
    async putReview(id, d) { const db = L.db(); db.reviews[id] = Object.assign({}, d, { by: me.uid, byName: me.name, at: Date.now() }); L.put(db); },
    async getReview(id) { return L.db().reviews[id] || null; },
    async eventsList(school) { return Object.values(L.db().events).filter(e => !school || e.school === school).map(e => JSON.parse(e.json)); },
    async putEvent(ev, rows, logins) { const db = L.db(); db.events[ev.id] = { school: ev.school, json: JSON.stringify(ev) }; rows.forEach(r => db.results[ev.id + '_' + r.tag] = { event: ev.id, school: ev.school, iv: r.iv, c: r.c }); (logins || []).forEach(r => db.rlog.rows[ev.id + '_' + r.sid] = { event: ev.id, school: ev.school, email: r.email, rec: r.rec }); L.put(db); },
    async deleteEvent(id) { const db = L.db(); delete db.events[id]; Object.keys(db.results).forEach(k => { if (db.results[k].event === id) delete db.results[k]; }); Object.keys(db.rlog.rows).forEach(k => { if (db.rlog.rows[k].event === id) delete db.rlog.rows[k]; }); L.put(db); },
    /* results login: student ID + password, email verified. In demo mode no email can be sent, so verification is simulated. */
    async resSignUp(school, sid, email, pw) {
      const db = L.db(), k = rkey(school, sid), em = String(email).trim().toLowerCase();
      if (db.rlog.logins[k]) throw err('That student ID already has a results login. Log in with it, or ask your PE teacher to reset it.');
      db.rlog.logins[k] = { email: em, hash: await sha(k + '|' + pw), verified: false }; L.put(db); lsSet('pulse.res.sess', { k, sid: normSid(sid), school, email: em }); return { email: em, verified: false, demo: true };
    },
    async resVerifyNow() { const db = L.db(), s = lsGet('pulse.res.sess'); if (!s || !db.rlog.logins[s.k]) throw err('Start by creating your login.'); db.rlog.logins[s.k].verified = true; L.put(db); return true; },
    async resSignIn(school, sid, pw) {
      const db = L.db(), k = rkey(school, sid), a = db.rlog.logins[k];
      if (!a || a.hash !== await sha(k + '|' + pw)) throw err('That student ID and password do not match. If you have no login yet, create one below.');
      lsSet('pulse.res.sess', { k, sid: normSid(sid), school, email: a.email }); return { sid: normSid(sid), school, email: a.email, verified: !!a.verified };
    },
    async resSession() { const s = lsGet('pulse.res.sess'), a = s && L.db().rlog.logins[s.k]; return a ? { sid: s.sid, school: s.school, email: a.email, verified: !!a.verified } : null; },
    async resResend() { return true; },
    async resCheck() { const s = await L.resSession(); return !!(s && s.verified); },
    async resSignOut() { lsDel('pulse.res.sess'); },
    async resGet(evId, sid) { const db = L.db(), s = lsGet('pulse.res.sess'), a = s && db.rlog.logins[s.k]; if (!a || !a.verified || s.sid !== normSid(sid)) return null; const r = db.rlog.rows[evId + '_' + normSid(sid)]; return r && r.email === a.email ? r.rec : null; },
    async getResult(evId, tag) { return L.db().results[evId + '_' + tag] || null; },
    /* friends */
    async friendCode() {
      const db = L.db(), u = db.users[me.uid];
      if (u.friendCode && db.friends.codes[u.friendCode]) return u.friendCode;
      const code = newCode(c => !db.friends.codes[c]);
      db.friends.codes[code] = { uid: me.uid, name: me.name }; u.friendCode = code; L.put(db); me = L.pub(u); return code;
    },
    async findCode(code) { const c = L.db().friends.codes[code]; return c ? { uid: c.uid, name: c.name } : null; },
    async requestFriend(other) {
      const db = L.db(), id = pairId(me.uid, other.uid);
      if (db.friends.ships[id]) throw err(db.friends.ships[id].status === 'accepted' ? 'You are already friends.' : 'A request between you two is already open.');
      db.friends.ships[id] = { a: me.uid < other.uid ? me.uid : other.uid, b: me.uid < other.uid ? other.uid : me.uid, aName: me.uid < other.uid ? me.name : other.name, bName: me.uid < other.uid ? other.name : me.name, from: me.uid, status: 'pending', at: Date.now() };
      L.put(db);
    },
    async myFriendships() { return Object.entries(L.db().friends.ships).filter(([, v]) => v.a === me.uid || v.b === me.uid).map(([id, v]) => Object.assign({ id }, v)); },
    async acceptFriend(id) { const db = L.db(), v = db.friends.ships[id]; if (!v || v.from === me.uid || (v.a !== me.uid && v.b !== me.uid)) throw err('That request is no longer there.'); v.status = 'accepted'; L.put(db); },
    async removeFriend(id) { const db = L.db(), v = db.friends.ships[id]; if (v && (v.a === me.uid || v.b === me.uid)) { delete db.friends.ships[id]; L.put(db); } },
    async publishFeed(doc) { const db = L.db(); db.friends.feed[me.uid] = doc; L.put(db); },
    async getFeed(uid) { const db = L.db(), v = db.friends.ships[pairId(me.uid, uid)]; if (!v || v.status !== 'accepted') return null; return db.friends.feed[uid] || null; },
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
      return Object.assign({ uid: user.uid, email: user.email, emailVerified: !!user.emailVerified }, d);
    },
    async signUp(d) {
      let cred;
      try { cred = await fb.auth.createUserWithEmailAndPassword(cleanEmail(d.email), d.password); } catch (e) { throw fbErr(e); }
      const doc = { name: d.name, email: cleanEmail(d.email), role: d.role, school: d.school || '', schoolName: d.schoolName || schoolName(d.school), grade: d.grade || '', sports: d.sports || [], createdAt: Date.now() };
      const undo = async m => { try { await cred.user.delete(); } catch (x) {} throw m; };
      if (d.role === 'coach') {
        doc.coachCode = String(d.coachCode || '').trim();
        let known = isKnown(d.school);
        if (!known) { try { known = (await fb.db.doc('schoolDirectory/' + d.school).get()).exists; } catch (e) {} }
        if (!known) {
          if (doc.coachCode.length < 6) await undo(err('Your school is new on Pulse. Choose a coach access code of at least 6 characters. Other coaches will need it to join.'));
          try { await fb.db.doc('schools/' + d.school).set({ coachCode: doc.coachCode, owner: cred.user.uid, name: doc.schoolName }); await fb.db.doc('schoolDirectory/' + d.school).set({ name: doc.schoolName }); }
          catch (e) { await undo(err('That school is already set up on Pulse. Use the coach access code its first coach chose.')); }
        }
      }
      try { await fb.db.doc('users/' + cred.user.uid).set(doc); }
      catch (e) {
        if (d.role === 'coach') await undo(err('That coach access code is not right for this school. Ask the coach who set the school up on Pulse.'));
        await undo(fbErr(e));
      }
      if (d.role === 'trainer' || d.role === 'parent') { try { await cred.user.sendEmailVerification({ url: location.origin + location.pathname }); } catch (e) {} doc.emailVerified = false; }
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
    async schoolList() { try { const q = await fb.db.collection('schoolDirectory').get(); q.forEach(d => dirCache[d.id] = d.data().name); } catch (e) {} return knownSchools(); },
    async schoolCode() { try { const s = await fb.db.doc('schools/' + me.school).get(); return s.exists ? s.data().coachCode : ''; } catch (e) { return ''; } },
    async emailVerified() { const u = fb.auth.currentUser; if (!u) return false; try { await u.reload(); await u.getIdToken(true); } catch (e) {} me.emailVerified = !!u.emailVerified; return me.emailVerified; },
    async verifyNow() { return false; },
    async resendVerify() { const u = fb.auth.currentUser; if (!u) throw err('Log in again first.'); try { await u.sendEmailVerification({ url: location.origin + location.pathname }); } catch (e) { throw fbErr(e); } return true; },
    /* personal trainers */
    async trainerCode() {
      if (me.trainerCode) return me.trainerCode;
      for (let i = 0; i < 6; i++) {
        const code = newCode(() => true), ref = fb.db.doc('trainerCodes/' + code);
        try {
          if ((await ref.get()).exists) continue;
          await ref.set({ uid: me.uid, name: me.name });
          await fb.db.doc('users/' + me.uid).update({ trainerCode: code }); me.trainerCode = code; return code;
        } catch (e) { if (i === 5) throw fbErr(e); }
      }
      throw err('Could not make a code. Try again.');
    },
    async findTrainerCode(code) { try { const s = await fb.db.doc('trainerCodes/' + code).get(); return s.exists ? { uid: s.data().uid, name: s.data().name } : null; } catch (e) { throw fbErr(e); } },
    async requestTrainee(o) {
      if (me.role !== 'trainer') throw err('Only trainer accounts can ask to follow a client.');
      if (!(await F.emailVerified())) throw err('Verify your email first. Your client sees it on your request.');
      const id = me.uid + '_' + o.uid, ref = fb.db.doc('trainerLinks/' + id);
      let cur = null; try { cur = await ref.get(); } catch (e) {}
      if (cur && cur.exists) throw err(cur.data().status === 'accepted' ? 'This client is already linked to you.' : 'You already asked this client. They need to accept.');
      try { await ref.set({ trainer: me.uid, trainee: o.uid, trainerName: me.name, trainerEmail: me.email, traineeName: o.name, status: 'pending', at: Date.now() }); } catch (e) { throw fbErr(e); }
    },
    async myLinks() {
      try {
        const q = await fb.db.collection('trainerLinks').where(me.role === 'trainer' ? 'trainer' : 'trainee', '==', me.uid).get();
        const out = []; q.forEach(d => out.push(Object.assign({ id: d.id }, d.data()))); return out;
      } catch (e) { throw fbErr(e); }
    },
    async acceptLink(id) { try { await fb.db.doc('trainerLinks/' + id).update({ status: 'accepted' }); } catch (e) { throw fbErr(e); } },
    async removeLink(id) { try { await fb.db.doc('trainerLinks/' + id).delete(); } catch (e) { throw fbErr(e); } },
    async publishTrainee(doc) { try { await fb.db.doc('trainee/' + me.uid).set(Object.assign({}, doc, { uid: me.uid })); } catch (e) { throw fbErr(e); } },
    async deleteTrainee() { try { await fb.db.doc('trainee/' + me.uid).delete(); } catch (e) { throw fbErr(e); } },
    async traineeRoster() {
      const links = (await F.myLinks()).filter(l => l.status === 'accepted'), out = [];
      await Promise.all(links.map(async l => { try { const s = await fb.db.doc('trainee/' + l.trainee).get(); if (s.exists) out.push(s.data()); } catch (e) {} }));
      return out;
    },
    async updateProfile(f) { const up = Object.assign({}, f); if (f.school !== undefined) up.schoolName = f.schoolName || schoolName(f.school); try { await fb.db.doc('users/' + me.uid).update(up); } catch (e) { throw fbErr(e); } Object.assign(me, up); return me; },
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
      if (me.role === 'trainer') return F.traineeRoster();
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
    async eventsList(school) { let q = fb.db.collection('events'); if (school) q = q.where('school', '==', school); const snap = await q.get(); return snap.docs.map(d => JSON.parse(d.data().json)); },
    async putEvent(ev, rows, logins) {
      try {
        logins = logins || [];
        for (let i = 0; i < logins.length; i += 400) { const b = fb.db.batch(); logins.slice(i, i + 400).forEach(r => b.set(fb.db.doc('loginResults/' + ev.id + '_' + r.sid), { event: ev.id, school: ev.school, email: r.email, rec: r.rec })); await b.commit(); }
        for (let i = 0; i < rows.length; i += 400) { const b = fb.db.batch(); rows.slice(i, i + 400).forEach(r => b.set(fb.db.doc('results/' + ev.id + '_' + r.tag), { event: ev.id, school: ev.school, iv: r.iv, c: r.c })); await b.commit(); }
        await fb.db.doc('events/' + ev.id).set({ school: ev.school, kind: ev.kind, title: ev.title, date: ev.date, json: JSON.stringify(ev) });
      } catch (e) { throw fbErr(e); }
    },
    async deleteEvent(id) {
      try {
        const q = await fb.db.collection('results').where('school', '==', me.school).where('event', '==', id).get();
        for (let i = 0; i < q.docs.length; i += 400) { const b = fb.db.batch(); q.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
        const q2 = await fb.db.collection('loginResults').where('school', '==', me.school).where('event', '==', id).get();
        for (let i = 0; i < q2.docs.length; i += 400) { const b = fb.db.batch(); q2.docs.slice(i, i + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
        await fb.db.doc('events/' + id).delete();
      } catch (e) { throw fbErr(e); }
    },
    async getResult(evId, tag) { try { const s = await fb.db.doc('results/' + evId + '_' + tag).get(); return s.exists ? s.data() : null; } catch (e) { if (e.code === 'permission-denied') return null; throw fbErr(e); } },
    /* results login: a second Firebase app, so signing in here never signs the student out of Pulse */
    async rapp() {
      if (!F._r) { const app = firebase.apps.find(a => a.name === 'results') || firebase.initializeApp(cfg.firebase, 'results'); F._r = { auth: app.auth(), db: app.firestore() }; await new Promise(ok => { const off = F._r.auth.onAuthStateChanged(() => { off(); ok(); }); }); }
      return F._r;
    },
    async resRegister(school, sid, user) {
      await user.getIdToken(true);
      await F._r.db.doc('resultLogins/' + rkey(school, sid)).set({ uid: user.uid, email: String(user.email).toLowerCase(), sid: normSid(sid), school });
    },
    async resSignUp(school, sid, email, pw) {
      const r = await F.rapp(), em = String(email).trim().toLowerCase();
      if (!okEmail(em)) throw err('That email address does not look right.');
      let u;
      try { u = (await r.auth.createUserWithEmailAndPassword(em, pw)).user; }
      catch (e) {
        if (e.code === 'auth/email-already-in-use') {   // maybe their Pulse account: same email and password proves it is theirs
          try { u = (await r.auth.signInWithEmailAndPassword(em, pw)).user; } catch (x) { throw err('That email already has an account with a different password. Enter the password you use for Pulse, or use a different email.'); }
        } else throw fbErr(e);
      }
      try { const ex = await r.db.doc('resultLogins/' + rkey(school, sid)).get(); if (ex.exists && ex.data().uid !== u.uid) { await r.auth.signOut(); throw err('That student ID already has a results login. Log in with it, or ask your PE teacher to reset it.'); } } catch (e) { if (e.friendly) throw e; }
      lsSet('pulse.res.sess', { sid: normSid(sid), school, email: em });
      if (u.emailVerified) { await F.resRegister(school, sid, u); return { email: em, verified: true }; }
      try { await u.sendEmailVerification({ url: location.origin + location.pathname + '#/results' }); } catch (e) { throw fbErr(e); }
      return { email: em, verified: false };
    },
    async resResend() { const r = await F.rapp(); if (!r.auth.currentUser) throw err('Create your login first.'); try { await r.auth.currentUser.sendEmailVerification({ url: location.origin + location.pathname + '#/results' }); } catch (e) { throw fbErr(e); } return true; },
    async resCheck() {
      const r = await F.rapp(), u = r.auth.currentUser, s = lsGet('pulse.res.sess'); if (!u || !s) return false;
      await u.reload(); if (!u.emailVerified) return false;
      await F.resRegister(s.school, s.sid, u); return true;
    },
    async resSignIn(school, sid, pw) {
      const r = await F.rapp(); let snap;
      try { snap = await r.db.doc('resultLogins/' + rkey(school, sid)).get(); } catch (e) { throw fbErr(e); }
      if (!snap.exists) throw err('No results login for that student ID yet. Create one below.');
      let u; try { u = (await r.auth.signInWithEmailAndPassword(snap.data().email, pw)).user; } catch (e) { throw err(e.code === 'auth/too-many-requests' ? FBERR['auth/too-many-requests'] : 'That student ID and password do not match.'); }
      lsSet('pulse.res.sess', { sid: normSid(sid), school, email: u.email });
      return { sid: normSid(sid), school, email: u.email, verified: u.emailVerified };
    },
    async resSession() { const r = await F.rapp(), u = r.auth.currentUser, s = lsGet('pulse.res.sess'); return u && s ? { sid: s.sid, school: s.school, email: u.email, verified: u.emailVerified } : null; },
    async resSignOut() { try { const r = await F.rapp(); await r.auth.signOut(); } catch (e) {} lsDel('pulse.res.sess'); },
    async resGet(evId, sid) {
      const r = await F.rapp(); if (!r.auth.currentUser) return null;
      try { const s = await r.db.doc('loginResults/' + evId + '_' + normSid(sid)).get(); return s.exists ? s.data().rec : null; } catch (e) { if (e.code === 'permission-denied') return null; throw fbErr(e); }
    },
    /* friends */
    async friendCode() {
      if (me.friendCode) return me.friendCode;
      for (let i = 0; i < 6; i++) {
        const code = newCode(() => true), ref = fb.db.doc('friendCodes/' + code);
        try {
          if ((await ref.get()).exists) continue;
          await ref.set({ uid: me.uid, name: me.name });
          await fb.db.doc('users/' + me.uid).update({ friendCode: code }); me.friendCode = code; return code;
        } catch (e) { if (i === 5) throw fbErr(e); }
      }
      throw err('Could not make a friend code. Try again.');
    },
    async findCode(code) { try { const s = await fb.db.doc('friendCodes/' + code).get(); return s.exists ? { uid: s.data().uid, name: s.data().name } : null; } catch (e) { throw fbErr(e); } },
    async requestFriend(other) {
      const id = pairId(me.uid, other.uid), ref = fb.db.doc('friendships/' + id);
      let cur = null; try { cur = await ref.get(); } catch (e) { /* not ours to read: it does not exist */ }
      if (cur && cur.exists) throw err(cur.data().status === 'accepted' ? 'You are already friends.' : 'A request between you two is already open.');
      const mine = me.uid < other.uid;
      try { await ref.set({ a: mine ? me.uid : other.uid, b: mine ? other.uid : me.uid, aName: mine ? me.name : other.name, bName: mine ? other.name : me.name, from: me.uid, status: 'pending', at: Date.now() }); } catch (e) { throw fbErr(e); }
    },
    async myFriendships() {
      try {
        const col = fb.db.collection('friendships'), [x, y] = await Promise.all([col.where('a', '==', me.uid).get(), col.where('b', '==', me.uid).get()]);
        const out = []; x.forEach(d => out.push(Object.assign({ id: d.id }, d.data()))); y.forEach(d => out.push(Object.assign({ id: d.id }, d.data()))); return out;
      } catch (e) { throw fbErr(e); }
    },
    async acceptFriend(id) { try { await fb.db.doc('friendships/' + id).update({ status: 'accepted' }); } catch (e) { throw fbErr(e); } },
    async removeFriend(id) { try { await fb.db.doc('friendships/' + id).delete(); } catch (e) { throw fbErr(e); } },
    async publishFeed(doc) { try { await fb.db.doc('friendFeed/' + me.uid).set(doc); } catch (e) { throw fbErr(e); } },
    async getFeed(uid) { try { const s = await fb.db.doc('friendFeed/' + uid).get(); return s.exists ? s.data() : null; } catch (e) { if (e.code === 'permission-denied') return null; throw fbErr(e); } },
    async gput(col, id, data, merge) { try { await fb.db.doc(col + '/' + id).set(data, merge ? { merge: true } : undefined); } catch (e) { throw fbErr(e); } },
    async gget(col, id) { try { const s = await fb.db.doc(col + '/' + id).get(); return s.exists ? Object.assign({ id }, s.data()) : null; } catch (e) { if (e.code === 'permission-denied') return null; throw fbErr(e); } },
    async gdel(col, id) { try { await fb.db.doc(col + '/' + id).delete(); } catch (e) { throw fbErr(e); } },
    async gquery(col, conds) { try { let q = fb.db.collection(col); (conds || []).forEach(([f, v]) => { q = q.where(f, '==', v); }); const r = await q.get(), out = []; r.forEach(d => out.push(Object.assign({ id: d.id }, d.data()))); return out; } catch (e) { throw fbErr(e); } },
    async myReviews() { const q = await fb.db.collection('reviews').where('uid', '==', me.uid).get(); const out = {}; q.forEach(d => out[d.id] = d.data()); return out; }
  };

  const B = mode === 'firebase' ? F : L;
  const api = {
    mode, schoolName, schoolId, isKnown, knownNames: () => knownSchools(), validEmail, slug,
    schoolList: () => B.schoolList(), schoolCode: () => B.schoolCode(), emailVerified: () => B.emailVerified(), verifyNow: () => B.verifyNow(), resendVerify: () => B.resendVerify(),
    trainerCode: () => B.trainerCode(), findTrainerCode: c => B.findTrainerCode(cleanCode(c)), requestTrainee: o => B.requestTrainee(o), myLinks: () => B.myLinks(), acceptLink: i => B.acceptLink(i), removeLink: i => B.removeLink(i), publishTrainee: d => B.publishTrainee(d), deleteTrainee: () => B.deleteTrainee(),
    get user() { return me; },
    async init() { try { await B.init(); } catch (e) { console.warn(e); api.offline = true; me = null; } try { B.schoolList().catch(() => {}); } catch (e) {} },
    signUp: d => B.signUp(d), signIn: (e, p) => B.signIn(e, p), signOut: () => B.signOut(), resetPassword: e => B.resetPassword(e),
    updateProfile: f => B.updateProfile(f), loadState: () => B.loadState(), saveState: s => B.saveState(s),
    gput: (c, i, d, m) => B.gput(c, i, d, m), gget: (c, i) => B.gget(c, i), gdel: (c, i) => B.gdel(c, i), gquery: (c, q) => B.gquery(c, q),
        publishProgress: d => B.publishProgress(d), coachRoster: () => B.coachRoster(),
    putNote: (i, d) => B.putNote(i, d), getNote: i => B.getNote(i), putReview: (i, d) => B.putReview(i, d), getReview: i => B.getReview(i), myReviews: () => B.myReviews(),
    resSignUp: (sc, i, e, p) => B.resSignUp(sc, i, e, p), resSignIn: (sc, i, p) => B.resSignIn(sc, i, p), resSession: () => B.resSession(), resResend: () => B.resResend(), resCheck: () => B.resCheck(), resSignOut: () => B.resSignOut(), resGet: (e, i) => B.resGet(e, i), resVerifyNow: () => B.resVerifyNow ? B.resVerifyNow() : Promise.resolve(false), normSid,
    friendCode: () => B.friendCode(), findCode: c => B.findCode(cleanCode(c)), requestFriend: o => B.requestFriend(o), myFriendships: () => B.myFriendships(), acceptFriend: i => B.acceptFriend(i), removeFriend: i => B.removeFriend(i), publishFeed: d => B.publishFeed(d), getFeed: u => B.getFeed(u), cleanCode,
    eventsList: s => B.eventsList(s), putEvent: (e, r, lg) => B.putEvent(e, r, lg), deleteEvent: i => B.deleteEvent(i), getResult: (e, t) => B.getResult(e, t)
  };
  return api;
})();
