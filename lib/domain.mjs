import {createHash,randomUUID} from 'node:crypto';

export const CATEGORIES={website:'Website',branding:'Brand identity',social:'Social content',automation:'Automation',commerce:'Commerce'};
export class AppError extends Error{constructor(message,status=400){super(message);this.status=status;}}
export const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function normalizeQuote(body){
  if(!body||!Array.isArray(body.items)||body.items.length<1||body.items.length>16)throw new AppError('Add 1 to 16 reviewed deliverables.');
  if(!['USD','EUR','GBP'].includes(body.currency))throw new AppError('Choose USD, EUR or GBP.');
  const title=String(body.title||'').trim();if(title.length<3||title.length>90)throw new AppError('Project title must contain 3 to 90 characters.');
  const items=body.items.map(x=>{
    const description=String(x.description||'').trim();
    if(description.length<6||description.length>240)throw new AppError('Describe each deliverable in 6 to 240 characters.');
    if(!Object.hasOwn(CATEGORIES,x.category))throw new AppError('Choose a supported category for every item.');
    const amount=String(x.amount??'');if(!/^\d{1,5}(\.\d{1,2})?$/.test(amount))throw new AppError('Use a positive price with up to two decimals.');
    const [whole,decimal='']=amount.split('.');const cents=Number(whole)*100+Number(decimal.padEnd(2,'0'));
    if(cents<100||cents>1000000)throw new AppError('Each sandbox deliverable must cost between 1 and 10,000.');
    return {category:x.category,description,cents};
  });
  const revisions=Number(body.revisions);if(!Number.isInteger(revisions)||revisions<0||revisions>5)throw new AppError('Set 0 to 5 included revisions.');
  const acceptance=String(body.acceptance||'').trim();if(acceptance.length<12||acceptance.length>1200)throw new AppError('Add clear acceptance criteria (12 to 1,200 characters).');
  const totalCents=items.reduce((s,x)=>s+x.cents,0);if(totalCents>1000000)throw new AppError('Sandbox quote limit is 10,000.');
  return {title,currency:body.currency,items,revisions,acceptance,totalCents};
}
export function makeQuote(body,parent=null){
 const normalized=normalizeQuote(body), id=randomUUID();
 const record={...normalized,id,kind:parent?'change-order':'initial',parentId:parent?.id||null,parentHash:parent?.scopeHash||null,createdAt:new Date().toISOString()};
 return {...record,scopeHash:hash(record),status:'AWAITING_REVIEW',approval:null,orderId:null,capture:null,events:[{kind:'SCOPE_CREATED',at:record.createdAt,hash:hash(record)}]};
}
export function approveQuote(q,input){
 if(input.scopeHash!==q.scopeHash)throw new AppError('Scope changed. Review the current version.',409);
 if(input.agreed!==true)throw new AppError('Explicit scope approval is required.');
 if(q.approval)return q;
 if(q.status!=='AWAITING_REVIEW')throw new AppError('This scope cannot be approved.',409);
 q.approval={scopeHash:q.scopeHash,at:new Date().toISOString(),acknowledgement:'Reviewed deliverables, amount, revision limit and acceptance criteria'};
 q.status='APPROVED';q.events.push({kind:'SCOPE_APPROVED',at:q.approval.at,hash:q.scopeHash});return q;
}
export function requireApproved(q){if(!q.approval||q.approval.scopeHash!==q.scopeHash)throw new AppError('Review and approve this exact scope before checkout.',409);}
export const money=cents=>(cents/100).toFixed(2);
export function validateCapture(order,q){
 if(order.id!==q.orderId)throw new AppError('Payment order does not match this scope.',409);
 if(order.status!=='COMPLETED')throw new AppError('PayPal has not completed this payment.',409);
 const units=order.purchase_units;if(!Array.isArray(units)||units.length!==1)throw new AppError('Unexpected payment structure.',409);
 const unit=units[0], captures=unit.payments?.captures;
 if(unit.custom_id!==q.scopeHash)throw new AppError('Payment scope fingerprint does not match.',409);
 if(!Array.isArray(captures)||captures.length!==1)throw new AppError('Expected exactly one capture.',409);
 const capture=captures[0];
 if(capture.status!=='COMPLETED'||capture.amount?.currency_code!==q.currency||capture.amount?.value!==money(q.totalCents))throw new AppError('Payment amount, currency or status did not match.',409);
 if(typeof capture.id!=='string'||capture.id.length<3)throw new AppError('Missing capture reference.',409);
 return {id:capture.id,amount:money(q.totalCents),currency:q.currency,at:capture.create_time||new Date().toISOString(),environment:'sandbox'};
}
