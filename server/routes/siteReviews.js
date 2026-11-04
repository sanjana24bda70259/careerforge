import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { SiteReview } from '../models/SiteReview.js';
const router = Router();
router.get('/', async (req,res,next) => { try { const reviews = await SiteReview.find().sort({createdAt:-1}).limit(12).select('name rating text createdAt').lean(); res.json({success:true,data:{reviews}}); } catch(e){next(e);} });
router.post('/', rateLimit({windowMs:3600000,max:5,standardHeaders:true,legacyHeaders:false}), async (req,res,next) => {
 try {
 const { name, rating, text, consent } = req.body || {};
 if(typeof name!=='string'||!name.trim()||name.trim().length>60||typeof text!=='string'||text.trim().length<10||text.trim().length>1000||!Number.isInteger(rating)||rating<1||rating>5||consent!==true) return res.status(400).json({success:false,message:'Add your name, a rating, a review of 10–1000 characters and permission to publish.'});
 const review=await SiteReview.create({name:name.trim(),rating,text:text.trim()});
 res.status(201).json({success:true,data:{review},message:'Your review has been published.'});
 }catch(e){next(e);}
});
export default router;
