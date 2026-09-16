import mongoose from 'mongoose';

const aptitudeQuestionBookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  questionId: { type: String, required: true },
  track: { type: String, enum: ['advanced'], default: 'advanced' }
}, { timestamps: true });

aptitudeQuestionBookmarkSchema.index({ userId: 1, questionId: 1 }, { unique: true });
export const AptitudeQuestionBookmark = mongoose.model('AptitudeQuestionBookmark', aptitudeQuestionBookmarkSchema);
