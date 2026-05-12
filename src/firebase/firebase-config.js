// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {getFirestore} from 'firebase/firestore';
import { getStorage} from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCkylsuF-6LqE1vX87dzRxnB5-SE9ZJPb4",
    authDomain: "stalkers-bar.firebaseapp.com",
    projectId: "stalkers-bar",
    storageBucket: "stalkers-bar.firebasestorage.app",
    messagingSenderId: "964865110468",
    appId: "1:964865110468:web:6ad7551bd827b9c87a7491"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const storage = getStorage(app);
