const $=id=>document.getElementById(id);
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let report=null,record=null,envelope=null,generation=0;
const demo={baseline:'Build one responsive landing page with a contact form.\nCreate eight Instagram posts with captions.\nInclude one revision round.\nOnline checkout is excluded.',request:'Create twelve Instagram posts with captions.\nAdd online checkout to the website.\nMake unlimited revisions.\nDeliver everything tomorrow.'};
function tell(text){$('live').textContent=text;}
function invalidateExport(){generation++;record=null;envelope=null;$('reply').value='';$('copy').disabled=true;$('export').disabled=true;$('receipt-meta').textContent='';}
function resetResults(){report=null;invalidateExport();$('results').hidden=true;$('empty').hidden=false;$('error').hidden=true;tell('');}
function loadDemo(){resetResults();$('baseline').value=demo.baseline;$('request').value=demo.request;$('data-label').textContent='SYNTHETIC EXAMPLE';}
function decisions(){return report.items.map(x=>({decision:$(`decision-${x.id}`).value,note:$(`note-${x.id}`).value}));}
function updateReview(){
 invalidateExport();const ds=decisions(),count=ds.filter(d=>DECISIONS.includes(d.decision)&&d.note.trim().length>=3).length;
 $('review-count').textContent=`${count}/${ds.length}`;$('prepare').disabled=count!==ds.length||$('reviewer').value.trim().length<2;
}
function render(){
 $('results').hidden=false;$('empty').hidden=true;$('count').textContent=report.items.length;$('flags-count').textContent=report.items.filter(x=>x.flags.length).length;
 $('cards').innerHTML=report.items.map(x=>`<article class="card"><div class="card-head"><div><span class="id">${x.id}</span><span class="signal ${x.flags.length?'warn':''}">${escapeHtml(x.signal)}</span></div><span>${escapeHtml(x.score<48?'Category needs review':LABELS[x.category])} · ${x.score}% model score</span></div><div class="card-body"><div><div class="label">NEW REQUEST / EXACT SOURCE</div><p class="quote">“${escapeHtml(x.text)}”</p><div class="model">Influential model words: ${x.evidence.length?x.evidence.map(w=>`<span class="token">${escapeHtml(w)}</span>`).join(''):'none recognized'}</div>${x.qtyChanges.map(q=>`<div class="delta">${escapeHtml(q.unit)}: ${q.original} → ${q.requested} ${q.delta===null?'· confirm meaning':`· ${q.delta>0?'+':''}${q.delta}`} <span class="id">${q.source}</span></div>`).join('')}${x.flags.map(f=>`<div class="flag">${escapeHtml(f.text)}</div>`).join('')}</div><div><div class="label">RELATED ORIGINAL WORDING</div>${x.candidates.length?x.candidates.map(c=>`<blockquote class="evidence"><span class="id">${c.id}</span>${escapeHtml(c.text)}<small>${Math.round(c.similarity*100)}% lexical similarity · not an inclusion probability</small></blockquote>`).join(''):'<p class="notice">No close wording was retrieved. Read the entire original scope before deciding.</p>'}${x.exactId?'<p class="help">Exact wording was found. Context and client intent still need review.</p>':''}</div></div><div class="decision"><label for="decision-${x.id}">Your decision<select id="decision-${x.id}" class="decision-input"><option value="">Choose after reviewing</option><option value="included">Included in recorded scope</option><option value="additional">Additional work to agree</option><option value="clarify">Ask for clarification</option></select></label><label for="note-${x.id}">Your reason or clarification<input id="note-${x.id}" class="note-input" maxlength="600" placeholder="Explain the decision; refer to the original wording."></label></div></article>`).join('');
 $('cards').querySelectorAll('select,input').forEach(el=>el.addEventListener('input',updateReview));updateReview();tell(`${report.items.length} requests compared. Review every item before preparing a reply.`);
}
$('compare').addEventListener('click',()=>{
 try{resetResults();report=compare(MODEL,$('baseline').value,$('request').value);render();$('results').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){$('error').textContent=e.message;$('error').hidden=false;}
});
for(const id of ['baseline','request'])$(id).addEventListener('input',()=>{resetResults();$('data-label').textContent='YOUR WORKSPACE';});
$('reviewer').addEventListener('input',()=>{if(report)updateReview();});
$('sample').addEventListener('click',loadDemo);
$('clear').addEventListener('click',()=>{resetResults();$('baseline').value='';$('request').value='';$('reviewer').value='';$('data-label').textContent='YOUR WORKSPACE';tell('Workspace cleared.');});
$('prepare').addEventListener('click',async()=>{
 try{
  const token=++generation;record=makeRecord(report,decisions(),$('reviewer').value);const text=JSON.stringify(record);
  const digest=globalThis.crypto?.subtle?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(n=>n.toString(16).padStart(2,'0')).join(''):null;
  if(token!==generation)return;
  envelope={recordJson:text,sha256:digest,verification:'Hash the exact UTF-8 recordJson string, without reformatting. A hash is not a signature or proof of client acceptance.'};
  $('reply').value=draftReply(record);$('copy').disabled=false;$('export').disabled=false;$('receipt-meta').textContent=digest?`RECORD SHA-256 / ${digest}`:'Digest unavailable in this browser context. Evidence remains exportable with sha256: null.';tell('Review draft prepared. Nothing has been sent.');
 }catch(e){$('error').textContent=e.message;$('error').hidden=false;}
});
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('reply').value);tell('Reply copied. Review it before sending.');}catch{$('reply').focus();$('reply').select();tell('Copy permission is unavailable. Select and copy the draft manually.');}});
$('export').addEventListener('click',()=>{if(!envelope)return;const url=URL.createObjectURL(new Blob([JSON.stringify(envelope,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='scopeproof-change-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);tell('Evidence exported. The file contains the text you entered.');});
loadDemo();
