const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
let data, form, message='', html='', saveSucceeds=true;
const context={window:{},crypto,Intl,Date,URL,console,FormData:class{constructor(f){return Object.entries(f.values);}},document:{getElementById(){return form;}}};
vm.createContext(context);
vm.runInContext(fs.readFileSync('dist/data.js','utf8'),context);
data=JSON.parse(JSON.stringify(context.window.SEVA_SEED));
const api={get db(){return data;},set db(v){data=v;},esc:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),money:v=>'INR '+Number(v||0),date:v=>v||'—',modal:(title,body)=>{html=title+body;form={};},toast:v=>message=v,save:()=>saveSucceeds,closeModal(){},render(){}};
context.window.Seva=api;
vm.runInContext(fs.readFileSync('dist/growth.js','utf8'),context);
const growth=context.window.SevaGrowth;
const action=(name,id='')=>growth.handleAction('sg-'+name,{dataset:{id}});
const submit=values=>{form.values=values;form.onsubmit({preventDefault(){}});};
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());

growth.initialize(data);growth.initialize(data);
assert.equal(data.opportunities.length,4,'migration is idempotent');
assert.equal(data.impactMilestones.length,8);
assert.equal(growth.filterOpportunities(data.opportunities,{location:'Remote'}).length,1);
assert.equal(growth.filterOpportunities(data.opportunities,{skills:'Teaching Hindi',availability:'Weekends'}).length,1);
assert.equal(growth.filterOpportunities(data.opportunities,{location:'Remote',cause:'Healthcare'}).length,0);
assert.ok(growth.renderPublic('impact/SSF-P-001').includes('INR 168000'),'spending reconciles opening amounts');
assert.ok(!growth.renderPublic('impact/missing').includes('undefined'));
const application={name:'Test volunteer',email:'test@example.org',phone:'',skills:'Teaching',motivation:'Test',consent:'on'};
action('apply','SSF-OP-001');submit(application);
assert.equal(data.volunteerMatches.length,1);
const appId=data.volunteerMatches[0].id;
action('apply','SSF-OP-001');submit({...application,email:'TEST@example.org'});
assert.equal(data.volunteerMatches.length,1,'duplicate email is case insensitive');
action('review-application',appId);submit({status:'Assigned',orientationDate:today,notes:''});
assert.equal(data.volunteerMatches[0].status,'Applied','cannot skip orientation');
action('review-application',appId);submit({status:'Orientation',orientationDate:today,notes:''});
action('review-application',appId);submit({status:'Assigned',orientationDate:'2099-01-01',notes:''});
assert.equal(data.volunteerMatches[0].status,'Orientation','future orientation blocks assignment');
action('review-application',appId);submit({status:'Assigned',orientationDate:today,notes:''});
assert.equal(data.volunteerMatches[0].status,'Assigned');
assert.ok(data.volunteers.some(v=>v.id===data.volunteerMatches[0].personId));
action('service',appId);submit({date:today,hours:'2',verified:'on'});
assert.equal(data.volunteerMatches[0].verifiedHours,2);
assert.equal(data.volunteers.find(v=>v.email===application.email).hours,2);
action('service',appId);submit({date:today,hours:'2',verified:'on'});
assert.equal(data.volunteerMatches[0].verifiedHours,2,'same-day hours cannot be counted twice');
action('review-application',appId);submit({status:'Completed',orientationDate:today,notes:'Done'});
assert.equal(data.volunteerMatches[0].status,'Completed');
// Existing volunteer profiles are reused; no duplicate profile is created.
const existing=data.volunteers[0],opId='SSF-OP-003',volunteersBefore=data.volunteers.length;
action('apply',opId);submit({...application,email:existing.email});
const reuseId=data.volunteerMatches[0].id;
action('review-application',reuseId);submit({status:'Orientation',orientationDate:today,notes:''});
action('review-application',reuseId);submit({status:'Assigned',orientationDate:today,notes:''});
assert.equal(data.volunteers.length,volunteersBefore);
assert.equal(data.volunteerMatches[0].personId,existing.id);
// Full capacity stops new applications.
data.opportunities.find(o=>o.id===opId).capacity=1;
action('apply',opId);assert.match(message,/no longer available/);
// Closed roles stay out of the public matching page.
data.opportunities.find(o=>o.id===opId).status='Closed';
assert.ok(!growth.renderPublic('opportunities').includes('Mentor digital skills from anywhere'));
// An update cannot publish without an explicit review, including photo consent.
const update={projectId:'SSF-P-001',title:'QA <script>',body:'Progress & care',date:today,status:'Published',metric:'Kits',value:'140',photo:'',photoCaption:''};
const updateCount=data.impactUpdates.length;
action('update');submit(update);assert.equal(data.impactUpdates.length,updateCount);
action('update');submit({...update,approved:'on'});assert.equal(data.impactUpdates.length,updateCount+1);
let page=growth.renderPublic('impact/SSF-P-001');assert.ok(page.includes('QA &lt;script&gt;'));assert.ok(!page.includes('QA <script>'));
action('update');submit({...update,title:'Private draft',status:'Draft'});assert.ok(!growth.renderPublic('impact/SSF-P-001').includes('Private draft'));
action('update');submit({...update,title:'Future report',date:'2099-01-01',approved:'on'});assert.ok(!growth.renderPublic('impact/SSF-P-001').includes('Future report'));
action('update');submit({...update,approved:'on',photo:'javascript:alert(1)',photoCaption:'Test'});assert.match(message,/HTTPS/);
// Partnership interest never changes received donations or project funding.
const donationCount=data.donations.length,raised=data.projects[0].raised;
action('partner-enquiry','SSF-P-001');submit({company:'Example company',name:'Test contact',email:'company@example.org',phone:'',projectId:'SSF-P-001',type:'Programme funding',budget:'50000',teamSize:'5',message:'Test partnership',consent:'on'});
assert.equal(data.partnershipEnquiries.length,1);
action('review-partner',data.partnershipEnquiries[0].id);submit({status:'Agreed',owner:'Priya Nair',followUp:today,reportDue:'2026-12-01',notes:'Test'});
assert.equal(data.donations.length,donationCount);assert.equal(data.projects[0].raised,raised);
// Storage failure rolls back the entire mutation.
const before=JSON.stringify(data);saveSucceeds=false;
action('partner-enquiry');submit({company:'Unsaved company',name:'Test',email:'fail@example.org',message:'Test',consent:'on',budget:'0',teamSize:'0'});
assert.equal(JSON.stringify(data),before);
saveSucceeds=true;
// All views can render existing records after migration and persisted data round trip.
data=JSON.parse(JSON.stringify(data));growth.initialize(data);
for(const route of ['impact','impact/SSF-P-001','opportunities','partnerships'])assert.ok(growth.renderPublic(route).length>1000);
for(const route of ['impactManager','opportunityManager','partnershipManager'])assert.ok(growth.renderAdmin(route).length>1000);
// Generate real proposal PDFs and verify the downloader receives a valid document.
const {jsPDF}=require('../dist/assets/jspdf.umd.min.js');
let pdfCount=0;
context.window.jspdf={jsPDF:function(){const pdf=new jsPDF();pdf.save=filename=>{assert.match(filename,/Partnership-Proposal\.pdf$/);const bytes=Buffer.from(pdf.output('arraybuffer'));assert.ok(bytes.subarray(0,4).equals(Buffer.from('%PDF')));assert.ok(pdf.getNumberOfPages()>=1);pdfCount++;};return pdf;}};
for(const p of data.projects) action('proposal',p.id);
assert.equal(pdfCount,data.projects.length);
console.log('Passed: migration, matching, applications, lifecycle, capacity, service accounting, publication controls, PDF generation, persistence rollback and rendering.');
