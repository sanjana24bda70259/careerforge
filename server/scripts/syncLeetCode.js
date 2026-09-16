import '../config/env.js';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/db.js';
import { syncLeetCodeCatalog } from '../services/leetcodeImporter.js';

try {
  await connectDatabase();
  const result = await syncLeetCodeCatalog();
  console.log(`Imported ${result.imported} LeetCode problems.`);
  await mongoose.disconnect();
} catch (error) {
  console.error(`LeetCode import failed: ${error.message}`);
  await mongoose.disconnect();
  process.exitCode = 1;
}
