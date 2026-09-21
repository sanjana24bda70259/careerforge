import mongoose from 'mongoose';

/*
 * New revisions are concept-aware.  The older Revision collection is kept for
 * compatibility with previously saved DSA problems and is merged in the API.
 */
const revisionItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  skillId: { type: String, required: true, maxlength: 160 },
  label: { type: String, required: true, maxlength: 160 },
  domain: { type: String, enum: ['dsa', 'aptitude', 'cs', 'interview'], required: true, index: true },
  sourceType: { type: String, enum: ['dsa_problem', 'aptitude_question', 'interview_answer', 'cs_concept'], required: true },
  sourceId: { type: String, required: true, maxlength: 200 },
  prompt: { type: String, default: '', maxlength: 700 },
  dueAt: { type: Date, required: true, index: true },
  intervalIndex: { type: Number, default: 0, min: 0, max: 5 },
  successfulReviews: { type: Number, default: 0, min: 0 },
  unsuccessfulReviews: { type: Number, default: 0, min: 0 },
  lastReviewedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

revisionItemSchema.index({ userId: 1, sourceType: 1, sourceId: 1 }, { unique: true });

export const RevisionItem = mongoose.model('RevisionItem', revisionItemSchema);
