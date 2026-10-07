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
- **Coach tab (students)**: which coaches can see them, a preview of exactly what they see, and what stays private
- **School results**: students search school events. Public events (inter-house, sports day) show winners and house points to anyone. Personal events (a functional fitness test with bronze, silver and gold pins) need the student's name, school ID and date of birth, plus an access code if the school uses one. Coaches publish results in the **Results** tab from a CSV and the school's own pin criteria
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
5. Create the coach access code. In Firestore **Data**, click **Start collection**, name it `schools`. Set the document ID to `vasant-valley` (it must match the `id` in `js/config.js`) and add a field `coachCode` (string) with a code only coaches will know, for example `VV-COACH-7Q4`. Give that code to your coaches.
6. **Project settings (gear icon) → Your apps → Web (`</>`)**. Register the app (no hosting needed) and copy the `firebaseConfig` values into `firebase:` in `js/config.js`.
7. **Authentication → Settings → Authorized domains → Add domain:** `shxvsk1x.github.io`.
8. Commit and push. The demo-mode banner disappears and accounts work on every device.

The Firebase web config is meant to be public; the security rules are what protect the data. Students can only read their own plan. Coaches can only read progress summaries and doctors' notes for students at their school who play a sport they coach.

To add another school, add it to `schools` in `js/config.js` and create a matching `schools/<id>` document with its own `coachCode`.

## School results and pins

Coaches: **Results** tab, **Add an event**.

- **Public** (inter-house, sports day): CSV with `category,place,name` and optional `house,result`. House points (5, 3, 1) are added up for you.
- **Personal** (fitness test): write the criteria one test per line as `Test | unit | higher or lower | bronze | silver | gold` (each number is the minimum for that pin), then a CSV with `name,id,dob` (YYYY-MM-DD), one column per test, and an optional `note`. Choose whether the overall pin is the lowest or the average level, and let Pulse generate an access code per student. Download the codes straight away; they are not stored.

How personal results are protected: the browser turns name + ID + date of birth (+ code) into a lookup id and an encryption key (PBKDF2-SHA512, 150,000 rounds). Only the encrypted result is stored, under that id. The rules in `firestore.rules` let a signed-in student fetch one document by id but never list the collection, and coaches can only see encrypted data. The browser also slows repeated wrong tries.

Honest limit: the id is guessable by someone who knows a classmate's name, ID and birthday, so **use access codes**. After changing `firestore.rules`, publish them again in the Firebase console. For stronger protection add Firebase App Check or a Cloud Function that rate-limits lookups.

## Privacy

Coaches see sessions completed, weigh-in trends, water, protein and readiness as percentages, flags, and supplement requests with the doctor's note. They do not see food logs, meal plans, exercises, injury notes, glass photos or Ask Pulse chats.

Pulse gives general guidance, not medical advice.
