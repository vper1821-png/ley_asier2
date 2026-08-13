import mongoose from 'mongoose';
import { CONFIG } from './config.js';
import { TrainingRecord } from './models/compliance.js';

async function main() {
  await mongoose.connect(CONFIG.MONGODB_URI);

  // Set completed=false for all records without signature
  const result = await TrainingRecord.updateMany(
    { $or: [{ signatureData: { $exists: false } }, { signatureData: null }, { signatureData: '' }] },
    { $set: { completed: false } }
  );
  console.log(`Records fixed: ${result.modifiedCount}`);

  // Count remaining completed
  const completed = await TrainingRecord.countDocuments({ completed: true });
  const total = await TrainingRecord.countDocuments();
  console.log(`Completed: ${completed} / ${total} total`);

  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
