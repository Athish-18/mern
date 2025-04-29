// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'dwell-base.firebaseapp.com',
  projectId: 'dwell-base',
  storageBucket: 'dwell-base.firebasestorage.app', // ✅ Corrected
  messagingSenderId: '951257105783',
  appId: '1:951257105783:web:79e009ce21e63f92b30d72',
  measurementId: 'G-3SMMX25J5V',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// eslint-disable-next-line no-unused-vars
const analytics = getAnalytics(app);
