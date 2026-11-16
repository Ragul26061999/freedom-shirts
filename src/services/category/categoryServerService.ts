import { db } from '@/lib/firebase/admin';
import { CategoryType } from '@/types';

const serializeDate = (val: unknown) =>
  val && typeof (val as { toDate?: () => Date }).toDate === 'function'
    ? (val as { toDate: () => Date }).toDate().toISOString()
    : val;

export const categoryServerService = {
  /**
   * Fetch categories during server rendering so the storefront renders them in
   * the initial HTML. This prevents the category bar from popping in after
   * hydration (layout shift / flash on reload).
   */
  async getCategories(): Promise<CategoryType[]> {
    try {
      const snapshot = await db.collection('categories').orderBy('name').get();

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          id: docSnap.id,
          ...data,
          created_at: serializeDate(data.created_at),
          updated_at: serializeDate(data.updated_at),
        } as unknown as CategoryType;
      });
    } catch (error) {
      // Never break the homepage if Firestore is unavailable (e.g. during build).
      console.error('Failed to load categories on the server:', error);
      return [];
    }
  },
};
