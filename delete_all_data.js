require('dotenv').config();
const mongoose = require('mongoose');

async function deleteAllData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections:`);
    collections.forEach(col => console.log(`  - ${col.name}`));

    console.log('\nDeleting all collections...');
    
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`✓ Deleted: ${collection.name}`);
    }

    console.log('\n✅ All data deleted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting data:', error.message);
    process.exit(1);
  }
}

deleteAllData();
