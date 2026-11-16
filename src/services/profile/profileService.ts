'use client';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { ProfileType } from '@/types';

const serializeDate = (value: unknown): unknown => {
  if (!value) return value;
  if (typeof value === 'object' && value !== null) {
    const maybeTimestamp = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof maybeTimestamp.toDate === 'function') {
      return maybeTimestamp.toDate().toISOString();
    }
    const seconds = maybeTimestamp.seconds ?? maybeTimestamp._seconds;
    if (typeof seconds === 'number') {
      return new Date(seconds * 1000).toISOString();
    }
  }
  return value;
};

function currentUserId(): string | null {
  return auth.currentUser?.uid ?? null;
}

export const profileService = {
  async getProfileById(userId: string): Promise<ProfileType | null> {
    try {
      const snap = await getDoc(doc(db, 'profiles', userId));
      if (!snap.exists()) return null;

      const data = snap.data();
      return {
        profile_id: snap.id,
        ...data,
        created_at: serializeDate(data.created_at),
        updated_at: serializeDate(data.updated_at),
      } as unknown as ProfileType;
    } catch (error) {
      console.error('Error in getProfileById:', error);
      return null;
    }
  },

  async getCurrentProfile(): Promise<ProfileType | null> {
    const userId = currentUserId();
    if (!userId) return null;
    return this.getProfileById(userId);
  },

  async updateProfile(
    userId: string,
    data: Partial<ProfileType>
  ): Promise<ProfileType | null> {
    try {
      const profileRef = doc(db, 'profiles', userId);
      const existing = await getDoc(profileRef);

      if (existing.exists()) {
        await updateDoc(profileRef, {
          ...data,
          updated_at: serverTimestamp(),
        });
      } else {
        await setDoc(profileRef, {
          ...data,
          email: data.email ?? auth.currentUser?.email ?? '',
          role: data.role ?? 'user',
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
      }

      return await this.getProfileById(userId);
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return null;
    }
  },

  async updateCurrentProfile(
    data: Partial<ProfileType>
  ): Promise<ProfileType | null> {
    const userId = currentUserId();
    if (!userId) return null;
    return this.updateProfile(userId, data);
  },

  /**
   * Upload an avatar through the authenticated Cloudinary endpoint.
   */
  async uploadAvatar(
    userId: string,
    file: File,
    _currentAvatarUrl?: string
  ): Promise<string | null> {
    try {
      if (!userId || !file) return null;

      const user = auth.currentUser;
      if (!user || user.uid !== userId) {
        throw new Error('You must be signed in to upload an avatar.');
      }

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/profile/upload-avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) {
        throw new Error(result.error || 'Failed to upload avatar.');
      }

      return result.url as string;
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return null;
    }
  },

  async deleteProfile(userId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'profiles', userId));
      return true;
    } catch (error) {
      console.error('Error in deleteProfile:', error);
      return false;
    }
  },

  async deleteCurrentProfile(): Promise<boolean> {
    const userId = currentUserId();
    if (!userId) return false;
    return this.deleteProfile(userId);
  },
};
