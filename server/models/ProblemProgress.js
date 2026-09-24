import mongoose from 'mongoose';

const problemProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  problemId: { type: String, required: true },
  status: { type: String, enum: ['not_started', 'attempted', 'solved', 'needs_revision'], default: 'not_started' },
  attempts: { type: Number, default: 0, min: 0 },
  usedHint: { type: Boolean, default: false },
  language: { type: String, maxlength: 40 },
  latestCode: { type: String, maxlength: 50000 },
  timeSpentSeconds: { type: Number, default: 0, min: 0 },
  lastAttemptedAt: Date,
  lastSubmission: {
    status: { type: String, default: null },
    language: { type: String, default: null },
    submittedAt: { type: Date, default: null },
    executionTimeMs: { type: Number, default: null }
  },
  solvedAt: Date
}, { timestamps: true });

problemProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });
export const ProblemProgress = mongoose.model('ProblemProgress', problemProgressSchema);
