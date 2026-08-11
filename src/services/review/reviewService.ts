import { db, auth } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ReviewType, ProfileType } from '../../types';
import { toast } from 'sonner';

export const reviewService = {
  async getReviewsByProduct(productId: string): Promise<ReviewType[]> {
    try {
      const q = query(
        collection(db, 'reviews'),
        where('product_id', '==', productId)
      );
      
      const snapshot = await getDocs(q);
      const reviews = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let profile: ProfileType | undefined = undefined;
        
        if (data.user_id) {
          const profileDoc = await getDoc(doc(db, 'profiles', data.user_id));
          if (profileDoc.exists()) {
            const pd = profileDoc.data();
            profile = {
              profile_id: profileDoc.id,
              ...pd
            } as ProfileType;
          }
        }
        
        return {
          id: docSnap.id,
          ...data,
          created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString(),
          profile
        } as unknown as ReviewType;
      }));
      
      // Sort in memory to avoid needing a Firestore composite index
      reviews.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
      
      return reviews;
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast.error(error.message || 'Failed to fetch reviews');
      return [];
    }
  },

  async getReviewById(id: number | string): Promise<ReviewType | null> {
    try {
      const docSnap = await getDoc(doc(db, 'reviews', String(id)));
      if (!docSnap.exists()) return null;
      
      const data = docSnap.data();
      let profile: ProfileType | undefined = undefined;
        
      if (data.user_id) {
        const profileDoc = await getDoc(doc(db, 'profiles', data.user_id));
        if (profileDoc.exists()) {
          const pd = profileDoc.data();
          profile = {
            profile_id: profileDoc.id,
            ...pd
          } as ProfileType;
        }
      }
      
      return {
        id: docSnap.id,
        ...data,
        created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : new Date().toISOString(),
        profile
      } as unknown as ReviewType;
    } catch (error) {
      console.error('Error fetching review:', error);
      toast.error('Failed to fetch review');
      return null;
    }
  },

  async createReview(
    productId: string,
    rating: number,
    comment: string
  ): Promise<ReviewType | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('You must be logged in to leave a review');
        return null;
      }
      
      const newReview = {
        product_id: productId,
        user_id: user.uid,
        rating,
        comment,
        created_at: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'reviews'), newReview);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data()!;
      
      let profile: ProfileType | undefined = undefined;
      const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
      if (profileDoc.exists()) {
         profile = { profile_id: profileDoc.id, ...profileDoc.data() } as ProfileType;
      }

      return {
        id: docSnap.id,
        ...data,
        created_at: new Date().toISOString(),
        profile
      } as unknown as ReviewType;
    } catch (error: any) {
      console.error('Error creating review:', error);
      toast.error(error.message || 'Failed to create review');
      return null;
    }
  },

  async updateReview(
    id: number | string,
    rating: number,
    comment: string
  ): Promise<ReviewType | null> {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('You must be logged in to update a review');
        return null;
      }
      
      const reviewRef = doc(db, 'reviews', String(id));
      const reviewSnap = await getDoc(reviewRef);
      
      if (!reviewSnap.exists() || reviewSnap.data()?.user_id !== user.uid) {
        toast.error('Not authorized to update this review');
        return null;
      }
      
      await updateDoc(reviewRef, {
        rating,
        comment,
        updated_at: serverTimestamp()
      });
      
      const updatedSnap = await getDoc(reviewRef);
      const data = updatedSnap.data()!;
      
      return {
        id: updatedSnap.id,
        ...data,
        updated_at: new Date().toISOString()
      } as unknown as ReviewType;
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Something went wrong');
      return null;
    }
  },

  async deleteReview(id: number | string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('You must be logged in to delete a review');
        return false;
      }
      
      const reviewRef = doc(db, 'reviews', String(id));
      const reviewSnap = await getDoc(reviewRef);
      
      if (!reviewSnap.exists() || reviewSnap.data()?.user_id !== user.uid) {
        toast.error('Not authorized to delete this review');
        return false;
      }
      
      await deleteDoc(reviewRef);
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Something went wrong');
      return false;
    }
  }
};
