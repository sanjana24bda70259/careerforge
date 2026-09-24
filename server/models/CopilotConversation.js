import mongoose from 'mongoose';

const actionSchema = new mongoose.Schema({
  label: { type: String, required: true, maxlength: 100 },
  route: { type: String, required: true, maxlength: 240 }
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 140 },
  content: { type: String, default: '', maxlength: 4000 },
  bullets: { type: [String], default: [], validate: value => value.length <= 12 },
  code: { type: String, default: '', maxlength: 6000 },
  language: { type: String, default: '', maxlength: 40 }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 6000 },
  focus: { type: String, default: '', maxlength: 100 },
  intent: { type: String, default: '', maxlength: 80 },
  sections: { type: [sectionSchema], default: [] },
  actions: { type: [actionSchema], default: [] }
}, { _id: true, timestamps: { createdAt: true, updatedAt: false } });

const copilotConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120, default: 'New conversation' },
  messages: { type: [messageSchema], default: [] }
}, { timestamps: true });

copilotConversationSchema.index({ userId: 1, updatedAt: -1 });

export const CopilotConversation = mongoose.model('CopilotConversation', copilotConversationSchema);
