import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { CartItemType, CartType, CartStatus } from '../../types';
import { toast } from 'sonner';

import { auth } from '@/lib/firebase/client';

async function getClientUser() {
  const user = auth.currentUser;
  if (!user) return null;
  return { id: user.uid, email: user.email };
}

export async function getActiveCart() {
  try {
    const user = await getClientUser();
    if (!user) return null;

    const q = query(
      collection(db, 'carts'),
      where('user_id', '==', user.id),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const cartDoc = snapshot.docs[0];
    return { id: cartDoc.id, ...cartDoc.data() } as CartType;
  } catch (error) {
    console.error('Error in getActiveCart:', error);
    console.error('Failed to fetch cart');
    return null;
  }
}

export async function createCart() {
  try {
    const user = await getClientUser();
    if (!user) throw new Error('User not authenticated');

    const newCart = {
      user_id: user.id,
      status: 'active' as CartStatus,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'carts'), newCart);
    return { id: docRef.id, ...newCart } as unknown as CartType;
  } catch (error) {
    console.error('Error in createCart:', error);
    console.error('Failed to create cart');
    return null;
  }
}

export async function getOrCreateCart() {
  const cart = await getActiveCart();
  if (cart) return cart;
  return await createCart();
}

export async function getCartItems(cartId: string) {
  try {
    const q = query(collection(db, 'cart_items'), where('cart_id', '==', cartId));
    const snapshot = await getDocs(q);
    
    const items = await Promise.all(snapshot.docs.map(async (itemDoc) => {
      const data = itemDoc.data();
      let product = null;
      if (data.product_id) {
        const productSnap = await getDoc(doc(db, 'products', data.product_id));
        if (productSnap.exists()) {
          product = { product_id: productSnap.id, ...productSnap.data() };
        }
      }
      return { id: itemDoc.id, ...data, product } as unknown as CartItemType;
    }));
    
    return items;
  } catch (error) {
    console.error('Error in getCartItems:', error);
    console.error('Failed to fetch cart items');
    return [];
  }
}

export async function clearCart(cartId: string) {
  try {
    const q = query(collection(db, 'cart_items'), where('cart_id', '==', cartId));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(itemDoc => deleteDoc(doc(db, 'cart_items', itemDoc.id)));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error in clearCart:', error);
    console.error('Failed to clear cart');
    return false;
  }
}

export async function removeCartItem(cartItemId: string) {
  try {
    await deleteDoc(doc(db, 'cart_items', cartItemId));
    return true;
  } catch (error) {
    console.error('Error in removeCartItem:', error);
    console.error('Failed to remove item');
    return false;
  }
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
  try {
    if (quantity <= 0) {
      return await removeCartItem(cartItemId);
    }
    
    const itemRef = doc(db, 'cart_items', cartItemId);
    await updateDoc(itemRef, { 
      quantity, 
      updated_at: serverTimestamp() 
    });
    
    const updatedSnap = await getDoc(itemRef);
    return { id: updatedSnap.id, ...updatedSnap.data() } as unknown as CartItemType;
  } catch (error) {
    console.error('Error in updateCartItemQuantity:', error);
    console.error('Failed to update quantity');
    return null;
  }
}

export async function addItemToCart(
  cartId: string, 
  productId: string, 
  _price: number, 
  quantity: number = 1,
  selectedColor?: string,
  selectedSize?: string
) {
  try {
    // Modify query to find existing item with SAME variants
    const q = query(
      collection(db, 'cart_items'), 
      where('cart_id', '==', cartId), 
      where('product_id', '==', productId),
      where('selectedColor', '==', selectedColor || null),
      where('selectedSize', '==', selectedSize || null)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      // Update existing item
      const existingDoc = snapshot.docs[0];
      const existingItem = existingDoc.data();
      const newQuantity = existingItem.quantity + quantity;
      
      await updateDoc(existingDoc.ref, {
        quantity: newQuantity,
        updated_at: serverTimestamp()
      });
      
      const updatedSnap = await getDoc(existingDoc.ref);
      return { id: updatedSnap.id, ...updatedSnap.data() } as unknown as CartItemType;
    } else {
      // Insert new item
      const newItem = {
        cart_id: cartId,
        product_id: productId,
        quantity,
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'cart_items'), newItem);
      return { id: docRef.id, ...newItem } as unknown as CartItemType;
    }
  } catch (error) {
    console.error('Error in addItemToCart:', error);
    console.error('Failed to add item to cart');
    return null;
  }
}

export async function findCartItemByProductId(cartId: string, productId: string, selectedColor?: string, selectedSize?: string) {
  try {
    const q = query(
      collection(db, 'cart_items'),
      where('cart_id', '==', cartId),
      where('product_id', '==', productId),
      where('selectedColor', '==', selectedColor || null),
      where('selectedSize', '==', selectedSize || null)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const cartDoc = snapshot.docs[0];
    return { id: cartDoc.id, ...cartDoc.data() } as CartItemType;
  } catch (error) {
    console.error('Error in findCartItemByProductId:', error);
    console.error('Failed to find cart item');
    return null;
  }
}
