import { ProductType } from '../../types';
import { toUserFacingQueryError } from '@/utils/errorHandling';

export const productService = {
  async getProducts(): Promise<ProductType[]> {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      const products: ProductType[] = data.products;

      const now = new Date();
      return products
        .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        .filter(p => !p.expiry_date || new Date(p.expiry_date) >= now);
    } catch (error) {
      throw error instanceof Error
        ? error
        : toUserFacingQueryError('Products', {});
    }
  },

  async getProductById(id: string): Promise<ProductType | null> {
    try {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch product');
      }
      const data = await response.json();
      const product: ProductType = data.product;

      const now = new Date();
      if (product.expiry_date && new Date(product.expiry_date) < now) {
        return null; // Product is expired
      }
      return product;
    } catch (error) {
      throw error instanceof Error
        ? error
        : toUserFacingQueryError('Product', {});
    }
  },

  async getProductsByCategory(categoryId: number | string): Promise<ProductType[]> {
    try {
      const response = await fetch(`/api/products?category_id=${categoryId}`);
      if (!response.ok) throw new Error('Failed to fetch products by category');
      const data = await response.json();
      const products: ProductType[] = data.products;

      const now = new Date();
      return products
        .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        .filter(p => !p.expiry_date || new Date(p.expiry_date) >= now);
    } catch (error) {
      throw error instanceof Error
        ? error
        : toUserFacingQueryError('Products', {});
    }
  },
};
