import { db } from "@/lib/firebase/client";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp, setDoc } from "firebase/firestore";
import { ProductType } from "@/types";

export interface CreateProductData {
  title: string;
  description: string;
  price: number;
  discount_price?: number | null;
  offer_start_date?: string | null;
  offer_end_date?: string | null;
  image?: string | null;
  stock: number;
  sku?: string | null;
  category_id?: number | null;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
  variants?: {
    color: string;
    images: string[];
    sizes: {
      size: string;
      stock: number;
    }[];
  }[];
}

export interface UpdateProductData extends Partial<CreateProductData> {
  updated_at?: string;
}

export interface ProductWithDetails extends ProductType {
  category?: {
    id: number;
    name: string;
  };
  total_reviews?: number;
  average_rating?: number;
}

// Helper for dates
const serializeDate = (val: any) => val && typeof val.toDate === 'function' ? val.toDate().toISOString() : val;

export const adminProductService = {
  async getAllProducts(): Promise<ProductWithDetails[]> {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      
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

        // Mock reviews for now since we don't have reviews migrated
        const total_reviews = 0;
        const average_rating = 0;

        return {
          product_id: docSnap.id,
          ...data,
          created_at: serializeDate(data.created_at),
          updated_at: serializeDate(data.updated_at),
          expiry_date: serializeDate(data.expiry_date),
          manufacturing_date: serializeDate(data.manufacturing_date),
          category,
          total_reviews,
          average_rating
        } as unknown as ProductWithDetails;
      }));

      return products.sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } catch (err) {
      console.error("Failed to get all products:", err);
      return [];
    }
  },

  async createCategory(categoryData: { name: string; description?: string }): Promise<{ id: number; name: string }> {
    try {
      // Use timestamp for sequential id
      const idStr = String(Date.now());
      
      await setDoc(doc(db, "categories", idStr), {
        name: categoryData.name,
        description: categoryData.description || "",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      return { id: Number(idStr), name: categoryData.name };
    } catch (err) {
      console.error("Failed to create category:", err);
      throw err;
    }
  },

  async uploadProductImage(file: File): Promise<string | null> {
    try {
      // Re-create the File object to ensure it hasn't been corrupted or proxied by React state
      // which can cause Next.js fetch to fail to set the multipart boundary correctly.
      const safeFile = new File([file], file.name || 'upload.jpg', { type: file.type || 'image/jpeg' });
      
      const formData = new FormData();
      formData.append('image', safeFile);
      
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload image');
      }

      const data = await response.json();
      return data.url || null;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  },

  async createProduct(productData: CreateProductData): Promise<ProductType> {
    try {
      const docRef = await addDoc(collection(db, "products"), {
        ...productData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      const docSnap = await getDoc(docRef);
      const data = docSnap.data()!;
      return {
        product_id: docSnap.id,
        ...data,
        created_at: serializeDate(data.created_at),
        updated_at: serializeDate(data.updated_at),
      } as unknown as ProductType;
    } catch (err) {
      console.error("Failed to create product:", err);
      throw err;
    }
  },

  async updateProduct(productId: string, productData: UpdateProductData): Promise<ProductType> {
    try {
      const docRef = doc(db, "products", productId);
      await updateDoc(docRef, {
        ...productData,
        updated_at: serverTimestamp(),
      });

      const docSnap = await getDoc(docRef);
      const data = docSnap.data()!;
      return {
        product_id: docSnap.id,
        ...data,
        created_at: serializeDate(data.created_at),
        updated_at: serializeDate(data.updated_at),
      } as unknown as ProductType;
    } catch (err) {
      console.error("Failed to update product:", err);
      throw err;
    }
  },

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "products", productId));
      return true;
    } catch (err) {
      console.error("Failed to delete product:", err);
      throw err;
    }
  },

  async updateStock(productId: string, newStock: number): Promise<ProductType> {
    try {
      const docRef = doc(db, "products", productId);
      await updateDoc(docRef, {
        stock: newStock,
        updated_at: serverTimestamp(),
      });

      const docSnap = await getDoc(docRef);
      const data = docSnap.data()!;
      return {
        product_id: docSnap.id,
        ...data,
      } as unknown as ProductType;
    } catch (err) {
      console.error("Failed to update product stock:", err);
      throw err;
    }
  },

  async getLowStockProducts(threshold: number = 10): Promise<ProductType[]> {
    try {
      const q = query(collection(db, "products"), where("stock", "<", threshold));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          product_id: docSnap.id,
          ...data,
          created_at: serializeDate(data.created_at),
          updated_at: serializeDate(data.updated_at),
        } as unknown as ProductType;
      });
    } catch (err) {
      console.error("Failed to get low stock products:", err);
      return [];
    }
  },

  async getProductAnalytics() {
    try {
      const snapshot = await getDocs(collection(db, "products"));
      
      const totalProducts = snapshot.docs.length;
      let lowStockCount = 0;
      let totalInventoryValue = 0;
      const categoryStats: Record<string, number> = {};

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        if (data.stock < 10) lowStockCount++;
        totalInventoryValue += (data.price || 0) * (data.stock || 0);

        let categoryName = "Uncategorized";
        if (data.category_id) {
          const catDoc = await getDoc(doc(db, "categories", String(data.category_id)));
          if (catDoc.exists()) {
            categoryName = catDoc.data().name;
          }
        }
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1;
      }

      return {
        totalProducts,
        categoryStats,
        lowStockCount,
        totalInventoryValue: Number(totalInventoryValue.toFixed(2)),
      };
    } catch (err) {
      console.error("Failed to get product analytics:", err);
      return {
        totalProducts: 0,
        categoryStats: {},
        lowStockCount: 0,
        totalInventoryValue: 0,
      };
    }
  },

  async bulkUpdateProducts(updates: Array<{ productId: string; data: UpdateProductData }>): Promise<boolean> {
    try {
      const promises = updates.map(({ productId, data }) =>
        this.updateProduct(productId, data),
      );
      await Promise.all(promises);
      return true;
    } catch (err) {
      console.error("Failed to bulk update products:", err);
      throw err;
    }
  },
};
