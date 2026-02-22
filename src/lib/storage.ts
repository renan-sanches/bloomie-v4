import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

export const uploadPlantPhoto = async (
  uid: string,
  plantId: string,
  file: File
): Promise<string> => {
  const storageRef = ref(storage, `users/${uid}/plants/${plantId}/photo`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const uploadGrowthPhoto = async (
  uid: string,
  plantId: string,
  file: File
): Promise<string> => {
  const name = `growth_${Date.now()}`;
  const storageRef = ref(storage, `users/${uid}/plants/${plantId}/growth/${name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const deletePlantPhoto = (uid: string, plantId: string) =>
  deleteObject(ref(storage, `users/${uid}/plants/${plantId}/photo`));
