import mongoose from 'mongoose';

const leetCodeProblemSchema = new mongoose.Schema({
  leetCodeId: { type: Number, required: true, unique: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  section: { type: String, enum: ['Arrays', 'Strings', 'Other'], default: 'Other', index: true },
  url: { type: String, required: true },
  source: { type: String, default: 'LeetCode' }
}, { timestamps: true });

export const LeetCodeProblem = mongoose.model('LeetCodeProblem', leetCodeProblemSchema);
