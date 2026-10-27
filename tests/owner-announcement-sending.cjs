const fs=require('fs'), ts=require('typescript'), assert=require('assert'), Module=require('module');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const ids=['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002'];
const campaigns=[], deliveries=[], sent=[]; let slot=true;
class Query {
 constructor(table){this.table=table;this.filters=[];this.operation='select';this.payload=null;this.isSingle=false;this.max=null;}
 select(){return this} not(){return this} order(){return this} range(){return this} eq(k,v){this.filters.push(x=>x[k]===v);return this} in(k,vs){this.filters.push(x=>vs.includes(x[k]));return this} limit(n){this.max=n;return this} maybeSingle(){this.isSingle=true;return this} single(){this.isSingle=true;return this} upsert(x){this.operation='upsert';this.payload=x;return this} insert(x){this.operation='insert';this.payload=x;return this} update(x){this.operation='update';this.payload=x;return this}
 then(ok,bad){try{const rows=this.table==='memorials'?ids.map(owner_id=>({owner_id})):this.table==='owner_announcement_campaigns'?campaigns:this.table==='owner_announcement_deliveries'?deliveries:[];
 if(this.operation==='upsert'){if(!rows.some(x=>x.id===this.payload.id))rows.push({...this.payload});return Promise.resolve({data:null,error:null}).then(ok,bad)}
 if(this.operation==='insert'){if(rows.some(x=>x.campaign_id===this.payload.campaign_id&&x.owner_id===this.payload.owner_id))return Promise.resolve({error:{code:'23505'}}).then(ok,bad);rows.push({...this.payload});return Promise.resolve({error:null}).then(ok,bad)}
 let result=rows.filter(x=>this.filters.every(f=>f(x)));if(this.max!==null)result=result.slice(0,this.max);if(this.operation==='update')result.forEach(x=>Object.assign(x,this.payload));return Promise.resolve({data:this.isSingle?(result[0]||null):result,error:null}).then(ok,bad)}catch(e){return Promise.reject(e).then(ok,bad)}}
}
const db={from:t=>new Query(t),rpc:async()=>{const value=slot;slot=false;return {data:value,error:null}},auth:{getUser:async()=>({data:{user:{id:ids[0],email:'mike@realchoicerealestate.com'}},error:null}),admin:{getUserById:async id=>({data:{user:{id,email:`${id}@example.invalid`,user_metadata:{first_name:'Alex'}}},error:null})}}};
const original=Module._load;Module._load=function(name,parent,...rest){if(name==='next/server')return {NextResponse:{json:(body,options)=>({body,status:options?.status||200})}};if(name==='@supabase/supabase-js')return {createClient:()=>db};if(name==='../../../lib/email')return {transporter:{sendMail:async m=>sent.push(m)}};return original.call(this,name,parent,...rest)};
Object.assign(process.env,{NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'test',OWNER_ANNOUNCEMENT_SECRET:'x'.repeat(32),EMAIL_USER:'test',EMAIL_PASSWORD:'test'});
(async()=>{const {POST}=require('../app/api/admin/owner-announcements/route.ts');const payload={action:'send',campaignId:'20000000-0000-4000-8000-000000000000',subject:'Test',body:'Hello'};const req={headers:{get:()=> 'Bearer test'},json:async()=>payload};
let r=await POST(req);assert.equal(r.body.sent,1);assert.equal(r.body.remaining,1);assert.equal(sent.length,1);
r=await POST(req);assert.equal(r.body.sent,0);assert.equal(r.body.waitingForRateLimit,true);assert.equal(sent.length,1);
slot=true;r=await POST(req);assert.equal(r.body.sent,1);assert.equal(sent.length,2);assert.equal(new Set(sent.map(x=>x.to)).size,2);
slot=true;r=await POST(req);assert.equal(r.body.sent,0);assert.equal(sent.length,2);
deliveries[0].status='failed';r=await POST(req);assert.equal(r.status,409);assert.equal(sent.length,2);
console.log('PASS: one-per-slot pacing, blocked retries, delivery deduplication and unresolved delivery protection');
// Exercise the API with a fake shared 25-slot batch; database timing is tested separately.
ids.length=0; for(let i=1;i<=26;i++) ids.push(`30000000-0000-4000-8000-${String(i).padStart(12,'0')}`);
let slots=25; db.rpc=async()=>({data: slots>0 ? (--slots, true) : false,error:null});
const batchPayload={...payload,campaignId:'40000000-0000-4000-8000-000000000000'};
const batchReq={headers:{get:()=> 'Bearer test'},json:async()=>batchPayload};
const before=sent.length;
for(let i=0;i<25;i++){const response=await POST(batchReq);assert.equal(response.body.sent,1);}
let paused=await POST(batchReq);assert.equal(paused.body.sent,0);assert.equal(paused.body.waitingForRateLimit,true);assert.equal(sent.length-before,25);
slots=25;const resumed=await POST(batchReq);assert.equal(resumed.body.sent,1);assert.equal(sent.length-before,26);
console.log('PASS: simulated 25-message batch pauses and resumes without duplicates');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{Module._load=original});
