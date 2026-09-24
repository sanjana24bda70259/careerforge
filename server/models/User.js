import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 80 },
  college: { type: String, trim: true, maxlength: 160 },
  degree: { type: String, trim: true, maxlength: 100 },
  branch: { type: String, trim: true, maxlength: 100 },
  graduationYear: { type: Number, min: 2020, max: 2100 },
  targetRole: { type: String, trim: true, maxlength: 100 },
  preferredLanguage: { type: String, trim: true, maxlength: 50 },
  studyGoal: { type: String, trim: true, maxlength: 240 },
  weeklyStudyHours: { type: Number, min: 1, max: 80 },
  skills: [{ type: String, trim: true, maxlength: 60 }],
  problemsSolved: { type: Number, default: 0, min: 0 }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  profile: { type: profileSchema, default: () => ({}) }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
