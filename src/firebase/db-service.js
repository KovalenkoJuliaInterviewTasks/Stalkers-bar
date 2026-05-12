import {doc, setDoc, getDoc, deleteDoc, getDocs} from 'firebase/firestore';
import {collection, collectionData} from "rxfire/firestore";
import {db} from "./firebase-config";
export async function addProduct(productCollection, product){
    const ref = doc(productCollection, product.id);
    await setDoc(ref, product);
}
export async function addCategory(categoriesCollection, category){
    const ref = doc(categoriesCollection, category.name);
    await setDoc(ref, category);
}
export async function removeProduct(productCollection, id){
    const ref = doc(productCollection, id);
    await deleteDoc(ref);
}
export async function removeCategory(categoriesCollection, name){
    const ref = doc(categoriesCollection, name);
    await deleteDoc(ref);
}
export async function isCategoryExists(categoriesCollection, name){
    const ref = doc(categoriesCollection, name);
    return (await getDoc(ref)).exists();
}

export async function getCollection(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching collection:", error);
        return [];
    }
}