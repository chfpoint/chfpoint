import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC7mn59Qlg98xN2SyY3QcVE4CUnQyfJaF8",
  authDomain: "chfpoint-update.firebaseapp.com",
  projectId: "chfpoint-update",
  storageBucket: "chfpoint-update.firebasestorage.app",
  messagingSenderId: "906891157923",
  appId: "1:906891157923:web:c2066b2079fbbf62e47a16"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);