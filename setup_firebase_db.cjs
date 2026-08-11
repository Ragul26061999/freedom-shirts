const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
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

async function setupDatabase() {
  console.log('Setting up Firebase collections...');

  // 1. Categories
  const categoriesRef = db.collection('categories');
  const sampleCategories = [
    { id: 'men', name: 'Men', description: 'Men clothing', created_at: new Date() },
    { id: 'women', name: 'Women', description: 'Women clothing', created_at: new Date() },
    { id: 'accessories', name: 'Accessories', description: 'Various accessories', created_at: new Date() }
  ];

  for (const cat of sampleCategories) {
    await categoriesRef.doc(cat.id).set(cat);
    console.log(`Added category: ${cat.name}`);
  }

  // 2. Sample Product
  const productsRef = db.collection('products');
  const sampleProduct = {
    title: 'Sample T-Shirt',
    description: 'A nice cotton t-shirt',
    price: 19.99,
    category_id: 'men',
    images: ['https://via.placeholder.com/150'],
    created_at: new Date(),
    updated_at: new Date()
  };

  const productDoc = await productsRef.add(sampleProduct);
  console.log(`Added sample product with ID: ${productDoc.id}`);

  console.log('Firebase collections setup complete!');
  process.exit(0);
}

setupDatabase().catch(console.error);
