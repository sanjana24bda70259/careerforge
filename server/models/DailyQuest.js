import mongoose from 'mongoose';

const dailyQuestTaskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  detail: { type: String, required: true },
  xp: { type: Number, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const dailyQuestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dateKey: { type: String, required: true },
  tasks: { type: [dailyQuestTaskSchema], default: [] }
}, { timestamps: true });

dailyQuestSchema.index({ userId: 1, dateKey: 1 }, { unique: true });
export const DailyQuest = mongoose.model('DailyQuest', dailyQuestSchema);
