import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const LOCAL_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/traveltracker';
const ATLAS_URI = process.env.MONGO_URI;

async function migrateAll() {
  if (!ATLAS_URI) {
    console.error('❌ MONGO_URI non définie dans les variables d\'environnement.');
    process.exit(1);
  }
  console.log('🔄 1/3 Connecting to Local MongoDB (localhost:27017)...');
  const local = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('✅ Local connected!');

  console.log('🔄 2/3 Connecting to MongoDB Atlas Cloud...');
  const atlas = await mongoose.createConnection(ATLAS_URI).asPromise();
  console.log('✅ Atlas connected!');

  const collections = await local.db.listCollections().toArray();
  console.log(`\n📦 Migrating ${collections.length} collections to Atlas...\n`);

  for (const c of collections) {
    if (c.name.startsWith('system.')) continue;
    const docs = await local.db.collection(c.name).find({}).toArray();
    console.log(`⏳ Exporting [${c.name}] (${docs.length} documents)...`);
    if (docs.length > 0) {
      await atlas.db.collection(c.name).deleteMany({});
      await atlas.db.collection(c.name).insertMany(docs);
      console.log(`   ➡️ Transferred [${c.name}] to Atlas successfully.`);
    }
  }

  console.log('\n🎉 ALL COLLECTIONS EXPORTED TO ATLAS SUCCESSFULLY!');
  await local.close();
  await atlas.close();
  process.exit(0);
}

migrateAll().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
