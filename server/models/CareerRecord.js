import mongoose from 'mongoose';

const careerRecordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['project', 'job', 'resume', 'interview', 'aptitude_attempt', 'mock_attempt', 'notification'], required: true, index: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

careerRecordSchema.index({ userId: 1, type: 1, createdAt: -1 });
export const CareerRecord = mongoose.model('CareerRecord', careerRecordSchema);
