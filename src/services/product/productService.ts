import { ProductType } from '../../types';
import { toUserFacingQueryError } from '@/utils/errorHandling';

// Product query parameters interface
export interface ProductQueryParams {
  sortBy?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'created-asc' | 'created-desc' | 'default';
  stockFilter?: 'all' | 'in-stock' | 'out-of-stock';
  categoryFilter?: string;
  limit?: number;
  cursor?: string;
}

// Serialize params to query string
function serializeParams(params: ProductQueryParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.categoryFilter && params.categoryFilter !== 'all') {
    searchParams.append('category_id', params.categoryFilter);
  }
  
  if (params.stockFilter && params.stockFilter !== 'all') {
    searchParams.append('stock_filter', params.stockFilter);
  }
  
  if (params.sortBy && params.sortBy !== 'default') {
    const fieldMap: Record<string, string> = {
      'price-asc': 'price:asc',
      'price-desc': 'price:desc',
      'name-asc': 'title:asc',
      'name-desc': 'title:desc',
      'created-asc': 'created_at:asc',
      'created-desc': 'created_at:desc',
    };
    const [field, order] = (fieldMap[params.sortBy] || 'created_at:desc').split(':');
    searchParams.append('sort_by', field);
    searchParams.append('sort_order', order);
  }
  
  if (params.limit) {
    searchParams.append('limit', String(params.limit));
  }
  
  if (params.cursor) {
    searchParams.append('cursor', params.cursor);
  }
  
  return searchParams.toString();
}

// Service layer
export const productService = {
  async getProductsWithFilters(params: ProductQueryParams = {}): Promise<ProductType[]> {
    try {
      const queryString = serializeParams(params);
      const response = await fetch(`/api/products?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      throw error instanceof Error ? error : toUserFacingQueryError('Products', {});
    }
  },

  async getProductsByCategory(categoryId: string | number): Promise<ProductType[]> {
    try {
      const queryString = serializeParams({
        categoryFilter: String(categoryId),
        limit: 100,
      });
      const response = await fetch(`/api/products?${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch category products');
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      throw error instanceof Error ? error : toUserFacingQueryError('Products', {});
    }
  },

  async getProducts(): Promise<ProductType[]> {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.products;
    } catch (error) {
      throw error instanceof Error ? error : toUserFacingQueryError('Products', {});
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
      return data.product || null;
    } catch (error) {
      throw error instanceof Error ? error : toUserFacingQueryError('Product', {});
    }
  },
};