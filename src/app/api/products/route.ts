import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';
import type { Query, DocumentData } from 'firebase-admin/firestore';

const serializeDate = (val: unknown): string | null => {
  if (val && typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  return null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '24', 10), 100);
    const cursor = searchParams.get('cursor');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    if (!db || typeof db.collection !== 'function') {
      console.error('Firebase Admin is not initialized. Check your environment variables.');
      return NextResponse.json(
        { error: 'Server configuration error: Database not connected.' },
        { status: 500 }
      );
    }

    // Build query with pagination using a typed Query variable
    let productsRef: Query<DocumentData> = db.collection('products');

    if (categoryId) {
      const id = /^\d+$/.test(categoryId) ? Number(categoryId) : categoryId;
      productsRef = productsRef.where('category_id', '==', id);
    }

    const validSortFields = ['created_at', 'title', 'price', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order: 'asc' | 'desc' = sortOrder === 'asc' ? 'asc' : 'desc';
    productsRef = productsRef.orderBy(sortField, order);

    if (cursor) {
      const cursorDoc = await db.collection('products').doc(cursor).get();
      if (cursorDoc.exists) {
        productsRef = productsRef.startAfter(cursorDoc);
      }
    }

    const snapshot = await productsRef.limit(limit + 1).get();
    const hasMore = snapshot.docs.length > limit;
    const docs = hasMore ? snapshot.docs.slice(0, limit) : snapshot.docs;
    const lastDoc = docs.length > 0 ? docs[docs.length - 1].id : null;

    // Fetch all categories in one go (not N+1 per product)
    const categoriesSnapshot = await db.collection('categories').get();
    const categoriesById = new Map<string, Record<string, unknown>>();
    categoriesSnapshot.docs.forEach((catDoc) => {
      const catData = catDoc.data();
      categoriesById.set(catDoc.id, {
        id: catDoc.id,
        ...catData,
        created_at: serializeDate(catData.created_at),
        updated_at: serializeDate(catData.updated_at),
      });
    });

    const products = docs
      .map((docSnap) => {
        const data = docSnap.data();
        const category =
          data.category_id != null
            ? categoriesById.get(String(data.category_id)) ?? null
            : null;

        return {
          product_id: docSnap.id,
          ...data,
          created_at: serializeDate(data.created_at),
          updated_at: serializeDate(data.updated_at),
          expiry_date: serializeDate(data.expiry_date),
          manufacturing_date: serializeDate(data.manufacturing_date),
          category,
        };
      })
      .filter((p) => {
        if (!p.expiry_date) return true;
        const expiry = new Date(p.expiry_date);
        return Number.isNaN(expiry.getTime()) || expiry >= new Date();
      });

    return NextResponse.json(
      {
        products,
        pagination: {
          hasMore,
          nextCursor: lastDoc,
          limit,
          totalReturned: products.length,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching products from admin API:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
