/* =========================================================
   PULSE — settings you can change
   ========================================================= */
window.PULSE_CONFIG = {
  /* Paste your Firebase web app config here (Firebase console → Project settings →
     Your apps → Web app → "SDK setup and configuration" → Config).
     While this is null, Pulse runs in demo mode: accounts and the coach view
     work, but only inside this one browser. */
  firebase: {
    apiKey: 'AIzaSyBt9m6A6ih86w5PvkJflspXUPWV8HEy7yA',
    authDomain: 'pulse-athlete.firebaseapp.com',
    projectId: 'pulse-athlete',
    storageBucket: 'pulse-athlete.firebasestorage.app',
    messagingSenderId: '437805527132',
    appId: '1:437805527132:web:f9c149d8e82663f7ce7699'
  },
  // firebase: {
  //   apiKey: '...',
  //   authDomain: 'your-project.firebaseapp.com',
  //   projectId: 'your-project',
  //   appId: '...'
  // },

  /* Schools listed here are suggested to everyone and have a ready-made id. Any other school
     can be typed in at sign-up and sets itself up. For a school listed here, create the coach
     access code yourself under "schools" in Firestore (document id = the id below). */
  schools: [
    { id: 'vasant-valley', name: 'Vasant Valley School' }
  ],

  /* Grades students can pick. */
  grades: ['6', '7', '8', '9', '10', '11', '12'],

  /* Demo mode only: the code a coach types to create a coach account.
     With Firebase, each school's code lives in Firestore instead (see README). */
  demoCoachCode: 'PULSE-COACH'
};
