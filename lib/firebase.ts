import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCO7pml8GNg0mf7w9JW-49pqNJRXiWaLv0",
  authDomain: "booktick-45b15.firebaseapp.com",
  projectId: "booktick-45b15",
  storageBucket: "booktick-45b15.firebasestorage.app",
  messagingSenderId: "240186910203",
  appId: "1:240186910203:web:ed57ab3e8750ab2c43d75e",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);