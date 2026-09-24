import mongoose from 'mongoose';

const dailyPlanTaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  domain: { type: String, enum: ['dsa', 'aptitude', 'cs', 'revision', 'career'], required: true },
  title: { type: String, required: true, maxlength: 180 },
  detail: { type: String, required: true, maxlength: 280 },
  estimatedMinutes: { type: Number, required: true, min: 1, max: 240 },
  href: { type: String, required: true, maxlength: 240 },
  sourceId: { type: String, default: null, maxlength: 160 },
  status: { type: String, enum: ['planned', 'completed', 'skipped', 'rescheduled'], default: 'planned' },
  completedAt: { type: Date, default: null },
  skippedAt: { type: Date, default: null },
  rescheduledFor: { type: String, default: null }
}, { _id: false });

const dailyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dateKey: { type: String, required: true },
  startedAt: { type: Date, default: null },
  tasks: { type: [dailyPlanTaskSchema], default: [] }
}, { timestamps: true });

dailyPlanSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const DailyPlan = mongoose.model('DailyPlan', dailyPlanSchema);
