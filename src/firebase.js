import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDELepscUxcR8ZoaV6Euy2dc0BwVDRI7_Q",
  authDomain: "kisan-bazar-e3b91.firebaseapp.com",
  projectId: "kisan-bazar-e3b91",
  storageBucket: "kisan-bazar-e3b91.firebasestorage.app",
  messagingSenderId: "95992417533",
  appId: "1:95992417533:web:c1adbaa7e347dd6791c294",
  measurementId: "G-23BK0LRX2T"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };
