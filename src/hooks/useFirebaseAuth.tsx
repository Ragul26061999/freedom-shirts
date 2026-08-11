import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

export function useFirebaseAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Map Firebase user to look somewhat like Supabase user for backwards compatibility
        const mappedUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          user_metadata: {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: firebaseUser.metadata.creationTime,
        };
        setUser(mappedUser);
        setSession({ user: mappedUser, access_token: await firebaseUser.getIdToken() });
        await ensureUserProfile(firebaseUser);
      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const ensureUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userEmail = firebaseUser.email || '';
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: firebaseUser.uid, email: userEmail }),
      });
    } catch (error: any) {
      console.error('Error in ensureUserProfile:', error?.message || JSON.stringify(error));
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Signed in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await ensureUserProfile(userCredential.user);
      }
      toast.success('Signed up successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign up');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut(auth);
      setUser(null);
      setSession(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { user, session, loading, signIn, signUp, signOut };
}
