import model from '../ml/model.json' with {type:'json'};
import {AppError} from './domain.mjs';

export function classify(text) {
  const tokens=(text.toLowerCase().match(/\b\w\w+\b/g)||[]);
  const counts=new Map(); for(const t of tokens){const i=model.vocabulary[t];if(i!==undefined)counts.set(i,(counts.get(i)||0)+1);}
  const vector=[...counts].map(([i,n])=>[i,n*model.idf[i]]);
  const norm=Math.sqrt(vector.reduce((s,[,n])=>s+n*n,0))||1;
  const features=vector.map(([i,n])=>[i,n/norm]);
  const scores=model.classes.map((_,k)=>model.intercepts[k]+features.reduce((s,[i,n])=>s+n*model.coefficients[k][i],0));
  const max=Math.max(...scores), exp=scores.map(x=>Math.exp(x-max)), sum=exp.reduce((a,b)=>a+b,0);
  const ranked=model.classes.map((label,k)=>({label,probability:exp[k]/sum,index:k})).sort((a,b)=>b.probability-a.probability);
  const winner=ranked[0], inverse=Object.fromEntries(Object.entries(model.vocabulary).map(([t,i])=>[i,t]));
  const evidence=features.map(([i,n])=>({word:inverse[i],weight:n*model.coefficients[winner.index][i]})).filter(x=>x.weight>0).sort((a,b)=>b.weight-a.weight).slice(0,4).map(x=>x.word);
  return {category:features.length?winner.label:'unknown',confidence:features.length?Math.round(winner.probability*100):0,evidence,model:model.version};
}

export function analyzeBrief(text, existing=[]) {
  if(typeof text!=='string'||text.trim().length<12||text.length>6000)throw new AppError('Enter a brief between 12 and 6,000 characters.');
  const allClauses=text.split(/[\n;.!?]+|\s+and\s+(?=(?:a |an |also |add |create |build |design |make |set |integrate |write ))/i).map(x=>x.trim()).filter(x=>x.length>5);
  const clauses=allClauses.slice(0,16);
  const flags=[];
  if(allClauses.length>16)flags.push('Only the first 16 clauses are shown. Split this brief into smaller requests and review the remaining requirements.');
  if(/unlimited|as many as|everything|whatever|all features/i.test(text))flags.push('Open-ended requirements: agree a finite number of deliverables and revisions.');
  if(/urgent|asap|tomorrow|today|immediately/i.test(text))flags.push('Confirm a specific delivery date before accepting this request.');
  if(/guarantee|guaranteed|100%|first rank/i.test(text))flags.push('Outcome guarantees need clarification; do not promise sales or rankings.');
  if(/ignore .*instructions|system prompt|reveal .*secret|api[_ -]?key/i.test(text))flags.push('Instruction-like content detected. Brief text cannot change prices, approvals or payment settings.');
  const result=clauses.map((source,index)=>{
    const prediction=classify(source);
    const excluded=/\b(no |not |without |exclude|do not |don't )/i.test(source);
    const uncertain=prediction.confidence<48||prediction.category==='unknown'||excluded;
    const relation=excluded?'clarify':existing.length?(existing.some(x=>x.category===prediction.category)?'review-change':'new-service'):'new-scope';
    return {id:`suggestion-${index+1}`,source,...prediction,uncertain,relation,reason:excluded?'Negation or exclusion needs human interpretation.':uncertain?'Limited model confidence; choose the correct service before quoting.':existing.length?'Compare against the actual approved deliverables; matching category does not mean included work.':'Confirm the deliverable, quantity and acceptance criteria.'};
  });
  return {items:result,flags,model:model.version,privacy:'Analysis runs locally on the server. No brief is sent to an AI provider.',limits:'A small English service classifier, not a general language model. Suggestions never authorize payment.'};
}
