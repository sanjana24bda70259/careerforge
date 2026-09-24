import mongoose from 'mongoose';

const csTopicProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subjectId: { type: String, required: true, index: true },
  topicId: { type: String, required: true, index: true },
  learnedAt: { type: Date, default: null },
  revisedAt: { type: Date, default: null },
  revisionCount: { type: Number, default: 0, min: 0 },
  quizAttempts: { type: Number, default: 0, min: 0 },
  quizCorrect: { type: Number, default: 0, min: 0 },
  quizTotal: { type: Number, default: 0, min: 0 },
  lastQuizAt: { type: Date, default: null }
}, { timestamps: true });

csTopicProgressSchema.index({ userId: 1, subjectId: 1, topicId: 1 }, { unique: true });

export const CsTopicProgress = mongoose.model('CsTopicProgress', csTopicProgressSchema);
