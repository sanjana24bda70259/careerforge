import mongoose from 'mongoose';

const dsaProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  topicId: { type: String, required: true },
  status: { type: String, enum: ['not_started', 'needs_practice', 'in_progress', 'proficient'], default: 'not_started' },
  mastery: { type: Number, default: 0, min: 0, max: 100 },
  diagnosticScore: { type: Number, min: 0, max: 100 },
  problemsSolved: { type: Number, default: 0, min: 0 },
  revisionCount: { type: Number, default: 0, min: 0 },
  lastPracticedAt: Date
}, { timestamps: true });

dsaProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });
export const DSAProgress = mongoose.model('DSAProgress', dsaProgressSchema);
