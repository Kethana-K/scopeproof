import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import {analyzeBrief} from './lib/ai.mjs';
import {AppError,makeQuote,approveQuote,requireApproved,validateCapture} from './lib/domain.mjs';
import {PayPal} from './lib/paypal.mjs';
import {Store} from './lib/store.mjs';

const ROOT=dirname(fileURLToPath(import.meta.url));
const sha=s=>createHash('sha256').update(s).digest('hex');
const locks=new Map();
async function withLock(key,fn){const prior=locks.get(key)||Promise.resolve();let release;const next=new Promise(r=>release=r);locks.set(key,next);await prior;try{return await fn();}finally{release();if(locks.get(key)===next)locks.delete(key);}}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>24000)throw new AppError('Request is too large.',413);}try{return JSON.parse(raw||'{}');}catch{throw new AppError('Invalid JSON.');}}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}

export async function createApp({store,paypal,origin='http://localhost:3000'}={}){
 if(!store){const dataDir=resolve(process.env.DATA_DIR||resolve(ROOT,'data'));await mkdir(dataDir,{recursive:true});store=new Store(resolve(dataDir,'scopeproof.sqlite'));}
 paypal??=new PayPal({clientId:process.env.PAYPAL_CLIENT_ID,clientSecret:process.env.PAYPAL_CLIENT_SECRET,webhookId:process.env.PAYPAL_WEBHOOK_ID,origin});
 const limits=new Map();
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self' https://www.sandbox.paypal.com");
  const url=new URL(req.url,origin);
  let sid=req.headers.cookie?.match(/(?:^|;\s*)scopeproof=([a-f0-9]{64})(?:;|$)/)?.[1];
  if(!sid){sid=randomBytes(32).toString('hex');res.setHeader('Set-Cookie',`scopeproof=${sid}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${origin.startsWith('https:')?'; Secure':''}`);}
  const owner=sha(sid);
  try{
   if(req.method==='POST'&&url.pathname==='/api/paypal/webhook'){
    const event=await body(req);if(typeof event.id!=='string'||event.id.length>120)throw new AppError('Invalid webhook event.');
    if(!await paypal.verifyWebhook(req.headers,event))throw new AppError('Webhook signature verification failed.',401);
    if(store.hasEvent(event.id))return send(res,200,{received:true,duplicate:true});
    if(event.event_type==='PAYMENT.CAPTURE.COMPLETED'){
      const orderId=event.resource?.supplementary_data?.related_ids?.order_id;
      const found=typeof orderId==='string'?store.findOrder(orderId):null;
      if(found)await withLock(found.quote.id,async()=>{
       const q=store.get(found.owner,found.quote.id);requireApproved(q);
       const order=await paypal.getOrder(q.orderId);const capture=validateCapture(order,q);
       if(q.status!=='PAID'){q.capture=capture;q.status='PAID';q.events.push({kind:'PAYPAL_CAPTURE_VERIFIED',at:new Date().toISOString(),captureId:capture.id,scopeHash:q.scopeHash});store.save(found.owner,q);}
      });
    }
    store.recordEvent(event.id);return send(res,200,{received:true});
   }
   if(url.pathname.startsWith('/api/')&&req.method!=='GET'){
    // Exact configured origin, or same-origin hostname for a local reverse-proxy preview.
    const allowed=new Set([origin,`${req.headers['x-forwarded-proto']==='https'?'https':'http'}://${req.headers.host}`]);
    if(!allowed.has(req.headers.origin))throw new AppError('Only requests from this application are accepted.',403);
    if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new AppError('Use application/json.',415);
    const now=Date.now(), rate=limits.get(owner)||{start:now,count:0};if(now-rate.start>60000){rate.start=now;rate.count=0;}rate.count++;limits.set(owner,rate);
    if(rate.count>60)throw new AppError('Too many requests. Please wait one minute.',429);
    if(limits.size>2000)for(const[k,v]of limits)if(now-v.start>60000)limits.delete(k);
   }
   if(req.method==='GET'&&url.pathname==='/api/config')return send(res,200,{name:'ScopeProof',paypal:{configured:paypal.ready,environment:'sandbox',livePaymentsEnabled:false},ai:{kind:'Local TF-IDF + logistic regression',version:'scopeproof-local-tfidf-logreg-v1',externalProvider:false},origin});
   if(req.method==='GET'&&url.pathname==='/api/quotes')return send(res,200,{quotes:store.list(owner)});
   if(req.method==='POST'&&url.pathname==='/api/analyze'){
     const b=await body(req);const parent=b.parentId?store.get(owner,b.parentId):null;
     if(b.parentId&&!parent)throw new AppError('Original scope was not found.',404);
     return send(res,200,analyzeBrief(b.text,parent?.items||[]));
   }
   if(req.method==='POST'&&url.pathname==='/api/quotes'){
    const b=await body(req);const parent=b.parentId?store.get(owner,b.parentId):null;
    if(b.parentId&&(!parent||!parent.approval))throw new AppError('A change order must reference an approved scope.',409);
    const q=makeQuote(b,parent);store.save(owner,q);return send(res,201,q);
   }
   const match=url.pathname.match(/^\/api\/quotes\/([a-f0-9-]{36})(?:\/(approve|order|capture|receipt))?$/);
   if(match){
     const [,id,action]=match;
     const q=store.get(owner,id);if(!q)throw new AppError('Scope was not found in this workspace.',404);
     if(req.method==='GET'&&!action)return send(res,200,q);
     if(req.method==='GET'&&action==='receipt')return send(res,200,{application:'ScopeProof',environment:'sandbox',record:q,verification:'The fingerprint links this exact scope to the PayPal order. This record is not a legal escrow, dispute guarantee, or identity verification.'});
     if(req.method==='POST')return await withLock(id,async()=>{
      const current=store.get(owner,id),b=await body(req);
      if(action==='approve'){approveQuote(current,b);store.save(owner,current);return send(res,200,current);}
      requireApproved(current);
      if(action==='order'){
       if(current.capture)return send(res,200,{paid:true,quote:current});
       let order=current.orderId?await paypal.getOrder(current.orderId):await paypal.createOrder(current);
       if(typeof order.id!=='string')throw new AppError('PayPal did not return an order identifier.',502);
       if(!current.orderId){current.orderId=order.id;current.status='CHECKOUT_READY';current.events.push({kind:'PAYPAL_ORDER_CREATED',at:new Date().toISOString(),orderId:order.id,scopeHash:current.scopeHash});store.save(owner,current);}
       const approval=order.links?.find(x=>x.rel==='payer-action'||x.rel==='approve')?.href;
       if(!approval)throw new AppError('PayPal order has no buyer approval link. Return from checkout and verify the payment.',409);
       const target=new URL(approval);if(target.protocol!=='https:'||target.hostname!=='www.sandbox.paypal.com')throw new AppError('Unexpected PayPal approval destination.',502);
       return send(res,200,{orderId:current.orderId,approvalUrl:approval,quote:current});
      }
      if(action==='capture'){
       if(current.capture)return send(res,200,current);
       if(!current.orderId)throw new AppError('Create a PayPal order first.',409);
       // Never trust URL parameters, client amounts or a client-side success callback.
       const inspected=await paypal.getOrder(current.orderId);
       if(inspected.status==='COMPLETED'){current.capture=validateCapture(inspected,current);}
       else{
        if(inspected.status!=='APPROVED')throw new AppError('The buyer must approve this PayPal order first.',409);
        try{current.capture=validateCapture(await paypal.captureOrder(current.orderId,current.id),current);}
        catch(error){if(error.paypalName==='UNPROCESSABLE_ENTITY')current.capture=validateCapture(await paypal.getOrder(current.orderId),current);else throw error;}
       }
       current.status='PAID';current.events.push({kind:'PAYPAL_CAPTURE_VERIFIED',at:new Date().toISOString(),captureId:current.capture.id,scopeHash:current.scopeHash});store.save(owner,current);return send(res,200,current);
      }
      throw new AppError('Unknown action.',404);
     });
   }
   if(req.method==='GET'&&!url.pathname.startsWith('/api/')){
    const allowed={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/favicon.svg':'favicon.svg'};
    const filename=allowed[url.pathname];if(!filename)throw new AppError('Not found.',404);
    const file=await readFile(resolve(ROOT,'public',filename));
    res.writeHead(200,{'Content-Type':filename.endsWith('.css')?'text/css':filename.endsWith('.js')?'text/javascript':filename.endsWith('.svg')?'image/svg+xml':'text/html; charset=utf-8','Cache-Control':'no-cache'});return res.end(file);
   }
   throw new AppError('Not found.',404);
  }catch(error){send(res,error.status||500,{error:error.status?error.message:'The request could not be completed.'});}
 });
 return {server,store,paypal};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const portIndex=process.argv.indexOf('--port');const port=Number(portIndex>=0?process.argv[portIndex+1]:process.env.PORT||3000);
 const app=await createApp({origin:process.env.APP_ORIGIN||`http://localhost:${port}`});
 app.server.listen(port,process.env.HOST||'0.0.0.0',()=>console.log(`ScopeProof ready on port ${port}; sandbox ${app.paypal.ready?'configured':'not configured'}.`));
}
