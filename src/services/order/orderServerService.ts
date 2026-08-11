'use server'

import { db } from '@/lib/firebase/admin';
import { OrderType } from '@/types';

export async function getOrders(userId: string): Promise<OrderType[]> {
    try {
      const ordersSnapshot = await db
        .collection('orders')
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .get();

      const orders = await Promise.all(
        ordersSnapshot.docs.map(async (doc) => {
          const orderData = doc.data();
          
          // Fetch order items for this order
          const itemsSnapshot = await db
            .collection('order_items')
            .where('order_id', '==', doc.id)
            .get();
            
          const order_items = await Promise.all(
            itemsSnapshot.docs.map(async (itemDoc) => {
              const itemData = itemDoc.data();
              // Fetch product for this item
              const productDoc = await db.collection('products').doc(itemData.product_id).get();
              return {
                id: itemDoc.id,
                ...itemData,
                product: productDoc.exists ? { product_id: productDoc.id, ...productDoc.data() } : null
              };
            })
          );

          // Fetch address for this order
          let address = null;
          if (orderData.address_id) {
            const addressDoc = await db.collection('addresses').doc(orderData.address_id).get();
            if (addressDoc.exists) {
              address = { id: addressDoc.id, ...addressDoc.data() };
            }
          }

          return {
            id: doc.id,
            ...orderData,
            order_items,
            address,
          } as unknown as OrderType;
        })
      );

      return orders;
    } catch (error) {
      console.error('Error in getOrders:', error);
      return [];
    }
}
