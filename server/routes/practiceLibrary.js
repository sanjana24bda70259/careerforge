import { Router } from 'express';
import { PracticeResponse } from '../models/PracticeResponse.js';
import { practiceTopic, practiceSummary, reviewPractice } from '../services/practiceCatalog.js';
const router=Router();
router.get('/:domain',async(req,res,next)=>{
  try {
    const topics=practiceSummary(req.params.domain);
    if(!topics.length)return res.status(404).json({success:false,message:'Practice library not found.'});
    const responses=await PracticeResponse.find({userId:req.user.id,domain:req.params.domain}).select('topicId correct').lean();
    res.json({success:true,data:{topics:topics.map(t=>({...t,attempted:responses.filter(r=>r.topicId===t.id).length,correct:responses.filter(r=>r.topicId===t.id&&r.correct===true).length}))}});
  }catch(error){next(error);}
});
router.get('/:domain/:topicId',async(req,res,next)=>{
  try {
    const topic=practiceTopic(req.params.domain,req.params.topicId);
    if(!topic)return res.status(404).json({success:false,message:'Practice topic not found.'});
    const responses=await PracticeResponse.find({userId:req.user.id,domain:topic.domain,topicId:topic.id}).lean();
    res.json({success:true,data:{topic:{...topic,questions:topic.questions.map(({correctAnswer,explanation,...q})=>q)},responses:responses.map(r=>{
      const question=topic.questions.find(q=>q.id===r.questionId);
      return {questionId:r.questionId,answer:r.answer,correct:r.correct,correctAnswer:question?.correctAnswer,explanation:question?.explanation};
    })}});
  }catch(error){next(error);}
});
router.post('/:domain/:topicId/review',async(req,res,next)=>{
  try {
    const topic=practiceTopic(req.params.domain,req.params.topicId);
    if(!topic)return res.status(404).json({success:false,message:'Practice topic not found.'});
    let review;
    try {review=reviewPractice(topic,req.body?.answers);}catch(error){return res.status(400).json({success:false,message:error.message});}
    await PracticeResponse.bulkWrite(review.map(r=>({updateOne:{filter:{userId:req.user.id,domain:topic.domain,topicId:topic.id,questionId:r.questionId},update:{$set:{answer:r.answer,correct:r.correct}},upsert:true}})));
    res.json({success:true,data:{review},message:topic.format==='written'?'Answer saved. Compare it with the review checklist.':'Answer checked and saved.'});
  }catch(error){next(error);}
});
export default router;
