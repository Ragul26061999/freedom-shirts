import { useState, useEffect, useCallback } from 'react';
import { ProductType } from '@/types';

const STORAGE_KEY = 'innova-recently-viewed';
const MAX_ITEMS = 12;

export function useRecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState<ProductType[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentProducts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to parse recently viewed products', error);
    }
  }, []);

  const addProduct = useCallback((product: ProductType) => {
    setRecentProducts(prev => {
      // Remove if it already exists so we can move it to the front
      const filtered = prev.filter(p => p.product_id !== product.product_id);
      const updated = [product, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { recentProducts: isMounted ? recentProducts : [], addProduct };
}
