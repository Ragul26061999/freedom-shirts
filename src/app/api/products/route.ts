import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    if (!db || typeof db.collection !== 'function') {
      console.error('Firebase Admin is not initialized. Check your environment variables.');
      return NextResponse.json(
        { error: 'Server configuration error: Database not connected.' },
        { status: 500 }
      );
    }

    let snapshot;
    if (categoryId) {
      snapshot = await db.collection('products').where('category_id', '==', categoryId).get();
    } else {
      snapshot = await db.collection('products').get();
    }

    const serializeDate = (val: any) => val && typeof val.toDate === 'function' ? val.toDate().toISOString() : val;

    const products = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      let category = null;

      if (data.category_id) {
        const catDoc = await db.collection('categories').doc(String(data.category_id)).get();
        if (catDoc.exists) {
          const catData = catDoc.data()!;
          category = { 
            id: catDoc.id, 
            ...catData,
            created_at: serializeDate(catData.created_at),
            updated_at: serializeDate(catData.updated_at)
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
      };
    }));

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Error fetching products from admin API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
