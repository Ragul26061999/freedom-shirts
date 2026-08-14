'use server'

import { db } from '@/lib/firebase/admin';
import { ProfileType } from '@/types';

export async function getProfileById(userId: string): Promise<ProfileType | null> {
  try {
    const doc = await db.collection('profiles').doc(userId).get();
    if (!doc.exists) {
      return null;
    }
    const data = doc.data();
    if (data && data.created_at) {
      data.created_at = (typeof data.created_at === 'object' && 'toDate' in data.created_at) 
        ? data.created_at.toDate().toISOString() 
        : (typeof data.created_at === 'object' && ('_seconds' in data.created_at || 'seconds' in data.created_at)
            ? new Date((data.created_at.seconds || data.created_at._seconds) * 1000).toISOString()
            : new Date(data.created_at).toISOString());
    }
    if (data && data.updated_at) {
      data.updated_at = (typeof data.updated_at === 'object' && 'toDate' in data.updated_at) 
        ? data.updated_at.toDate().toISOString() 
        : (typeof data.updated_at === 'object' && ('_seconds' in data.updated_at || 'seconds' in data.updated_at)
            ? new Date((data.updated_at.seconds || data.updated_at._seconds) * 1000).toISOString()
            : new Date(data.updated_at).toISOString());
    }

    return { profile_id: doc.id, ...data } as ProfileType;
  } catch (error) {
    console.error(`Error fetching profile with id ${userId}:`, error);
    return null;
  }
}

export async function updateProfile(
  userId: string,
  profile: Partial<ProfileType>
): Promise<ProfileType | null> {
  try {
    if (!userId) {
      console.error('ProfileService - Invalid userId provided:', userId);
      return null;
    }

    if (profile.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (profile.email && !emailRegex.test(profile.email)) {
        console.error('ProfileService - Invalid email format:', profile.email);
        throw new Error('Invalid email format provided');
      }
    }

    const docRef = db.collection('profiles').doc(userId);
    await docRef.set(profile, { merge: true });
    const updatedDoc = await docRef.get();

    return { profile_id: updatedDoc.id, ...updatedDoc.data() } as ProfileType;
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error updating profile with id ${userId}:`, err);
    console.error('Error stack:', err.stack);
    return null;
  }
}

export async function createProfile(profile: ProfileType): Promise<ProfileType | null> {
  try {
    if (profile.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        console.error('ProfileService - Invalid email format in create:', profile.email);
        throw new Error('Invalid email format provided');
      }
    }

    const docRef = db.collection('profiles').doc(profile.profile_id);
    
    // Check if exists first to handle race conditions
    const existingDoc = await docRef.get();
    if (existingDoc.exists) {
      console.log('Successfully retrieved existing profile');
      return { profile_id: existingDoc.id, ...existingDoc.data() } as ProfileType;
    }

    const dataToSave = { ...profile };
    delete (dataToSave as any).profile_id;
    
    await docRef.set(dataToSave);
    const newDoc = await docRef.get();

    return { profile_id: newDoc.id, ...newDoc.data() } as ProfileType;
  } catch (error) {
    console.error('Error creating profile:', error);
    return null;
  }
}
