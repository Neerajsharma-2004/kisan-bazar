# Kisan Bazar — Final (Premium UI, React-Leaflet)

This package is a full, clean rebuild (Premium Market UI + React-Leaflet map) and is set up to work with Firebase Email/Password authentication and Firestore.

## Quick start
1. Install dependencies:
   npm install

2. Run dev server:
   npm run dev
   Open http://localhost:5173

## Firebase setup (optional but required for full features)
1. Create Firebase project and enable Email/Password in Authentication.
2. Create Firestore in the console.
3. Set Firestore rules (recommended) — see README_FIRESTORE_RULES.txt in project root.
4. Put your web config into `src/firebase.js` (already included with the config you gave).

## Seeding sample data
To seed Auth + Firestore you can run the included `seed_firestore_admin.cjs` script (locally):
1. npm i firebase-admin
2. Download service account JSON and place it as `serviceAccountKey.json` in the project root
3. node seed_firestore_admin.cjs

Default seeded accounts (if you run the seeder):
  ravi@example.com  -> password: Ravi@1234
  sarita@example.com -> password: Sarita@1234
  neeraj@example.com -> password: Neeraj@1234

After seeding, log in with these accounts on the site.

## Notes
- Leaflet version locked to 1.9.4 and react-leaflet 4.2.1 to avoid version mismatch issues.
- Images are stored as Base64 in Firestore when uploaded by farmers (no Storage required).
- Make sure to rotate/revoke the service account key after running the seeder.

