import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export async function POST(request: Request) {
  try {
    const { uid, email } = await request.json();
    
    const docRef = db.collection('profiles').doc(uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const existingProfile = docSnap.data();
      if (!existingProfile?.email && email) {
        await docRef.set({ email }, { merge: true });
      }
      return NextResponse.json({ success: true });
    }

    const role = email.toLowerCase() === 'innovacentra@gmail.com' ? 'admin' : 'user';

    await docRef.set({
      profile_id: uid,
      username: role === 'admin' ? 'Admin' : '',
      avatar_url: '',
      email: email,
      role: role,
      created_at: new Date().toISOString(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in profile API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
