/* =========================================================
   PULSE — exercise form guides: a video and short steps for every exercise
   Videos are YouTube tutorials picked for each movement; v = YouTube video id.
   ========================================================= */
const FORM = {
"Back squat": {
"v": "PGFvWqAQRm8",
"s": [
"Set the bar on your upper back, below the bony bump of your neck, and squeeze it into your shoulders.",
"Feet shoulder-width, toes slightly out. Take a big breath into your belly and brace.",
"Sit down between your hips until your thighs are at least parallel, then drive the floor away."
],
"x": "Knees caving in or your chest dropping forward."
},
"Goblet squat": {
"v": "JO7D6GJ98wY",
"s": [
"Hold one dumbbell or kettlebell vertically against your chest.",
"Feet shoulder-width, toes slightly out. Brace your core.",
"Sit straight down with elbows inside your knees, then stand up tall."
],
"x": "Heels lifting off the floor."
},
"Front squat": {
"v": "wyDbagKS7Rg",
"s": [
"Rest the bar on the front of your shoulders with fingertips under it and elbows high.",
"Brace hard and keep your chest tall.",
"Sit straight down, keeping elbows up the whole time, then stand."
],
"x": "Elbows dropping, which tips the bar forward."
},
"Leg press": {
"v": "cDGOn-yfKJA",
"s": [
"Sit back fully against the pad, feet shoulder-width in the middle of the platform.",
"Unlock the safety and lower slowly until your knees reach about 90°.",
"Press through your whole foot without locking your knees at the top."
],
"x": "Lower back rolling off the seat at the bottom."
},
"Tempo bodyweight squat": {
"v": "ZLJBfYF_oO0",
"s": [
"Stand with feet shoulder-width, arms out in front for balance.",
"Lower for a slow count of 3, pause 1 second at the bottom.",
"Stand up at normal speed and squeeze your glutes."
],
"x": "Rushing the lowering part, which is the point of the exercise."
},
"Box squat to bench": {
"v": "5e7YnJP5u3U",
"s": [
"Stand just in front of a bench or box, feet shoulder-width.",
"Push your hips back and sit down until you lightly touch the box.",
"Without relaxing, drive straight back up to standing."
],
"x": "Dropping onto the box or rocking back to stand up."
},
"Romanian deadlift": {
"v": "osbkDJFMP-w",
"s": [
"Stand tall holding the bar at your hips, knees slightly bent.",
"Push your hips back and slide the bar down your thighs, back flat.",
"Stop when you feel a strong hamstring stretch, then drive your hips forward to stand."
],
"x": "Rounding your back or letting the bar drift away from your legs."
},
"Dumbbell Romanian deadlift": {
"v": "aa57T45iFSE",
"s": [
"Hold dumbbells in front of your thighs, knees soft.",
"Hinge at the hips and slide the weights down your legs with a flat back.",
"Feel the stretch in your hamstrings, then squeeze your glutes to stand."
],
"x": "Turning it into a squat by bending your knees too much."
},
"Hip thrust": {
"v": "pBH7pKHn-dI",
"s": [
"Sit with your upper back against a bench and the bar (padded) over your hips.",
"Feet flat, shins vertical at the top. Tuck your chin.",
"Drive through your heels to lift your hips until your body is flat, squeeze for 1 second."
],
"x": "Arching your lower back instead of using your glutes."
},
"Trap-bar or conventional deadlift": {
"v": "cclUh49qOww",
"s": [
"Stand with the bar over your mid-foot and grip just outside your legs.",
"Pull the slack out of the bar, chest up, back flat.",
"Push the floor away and stand tall, locking out with your glutes."
],
"x": "Jerking the bar off the floor with a rounded back."
},
"Kettlebell swing": {
"v": "B_x0tp3HIbk",
"s": [
"Stand with the bell a foot in front of you. Hinge and grip it.",
"Hike it back between your legs like a football snap.",
"Snap your hips forward so the bell floats to chest height. Let it fall back and repeat."
],
"x": "Squatting the swing or lifting with your arms."
},
"Kettlebell swing (power)": {
"v": "B_x0tp3HIbk",
"s": [
"Hike the bell back between your legs.",
"Snap your hips as hard as you can on every rep.",
"Let the bell float to chest height. Keep sets short and powerful."
],
"x": "Squatting instead of hinging."
},
"Single-leg glute bridge": {
"v": "nat5dN0Kuao",
"s": [
"Lie on your back, one foot flat, the other leg straight in the air.",
"Push through the heel on the floor to lift your hips.",
"Pause at the top with hips level, then lower slowly."
],
"x": "Letting the hip on the free-leg side drop."
},
"Band good morning": {
"v": "fJA39ZOVaEQ",
"s": [
"Stand on the band and loop it behind your neck.",
"Soft knees, long spine. Push your hips back to hinge forward.",
"Stop when your hamstrings stretch, then drive your hips through to stand."
],
"x": "Rounding your upper back."
},
"Bench press": {
"v": "gRVjAtPip0Y",
"s": [
"Lie with eyes under the bar, feet flat, shoulder blades squeezed together.",
"Lower the bar to your lower chest with elbows at about 45°.",
"Press back up and slightly back over your shoulders. Always use a spotter or safeties."
],
"x": "Bouncing the bar off your chest or flaring elbows wide."
},
"Dumbbell bench press": {
"v": "Y_7aHqXeCfQ",
"s": [
"Lie on a bench with dumbbells at chest level, shoulder blades pinned.",
"Press up and slightly in until your arms are straight.",
"Lower under control until you feel a stretch in your chest."
],
"x": "Letting the dumbbells drift too wide at the bottom."
},
"Push-up": {
"v": "WDIpL0pjun0",
"s": [
"Hands just wider than shoulders, body in one straight line from head to heels.",
"Lower until your chest is a fist away from the floor, elbows at 45°.",
"Push the floor away until your arms are straight."
],
"x": "Hips sagging or sticking up."
},
"Cable chest press": {
"v": "u74FbPhR8iE",
"s": [
"Set the handles at chest height and take a split stance facing away.",
"Start with hands by your chest, core tight.",
"Press forward and squeeze your chest, then return slowly."
],
"x": "Leaning your whole body forward to move the weight."
},
"Incline dumbbell press": {
"v": "hChjZQhX1Ls",
"s": [
"Set the bench to about 30°. Start with dumbbells at your upper chest.",
"Press up over your shoulders, elbows at about 45°.",
"Lower slowly to a deep stretch."
],
"x": "Setting the bench too steep, which turns it into a shoulder press."
},
"Feet-elevated push-up": {
"v": "J21Glo_IuCI",
"s": [
"Put your feet on a bench or box, hands on the floor.",
"Keep your body in one straight line.",
"Lower your chest to the floor and push back up."
],
"x": "Letting your hips sag."
},
"Standing overhead press": {
"v": "bMksDb5a3P0",
"s": [
"Bar on your front shoulders, hands just outside them. Squeeze glutes and brace.",
"Press straight up, moving your head back slightly to let the bar pass.",
"Finish with the bar over the back of your head, arms locked."
],
"x": "Leaning back and arching your lower back."
},
"Seated dumbbell shoulder press": {
"v": "WKEl69bIGus",
"s": [
"Sit tall with back support, dumbbells at shoulder height.",
"Press up until arms are almost straight.",
"Lower back to shoulder height under control."
],
"x": "Arching your back off the pad."
},
"Half-kneeling one-arm press": {
"v": "gashgHnvH2k",
"s": [
"Kneel on one knee; hold the weight on the same side as the down knee.",
"Squeeze the glute of the down leg and brace.",
"Press up in a slight arc until your arm is straight, then lower."
],
"x": "Leaning sideways to finish the rep."
},
"Pike push-up": {
"v": "shEnAXgc9y4",
"s": [
"Start in a push-up, then walk your feet in and lift your hips high.",
"Bend your elbows to lower the top of your head towards the floor.",
"Push back up to straight arms."
],
"x": "Dropping your hips, which turns it into a normal push-up."
},
"Band overhead press": {
"v": "_E94vW5y_Lw",
"s": [
"Stand on the band, handles at your shoulders.",
"Brace your core and press straight up.",
"Lower slowly to your shoulders."
],
"x": "Arching your lower back."
},
"Chest-supported dumbbell row": {
"v": "ro2vfHfD0DQ",
"s": [
"Lie face-down on an incline bench with a dumbbell in each hand.",
"Pull your elbows back towards your hips.",
"Pause with shoulder blades squeezed, then lower fully."
],
"x": "Lifting your chest off the pad to cheat the weight up."
},
"Barbell row": {
"v": "A1tmBJKKfVs",
"s": [
"Hinge to about 45°, back flat, bar hanging at arm's length.",
"Pull the bar to your belly button, elbows back.",
"Lower under control without standing up."
],
"x": "Using your hips to swing the bar up."
},
"Seated cable row": {
"v": "f_r95UajQcg",
"s": [
"Sit tall with a slight knee bend and grab the handle.",
"Pull it to your stomach, squeezing shoulder blades back then down.",
"Let your arms straighten fully and your shoulders reach forward."
],
"x": "Rocking your torso back and forth."
},
"One-arm dumbbell row": {
"v": "kHFJCf1FpAc",
"s": [
"One hand and knee on a bench, back flat.",
"Pull the dumbbell towards your hip pocket.",
"Lower until your arm is straight and your shoulder stretches."
],
"x": "Twisting your torso to lift the weight."
},
"Band row": {
"v": "LSkyinhmA8k",
"s": [
"Anchor the band at chest height and step back until it's tight.",
"Stand tall and pull the handles to your ribs.",
"Squeeze your shoulder blades for one second, then return slowly."
],
"x": "Shrugging your shoulders up."
},
"Inverted row (sturdy table)": {
"v": "6NTruShwwKk",
"s": [
"Lie under a sturdy table and grip the edge.",
"Keep your body straight from heels to head.",
"Pull your chest to the edge, then lower slowly. Test that the table is safe first."
],
"x": "Hips sagging towards the floor."
},
"Pull-up": {
"v": "TMnxKjdYcME",
"s": [
"Hang from the bar, hands just wider than shoulders, palms away.",
"Pull your shoulder blades down, then pull until your chin is over the bar.",
"Lower all the way to a full hang."
],
"x": "Kicking or swinging to get up."
},
"Lat pulldown": {
"v": "CAwf7n6Luuc",
"s": [
"Sit with thighs under the pad, hands just wider than shoulders.",
"Lean back slightly and pull the bar to your upper chest.",
"Let the bar rise under control until your arms are straight."
],
"x": "Pulling the bar behind your neck."
},
"Band-assisted pull-up": {
"v": "4yE-XGDWJPg",
"s": [
"Loop a band over the bar and put one foot or knee in it.",
"Pull until your chin passes the bar.",
"Lower for a slow 3 seconds."
],
"x": "Using a band so strong it does all the work."
},
"Eccentric pull-up": {
"v": "ELOKABEA1mU",
"s": [
"Jump or step up so your chin is above the bar.",
"Lower yourself as slowly as you can, about 4–5 seconds.",
"Reset at the bottom and repeat."
],
"x": "Dropping quickly through the bottom half."
},
"Band lat pulldown": {
"v": "VxCt-KKvzBQ",
"s": [
"Anchor the band high and kneel facing it.",
"Pull your elbows down towards your ribs.",
"Return slowly until your arms are straight."
],
"x": "Pulling with your arms instead of your back."
},
"Prone Y-T-W raise": {
"v": "CFt3WjCBbpc",
"s": [
"Lie face-down, arms hanging or resting on the floor.",
"Lift your arms into a Y, then a T, then a W shape, thumbs up.",
"Hold each for a second, using the muscles between your shoulder blades."
],
"x": "Lifting your chest high and arching your back."
},
"Bulgarian split squat": {
"v": "VPhhE6bBzZE",
"s": [
"Stand in front of a bench and put one foot back on it.",
"Keep your front shin fairly vertical and drop your back knee straight down.",
"Drive through your front foot to stand."
],
"x": "Standing too close to the bench, which strains the knee."
},
"Reverse lunge": {
"v": "-Nr6dqEvz3Q",
"s": [
"Stand tall, then step one foot back.",
"Lower until both knees are at about 90°.",
"Push through your front heel to return to standing."
],
"x": "Front heel lifting off the floor."
},
"Step-up": {
"v": "d4p6Jy6KUO4",
"s": [
"Place your whole foot on a box or bench.",
"Drive through that foot to stand up on the box.",
"Lower slowly with control."
],
"x": "Pushing off with your back leg."
},
"Walking lunge": {
"v": "YYWhkctnP2o",
"s": [
"Take a long step forward and lower your back knee towards the floor.",
"Keep your torso tall.",
"Push through your front foot and step straight into the next lunge."
],
"x": "Short steps that push your front knee far past your toes."
},
"Single-leg RDL": {
"v": "Zfr6wizR8rs",
"s": [
"Stand on one leg, slight bend in the knee.",
"Hinge forward, reaching your free leg back, hips square to the floor.",
"Go until your body is near parallel, then stand back up."
],
"x": "Opening your hip and twisting to one side."
},
"Single-leg RDL (bodyweight)": {
"v": "Zfr6wizR8rs",
"s": [
"Stand on one leg with arms out for balance.",
"Hinge forward and reach your free leg straight back.",
"Return to standing slowly. Keep your hips level."
],
"x": "Rushing, which ruins your balance."
},
"Lateral lunge": {
"v": "Vx6mQXEj8kw",
"s": [
"Stand with feet together, then step wide to one side.",
"Sit back into that hip, keeping the other leg straight.",
"Push off to return to the middle."
],
"x": "Letting the bent knee cave inwards."
},
"Lateral lunge reach": {
"v": "Vx6mQXEj8kw",
"s": [
"Step wide to one side and sit into that hip.",
"Reach both hands towards the foot of the bent leg.",
"Push back to standing."
],
"x": "Rounding your back to reach further."
},
"Dead bug": {
"v": "-gRN_JyVTLY",
"s": [
"Lie on your back, arms up, knees bent at 90° over your hips.",
"Press your lower back into the floor.",
"Slowly lower the opposite arm and leg, then return and switch."
],
"x": "Your lower back arching off the floor."
},
"Pallof press": {
"v": "SsQWYNxlYsQ",
"s": [
"Stand side-on to a band or cable at chest height.",
"Hold the handle at your chest, feet shoulder-width.",
"Press straight out and resist the twist for 2 seconds, then bring it back."
],
"x": "Letting the band rotate your body."
},
"Side plank": {
"v": "Ujf5ELfqI7o",
"s": [
"Lie on your side, elbow under your shoulder, feet stacked.",
"Lift your hips so your body forms a straight line.",
"Hold, breathing normally."
],
"x": "Hips sagging towards the floor."
},
"Hanging knee raise": {
"v": "FxbUkA7jhsM",
"s": [
"Hang from a bar with straight arms.",
"Curl your knees up towards your chest by tilting your pelvis.",
"Lower slowly without swinging."
],
"x": "Swinging your body to lift your legs."
},
"Plank walkout": {
"v": "aFkv2m9FTGs",
"s": [
"Stand, then bend down and put your hands on the floor.",
"Walk your hands out to a plank, keeping your hips still.",
"Walk back and stand up."
],
"x": "Hips swaying side to side."
},
"Hollow body hold": {
"v": "hf00_b2sRdc",
"s": [
"Lie on your back, arms by your ears, legs straight.",
"Press your lower back down and lift your shoulders and feet.",
"Hold the banana shape. Bend your knees to make it easier."
],
"x": "Lower back lifting off the floor."
},
"Farmer's carry": {
"v": "z7E_YU9P1jU",
"s": [
"Pick up a heavy weight in each hand.",
"Stand tall, shoulders back and down.",
"Walk with short quick steps, gripping hard."
],
"x": "Leaning or letting your shoulders round forward."
},
"Farmer's carry or bear crawl": {
"v": "z7E_YU9P1jU",
"s": [
"Carry a heavy weight in each hand, standing tall.",
"Walk with short, controlled steps.",
"Or bear crawl: knees an inch off the floor, opposite hand and foot."
],
"x": "Rushing and losing your posture."
},
"Suitcase carry": {
"v": "y-hn_Ha1-RE",
"s": [
"Hold one heavy weight in one hand only.",
"Stand perfectly tall without leaning away from it.",
"Walk slowly, then switch hands."
],
"x": "Leaning towards or away from the weight."
},
"Bear crawl": {
"v": "Gb2e9edK8a4",
"s": [
"Start on hands and knees, then lift your knees an inch off the floor.",
"Move opposite hand and foot forward together.",
"Keep your back flat and hips low."
],
"x": "Hips shooting up high."
},
"Box jump": {
"v": "3INzGHuk23U",
"s": [
"Stand a short step from the box.",
"Swing your arms and jump, landing softly on the box with both feet.",
"Stand tall on top, then step down. Never jump down."
],
"x": "Using a box so high you land in a deep squat."
},
"Med-ball chest pass": {
"v": "pJ8amgzbZMM",
"s": [
"Stand facing a wall holding the ball at your chest.",
"Step forward and explosively throw the ball into the wall.",
"Catch it and reset."
],
"x": "Throwing with just your arms."
},
"Broad jump": {
"v": "z1IDJMMg024",
"s": [
"Feet hip-width, swing your arms back.",
"Swing forward and jump as far as you can.",
"Land softly on both feet with knees bent and hold the landing."
],
"x": "Landing stiff-legged."
},
"Med-ball slam": {
"v": "CkO1mfSBvv4",
"s": [
"Lift the ball overhead, reaching tall.",
"Slam it into the floor as hard as you can, using your whole body.",
"Pick it up with a squat and repeat."
],
"x": "Rounding your back to pick the ball up."
},
"Squat jump": {
"v": "tZSYZdtbONc",
"s": [
"Stand feet shoulder-width.",
"Dip quickly into a quarter squat and jump as high as you can.",
"Land softly, bending your knees, and reset."
],
"x": "Knees caving in on landing."
},
"Hang power clean": {
"v": "eS6VypYM3kc",
"s": [
"Stand with the bar at your hips, grip just outside your legs.",
"Dip slightly, then jump and shrug hard.",
"Pull yourself under and catch the bar on your shoulders, elbows high. Learn this from a coach first."
],
"x": "Pulling with your arms before your legs finish."
},
"Plyo push-up": {
"v": "MH4gcTKQiEc",
"s": [
"Start in a strong push-up position.",
"Lower, then push so hard your hands leave the floor.",
"Land softly with bent elbows and go straight into the next rep."
],
"x": "Landing with locked elbows."
},
"Dumbbell curl": {
"v": "6DeLZ6cbgWQ",
"s": [
"Stand tall, dumbbells at your sides, palms forward.",
"Curl up keeping your elbows pinned to your sides.",
"Lower slowly to straight arms."
],
"x": "Swinging your body to lift the weight."
},
"Cable triceps pressdown": {
"v": "ylk5P1FqdLE",
"s": [
"Face the cable with a bar or rope at chest height.",
"Keep your elbows tucked at your sides.",
"Push down until your arms are straight, then return slowly."
],
"x": "Elbows drifting forward."
},
"Band curl": {
"v": "RyWX9e7imhc",
"s": [
"Stand on the band, handles at your sides.",
"Curl up, elbows pinned.",
"Lower slowly against the band."
],
"x": "Letting the band snap your arms down."
},
"Diamond push-up": {
"v": "_4EGPVJuqfA",
"s": [
"Put your hands together under your chest, thumbs and fingers forming a diamond.",
"Lower your chest towards your hands, elbows brushing your ribs.",
"Push back up."
],
"x": "Flaring your elbows out wide."
},
"Overhead dumbbell triceps extension": {
"v": "YM8iX9BJWjA",
"s": [
"Hold one dumbbell overhead with both hands.",
"Bend your elbows to lower it behind your head, elbows pointing forward.",
"Straighten your arms to lift it back up."
],
"x": "Arching your back."
},
"Chin-up hold": {
"v": "QWaY882IjKg",
"s": [
"Grip the bar with palms facing you.",
"Pull or jump to chin over the bar.",
"Hold strong, chest up, for the set time."
],
"x": "Letting your chin slowly sink below the bar."
},
"Bench dip": {
"v": "WVeZDBhZwLA",
"s": [
"Hands on the bench edge behind you, legs out in front.",
"Lower by bending your elbows to about 90°.",
"Push back up to straight arms."
],
"x": "Going so deep it hurts the front of your shoulders."
},
"Hack squat": {
"v": "hglQExHCM9Q",
"s": [
"Back flat on the pad, shoulders under the pads, feet shoulder-width.",
"Lower until your thighs are parallel or deeper.",
"Drive back up through your whole foot."
],
"x": "Lifting your heels off the platform."
},
"Smith machine squat": {
"v": "DUWK_gKcRCc",
"s": [
"Set the bar on your upper back, feet slightly in front of the bar.",
"Unhook and sit straight down.",
"Drive up, keeping your back against the bar path."
],
"x": "Feet directly under the bar, which strains the knees."
},
"Belt squat": {
"v": "FCIZZvIM-I0",
"s": [
"Attach the belt around your hips and stand on the platform.",
"Stay tall and squat down.",
"Push the platform away to stand."
],
"x": "Leaning far forward."
},
"Landmine squat": {
"v": "YxaXaZxVcDU",
"s": [
"Hold the end of the bar at your chest.",
"Lean slightly into the bar and sit down between your heels.",
"Stand tall again."
],
"x": "Letting your chest collapse."
},
"Sandbag front squat": {
"v": "oWBFjZBCIu0",
"s": [
"Hug the sandbag high against your chest.",
"Brace and squat down with elbows inside your knees.",
"Stand up tall."
],
"x": "Letting the bag slip down and pull you forward."
},
"Weighted vest squat": {
"v": "IzgwYIgmD5U",
"s": [
"Put on the vest and tighten it.",
"Squat to full depth with your chest up.",
"Drive back up."
],
"x": "Using a vest so heavy your form breaks."
},
"Hex bar deadlift": {
"v": "tpUKFfIFG24",
"s": [
"Stand in the middle of the bar and grip the handles.",
"Hips down, chest up, back flat.",
"Push the floor away and stand tall."
],
"x": "Hips shooting up first."
},
"Trap bar carry": {
"v": "tpUKFfIFG24",
"s": [
"Deadlift the trap bar to standing.",
"Stay tall and walk with short steps.",
"Set it down with a flat back."
],
"x": "Rounding your back to pick it up."
},
"Kettlebell deadlift": {
"v": "sDbMsk3d6F4",
"s": [
"Stand with the bell between your feet.",
"Hinge your hips back and grip it with a flat back.",
"Stand up by driving your hips forward."
],
"x": "Squatting down with a rounded back."
},
"Back extension": {
"v": "G67phY3O-yk",
"s": [
"Set the pad just below your hips.",
"Lower your torso by hinging at the hips.",
"Squeeze your glutes to rise until your body is straight."
],
"x": "Over-arching your back at the top."
},
"Glute-ham raise": {
"v": "TzowfEB3NqI",
"s": [
"Lock your feet in, knees on the pad, body upright.",
"Lower your body forward slowly, staying straight from knees to head.",
"Pull yourself back up with your hamstrings. Very hard: use a band or push off the floor."
],
"x": "Bending at the hips to make it easier."
},
"Hip thrust machine": {
"v": "UlljOYPM57U",
"s": [
"Sit in the machine with the pad across your hips.",
"Feet flat, chin tucked.",
"Drive your hips up and squeeze for one second."
],
"x": "Arching your back to finish."
},
"Smith machine hip thrust": {
"v": "qWhloAdOIBc",
"s": [
"Upper back on a bench, Smith bar padded over your hips.",
"Feet flat, shins vertical at the top.",
"Drive up, squeeze, lower slowly."
],
"x": "Pushing through your toes."
},
"Cable pull-through": {
"v": "yXopOhzEoeo",
"s": [
"Face away from a low cable with the rope between your legs.",
"Hinge back, letting the rope pull through.",
"Snap your hips forward to stand tall."
],
"x": "Pulling with your arms."
},
"Machine chest press": {
"v": "n8TOta_pfr4",
"s": [
"Set the seat so the handles line up with mid-chest.",
"Press forward until your arms are nearly straight.",
"Return slowly to a stretch."
],
"x": "Shoulders rolling forward off the pad."
},
"Smith machine bench press": {
"v": "7FyJdsXeta8",
"s": [
"Lie so the bar lines up with your lower chest.",
"Unhook and lower to your chest.",
"Press up and squeeze your chest."
],
"x": "Elbows flared at 90°."
},
"Incline barbell press": {
"v": "SrqOu55lrYU",
"s": [
"Set the bench to about 30°, eyes under the bar.",
"Lower the bar to your upper chest.",
"Press up. Use a spotter or safeties."
],
"x": "Bouncing the bar."
},
"Decline dumbbell press": {
"v": "k9CzXmJcJNw",
"s": [
"Hook your feet and lie back on the decline bench.",
"Press the dumbbells over your lower chest.",
"Lower to a stretch, then press."
],
"x": "Letting the weights drift towards your face."
},
"Pec deck fly": {
"v": "hZ0CGRaKwbQ",
"s": [
"Sit tall with forearms or hands on the pads.",
"Bring the pads together in a hugging motion.",
"Return slowly until you feel a chest stretch."
],
"x": "Going too far back and straining your shoulders."
},
"Cable fly": {
"v": "QcTcWpkn_bw",
"s": [
"Stand between two cables, one step forward.",
"Slight bend in the elbows, bring your hands together in an arc.",
"Return slowly to a stretch."
],
"x": "Bending your elbows a lot, which turns it into a press."
},
"Parallel-bar dip": {
"v": "U7HeutDqS_w",
"s": [
"Support yourself on straight arms between the bars.",
"Lean slightly forward and lower until your shoulders reach elbow level.",
"Push back up."
],
"x": "Dropping too deep with shoulder pain."
},
"Assisted dip": {
"v": "kbmVlw-i0Vs",
"s": [
"Kneel or stand on the assistance pad and grip the handles.",
"Lower until your elbows reach 90°.",
"Press back up."
],
"x": "Shrugging your shoulders up to your ears."
},
"Machine-assisted dip": {
"v": "kbmVlw-i0Vs",
"s": [
"Kneel on the pad, hands on the handles.",
"Stay upright to focus on triceps and lower to 90°.",
"Press to straight arms."
],
"x": "Leaning far forward."
},
"Ring push-up": {
"v": "dSRY2IHqOsI",
"s": [
"Set rings a few inches off the floor and hold them.",
"Keep the rings close to your body as you lower.",
"Push up and turn your hands out at the top."
],
"x": "Letting the rings drift apart."
},
"Suspension chest press": {
"v": "iK2SixlGoUg",
"s": [
"Face away from the anchor holding the handles.",
"Lean forward into the straps, body straight.",
"Lower your chest between your hands, then press back."
],
"x": "Hips sagging."
},
"Parallette push-up": {
"v": "zl0YHnh7H3c",
"s": [
"Grip the parallettes, body straight.",
"Lower your chest below your hands.",
"Press back up."
],
"x": "Going deeper than your shoulders can control."
},
"Machine shoulder press": {
"v": "e5gJP7quyGk",
"s": [
"Adjust the seat so the handles start at shoulder height.",
"Press up until your arms are nearly straight.",
"Lower under control."
],
"x": "Arching your back off the pad."
},
"Smith machine overhead press": {
"v": "kYZ0aUEzgEQ",
"s": [
"Sit on a bench under the bar, chin height start.",
"Press the bar straight up.",
"Lower to chin height."
],
"x": "Bringing the bar behind your neck."
},
"Landmine press": {
"v": "7Sv6hfQNFAA",
"s": [
"Hold the bar end at your shoulder, staggered stance.",
"Press up and forward until your arm is straight.",
"Lower slowly."
],
"x": "Leaning back to push the bar."
},
"Kettlebell press": {
"v": "X-uFqWtjpGI",
"s": [
"Rack the bell on the back of your forearm at your shoulder.",
"Brace, squeeze your glutes, press straight up.",
"Lower back to the rack position."
],
"x": "Letting your wrist bend backwards."
},
"Arnold press": {
"v": "6Z15_WdXmVw",
"s": [
"Start with dumbbells at chin height, palms facing you.",
"Rotate your palms forward as you press up.",
"Reverse the rotation on the way down."
],
"x": "Rushing the rotation."
},
"Machine row": {
"v": "QpLTp2AJ_cI",
"s": [
"Chest on the pad, grab the handles.",
"Pull your elbows back and squeeze your shoulder blades.",
"Return slowly."
],
"x": "Lifting your chest off the pad."
},
"T-bar row": {
"v": "oa-WYYfTYcM",
"s": [
"Straddle the bar, hinge forward with a flat back.",
"Row the handle to your lower chest.",
"Lower to a full stretch."
],
"x": "Standing up as you row."
},
"Suspension row": {
"v": "N_14s8zFOms",
"s": [
"Hold the handles and lean back, body straight.",
"Pull your chest to your hands.",
"Lower slowly. Walk your feet forward to make it harder."
],
"x": "Hips dropping."
},
"Ring row": {
"v": "VQn3aGSUorc",
"s": [
"Hold the rings and lean back with straight arms.",
"Pull the rings to your ribs.",
"Lower slowly."
],
"x": "Bending at the hips."
},
"Face pull": {
"v": "eTCBSFlCJ_s",
"s": [
"Set a rope at face height.",
"Pull towards your forehead, splitting the rope and turning your thumbs back.",
"Return slowly."
],
"x": "Using too much weight and leaning back."
},
"Reverse pec deck": {
"v": "hmtnyIGgR9A",
"s": [
"Sit facing the pad, handles at shoulder height.",
"Open your arms wide in an arc.",
"Return slowly."
],
"x": "Shrugging."
},
"Kettlebell row": {
"v": "ApvGZS9IIkM",
"s": [
"Hinge forward with a flat back, bell in one hand.",
"Row it to your hip.",
"Lower to a stretch."
],
"x": "Twisting your torso."
},
"Assisted pull-up": {
"v": "gnElpp3Fm50",
"s": [
"Kneel on the pad and grip the handles.",
"Pull your chin above the handles.",
"Lower to straight arms."
],
"x": "Using so much assistance it's too easy."
},
"Chin-up": {
"v": "el1Aa5jrlhg",
"s": [
"Grip the bar palms facing you, shoulder-width.",
"Pull your chest towards the bar.",
"Lower to a full hang."
],
"x": "Half reps."
},
"Straight-arm pulldown": {
"v": "lJsiuRq7Bts",
"s": [
"Face a high cable with a bar or rope.",
"Arms long, sweep the bar down to your thighs.",
"Return slowly overhead."
],
"x": "Bending your elbows."
},
"Smith machine split squat": {
"v": "7PKpCGcyMPQ",
"s": [
"Bar on your back, long split stance.",
"Drop your back knee towards the floor.",
"Drive up through your front foot."
],
"x": "Stance too short."
},
"Weighted vest step-up": {
"v": "d4p6Jy6KUO4",
"s": [
"Wear the vest and stand facing a box.",
"Step up driving through the top foot.",
"Lower slowly."
],
"x": "Pushing off the bottom foot."
},
"Kettlebell reverse lunge": {
"v": "wmk1hCgalrE",
"s": [
"Hold the bell at your chest.",
"Step back into a lunge.",
"Drive back up."
],
"x": "Leaning forward."
},
"Sandbag lunge": {
"v": "C_j8d6cofh8",
"s": [
"Hold the bag on one shoulder.",
"Lunge with an upright torso.",
"Switch shoulders halfway."
],
"x": "Twisting under the load."
},
"Leg extension": {
"v": "xAUvXdHu1sI",
"s": [
"Sit with the pad on your lower shins, knees in line with the pivot.",
"Straighten your legs and pause at the top.",
"Lower slowly."
],
"x": "Swinging the weight."
},
"Leg curl": {
"v": "kLJlqfn_bDM",
"s": [
"Lie face-down with the pad just above your heels.",
"Curl your heels towards your glutes.",
"Lower for three seconds."
],
"x": "Hips lifting off the pad."
},
"Standing calf raise": {
"v": "4HQ8Am9IuME",
"s": [
"Stand with the balls of your feet on an edge.",
"Lower your heels to a deep stretch.",
"Rise as high as you can and pause."
],
"x": "Bouncing."
},
"Hip abduction": {
"v": "5O_Y9l__iao",
"s": [
"Sit with pads on the outsides of your knees.",
"Push your knees out against the pads.",
"Return slowly."
],
"x": "Using momentum."
},
"Stability ball hamstring curl": {
"v": "8Wagn999nhA",
"s": [
"Lie on your back, heels on the ball.",
"Lift your hips, then curl the ball in with your heels.",
"Roll it out slowly, keeping your hips up."
],
"x": "Hips dropping."
},
"Mini-band lateral walk": {
"v": "ReT_5fnUe6k",
"s": [
"Band above your knees or ankles, half squat.",
"Step sideways, keeping tension.",
"Keep your knees pushed out."
],
"x": "Feet coming together."
},
"Nordic hamstring curl": {
"v": "3-4pKUhkzoQ",
"s": [
"Kneel with your ankles anchored.",
"Lower your body forward as slowly as you can, straight from knees to head.",
"Catch yourself with your hands and push back up."
],
"x": "Bending at the hips."
},
"Wall sit": {
"v": "JaZNYM3zAP0",
"s": [
"Back flat against a wall.",
"Slide down until your thighs are parallel to the floor.",
"Hold."
],
"x": "Hands pushing on your thighs."
},
"Ab wheel rollout": {
"v": "PK4n7qJpOhM",
"s": [
"Kneel holding the wheel under your shoulders.",
"Roll out slowly with your ribs down.",
"Pull back using your abs."
],
"x": "Lower back sagging."
},
"Machine crunch": {
"v": "0kLWho-pEdQ",
"s": [
"Sit and hold the handles.",
"Curl your ribs towards your hips.",
"Return slowly."
],
"x": "Pulling with your arms."
},
"Cable crunch": {
"v": "0KEP6A1deBE",
"s": [
"Kneel facing a high cable, rope beside your head.",
"Curl your ribs down towards your knees.",
"Return slowly."
],
"x": "Sitting back on your heels."
},
"Stability ball rollout": {
"v": "Vzh4IiEE_jU",
"s": [
"Kneel with forearms on the ball.",
"Roll forward until your body is long.",
"Pull back with your abs."
],
"x": "Back arching."
},
"Suspension body saw": {
"v": "HmyWstLop08",
"s": [
"Feet in the straps, forearm plank.",
"Push your body backwards and forwards from your shoulders.",
"Keep your body straight."
],
"x": "Hips piking up."
},
"Landmine rotation": {
"v": "ZSkBWzDfB5U",
"s": [
"Hold the bar end at arm's length overhead.",
"Rotate it to one hip, then the other.",
"Turn through your hips and feet."
],
"x": "Bending your arms."
},
"Medicine ball Russian twist": {
"v": "DLpMtMZnpy0",
"s": [
"Sit, lean back slightly, feet down or up.",
"Rotate the ball side to side.",
"Keep your chest tall."
],
"x": "Rounding your back."
},
"L-sit hold": {
"v": "SSObIetKzoE",
"s": [
"Support yourself on straight arms.",
"Lift your legs out straight in front.",
"Hold. Bend your knees to make it easier."
],
"x": "Shoulders shrugging up."
},
"Hanging leg raise": {
"v": "JXztA3fLp50",
"s": [
"Hang with straight arms.",
"Raise straight legs to hip height or higher.",
"Lower slowly."
],
"x": "Swinging."
},
"Sled push": {
"v": "1PmO6kzBEc8",
"s": [
"Grip the handles with arms long.",
"Lean at a low angle.",
"Drive with short, powerful steps."
],
"x": "Standing too upright."
},
"Sled drag": {
"v": "hbCeJFBFyYk",
"s": [
"Hold the strap and face the sled.",
"Walk backwards in a low squat.",
"Keep steady tension."
],
"x": "Leaning back too far."
},
"Sandbag bear-hug carry": {
"v": "eMJ4g9eQ5vs",
"s": [
"Hug the bag tight to your chest.",
"Stand tall.",
"Walk with short steps."
],
"x": "Leaning back."
},
"Plate pinch carry": {
"v": "iQnSTXgf-Gs",
"s": [
"Pinch plates smooth side out in each hand.",
"Stand tall.",
"Walk slowly."
],
"x": "Letting the plates slide."
},
"Battle rope slams": {
"v": "zJVbXefebRI",
"s": [
"Hold the ropes, athletic stance.",
"Lift both arms high.",
"Slam the ropes down hard and repeat."
],
"x": "Using only your arms."
},
"Sled sprint": {
"v": "jIqTuErNI1Y",
"s": [
"Use a light sled.",
"Lean forward and sprint 10–15 m.",
"Rest fully between reps."
],
"x": "Loading it so heavy you can't sprint."
},
"Hurdle hops": {
"v": "J3gEHtnqBkU",
"s": [
"Line up mini hurdles.",
"Hop over each with quick, springy contacts.",
"Land on the balls of your feet."
],
"x": "Pausing between hurdles."
},
"Agility ladder quick feet": {
"v": "Kb0bfAGiub8",
"s": [
"Stand at the start of the ladder.",
"Tap fast feet into each square.",
"Stay light on the balls of your feet."
],
"x": "Looking down the whole time."
},
"Landmine push press": {
"v": "6aVFcQmSrVc",
"s": [
"Hold the bar end at your shoulder.",
"Dip your knees, then drive.",
"Press explosively to arm's length."
],
"x": "Pressing with your arm only."
},
"Sandbag clean": {
"v": "UGaAWKc1wGw",
"s": [
"Straddle the bag, flat back.",
"Lap it onto your thighs, then explode your hips.",
"Catch it on your chest."
],
"x": "Rounding your back."
},
"Jump rope bursts": {
"v": "FJmRQ5iTXKE",
"s": [
"Elbows close, turn with your wrists.",
"Jump low on the balls of your feet.",
"Go fast for the set time."
],
"x": "Jumping too high."
},
"EZ-bar curl": {
"v": "SDFZBaJcTsU",
"s": [
"Grip the angled part of the bar.",
"Curl with elbows still.",
"Lower slowly."
],
"x": "Swinging your back."
},
"Preacher curl": {
"v": "BPmUhDtdQfw",
"s": [
"Armpits on the pad, arms straight.",
"Curl up.",
"Lower to a full stretch."
],
"x": "Bouncing at the bottom."
},
"Cable curl": {
"v": "pEVXvlVKm80",
"s": [
"Face a low cable.",
"Curl with elbows pinned.",
"Lower slowly."
],
"x": "Leaning back."
},
"EZ-bar skull crusher": {
"v": "GaK2da6B2zM",
"s": [
"Lie on a bench holding the bar over your chest.",
"Bend your elbows to lower the bar behind your head.",
"Extend back up."
],
"x": "Elbows flaring out."
},
"Suspension biceps curl": {
"v": "Pa8Mls8saXc",
"s": [
"Face the anchor, hold the handles, lean back.",
"Curl yourself towards your hands.",
"Lower slowly."
],
"x": "Hips dropping."
},
"Copenhagen plank": {
"v": "TH7B8ppYXOc",
"s": [
"Side plank with your top leg on a bench.",
"Lift your hips.",
"Hold. Put the knee on the bench to make it easier."
],
"x": "Hips sagging."
},
"Lateral bound and stick": {
"v": "Biqvx8sMuvs",
"s": [
"Stand on one leg.",
"Bound sideways onto the other leg.",
"Stick the landing for 2 seconds."
],
"x": "Knee collapsing inwards."
},
"Single-leg calf raise": {
"v": "Ux47hU-ePXs",
"s": [
"Stand on one foot on a step edge.",
"Lower your heel.",
"Rise up high."
],
"x": "Bending your knee."
},
"Drop landing": {
"v": "GWOlQK0u0UA",
"s": [
"Step off a low box.",
"Land on both feet, knees bent and over your toes.",
"Hold the landing quietly."
],
"x": "Stiff, loud landings."
},
"Rotational med-ball throw (or band rotation)": {
"v": "NP2e1Szrj28",
"s": [
"Stand side-on to a wall.",
"Rotate back, then throw the ball into the wall.",
"Power comes from your hips."
],
"x": "Throwing with just your arms."
},
"Band external rotation": {
"v": "8UZT_SElGlc",
"s": [
"Elbow tucked at your side, holding the band.",
"Rotate your forearm outwards.",
"Return slowly."
],
"x": "Elbow leaving your side."
},
"Side plank with reach": {
"v": "OJoQj2HLcv4",
"s": [
"Side plank on your elbow.",
"Reach your top arm under your body.",
"Open back up to the ceiling."
],
"x": "Hips dropping."
},
"Split-step to lunge reaction": {
"v": "gy4YZS5tGxE",
"s": [
"Small hop to land in an athletic stance.",
"React and lunge in a direction.",
"Recover to the middle."
],
"x": "Landing flat-footed."
},
"Lateral shuffle": {
"v": "mziPKITnPeQ",
"s": [
"Athletic stance, chest up.",
"Shuffle sideways without crossing your feet.",
"Stay low."
],
"x": "Bouncing up and down."
},
"Lateral shuffle and cut": {
"v": "mziPKITnPeQ",
"s": [
"Shuffle sideways in a low stance.",
"Plant your outside foot.",
"Cut hard the other way."
],
"x": "Knee caving on the plant."
},
"Band pull-apart": {
"v": "smSSXITNpCI",
"s": [
"Hold the band in front at shoulder height.",
"Pull it apart to your chest.",
"Return slowly."
],
"x": "Shrugging."
},
"Streamline hollow hold": {
"v": "3DfXrVU_K94",
"s": [
"Lie on your back, arms overhead in a streamline.",
"Lift into a hollow body shape.",
"Hold, squeezing your arms to your ears."
],
"x": "Arching your back."
},
"A-skips": {
"v": "rWZdDUGFjoI",
"s": [
"March forward with a skip.",
"Drive one knee up to hip height.",
"Strike down under your hips."
],
"x": "Leaning back."
},
"Pogo hops": {
"v": "jj-0qlVuM3w",
"s": [
"Hop in place with nearly straight knees.",
"Bounce off the balls of your feet.",
"Keep ground contacts short."
],
"x": "Sinking into your heels."
},
"Hip airplane": {
"v": "d3c8xHzprzs",
"s": [
"Stand on one leg in a hinge.",
"Rotate your hips open and closed.",
"Move slowly with control."
],
"x": "Losing your balance by rushing."
},
"Approach jump and stick": {
"v": "A5LAxy-fD0I",
"s": [
"Take a 2–3 step approach.",
"Jump vertically, arms driving up.",
"Land soft on both feet and hold."
],
"x": "Landing with knees together."
},
"Neck isometrics (4 ways)": {
"v": "OXDTBMXXHVo",
"s": [
"Place your hand on your forehead.",
"Push gently without moving your head for 10 seconds.",
"Repeat for the back and both sides."
],
"x": "Pushing hard enough to cause pain."
},
"Sprawl to sprint": {
"v": "YyA0JAnK5l8",
"s": [
"Drop into a sprawl, hips to the floor.",
"Pop up quickly.",
"Sprint 5 metres."
],
"x": "Slow pop-up."
},
"90/90 hip switch": {
"v": "HUZimFZJZWU",
"s": [
"Sit with both knees bent at 90°.",
"Rotate both knees to the other side.",
"Stay tall through your chest."
],
"x": "Rounding your back."
},
"Wrist prep circles and rocks": {
"v": "SV3HI95IfhE",
"s": [
"Make slow circles with your wrists.",
"On hands and knees, rock gently forwards and back.",
"Change hand positions each set."
],
"x": "Forcing painful ranges."
},
"Scapular pull-up (or wall slide)": {
"v": "r1gC1F1y3rw",
"s": [
"Hang from a bar with straight arms.",
"Pull your shoulder blades down without bending your elbows.",
"Relax back down."
],
"x": "Bending your arms."
},
"Couch stretch": {
"v": "nTJaGnjUkTY",
"s": [
"Kneel with your back foot up a wall or couch.",
"Squeeze your glute and stand your torso up.",
"Hold 45 seconds per side."
],
"x": "Arching your lower back."
},
"Thoracic open book": {
"v": "rDviWORCWEw",
"s": [
"Lie on your side, knees bent, arms stacked.",
"Open your top arm across to the other side.",
"Follow your hand with your eyes."
],
"x": "Letting your knees come apart."
}
};
