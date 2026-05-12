import {getDownloadURL, ref, uploadBytes} from "firebase/storage";
import {storage} from "./firebase-config";

export async function uploadImage(file){
    if (!file) return null;

    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}