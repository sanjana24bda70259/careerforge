import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  answer: { type: Number, default: null }
}, { _id: false });

const csQuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subjectId: { type: String, required: true, index: true },
  topicId: { type: String, required: true, index: true },
  answers: { type: [answerSchema], required: true },
  attempted: { type: Number, required: true, min: 0 },
  correct: { type: Number, required: true, min: 0 },
  incorrect: { type: Number, required: true, min: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

csQuizAttemptSchema.index({ userId: 1, subjectId: 1, topicId: 1, submittedAt: -1 });

export const CsQuizAttempt = mongoose.model('CsQuizAttempt', csQuizAttemptSchema);
