import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  domain:{type:String,enum:['aptitude','cs','interview'],required:true},
  topicId:{type:String,required:true},questionId:{type:String,required:true},
  answer:{type:mongoose.Schema.Types.Mixed,required:true},correct:{type:Boolean,default:null}
},{timestamps:true});
schema.index({userId:1,domain:1,topicId:1,questionId:1},{unique:true});
export const PracticeResponse = mongoose.model('PracticeResponse',schema);
