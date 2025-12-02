
/**
 * To run this script, use the following command in your terminal:
 * npx tsx src/lib/seed-db.ts
 */

import admin from './firebase/admin';

const main = async () => {
  console.log('Connecting to Firestore...');
  const firestore = admin.firestore();
  console.log('Firestore connected.');

  const contactCollection = firestore.collection('qrlive_contact');
  const docId = 'main-contact';
  const contactDocRef = contactCollection.doc(docId);

  const contactData = {
    email: 'support@qrlive.in',
    mobile: '+919876543210',
    website: 'https://qrlive.in',
    instagram: 'https://instagram.com/qrlive.in',
  };

  try {
    console.log(`Checking for existing document with ID: ${docId}...`);
    const doc = await contactDocRef.get();
    if (doc.exists) {
      console.log('Document already exists. Updating with new data...');
      await contactDocRef.update(contactData);
      console.log('✅ Successfully updated contact information!');
    } else {
      console.log('Document does not exist. Creating new document...');
      await contactDocRef.set(contactData);
      console.log('✅ Successfully created contact information!');
    }
  } catch (error) {
    console.error('❌ Error writing to Firestore:', error);
    process.exit(1);
  }

  console.log('Script finished.');
  process.exit(0);
};

main();
