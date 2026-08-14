'use server'

import { db } from '@/lib/firebase/admin';
import { OrderType } from '@/types';

export async function getOrders(userId: string): Promise<OrderType[]> {
    try {
      const ordersSnapshot = await db
        .collection('orders')
        .where('user_id', '==', userId)
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
              let productData: any = null;
              if (productDoc.exists) {
                productData = { product_id: productDoc.id, ...productDoc.data() };
                
                // Serialize any product timestamps
                if (productData.created_at) {
                  productData.created_at = (typeof productData.created_at === 'object' && 'toDate' in productData.created_at) 
                    ? productData.created_at.toDate().toISOString() 
                    : (typeof productData.created_at === 'object' && ('_seconds' in productData.created_at || 'seconds' in productData.created_at)
                        ? new Date((productData.created_at.seconds || productData.created_at._seconds) * 1000).toISOString()
                        : new Date(productData.created_at).toISOString());
                }
                if (productData.updated_at) {
                  productData.updated_at = (typeof productData.updated_at === 'object' && 'toDate' in productData.updated_at) 
                    ? productData.updated_at.toDate().toISOString() 
                    : (typeof productData.updated_at === 'object' && ('_seconds' in productData.updated_at || 'seconds' in productData.updated_at)
                        ? new Date((productData.updated_at.seconds || productData.updated_at._seconds) * 1000).toISOString()
                        : new Date(productData.updated_at).toISOString());
                }
              }
              
              return {
                id: itemDoc.id,
                ...itemData,
                product: productData
              };
            })
          );

          // Fetch address for this order
          let address = null;
          const addressId = orderData.shipping_address_id || orderData.address_id;
          if (addressId) {
            const addressDoc = await db.collection('addresses').doc(addressId).get();
            if (addressDoc.exists) {
              address = { id: addressDoc.id, ...addressDoc.data() };
            }
          }

          // Serialize Firestore Timestamp to string for Next.js Server Action
          let created_at = null;
          if (orderData.created_at) {
            if (typeof orderData.created_at === 'object' && 'toDate' in orderData.created_at) {
              created_at = orderData.created_at.toDate().toISOString();
            } else if (typeof orderData.created_at === 'object' && 'seconds' in orderData.created_at) {
              created_at = new Date(orderData.created_at.seconds * 1000).toISOString();
            } else {
              created_at = new Date(orderData.created_at).toISOString();
            }
          }

          return {
            id: doc.id,
            ...orderData,
            created_at,
            order_items,
            address,
          } as unknown as OrderType;
        })
      );

      // Sort in memory to avoid needing a Firestore composite index
      orders.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      return orders;
    } catch (error) {
      console.error('Error in getOrders:', error);
      return [];
    }
}
