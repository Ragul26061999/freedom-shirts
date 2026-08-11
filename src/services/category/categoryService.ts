import { db } from '@/lib/firebase/client';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { CategoryType } from '../../types';
import { toUserFacingQueryError } from '@/utils/errorHandling';

export const categoryService = {
  async getCategories(): Promise<CategoryType[]> {
    try {
      const q = query(collection(db, 'categories'), orderBy('name'));
      const snapshot = await getDocs(q);
      
      const serializeDate = (val: any) => val && typeof val.toDate === 'function' ? val.toDate().toISOString() : val;
      
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          created_at: serializeDate(data.created_at),
          updated_at: serializeDate(data.updated_at)
        } as unknown as CategoryType;
      });
    } catch (error) {
      throw error instanceof Error
        ? error
        : toUserFacingQueryError('Categories', {});
    }
  },

  async getCategoryById(id: number | string): Promise<CategoryType | null> {
    try {
      const docRef = doc(db, 'categories', String(id));
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      const serializeDate = (val: any) => val && typeof val.toDate === 'function' ? val.toDate().toISOString() : val;
      
      return {
        id: docSnap.id,
        ...data,
        created_at: serializeDate(data.created_at),
        updated_at: serializeDate(data.updated_at)
      } as unknown as CategoryType;
    } catch (error) {
      throw error instanceof Error
        ? error
        : toUserFacingQueryError('Category', {});
    }
  },
};
