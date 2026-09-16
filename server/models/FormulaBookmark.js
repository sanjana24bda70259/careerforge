import mongoose from 'mongoose';

const formulaBookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  formulaId: { type: String, required: true }
}, { timestamps: true });
formulaBookmarkSchema.index({ userId: 1, formulaId: 1 }, { unique: true });
export const FormulaBookmark = mongoose.model('FormulaBookmark', formulaBookmarkSchema);
