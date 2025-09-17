import { storage } from '@/firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

/**
 * Upload a local file (URI) to Firebase Storage and return the public download URL.
 * Example: await uploadImageToStorage(localUri, `ids/nin/front-${Date.now()}.jpg`)
 */
export async function uploadImageToStorage(localUri: string, path: string): Promise<string> {
  // Fetch the data and create a Blob (React Native fetch supports blobs)
  const res = await fetch(localUri);
  const blob = await res.blob();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}
