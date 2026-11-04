import mongoose from 'mongoose';

const owner = { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true };
const domain = { type: String, enum: ['dsa', 'aptitude', 'cs', 'career', 'general'], default: 'general' };
const scheduleSchema = new mongoose.Schema({
  userId: owner, title: { type: String, required: true, maxlength: 180 }, domain,
  dateKey: { type: String, required: true }, startTime: { type: String, required: true },
  durationMinutes: { type: Number, required: true, min: 5, max: 480 },
  status: { type: String, enum: ['planned', 'completed'], default: 'planned' },
  sourceTaskId: { type: String, default: null }, href: { type: String, default: null },
  notes: { type: String, default: '', maxlength: 3000 }, archivedAt: { type: Date, default: null }
}, { timestamps: true });
scheduleSchema.index({ userId: 1, dateKey: 1, startTime: 1 });
scheduleSchema.index({ userId: 1, dateKey: 1, sourceTaskId: 1 }, { unique: true, partialFilterExpression: { sourceTaskId: { $type: 'string' } } });
export const StudySchedule = mongoose.model('StudySchedule', scheduleSchema);

const entrySchema = new mongoose.Schema({
  userId: owner, type: { type: String, enum: ['note', 'list', 'goal'], required: true },
  title: { type: String, required: true, maxlength: 180 }, content: { type: String, default: '', maxlength: 20000 }, domain,
  items: [{ text: { type: String, maxlength: 300 }, completed: { type: Boolean, default: false } }],
  dueDate: { type: String, default: null }, progress: { type: Number, default: 0, min: 0, max: 100 },
  goalType: { type: String, enum: ['exam', 'interview', 'project', 'study'], default: 'study' },
  pinned: { type: Boolean, default: false }, archivedAt: { type: Date, default: null }
}, { timestamps: true });
entrySchema.index({ userId: 1, type: 1, archivedAt: 1 });
export const WorkspaceEntry = mongoose.model('WorkspaceEntry', entrySchema);

const focusSchema = new mongoose.Schema({ userId: { ...owner, index: false }, domain, startedAt: { type: Date, default: Date.now }, endedAt: { type: Date, default: null }, durationSeconds: { type: Number, default: 0 } }, { timestamps: true });
focusSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { endedAt: null } });
export const FocusSession = mongoose.model('FocusSession', focusSchema);

const receiptSchema = new mongoose.Schema({ userId: owner, key: { type: String, required: true, maxlength: 200 }, readAt: { type: Date, default: null }, dismissedAt: { type: Date, default: null } }, { timestamps: true });
receiptSchema.index({ userId: 1, key: 1 }, { unique: true });
export const NotificationReceipt = mongoose.model('NotificationReceipt', receiptSchema);

const preferenceSchema = new mongoose.Schema({
  userId: { ...owner, unique: true }, theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  planningMode: { type: String, enum: ['personalized', 'custom'], default: 'personalized' },
  dailyBriefing: { type: Boolean, default: true }, revisionReminders: { type: Boolean, default: true },
  deadlineReminders: { type: Boolean, default: true }
}, { timestamps: true });
export const WorkspacePreference = mongoose.model('WorkspacePreference', preferenceSchema);
