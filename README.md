# Pulse

Training and fuel planning for student athletes. Tell Pulse your sport, schedule and equipment, and it builds a four-week training block for the gym you actually have, sets food targets by the gram, and adjusts each session to how you slept.

**Live:** https://shxvsk1x.github.io/Pulse-Athelete/

## What it does

- **Five-step onboarding** that builds a periodised block (Base, Build, Peak, Deload) from 66 exercises filtered by your equipment, level and injuries
- **Today**: morning readiness check-in, today's session, fuel and water at a glance
- **Plan**: every day of the block, with sport prep drills and one-tap exercise swaps
- **Live session**: tick off sets, log loads, automatic rest timer, session RPE and personal bests
- **Fuel**: calorie, macro and water targets, meal ideas filtered by diet and allergies, food search, custom foods
- **Progress**: weekly training load, acute:chronic ratio, body weight trend, personal bests, history and milestones
- Command menu (⌘K or /), light and dark themes, export and import, works offline-first in the browser

## Tech

Plain HTML, CSS and JavaScript. No build step and no dependencies. Data is stored in `localStorage` on the device.

```
index.html
css/styles.css
js/engine.js    knowledge base and planning engine
js/ui.js        icons, toasts, modals, command menu, charts
js/app.js       state, router, onboarding and app views
js/landing.js   marketing page
```

Run locally with any static server, for example `python3 -m http.server`.

Pulse gives general guidance, not medical advice.
