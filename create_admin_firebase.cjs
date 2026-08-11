const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const auth = getAuth();

async function createAdminUser() {
  const email = 'innovacentra@gmail.com';
  const password = 'password123';
  let userId;

  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log('User already exists in Firebase Auth. Updating password...');
    await auth.updateUser(userRecord.uid, { password, emailVerified: true });
    userId = userRecord.uid;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('Creating new user in Firebase Auth...');
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: true
      });
      userId = userRecord.uid;
    } else {
      console.error('Error with Firebase Auth:', error);
      console.error('\nNOTE: If you got "auth/configuration-not-found", you need to go to the Firebase Console -> Authentication -> Get Started -> Enable Email/Password provider.');
      return;
    }
  }

  console.log(`Setting custom claim for admin...`);
  await auth.setCustomUserClaims(userId, { admin: true });

  console.log(`Creating/Updating profile in Firestore...`);
  await db.collection('profiles').doc(userId).set({
    profile_id: userId,
    email: email,
    username: 'Admin',
    role: 'admin',
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp()
  }, { merge: true });

  console.log('SUCCESS: Admin user has been created and granted privileges in Firebase!');
}

createAdminUser().catch(console.error);
