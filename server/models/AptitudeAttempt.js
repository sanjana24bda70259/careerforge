import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({ questionId: { type: String, required: true }, answer: { type: Number, default: null }, timeTakenSeconds: { type: Number, default: null, min: 0 } }, { _id: false });
const aptitudeAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // Older Foundation attempts deliberately have no track field. Treating an
  // absent value as "foundation" keeps those records fully compatible.
  track: { type: String, enum: ['foundation', 'advanced'], default: 'foundation', index: true },
  testType: { type: String, enum: ['topic', 'daily_challenge', 'mock'], default: 'topic', index: true },
  topicId: { type: String, required: true, index: true },
  category: { type: String, default: null },
  mode: { type: String, enum: ['practice', 'timed'], default: 'practice' },
  questionIds: { type: [String], default: [] },
  answers: { type: [answerSchema], required: true },
  attempted: { type: Number, required: true, min: 0 },
  correct: { type: Number, required: true, min: 0 },
  incorrect: { type: Number, required: true, min: 0 },
  unanswered: { type: Number, required: true, min: 0 },
  accuracy: { type: Number, default: null },
  score: { type: Number, required: true, min: 0 },
  startedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: Date.now },
  timeTakenSeconds: { type: Number, default: null, min: 0 }
}, { timestamps: true });
aptitudeAttemptSchema.index({ userId: 1, track: 1, topicId: 1, createdAt: -1 });
export const AptitudeAttempt = mongoose.model('AptitudeAttempt', aptitudeAttemptSchema);
