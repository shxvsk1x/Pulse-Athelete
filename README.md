# Pulse

Training and fuel planning for student athletes. Tell Pulse your sport, schedule and the exact equipment you can use, and it builds a four-week training block from that equipment only, sets food and water targets for your goal, and adjusts as you go. Coaches follow their athletes' progress, and supplements with side effects for under-18s go through a doctor's note and a coach.

**Live:** https://shxvsk1x.github.io/Pulse-Athelete/

## What it does

- **Welcome screen**: continue as a guest, create an account (student or coach) or log in
- **Equipment picker**: 56 pieces of gym equipment, each with a drawing. The plan uses only what the athlete taps
- **Today**: weekly weigh-in reminder, plan-adjustment notices, session, water, readiness and fuel
- **Water first**: a target based on weight, heat and training; pace nudges; reminders; log by your own glass (photo plus size, measured or typed) or by typing ml
- **Meal plan**: breakfast, lunch, snack and dinner as separate cards, sized to the goal, each swappable as many times as you like
- **Food guard**: junk food (chocolate, chips, soda, pizza, fried food and more) cannot be logged. Pulse explains why and offers a healthier alternative
- **Supplements**: under-18s need a doctor's note for anything with side effects, verified by one of their coaches. Fat burners, test boosters and SARMs are blocked
- **Weekly weigh-in**: if weight is not moving towards the goal, Pulse adjusts calories (within safe limits for under-18s) and sometimes intensity, and tells the athlete and coaches why
- **Ask Pulse**: a built-in coach for nutrition, training and recovery questions. It can change the plan, but only when the change helps progress, and it pushes back on bad habits
- **Exercise guides**: every exercise has a captioned video, an animated stick-figure demo that works offline and a written step list. If a video is removed, blocked or slow, Pulse drops to the animation and steps by itself. Open `#/videocheck` to test every video link from your own browser
- **Set timing**: tap Start and Done on every set; Pulse keeps each set's time and rest, flags sessions that look rushed and shows a day-by-day log in Progress
- **I ate something else**: type any food (or its macros) to see calories and macros, a good / fine / avoid verdict with the reason, and the nutrients it gives. It is logged and tracked so repeats are noticed
- **Friends**: students share an 8-character code, the other accepts, and each sees the other's streak, sessions, 14-day strip, best lifts and weight trend. Opt-in, pausable, never shows food or body weight
- **Coach tab (students)**: which coaches can see them, a preview of exactly what they see, and what stays private
- **School results**: no event list to search. The tab always asks for school, student ID and password, even if the school has published nothing yet. Personal events (a functional fitness test with bronze, silver and gold pins) can be seen two ways: log in with student ID and password (the student creates it once by verifying the email on the school's list; we send a verification email), or look up with name, school ID and date of birth. Coaches publish results in the **Results** tab from a CSV and the school's own pin criteria
- **Any school, or none**: students and coaches type their school's name (suggestions appear for schools already on Pulse). Someone at university or an adult ticks "I'm not at a school" and Pulse hides the Coach and Results tabs; everything else, including the personalised plan, stays the same.
- **Personal trainers**: a trainer makes a trainer account and verifies their email. The athlete shows a trainer code, the trainer enters it, and the athlete sees the trainer's name and verified email and must accept. Only then can the trainer see the athlete's progress (the same summary a coach sees). Either side can end it at any time.
- **Coach dashboard**: every student at the school who plays a sport the coach coaches, with flags, weigh-in trends, habits and a queue of doctors' notes to verify. Multi-sport athletes are visible to each of their sports' coaches

## Tech

Plain HTML, CSS and JavaScript, with no build step. Accounts and sync use Firebase (Authentication + Firestore). Without Firebase settings, Pulse runs in **demo mode**: everything works, but accounts are stored only in the current browser.

```
index.html
css/styles.css
js/config.js     settings: Firebase keys, schools, grades
js/engine.js     knowledge base and planning engine
js/equipment.js  equipment catalogue, drawings and machine exercises
js/ui.js         icons, toasts, modals, command menu, charts
js/cloud.js      accounts and sync (Firebase or demo)
js/health.js     meals, junk-food guard, supplements, water maths
js/app.js        state, router, onboarding and the core views
js/fuel.js       Fuel tab: water, meal plan, food guard, supplements
js/auth.js       welcome, sign up, log in, sync
js/coach.js      weigh-ins, plan adjustment, Coach tab, coach dashboard
js/friends.js    friend codes, requests, friends' consistency view
js/timing.js     per-set timing log
js/foodcheck.js  off-plan food check and verdicts
js/demo.js       animated exercise demos
js/ask.js        Ask Pulse chatbot
js/results.js    school events, encrypted personal results, pins
js/landing.js    the "What is Pulse?" page
firestore.rules  database security rules
```

Run locally with any static server, for example `python3 -m http.server`.

## Turning on real accounts (Firebase, about 10 minutes)

1. Go to <https://console.firebase.google.com>, click **Add project**, name it (for example `pulse-vv`) and finish. Google Analytics is not needed.
2. **Build → Authentication → Get started → Email/Password → Enable → Save.**
3. **Build → Firestore Database → Create database.** Pick a location near you (for example `asia-south1`, Mumbai) and start in **production mode**.
4. In Firestore, open the **Rules** tab, replace everything with the contents of `firestore.rules` and click **Publish**.
5. Coach access codes. For a school listed in `js/config.js` (like `vasant-valley`), create the code yourself: in Firestore **Data**, **Start collection** `schools`, document ID `vasant-valley`, field `coachCode` (string), for example `VV-COACH-7Q4`. Any other school sets itself up: the first coach to sign up for a new school name chooses its code (6 or more characters) and shares it with the school's other coaches, who can read it on their Account page.
6. **Project settings (gear icon) → Your apps → Web (`</>`)**. Register the app (no hosting needed) and copy the `firebaseConfig` values into `firebase:` in `js/config.js`.
7. **Authentication → Settings → Authorized domains → Add domain:** `shxvsk1x.github.io`.
8. Commit and push. The demo-mode banner disappears and accounts work on every device.

The Firebase web config is meant to be public; the security rules are what protect the data. Students can only read their own plan. Coaches can only read progress summaries and doctors' notes for students at their school who play a sport they coach.

Schools do not need to be added anywhere. A school's id is its typed name made tidy (`Delhi Public School, RK Puram` becomes `delhi-public-rk-puram`, and the word "school" is ignored so `Vasant Valley` and `Vasant Valley School` are the same school). To reset a school's code, edit its `schools/<id>` document.

## School results and pins

Coaches: **Results** tab, **Add an event**.

- **Public** (inter-house, sports day): CSV with `category,place,name` and optional `house,result`. House points (5, 3, 1) are added up for you.
- **Personal** (fitness test): write the criteria one test per line as `Test | unit | higher or lower | bronze | silver | gold` (each number is the minimum for that pin), then a CSV with `name,id,dob,email` (dob as YYYY-MM-DD; email is the student's school email, needed for the student ID login), one column per test, and an optional `note`. Choose whether the overall pin is the lowest or the average level.

How personal results are protected: the browser turns name + ID + date of birth into a lookup id and an encryption key (PBKDF2-SHA512, 150,000 rounds). Only the encrypted result is stored, under that id. The rules in `firestore.rules` let a signed-in student fetch one document by id but never list the collection, and coaches can only see encrypted data. The browser also slows repeated wrong tries.

Honest limits: the name, ID and date of birth lookup can be guessed by someone who knows a classmate's details, so prefer the student ID login (add the `email` column). A student ID login stores the verified email in a lookup that anyone who knows the exact ID can fetch, so treat IDs as semi-private. If a student needs their ID login reset, delete their document in Firestore under `resultLogins`. After changing `firestore.rules`, publish them again in the Firebase console.

## Privacy

Coaches see sessions (exercises, weights, per-set times), weigh-in trends, the last 7 days of food with off-plan items and how Pulse rated them, allergies, injuries and diet, water, protein and readiness, flags, and supplement requests with the doctor's note. They do not see glass photos or Ask Pulse chats. Friends only see consistency and progress, never food or body weight. Because students can be under 18, the app tells them exactly what is shared on the Coach tab, and your school should confirm this is acceptable under its own policy.

Pulse gives general guidance, not medical advice.

## Training, safety and the leaderboard (added November 2026)

- **Training:** automatic progression (up when sets finish easy, down after two hard sessions), "Something hurts?" swaps out exercises that load the sore area for 14 days, guided warm-up and cool-down timers, and a Missed day page that moves, lightens or skips a session (rule-based, no AI service).
- **Habits:** daily streak, more badges, in-app and browser reminders while Pulse is open, a calendar file (.ics) with alarms for training days, CSV export, weekly local backup with restore.
- **Under 18:** nothing is shared with coaches, a trainer or the leaderboard until a parent or guardian agrees (Profile → Safety and sharing). Firestore rules also refuse progress documents for under-18s without consent.
- **Reports:** every signed-in user can report a message, person or leaderboard entry. Admins read them.
- **Messages:** coaches write to students at their own school; students can reply. 
- **Leaderboard:** a student claims a lift (live or with a private video link), a coach at their school ticks "I saw it" and verifies it, and only then does it reach the board (name, school, grade, kg). The video link is stored in `liftProof`, readable only by the student and their school's coaches. Students can leave the board at any time and their entries are deleted.
- **Team view** (coach): per-sport table, pain flags, meal-photo counts, CSV.
- **Meal photos:** optional. A small thumbnail stays on the device; coaches only see how many meals were photo-logged.
- **Admin:** in Firestore, create `admins/{your uid}` (any field). Open Admin in the coach app to list schools, coaches, students and reports, reset a school's coach code, or suspend new coach sign-ups for a school. Your uid is shown on the Admin page.
