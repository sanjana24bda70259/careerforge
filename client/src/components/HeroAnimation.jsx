import '../heroAnimation.css';
const cards=[
 {name:'trees',label:'Visualize algorithms',x:'12%',y:'14%',tilt:'-14deg',color:'#4b8df5',delay:'0s'},
 {name:'lines',label:'Practise patterns',x:'76%',y:'12%',tilt:'12deg',color:'#9675ed',delay:'-2s'},
 {name:'bars',label:'Track your progress',x:'87%',y:'42%',tilt:'14deg',color:'#f16e87',delay:'-4s'},
 {name:'stack',label:'Build your foundation',x:'5%',y:'48%',tilt:'-12deg',color:'#39b48a',delay:'-1s'},
 {name:'database',label:'Connect concepts',x:'18%',y:'77%',tilt:'10deg',color:'#e9ad35',delay:'-3s'},
 {name:'grid',label:'Plan your next step',x:'72%',y:'77%',tilt:'-9deg',color:'#8564df',delay:'-5s'},
];
function CardIcon({name}){
 if(name==='trees')return <><path d="M32 13 15 43M32 13l17 30"/><circle cx="32" cy="13" r="8"/><circle cx="15" cy="43" r="8"/><circle cx="49" cy="43" r="8"/></>;
 if(name==='lines')return <><rect x="10" y="12" width="33" height="8" rx="3"/><rect x="10" y="27" width="44" height="8" rx="3"/><rect x="10" y="42" width="37" height="8" rx="3"/></>;
 if(name==='bars')return <><rect x="10" y="34" width="10" height="20" rx="2"/><rect x="27" y="22" width="10" height="32" rx="2"/><rect x="44" y="9" width="10" height="45" rx="2"/></>;
 if(name==='stack')return <><rect x="9" y="12" width="46" height="9" rx="4"/><rect x="9" y="27" width="46" height="9" rx="4"/><rect x="9" y="42" width="46" height="9" rx="4"/><path d="M44 14v5m0 10v5m0 10v5" stroke="white" strokeWidth="2"/></>;
 if(name==='database')return <><path d="M13 20v24c0 14 38 14 38 0V20"/><ellipse cx="32" cy="18" rx="19" ry="9"/><path d="M13 30c0 12 38 12 38 0M13 41c0 12 38 12 38 0" fill="none" stroke="white" strokeWidth="2.5"/></>;
 return <>{[12,35].map(x=>[12,35].map(y=><rect key={x+':'+y} x={x} y={y} width="18" height="18" rx="2"/>))}</>;
}
export function HeroAnimation(){return <div className="hero-card-scene" aria-hidden="true">{cards.map(card=><div className="hero-concept" key={card.name} style={{left:card.x,top:card.y,'--card-tilt':card.tilt,'--card-color':card.color,'--card-delay':card.delay}}><span className="hero-concept-caption">{card.label}</span><div className="hero-concept-card"><svg viewBox="0 0 64 64" focusable="false"><CardIcon name={card.name}/></svg></div></div>)}</div>;}
