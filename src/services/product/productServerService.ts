import { db } from '@/lib/firebase/client';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { ProductType } from '@/types';

// Helper for dates
const serializeDate = (val: any) => val && typeof val.toDate === 'function' ? val.toDate().toISOString() : val;

export const productServerService = {
  async getProducts(): Promise<ProductType[]> {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      
      const products = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let category = null;

        if (data.category_id) {
          const catDoc = await getDoc(doc(db, "categories", String(data.category_id)));
          if (catDoc.exists()) {
            category = {
              id: Number(catDoc.id),
              name: catDoc.data().name
            };
          }
        }

        return {
          product_id: docSnap.id,
          ...data,
          created_at: serializeDate(data.created_at),
          updated_at: serializeDate(data.updated_at),
          expiry_date: serializeDate(data.expiry_date),
          manufacturing_date: serializeDate(data.manufacturing_date),
          category
        } as unknown as ProductType;
      }));

      const now = new Date();
      return products
        .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        .filter(p => !p.expiry_date || new Date(p.expiry_date) >= now);
    } catch (err) {
      console.error("Failed to get all products:", err);
      return [];
    }
  },

  async getProductById(id: string): Promise<ProductType | null> {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;

      const data = docSnap.data();
      let category = null;

      if (data.category_id) {
        const catDoc = await getDoc(doc(db, "categories", String(data.category_id)));
        if (catDoc.exists()) {
          category = {
            id: Number(catDoc.id),
            name: catDoc.data().name
          };
        }
      }

      const product = {
        product_id: docSnap.id,
        ...data,
        created_at: serializeDate(data.created_at),
        updated_at: serializeDate(data.updated_at),
        expiry_date: serializeDate(data.expiry_date),
        manufacturing_date: serializeDate(data.manufacturing_date),
        category
      } as unknown as ProductType;

      const now = new Date();
      if (product.expiry_date && new Date(product.expiry_date) < now) {
        return null;
      }
      return product;
    } catch (error) {
      console.error('Error in getProductById:', error);
      return null;
    }
  },

  async getProductsByCategory(categoryId: number | string): Promise<ProductType[]> {
    try {
      const q = query(collection(db, 'products'), where('category_id', 'in', [Number(categoryId), String(categoryId)]));
      const snapshot = await getDocs(q);
        
      const products = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let category = null;

        if (data.category_id) {
          const catDoc = await getDoc(doc(db, "categories", String(data.category_id)));
          if (catDoc.exists()) {
            category = {
              id: Number(catDoc.id),
              name: catDoc.data().name
            };
          }
        }

        return {
          product_id: docSnap.id,
          ...data,
          created_at: serializeDate(data.created_at),
          updated_at: serializeDate(data.updated_at),
          expiry_date: serializeDate(data.expiry_date),
          manufacturing_date: serializeDate(data.manufacturing_date),
          category
        } as unknown as ProductType;
      }));

      const now = new Date();
      return products.filter(p => !p.expiry_date || new Date(p.expiry_date) >= now);
    } catch (error) {
      console.error('Error in getProductsByCategory:', error);
      return [];
    }
  },

  async searchProducts(queryStr: string): Promise<ProductType[]> {
    const allProducts = await this.getProducts();
    const q = queryStr.toLowerCase();
    return allProducts.filter(p => p.title && p.title.toLowerCase().includes(q));
  }
};
