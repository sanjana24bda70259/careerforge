import mongoose from 'mongoose';

const dailyQuestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dateKey: { type: String, required: true },
  tasks: [{ id: String, type: String, title: String, detail: String, xp: Number, completed: { type: Boolean, default: false } }]
}, { timestamps: true });

dailyQuestSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
export const DailyQuest = mongoose.model('DailyQuest', dailyQuestSchema);
