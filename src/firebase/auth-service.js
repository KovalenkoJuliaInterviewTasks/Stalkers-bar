import {
    signInWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import {auth} from "./firebase-config";

async function signInWithEmail(loginData){
    await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
    return loginData.email;
}

async function signInWithGoogle(){
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    return credential.user.email;
}

export async function loginFirebase(loginData){
    return loginData.email === 'GOOGLE' ? signInWithGoogle() : signInWithEmail(loginData);
}

export async function logoutFirebase(){
    await signOut(auth);
}

export async function signUpFirebase(loginData){
    await createUserWithEmailAndPassword(auth, loginData.email, loginData.password);
}
