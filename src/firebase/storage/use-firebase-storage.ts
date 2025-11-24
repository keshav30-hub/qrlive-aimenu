'use client';

import { useState } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject, StorageReference } from 'firebase/storage';
import { useFirebase } from '@/firebase';

interface UseFirebaseStorageResult {
  uploadFile: (path: string, file: File) => Promise<{ downloadURL: string; storagePath: string } | null>;
  deleteFile: (storagePath: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export const useFirebaseStorage = (): UseFirebaseStorageResult => {
  const { storage } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async (path: string, file: File): Promise<{ downloadURL: string; storagePath: string } | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setIsLoading(false);
      return { downloadURL, storagePath: snapshot.ref.fullPath };
    } catch (e: any) {
      setError(e);
      setIsLoading(false);
      console.error("Error uploading file:", e);
      return null;
    }
  };

  const deleteFile = async (storagePath: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
      setIsLoading(false);
    } catch (e: any) {
       // A non-existent object is not an error for our use case.
      if (e.code !== 'storage/object-not-found') {
        setError(e);
        console.error("Error deleting file:", e);
      }
      setIsLoading(false);
    }
  };

  return { uploadFile, deleteFile, isLoading, error };
};
