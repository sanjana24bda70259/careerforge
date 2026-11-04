import mongoose from 'mongoose';
const schema = new mongoose.Schema({ name: { type: String, required: true, maxlength: 60 }, rating: { type: Number, required: true, min: 1, max: 5 }, text: { type: String, required: true, maxlength: 1000 } }, { timestamps: true });
export const SiteReview = mongoose.model('SiteReview', schema);
