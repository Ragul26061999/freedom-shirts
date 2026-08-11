import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const docSnap = await db.collection('products').doc(id).get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ product: null }, { status: 404 });
    }

    const data = docSnap.data()!;
    let category = null;

    const serializeDate = (val: any) => val && typeof val.toDate === 'function' ? val.toDate().toISOString() : val;

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

    const product = {
      product_id: docSnap.id,
      ...data,
      created_at: serializeDate(data.created_at),
      updated_at: serializeDate(data.updated_at),
      expiry_date: serializeDate(data.expiry_date),
      manufacturing_date: serializeDate(data.manufacturing_date),
      category
    };

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Error fetching product from admin API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
