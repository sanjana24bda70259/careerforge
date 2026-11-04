import { useState } from 'react';
import '../reviewCarousel.css';
function ReviewCard({review,copy=false}){
 const [expanded,setExpanded]=useState(false);const long=review.text.length>145;
 const initials=review.name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
 return <article className="review-carousel-card"><div className="review-person"><span>{initials}</span><div><h3>{review.name}</h3><time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString(undefined,{month:'short',year:'numeric'})}</time></div></div><div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</div><p className={expanded?'review-copy is-expanded':'review-copy'}>{review.text}</p>{long&&!copy&&<button type="button" className="review-read-more" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Read less':'Read more'}</button>}<footer>Community review <span>·</span> {review.rating}.0 / 5 rating</footer></article>;
}
export function ReviewCarousel({reviews}){
 const [paused,setPaused]=useState(false);const moving=reviews.length>1;
 return <div className={`reviews-carousel ${moving?'is-moving':'is-single'} ${paused?'is-paused':''}`}><div className="reviews-carousel-window"><div className="reviews-carousel-track" style={{'--review-duration':`${Math.max(24,reviews.length*7)}s`}}><div className="reviews-carousel-group">{reviews.map(review=><ReviewCard review={review} key={review._id}/>)}</div>{moving&&<div className="reviews-carousel-group" aria-hidden="true" inert="">{reviews.map(review=><ReviewCard review={review} copy key={review._id}/>)}</div>}</div></div>{moving&&<button type="button" className="reviews-motion-toggle" aria-pressed={paused} onClick={()=>setPaused(!paused)}>{paused?'Resume scrolling':'Pause scrolling'}</button>}</div>;
}
