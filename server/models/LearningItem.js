import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true, maxlength: 240 },
  bookmarked: { type: Boolean, default: false },
  practised: { type: Boolean, default: false },
  revisionSelected: { type: Boolean, default: false },
  dueDate: { type: String, default: null },
  reviewStage: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  lastReviewedDate: { type: String, default: null },
  mistakeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mistake', default: null }
}, { timestamps: true });
schema.index({ userId: 1, key: 1 }, { unique: true });
schema.index({ userId: 1, revisionSelected: 1, dueDate: 1 });
export const LearningItem = mongoose.model('LearningItem', schema);

const attemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  key: { type: String, required: true },
  dateKey: { type: String, required: true },
  answer: { type: Number, required: true },
  correct: { type: Boolean, required: true }
}, { timestamps: true });
attemptSchema.index({ userId: 1, dateKey: 1 });
export const LearningAttempt = mongoose.model('LearningAttempt', attemptSchema);
