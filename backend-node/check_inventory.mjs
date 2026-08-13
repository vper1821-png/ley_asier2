import mongoose from 'mongoose';
import { CONFIG } from './config.js';

async function main() {
  await mongoose.connect(CONFIG.MONGODB_URI);
  const db = mongoose.connection.db;

  const invs = await db.collection('datainventories').aggregate([
    { $group: { _id: '$storageLocation', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  console.log('Storage locations in inventory:');
  invs.forEach(i => console.log('  ', i._id, '(' + i.count + ' items)'));

  const conns = await db.collection('databaseconnections').find({}).project({ name: 1 }).toArray();
  console.log('\nDatabase connections:');
  conns.forEach(c => console.log('  ', c.name, '(' + c._id + ')'));

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
