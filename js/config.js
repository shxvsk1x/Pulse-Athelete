/* =========================================================
   PULSE — settings you can change
   ========================================================= */
window.PULSE_CONFIG = {
  /* Paste your Firebase web app config here (Firebase console → Project settings →
     Your apps → Web app → "SDK setup and configuration" → Config).
     While this is null, Pulse runs in demo mode: accounts and the coach view
     work, but only inside this one browser. */
  firebase: null,
  // firebase: {
  //   apiKey: '...',
  //   authDomain: 'your-project.firebaseapp.com',
  //   projectId: 'your-project',
  //   appId: '...'
  // },

  /* Schools that can use Pulse. The id must match the document name you create
     under "schools" in Firestore (that document holds the coach access code). */
  schools: [
    { id: 'vasant-valley', name: 'Vasant Valley School' }
  ],

  /* Grades students can pick. */
  grades: ['6', '7', '8', '9', '10', '11', '12'],

  /* Demo mode only: the code a coach types to create a coach account.
     With Firebase, each school's code lives in Firestore instead (see README). */
  demoCoachCode: 'PULSE-COACH'
};
