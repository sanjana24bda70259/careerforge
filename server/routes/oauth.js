import { Router } from 'express';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { createToken } from '../utils/token.js';
const router=Router();
const names=['google','github'];
const config=p=>({id:process.env[`${p.toUpperCase()}_CLIENT_ID`],secret:process.env[`${p.toUpperCase()}_CLIENT_SECRET`]});
const origin=()=>new URL(process.env.OAUTH_PUBLIC_ORIGIN||'http://127.0.0.1:5173').origin;
const callback=p=>`${origin()}/api/auth/oauth/${p}/callback`;
const cookieOptions=()=>({httpOnly:true,sameSite:'lax',secure:origin().startsWith('https:'),path:'/api/auth/oauth',maxAge:600000});
const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')));
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&Buffer.byteLength(a)===Buffer.byteLength(b)&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
async function json(url,options){const r=await fetch(url,{...options,signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Provider request failed');return r.json();}
router.get('/providers',(req,res)=>res.json({success:true,data:{providers:names.map(id=>({id,enabled:Boolean(config(id).id&&config(id).secret)}))}}));
router.get('/:provider/start',(req,res)=>{
 const p=req.params.provider,c=config(p);if(!names.includes(p)||!c.id||!c.secret)return res.status(503).json({success:false,message:'This sign-in provider has not been configured yet.'});
 const state=randomBytes(32).toString('hex'),verifier=randomBytes(32).toString('base64url');
 res.cookie('cf_oauth',jwt.sign({state,verifier,provider:p},process.env.JWT_SECRET,{expiresIn:'10m'}),cookieOptions());
 const url=new URL(p==='google'?'https://accounts.google.com/o/oauth2/v2/auth':'https://github.com/login/oauth/authorize');
 const params={client_id:c.id,redirect_uri:callback(p),state,scope:p==='google'?'openid email profile':'read:user user:email',response_type:'code',code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'};
 Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));res.redirect(url.href);
});
router.get('/:provider/callback',async(req,res)=>{
 const fail=message=>res.redirect(`${origin()}/login?oauth_error=${encodeURIComponent(message)}`);
 try{
 const p=req.params.provider,c=config(p);if(!names.includes(p)||!c.id||!c.secret)throw Error('Unavailable provider');
 const saved=jwt.verify(decodeURIComponent(cookies(req).cf_oauth||''),process.env.JWT_SECRET);
 const {maxAge, ...clearOptions}=cookieOptions(); res.clearCookie('cf_oauth',clearOptions);
 if(saved.provider!==p||!equal(saved.state,req.query.state)||typeof req.query.code!=='string')return fail('Sign-in expired or was cancelled. Please try again.');
 const token=await json(p==='google'?'https://oauth2.googleapis.com/token':'https://github.com/login/oauth/access_token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:new URLSearchParams({client_id:c.id,client_secret:c.secret,code:req.query.code,redirect_uri:callback(p),grant_type:'authorization_code',code_verifier:saved.verifier})});
 if(!token.access_token)throw Error('Missing provider token');
 const headers={Authorization:`Bearer ${token.access_token}`,Accept:'application/json','User-Agent':'CareerForge'};
 const profile=await json(p==='google'?'https://openidconnect.googleapis.com/v1/userinfo':'https://api.github.com/user',{headers});
 let email;if(p==='google'){if(profile.email_verified!==true)throw Error('Unverified email');email=profile.email;}else{const emails=await json('https://api.github.com/user/emails',{headers});email=emails.find(e=>e.primary&&e.verified)?.email;}
 if(typeof email!=='string'||!email.includes('@'))return fail('A verified email address is required.');
 email=email.toLowerCase();const subject=String(p==='google'?profile.sub:profile.id);if(!subject||subject==='undefined')throw Error('Missing identity');
 let user=await User.findOne({oauthAccounts:{$elemMatch:{provider:p,subject}}});
 if(!user){if(await User.exists({email}))return fail('An account already uses this email. Sign in with your existing method.');user=await User.create({email,passwordHash:randomBytes(48).toString('hex'),profile:{name:String(profile.name||profile.login||'Learner').slice(0,80)},oauthAccounts:[{provider:p,subject}]});}
 // Short-lived cookie carries the result back to the same browser without URL tokens.
 res.cookie('cf_oauth_result',createToken(user),{...cookieOptions(),path:'/api/auth/oauth/complete',maxAge:60000});
 res.redirect(`${origin()}/login?oauth_complete=1`);
 }catch{return fail('Could not complete sign-in. Please try again.');}
});
router.post('/complete',async(req,res,next)=>{try{const token=decodeURIComponent(cookies(req).cf_oauth_result||'');const {maxAge,...clearOptions}=cookieOptions();res.clearCookie('cf_oauth_result',{...clearOptions,path:'/api/auth/oauth/complete'});const decoded=jwt.verify(token,process.env.JWT_SECRET);const user=await User.findById(decoded.id||decoded.sub);if(!user)return res.status(401).json({success:false,message:'Sign-in expired.'});res.json({success:true,data:{token:createToken(user),user:{id:user.id,email:user.email,role:user.role,profile:user.profile}}});}catch{res.status(401).json({success:false,message:'Sign-in expired. Please try again.'});}});
export default router;
