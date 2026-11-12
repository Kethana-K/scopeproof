// Pure inference + conservative review engine. No network or automatic approval.
export const VERSION='changelens-review-v1';
export const DECISIONS=['included','additional','clarify'];
export const LABELS={website:'Website',social:'Social content',branding:'Branding',automation:'Automation',commerce:'Commerce',unknown:'Unrecognized'};
export function normalize(s){return s.toLowerCase().replace(/[“”]/g,'"').replace(/[’]/g,"'").replace(/[.!?]+$/,'').replace(/\s+/g,' ').trim();}
export function clauses(s){
 if(typeof s!=='string'||s.trim().length<6||s.length>6000)throw Error('Use 6–6,000 characters in each text box.');
 const xs=s.split(/\r?\n|;|[.!?](?=\s|$)/).map(x=>x.trim()).filter(Boolean);
 if(xs.length>24)throw Error('Use up to 24 clauses per comparison. Split a longer brief; no clauses will be silently omitted.');
 return xs;
}
export function vector(model,text){
 const counts=new Map(); for(const t of text.toLowerCase().match(/\b\w\w+\b/g)||[]){const i=model.vocabulary[t];if(i!==undefined)counts.set(i,(counts.get(i)||0)+1);}
 const raw=[...counts].map(([i,n])=>[i,n*model.idf[i]]),norm=Math.sqrt(raw.reduce((s,[,n])=>s+n*n,0))||1;
 return raw.map(([i,n])=>[i,n/norm]);
}
export function classify(model,text){
 const v=vector(model,text);if(!v.length)return {category:'unknown',score:0,evidence:[]};
 const z=model.classes.map((_,k)=>model.intercepts[k]+v.reduce((s,[i,n])=>s+n*model.coefficients[k][i],0));
 const e=z.map(n=>Math.exp(n-Math.max(...z))),sum=e.reduce((a,b)=>a+b,0),k=z.indexOf(Math.max(...z));
 const inverse=Object.fromEntries(Object.entries(model.vocabulary).map(([t,i])=>[i,t]));
 return {category:model.classes[k],score:Math.round(100*e[k]/sum),evidence:v.map(([i,n])=>({word:inverse[i],weight:n*model.coefficients[k][i]})).filter(x=>x.weight>0).sort((a,b)=>b.weight-a.weight).slice(0,4).map(x=>x.word)};
}
export function cosine(a,b){const bm=new Map(b);return a.reduce((s,[i,v])=>s+v*(bm.get(i)||0),0);}
function wordOverlap(a,b){
 const words=s=>new Set((s.toLowerCase().match(/\b[a-z]{3,}\b/g)||[]).filter(w=>!['the','and','with','for','our','your','please','include','make','create','build','add'].includes(w)).map(w=>w.replace(/s$/,'')));
 const av=words(a),bv=words(b),union=new Set([...av,...bv]);
 return union.size?[...av].filter(w=>bv.has(w)).length/union.size:0;
}
const numberWords={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20};
export function quantities(text){
 const normalized=text.toLowerCase().replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/g,w=>String(numberWords[w])).replace(/-/g,' ');
 const re=/\b(\d+)\s+(?:(?:additional|extra|more)\s+)?(?:(?:instagram|social|web|landing|responsive|revision)\s+)?(posts?|pages?|rounds?|revisions?|banners?|logos?|products?|reels?|emails?|forms?)\b/g;
 return [...normalized.matchAll(re)].map(m=>({quantity:Number(m[1]),unit:/round|revision/.test(m[2])?'revision':m[2].replace(/s$/,'')}));
}
const hasNegation=s=>/\b(?:no|not|without|exclud(?:e|ed|es|ing)|never|don't|doesn't|cannot|can't)\b/i.test(s);
export function compare(model,baselineText,requestText){
 const base=clauses(baselineText).map((text,i)=>({id:`B${i+1}`,text,...classify(model,text),v:vector(model,text)}));
 const items=clauses(requestText).map((text,i)=>{
  const prediction=classify(model,text),v=vector(model,text),flags=[];
  const candidates=base.map(b=>({id:b.id,text:b.text,category:b.category,similarity:Math.max(cosine(v,b.v),wordOverlap(text,b.text))})).filter(b=>b.similarity>.08||normalize(text)===normalize(b.text)).sort((a,b)=>b.similarity-a.similarity).slice(0,3);
  const exact=base.find(b=>normalize(text)===normalize(b.text));
  const quantitiesNew=quantities(text);
  const relevant=candidates.filter(b=>b.similarity>=.20);
  const qtyChanges=[];
  for(const q of quantitiesNew){
   const matches=relevant.flatMap(b=>quantities(b.text).filter(old=>old.unit===q.unit).map(old=>({...old,source:b.id,text:b.text})));
   const values=[...new Set(matches.map(x=>x.quantity))];
   if(values.length===1&&values[0]!==q.quantity){
    const ambiguous=/\b(extra|more|additional|another|between|at least|up to|each|per)\b|\d\s*[-–]\s*\d/i.test(text)||matches.some(m=>/\b(between|at least|up to|each|per)\b|\d\s*[-–]\s*\d/i.test(m.text));
    qtyChanges.push({unit:q.unit,original:values[0],requested:q.quantity,delta:ambiguous?null:q.quantity-values[0],source:matches[0].source,ambiguous});
   }else if(values.length>1)flags.push({kind:'quantity',text:`Multiple original ${q.unit} counts match. Choose the intended baseline before comparing totals.`});
  }
  if(hasNegation(text)||candidates.some(b=>hasNegation(b.text)))flags.push({kind:'negation',text:'An exclusion or negation needs human interpretation. A similar service name does not override it.'});
  if(/\b(unlimited|everything|whatever|all features|as many as)\b/i.test(text))flags.push({kind:'unbounded',text:'The request has no clear limit. Agree a finite deliverable or revision count.'});
  if(/\b(tomorrow|today|asap|urgent|immediately|sooner|earlier)\b/i.test(text))flags.push({kind:'deadline',text:'A timing change may affect delivery. Ask for a calendar date and confirm availability.'});
  if(/ignore.*instructions|system prompt|reveal.*secret|api.?key|mark.*approved|automatically approve/i.test(text))flags.push({kind:'instruction',text:'Instruction-like text is treated as client content. It cannot approve work or alter this application.'});
  if(prediction.category==='unknown'||prediction.score<48)flags.push({kind:'uncertain',text:'The local model is uncertain. Read the request and decide the service yourself.'});
  if(qtyChanges.some(q=>q.ambiguous))flags.push({kind:'quantity',text:'Quantity wording may be additive, ranged or per-item. The number is not treated as an agreed total.'});
  let signal=exact?'Exact wording found':qtyChanges.length?'Quantity changed':candidates.length?'Related scope found':'No close wording found';
  if(flags.length)signal='Clarification needed';
  return {id:`R${i+1}`,text,...prediction,candidates,qtyChanges,flags,signal,exactId:exact?.id||null,decision:'',note:''};
 });
 return {version:VERSION,model:model.version,baseline:base.map(({v,...b})=>b),baselineText,requestText,items,limits:'English-only prototype. Model scores and lexical matches are not contract interpretation. Every item requires a human decision.'};
}
export function makeRecord(report,decisions,reviewer){
 if(typeof reviewer!=='string'||reviewer.trim().length<2||reviewer.length>100)throw Error('Enter a reviewer label (2–100 characters).');
 if(!Array.isArray(decisions)||decisions.length!==report.items.length)throw Error('Review every request first.');
 const items=report.items.map((item,i)=>{
  const d=decisions[i];if(!DECISIONS.includes(d.decision)||typeof d.note!=='string'||d.note.trim().length<3||d.note.length>600)throw Error(`Add a decision and a short reason for ${item.id}.`);
  return {...item,decision:d.decision,note:d.note.trim()};
 });
 return {application:'ScopeProof ChangeLens',schema:1,version:report.version,model:report.model,createdAt:new Date().toISOString(),reviewer:reviewer.trim(),baselineText:report.baselineText,requestText:report.requestText,items,notice:'Prepared for discussion. This record is not client acceptance, a signed agreement, a bill or legal advice. The reviewer label is not identity-verified.'};
}
export function draftReply(record){
 const lines=['Thanks for the update. I compared your requests with our recorded scope. Here is my proposed review:',''];
 for(const item of record.items){lines.push(`${{included:'Included',additional:'Additional work to agree',clarify:'Needs clarification'}[item.decision]} — ${item.text}\n${item.note}`,'');}
 lines.push('Please confirm the open points. Any added work, price or delivery change needs a separate agreement before I start.');
 return lines.join('\n');
}
