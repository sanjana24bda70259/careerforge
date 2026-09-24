import mongoose from 'mongoose';

const mistakeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  source: { type: String, enum: ['dsa', 'aptitude', 'sql', 'cs', 'mock'], required: true, index: true },
  questionId: { type: String, default: null, maxlength: 180 },
  question: { type: String, required: true, trim: true, maxlength: 3000 },
  topic: { type: String, required: true, trim: true, maxlength: 140 },
  category: { type: String, default: null, trim: true, maxlength: 140 },
  userAnswer: { type: String, default: '', maxlength: 3000 },
  correctAnswer: { type: String, default: '', maxlength: 3000 },
  reason: { type: String, enum: ['Concept Gap', 'Calculation Error', 'Forgot Formula', 'Coding Bug', 'Misread Question', 'Time Pressure', 'Other'], default: 'Other' },
  note: { type: String, default: '', maxlength: 3000 },
  occurredAt: { type: Date, default: Date.now }
}, { timestamps: true });

mistakeSchema.index({ userId: 1, source: 1, occurredAt: -1 });

export const Mistake = mongoose.model('Mistake', mistakeSchema);
