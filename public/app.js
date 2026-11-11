const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryNames={website:'Website',branding:'Brand identity',social:'Social content',automation:'Automation',commerce:'Commerce',unknown:'Choose a category'};
const examplePrices={website:180,branding:90,social:80,automation:120,commerce:150,unknown:0};
const currencyMoney=(value,currency)=>new Intl.NumberFormat('en-US',{style:'currency',currency}).format(value/100);
let config,quotes=[],analysis,parentId=null,activeId=null;
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
async function api(path,data){const res=await fetch(path,{method:data===undefined?'GET':'POST',headers:data===undefined?{}:{'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});const value=await res.json();if(!res.ok)throw new Error(value.error||'The request failed.');return value;}
async function busy(button,work){const original=button.textContent;button.disabled=true;button.textContent='Working…';try{await work();}catch(error){toast(error.message);}finally{button.disabled=false;button.textContent=original;}}
const statusName={AWAITING_REVIEW:'Awaiting review',APPROVED:'Scope approved',CHECKOUT_READY:'Awaiting PayPal payment',PAID:'Sandbox payment verified'};
async function refresh(){quotes=(await api('/api/quotes')).quotes;renderSidebar();}
function renderSidebar(){
 $('quote-count').textContent=quotes.length;
 $('quote-list').innerHTML=quotes.length?quotes.map(q=>`<button class="saved-quote ${q.id===activeId?'selected':''}" data-id="${esc(q.id)}"><strong>${esc(q.title)}</strong><small>${esc(statusName[q.status])}</small></button>`).join(''):'<p class="empty">Your first clear agreement<br>starts with a client brief.</p>';
 $('quote-list').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>showQuote(b.dataset.id)));
}
function steps(stage){for(const [i,key]of ['brief','review','pay'].entries())$('step-'+key).className=`step ${i===stage?'current':i<stage?'done':''}`;}
function newScope(parent=null){
 parentId=parent?.id||null;activeId=null;analysis=null;
 $('composer').hidden=false;$('quote-detail').hidden=true;$('analysis').hidden=true;
 $('brief').value='';$('char-count').textContent='0 / 6,000';
 $('page-eyebrow').textContent=parent?'A NEW REQUEST NEEDS A NEW AGREEMENT':'FROM A CONVERSATION TO A COMMITMENT';
 $('page-title').innerHTML=parent?'Keep the original.<br><span>Review the change.</span>':'Agree the work.<br><span>Then get paid.</span>';
 $('page-description').textContent=parent?`Create a separate change order for “${parent.title}”. Its existing scope, approval and payment record stay intact.`:'Turn an unclear client request into a scope both sides can review. Every payment stays tied to the work that was approved.';
 $('brief').placeholder=parent?'The client now asks for a recurring subscription checkout and a CRM integration…':'Paste the exact client request here…';
 $('example').textContent=parent?'Try a change request ↗':'Try a sample brief ↗';
 steps(0);renderSidebar();window.scrollTo({top:0,behavior:'smooth'});
}
$('new-project').addEventListener('click',()=>newScope());
$('brief').addEventListener('input',()=>$('char-count').textContent=`${$('brief').value.length} / 6,000`);
$('example').addEventListener('click',()=>{
 $('brief').value=parentId?'Add a PayPal subscription checkout for monthly memberships. Connect incoming enquiries to our CRM. We want unlimited changes.':'Build a responsive one-page website for our coaching centre with a contact form. Create eight Instagram posts with captions. We need everything tomorrow.';
 $('brief').dispatchEvent(new Event('input'));$('brief').focus();
});
$('analyze').addEventListener('click',event=>busy(event.currentTarget,async()=>{
 analysis=await api('/api/analyze',{text:$('brief').value,parentId});renderAnalysis();
}));
function renderAnalysis(){
 $('analysis').hidden=false;$('model-count').textContent=`${analysis.items.length} suggestions`;
 $('analysis-flags').innerHTML=analysis.flags.map(f=>`<div class="flag">${esc(f)}</div>`).join('');
 $('suggestions').innerHTML=analysis.items.map((x,i)=>`<div class="suggestion" data-index="${i}"><input type="checkbox" class="include" aria-label="Include suggestion ${i+1}" ${x.uncertain?'':'checked'}><label class="copy-label">Deliverable to review<textarea class="description" maxlength="240" rows="2">${esc(x.source)}</textarea><span class="source">Source: “${esc(x.source)}”</span><span class="evidence">${x.evidence.length?'Model evidence: '+esc(x.evidence.join(' · ')):'No familiar service terms found.'}</span><span class="confidence ${x.uncertain?'low':''}">${x.confidence}% model score · ${esc(x.relation.replaceAll('-',' '))}</span><span class="source">${esc(x.reason)}</span></label><label class="category-label">Service<select class="category">${Object.entries(categoryNames).map(([k,v])=>`<option value="${k}" ${k===x.category?'selected':''}>${esc(v)}</option>`).join('')}</select></label><label class="price-label">Your price<input class="amount" type="number" min="1" max="10000" step="0.01" value="${x.uncertain?'':examplePrices[x.category]}"></label></div>`).join('');
 $('project-title').value=parentId?'Change order: additional services':'New client project';
 $('acceptance').value='';
 steps(1);$('analysis').scrollIntoView({behavior:'smooth',block:'start'});
}
$('create-quote').addEventListener('click',event=>busy(event.currentTarget,async()=>{
 const items=[...$('suggestions').querySelectorAll('.suggestion')].filter(row=>row.querySelector('.include').checked).map(row=>({description:row.querySelector('.description').value,category:row.querySelector('.category').value,amount:row.querySelector('.amount').value}));
 const q=await api('/api/quotes',{title:$('project-title').value,currency:$('currency').value,revisions:Number($('revisions').value),acceptance:$('acceptance').value,items,parentId});
 await refresh();await showQuote(q.id);toast('Scope saved. Review the exact deliverables and amount before approving.');
}));
async function showQuote(id){
 try{
 const q=await api('/api/quotes/'+id);activeId=q.id;renderSidebar();
 $('composer').hidden=true;$('quote-detail').hidden=false;
 $('page-eyebrow').textContent=q.kind==='change-order'?'CHANGE ORDER / ORIGINAL SCOPE PRESERVED':'YOUR AGREEMENT, WITH A TRACEABLE HANDOFF';
 $('page-title').innerHTML=q.status==='PAID'?'A clear scope.<br><span>A verified payment.</span>':'The work is clear.<br><span>Make it agreed.</span>';
 $('page-description').textContent='Review the scope below. Approval and checkout refer to this exact version. This prototype records review in one browser workspace; it does not verify client identity.';
 steps(q.approval?2:1);
 const subtotal=currencyMoney(q.totalCents,q.currency);
 $('quote-detail').innerHTML=`<div class="detail-grid"><section class="panel"><span class="section-kicker">${q.kind==='change-order'?'ADDITIONAL WORK ONLY':'SCOPE OF WORK'}</span><h2 class="detail-title">${esc(q.title)}</h2><span class="status-badge ${q.status==='PAID'?'paid':''}">${esc(statusName[q.status])}</span>${q.parentHash?`<div class="parent-note">This is a separate change order. Original scope fingerprint: <b>${esc(q.parentHash.slice(0,18))}…</b></div>`:''}<div class="items-review">${q.items.map(x=>`<div class="line-item"><div><small>${esc(categoryNames[x.category])}</small><p>${esc(x.description)}</p></div><strong>${esc(currencyMoney(x.cents,q.currency))}</strong></div>`).join('')}</div><div class="total-row"><span>Agreed scope total</span><strong>${esc(subtotal)}</strong></div><div class="criteria"><b>ACCEPTANCE CRITERIA · ${q.revisions} REVISION ROUND${q.revisions===1?'':'S'}</b>${esc(q.acceptance)}</div><div class="fingerprint">SCOPE FINGERPRINT / SHA-256<code>${esc(q.scopeHash)}</code>This fingerprint is stored in PayPal’s order metadata and checked when payment is verified.</div>${!q.approval?`<label class="approval-box"><input id="agree" type="checkbox"><span>I have reviewed these deliverables, the ${esc(subtotal)} total, revision limit and acceptance criteria. I approve this exact scope for the sandbox demonstration.</span></label><button id="approve" class="button primary wide" disabled>Approve this exact scope <span>✓</span></button>`:`<div class="parent-note">Scope review recorded ${esc(new Date(q.approval.at).toLocaleString())}. Editing is closed; additional work gets a separate change order.</div>`}<div class="detail-actions"><button id="export" class="button">Export evidence ↓</button>${q.approval?'<button id="change" class="button">Review a new request →</button>':''}</div></section><aside><section class="panel payment-box"><span class="section-kicker">PAYMENT, LINKED TO CONSENT</span><h3>${q.capture?'Verified by PayPal':q.approval?'Ready for the handoff':'Approval comes first'}</h3><p>${q.capture?'The server verified the completed capture, exact amount, currency and scope fingerprint.':q.approval?'The server calculates the amount from your saved scope. The browser cannot change the charge.':'Checkout stays locked until the exact scope is reviewed and approved.'}</p>${!config.paypal.configured?'<div class="payment-notice"><strong>Sandbox connection needed</strong><br>PayPal credentials are not configured. No API order or payment has been created. Configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET on the server to test the real sandbox flow.</div>':''}${q.capture?`<div class="criteria"><b>CAPTURE REFERENCE</b>${esc(q.capture.id)}<br>${esc(q.capture.currency)} ${esc(q.capture.amount)}<br>Sandbox funds only</div>`:`<button id="checkout" class="button primary" ${!q.approval||!config.paypal.configured?'disabled':''}>Continue to PayPal Sandbox ↗</button>${q.orderId?'<button id="capture" class="button">Verify & capture test payment</button><p>Use after approving on PayPal. No payment is marked paid from the return URL alone.</p>':''}`}<div class="event-list-title"><h4 class="detail-subheading">EVIDENCE TRAIL</h4></div><ol class="event-list">${q.events.map(x=>`<li>${esc(({SCOPE_CREATED:'Scope created',SCOPE_APPROVED:'Exact scope approved',PAYPAL_ORDER_CREATED:'PayPal sandbox order created',PAYPAL_CAPTURE_VERIFIED:'Payment verified with PayPal'})[x.kind]||x.kind)}<small>${esc(new Date(x.at).toLocaleString())}</small></li>`).join('')}</ol><p>This is a consent and payment record. It is not escrow, a contract review or a guarantee against disputes.</p></section></aside></div>`;
 $('agree')?.addEventListener('change',()=>$('approve').disabled=!$('agree').checked);
 $('approve')?.addEventListener('click',event=>busy(event.currentTarget,async()=>{await api(`/api/quotes/${q.id}/approve`,{agreed:$('agree').checked,scopeHash:q.scopeHash});await refresh();await showQuote(q.id);toast('Approval saved for this exact scope.');}));
 $('checkout')?.addEventListener('click',event=>busy(event.currentTarget,async()=>{const r=await api(`/api/quotes/${q.id}/order`,{});if(r.paid){await refresh();return showQuote(q.id);}window.location.assign(r.approvalUrl);}));
 $('capture')?.addEventListener('click',event=>busy(event.currentTarget,async()=>{await api(`/api/quotes/${q.id}/capture`,{});await refresh();await showQuote(q.id);toast('Sandbox payment verified against the approved scope.');}));
 $('change')?.addEventListener('click',()=>newScope(q));
 $('export').addEventListener('click',async()=>{try{const r=await api(`/api/quotes/${q.id}/receipt`);const url=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`scopeproof-${q.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}catch(e){toast(e.message);}});
 window.scrollTo({top:0,behavior:'smooth'});
 }catch(error){toast(error.message);}
}
async function boot(){
 try{config=await api('/api/config');$('connection-status').textContent=config.paypal.configured?'Sandbox credentials configured':'Sandbox credentials needed';$('connection-status').classList.toggle('ready',config.paypal.configured);await refresh();const query=new URLSearchParams(location.search);if(query.get('quote')){await showQuote(query.get('quote'));if(query.get('paypal')==='approved')toast('Returned from PayPal. Verify and capture to check the payment on the server.');if(query.get('paypal')==='cancelled')toast('Checkout was cancelled. Your approved scope is saved.');history.replaceState({},'',location.pathname);}}catch(error){toast(error.message);$('connection-status').textContent='Connection unavailable';}
}
boot();
