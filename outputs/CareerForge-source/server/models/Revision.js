import mongoose from 'mongoose';

const revisionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  problemId: { type: String, required: true },
  dueAt: { type: Date, required: true, index: true },
  intervalIndex: { type: Number, default: 0, min: 0, max: 4 },
  completedAt: Date
}, { timestamps: true });

revisionSchema.index({ userId: 1, problemId: 1 }, { unique: true });
export const Revision = mongoose.model('Revision', revisionSchema);
