import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['not_started', 'in_progress', 'evidence_recorded'], default: 'not_started' },
  evidenceNote: { type: String, default: '' }
}, { _id: false });

const placementSimulationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetRole: { type: String, default: '' },
  status: { type: String, enum: ['active', 'complete'], default: 'active', index: true },
  rounds: { type: [roundSchema], required: true }
}, { timestamps: true });

placementSimulationSchema.index({ userId: 1, updatedAt: -1 });

export const PlacementSimulation = mongoose.model('PlacementSimulation', placementSimulationSchema);
