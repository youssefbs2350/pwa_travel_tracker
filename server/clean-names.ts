import mongoose from 'mongoose';

async function cleanNames() {
  await mongoose.connect('mongodb://127.0.0.1:27017/traveltracker');
  const db = mongoose.connection.db;
  if (!db) {
    console.log('No DB');
    return;
  }

  // 1. Users: remove last names
  const users = await db.collection('users').find({}).toArray();
  for (const u of users) {
    if (u.name) {
      const firstName = u.name.trim().split(' ')[0];
      await db.collection('users').updateOne({ _id: u._id }, { $set: { name: firstName } });
    }
  }
  console.log(`[Clean] ${users.length} utilisateurs nettoyés (prénoms uniquement)`);

  // 2. Trips: participants
  const trips = await db.collection('trips').find({}).toArray();
  for (const t of trips) {
    if (Array.isArray(t.participants)) {
      const cleanParticipants = t.participants.map((p: string) => p.trim().split(' ')[0]);
      await db.collection('trips').updateOne({ _id: t._id }, { $set: { participants: cleanParticipants } });
    }
  }
  console.log(`[Clean] ${trips.length} voyages nettoyés`);

  // 3. Expenses: paidBy & splitWith
  const expenses = await db.collection('expenses').find({}).toArray();
  for (const e of expenses) {
    const paidBy = e.paidBy ? e.paidBy.trim().split(' ')[0] : e.paidBy;
    const splitWith = Array.isArray(e.splitWith)
      ? e.splitWith.map((s: string) => s.trim().split(' ')[0])
      : e.splitWith;
    await db.collection('expenses').updateOne({ _id: e._id }, { $set: { paidBy, splitWith } });
  }
  console.log(`[Clean] ${expenses.length} dépenses nettoyées`);

  // 4. Reviews: userName
  const reviews = await db.collection('reviews').find({}).toArray();
  for (const r of reviews) {
    if (r.userName) {
      const userName = r.userName.trim().split(' ')[0];
      await db.collection('reviews').updateOne({ _id: r._id }, { $set: { userName } });
    }
  }
  console.log(`[Clean] ${reviews.length} avis nettoyés`);

  // 5. Complaints: userName
  const complaints = await db.collection('complaints').find({}).toArray();
  for (const c of complaints) {
    if (c.userName) {
      const userName = c.userName.trim().split(' ')[0];
      await db.collection('complaints').updateOne({ _id: c._id }, { $set: { userName } });
    }
  }
  console.log(`[Clean] ${complaints.length} réclamations nettoyées`);

  await mongoose.disconnect();
}

cleanNames().catch(console.error);
