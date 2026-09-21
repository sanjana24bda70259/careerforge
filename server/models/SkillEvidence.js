import mongoose from 'mongoose';

/*
 * A compact, per-skill aggregate.  It deliberately stores evidence rather
 * than an opaque "readiness score" so every conclusion in the UI can explain
 * where it came from.
 */
const skillEvidenceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  skillId: { type: String, required: true, trim: true, maxlength: 160 },
  label: { type: String, required: true, trim: true, maxlength: 120 },
  domain: { type: String, enum: ['dsa', 'aptitude', 'cs', 'interview', 'project'], required: true, index: true },
  attempted: { type: Number, default: 0, min: 0 },
  correct: { type: Number, default: 0, min: 0 },
  incorrect: { type: Number, default: 0, min: 0 },
  completed: { type: Number, default: 0, min: 0 },
  revisionPassed: { type: Number, default: 0, min: 0 },
  revisionMissed: { type: Number, default: 0, min: 0 },
  interviewResponses: { type: Number, default: 0, min: 0 },
  timeTakenSeconds: { type: Number, default: 0, min: 0 },
  lastEvidenceAt: { type: Date, default: Date.now }
}, { timestamps: true });

skillEvidenceSchema.index({ userId: 1, skillId: 1 }, { unique: true });

export const SkillEvidence = mongoose.model('SkillEvidence', skillEvidenceSchema);
