import mongoose from 'mongoose';

const dsaResourceProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resourceId: { type: String, required: true },
  resourceType: { type: String, enum: ['cheatsheet'], required: true },
  bookmarked: { type: Boolean, default: false },
  revisedAt: { type: Date, default: null },
  revisionCount: { type: Number, default: 0, min: 0 }
}, { timestamps: true });

dsaResourceProgressSchema.index({ userId: 1, resourceId: 1, resourceType: 1 }, { unique: true });

export const DsaResourceProgress = mongoose.model('DsaResourceProgress', dsaResourceProgressSchema);
