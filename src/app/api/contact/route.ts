import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  subject?: unknown;
  message?: unknown;
};

const isNonEmptyString = (value: unknown, max = 2000): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    if (!db || typeof db.collection !== 'function') {
      console.error('Firebase Admin is not initialized. Check your environment variables.');
      return NextResponse.json(
        { error: 'Server configuration error: Database not connected.' },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ContactPayload;

    if (
      !isNonEmptyString(body.name, 120) ||
      !isNonEmptyString(body.email, 200) ||
      !isNonEmptyString(body.message, 5000)
    ) {
      return NextResponse.json(
        { error: 'Please provide your name, a valid email, and a message.' },
        { status: 400 }
      );
    }

    const email = body.email.trim();

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    await db.collection('contact_messages').add({
      name: body.name.trim(),
      email,
      phone: isNonEmptyString(body.phone, 40) ? body.phone.trim() : '',
      subject: isNonEmptyString(body.subject, 200) ? body.subject.trim() : 'General enquiry',
      message: body.message.trim(),
      status: 'new',
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to send contact message:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again or email us directly.' },
      { status: 500 }
    );
  }
}
