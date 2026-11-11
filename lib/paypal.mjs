import {AppError,money} from './domain.mjs';
const BASE='https://api-m.sandbox.paypal.com';
export class PayPal{
 constructor({clientId,clientSecret,webhookId,origin,fetchImpl=fetch}){Object.assign(this,{clientId,clientSecret,webhookId,origin,fetchImpl});this.token=null;}
 get ready(){return Boolean(this.clientId&&this.clientSecret);}
 async accessToken(){
  if(!this.ready)throw new AppError('PayPal sandbox credentials are not configured. No payment request was sent.',503);
  if(this.token&&this.token.until>Date.now()+30000)return this.token.value;
  let response;try{response=await this.fetchImpl(`${BASE}/v1/oauth2/token`,{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(15000)});}catch{throw new AppError('PayPal authentication is temporarily unavailable.',502);}
  const data=await response.json();if(!response.ok||!data.access_token)throw new AppError('PayPal sandbox authentication failed. Check server configuration.',502);
  this.token={value:data.access_token,until:Date.now()+Number(data.expires_in||300)*1000};return this.token.value;
 }
 async call(path,{method='GET',body,key}={}){
  const token=await this.accessToken();let response;
  try{response=await this.fetchImpl(BASE+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=representation',...(key?{'PayPal-Request-Id':key}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});}catch{throw new AppError('PayPal request timed out. Retry safely; the same request identifier will be reused.',502);}
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const err=new AppError('PayPal could not complete this sandbox request. Review the buyer approval and retry.',502);err.paypalName=data.name;throw err;}
  return data;
 }
 createOrder(q){return this.call('/v2/checkout/orders',{method:'POST',key:`create-${q.id}`,body:{intent:'CAPTURE',purchase_units:[{reference_id:q.id,custom_id:q.scopeHash,description:`ScopeProof: ${q.title}`.slice(0,127),amount:{currency_code:q.currency,value:money(q.totalCents)}}],payment_source:{paypal:{experience_context:{brand_name:'ScopeProof',user_action:'PAY_NOW',shipping_preference:'NO_SHIPPING',return_url:`${this.origin}/?paypal=approved&quote=${q.id}`,cancel_url:`${this.origin}/?paypal=cancelled&quote=${q.id}`}}}}});}
 getOrder(id){return this.call(`/v2/checkout/orders/${encodeURIComponent(id)}`);}
 captureOrder(id,qid){return this.call(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`,{method:'POST',body:{},key:`capture-${qid}`});}
 async verifyWebhook(headers,event){
  if(!this.webhookId)throw new AppError('Webhook registration is not configured.',503);
  const required=['paypal-auth-algo','paypal-cert-url','paypal-transmission-id','paypal-transmission-sig','paypal-transmission-time'];
  if(required.some(k=>!headers[k]))return false;
  const result=await this.call('/v1/notifications/verify-webhook-signature',{method:'POST',body:{auth_algo:headers['paypal-auth-algo'],cert_url:headers['paypal-cert-url'],transmission_id:headers['paypal-transmission-id'],transmission_sig:headers['paypal-transmission-sig'],transmission_time:headers['paypal-transmission-time'],webhook_id:this.webhookId,webhook_event:event}});
  return result.verification_status==='SUCCESS';
 }
}
