import mongoose from 'mongoose';
import { CONFIG } from './config.js';

async function main() {
  await mongoose.connect(CONFIG.MONGODB_URI);
  const db = mongoose.connection.db;
  const col = db.collection('datainventories');

  // Find duplicates by (userId, dataType, storageLocation)
  const dups = await col.aggregate([
    { $group: { _id: { userId: '$userId', dataType: '$dataType', storageLocation: '$storageLocation' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();

  console.log(`Found ${dups.length} duplicate groups:`);
  let totalRemoved = 0;
  for (const d of dups) {
    // Keep the first ID, remove the rest
    const [keep, ...remove] = d.ids;
    await col.deleteMany({ _id: { $in: remove } });
    console.log(`  ${d._id.dataType} (${d._id.storageLocation}): ${d.count} copies -> keeping 1, removed ${remove.length}`);
    totalRemoved += remove.length;
  }

  // Add unique index
  try {
    await col.createIndex(
      { userId: 1, dataType: 1, storageLocation: 1 },
      { unique: true, background: true }
    );
    console.log('\nUnique index created on (userId, dataType, storageLocation)');
  } catch (e) {
    console.log('\nIndex already exists or error:', e.message);
  }

  const remaining = await col.countDocuments();
  console.log(`Total inventory items remaining: ${remaining}`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
