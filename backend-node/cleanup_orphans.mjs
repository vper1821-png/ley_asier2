import mongoose from 'mongoose';
import { CONFIG } from './config.js';

async function main() {
  await mongoose.connect(CONFIG.MONGODB_URI);
  const db = mongoose.connection.db;

  const inventories = db.collection('datainventories');
  const connections = db.collection('databaseconnections');

  // Get all connection names
  const connNames = new Set();
  const conns = await connections.find({}).project({ name: 1 }).toArray();
  conns.forEach(c => connNames.add(c.name));
  console.log('Active connections:', [...connNames]);

  // Find inventory items where storageLocation doesn't match any connection name
  const items = await inventories.find({ storageLocation: { $exists: true, $ne: '' } }).toArray();
  console.log(`Total inventory items with storageLocation: ${items.length}`);

  let orphaned = 0;
  for (const item of items) {
    if (!connNames.has(item.storageLocation)) {
      await inventories.deleteOne({ _id: item._id });
      console.log(`Deleted orphaned: ${item._id} (${item.category}/${item.dataType} - storage: ${item.storageLocation})`);
      orphaned++;
    }
  }

  console.log(`\nOrphaned items deleted: ${orphaned}`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
