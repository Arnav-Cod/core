/* Project impact, volunteer matching, and corporate partnerships.
   Uses the existing browser-local workspace; no submissions leave this browser. */
(() => {
  'use strict';
  const api = () => window.Seva;
  const db = () => api().db;
  const e = value => api().esc(value);
  const money = value => api().money(value);
  const date = value => api().date(value);
  const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
  const id = prefix => 'SSF-' + prefix + '-' + crypto.randomUUID();
  const num = value => Math.max(0, Number(value) || 0);
  const stages = ['Applied','Orientation','Assigned','Completed','Declined'];
  const partnerStages = ['New','Discussion','Proposal shared','Agreed','Closed'];
  const lists = ['impactMilestones','impactUpdates','opportunities','volunteerMatches','partnershipEnquiries'];
  let adminTab = 'opportunities';
  let filters = {location:'',cause:'',availability:'',skills:''};
  const image = value => {
    if (/^(?:\.\/)?assets\/[\w./-]+$/.test(value || '') && !value.includes('..')) return value;
    try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; }
  };
  const link = (label, href, secondary=false) => `<a class="sg-button ${secondary?'secondary':''}" href="${e(href)}">${e(label)} <span aria-hidden="true">↗</span></a>`;
  const button = (label, action, record='', secondary=false) => `<button type="button" class="sg-button ${secondary?'secondary':''}" data-action="sg-${action}" data-id="${e(record)}">${e(label)}</button>`;
  const chip = label => `<span class="sg-chip">${e(label)}</span>`;
  const empty = (title, body) => `<div class="sg-empty"><h3>${e(title)}</h3><p>${e(body)}</p></div>`;
  const notice = '<p class="sg-demo">Interactive demo · Illustrative programmes and results. Submissions are saved only in this browser.</p>';
  const project = projectId => db().projects.find(p => p.id === projectId);
  const projects = () => db().projects.filter(p => p.status !== 'On hold');
  const publishedUpdates = projectId => db().impactUpdates.filter(u => u.projectId===projectId && u.status==='Published' && u.approved===true && u.date<=today()).sort((a,b)=>b.date.localeCompare(a.date));
  const milestones = projectId => db().impactMilestones.filter(m => m.projectId===projectId && m.visibility==='Published').sort((a,b)=>a.date.localeCompare(b.date));

  function initialize(data) {
    for (const key of lists) if (!Array.isArray(data[key])) data[key]=[];
    if (data.growthVersion) return;
    const seeds = [
      ['SSF-P-001','Learning kits ready','2026-09-12','Completed','Reading sessions underway','2026-10-15','In progress','A new chapter for young learners','Sample update: volunteer-led reading sessions and learning kits support children at the community learning centre.','Learning kits distributed',120],
      ['SSF-P-002','Health camp preparations','2026-10-10','Completed','Community screening camp','2026-11-15','Planned','Care, closer to the community','Sample update: the team has prepared a community screening and awareness programme, with follow-up referrals planned.','People reached',240],
      ['SSF-P-003','Digital skills cohort begins','2026-09-20','Completed','Skills workshop completion','2026-12-10','Planned','Building confidence through skills','Sample update: women are practising digital literacy and practical skills through guided community workshops.','Workshop participants',65],
      ['SSF-P-004','Sapling planting drive','2026-10-12','Completed','First survival check','2026-11-22','Planned','Planting is only the beginning','Sample update: volunteers have planted saplings and established a watering rota. The next visit will check how they are growing.','Saplings planted',80]
    ];
    for (const [pid,t1,d1,s1,t2,d2,s2,title,body,metric,value] of seeds) {
      if (!data.projects.some(p=>p.id===pid)) continue;
      data.impactMilestones.push({id:pid+'-MS1',projectId:pid,title:t1,date:d1,status:s1,visibility:'Published'}, {id:pid+'-MS2',projectId:pid,title:t2,date:d2,status:s2,visibility:'Published'});
      data.impactUpdates.push({id:pid+'-UP1',projectId:pid,title,body,date:'2026-10-24',metric,value,status:'Published',approved:true,photo:'',photoCaption:'',demo:true});
    }
    data.opportunities.push(
      {id:'SSF-OP-001',title:'Help a child discover the joy of reading',projectId:'SSF-P-001',location:'Community learning centre',cause:'Education',availability:'Weekends',schedule:'Saturdays · 10:00–12:00',hours:2,skills:'Teaching, Hindi, Reading',capacity:8,status:'Open',description:'Support small-group reading and mathematics activities. An orientation and teaching resources are provided before your first session.'},
      {id:'SSF-OP-002',title:'Support a community health camp',projectId:'SSF-P-002',location:'Community health centre',cause:'Healthcare',availability:'Weekends',schedule:'Sundays · 09:00–13:00',hours:4,skills:'Community outreach, Registration, First aid',capacity:12,status:'Open',description:'Help with registration, queues and health-awareness materials. Clinical care is provided only by qualified professionals.'},
      {id:'SSF-OP-003',title:'Mentor digital skills from anywhere',projectId:'SSF-P-003',location:'Remote',cause:'Women Empowerment',availability:'Flexible',schedule:'One weekly session · time agreed with coordinator',hours:2,skills:'Digital literacy, Mentoring, Design',capacity:6,status:'Open',description:'Guide learners through email, online forms and everyday digital tools. Meet your coordinator at orientation to agree your sessions.'},
      {id:'SSF-OP-004',title:'Help our neighbourhood grow greener',projectId:'SSF-P-004',location:'Neighbourhood green space',cause:'Environment',availability:'Weekdays',schedule:'Wednesdays · 07:00–09:00',hours:2,skills:'Gardening, Photography, Logistics',capacity:10,status:'Open',description:'Join a local care team to water saplings, record survival and share progress from the green space.'}
    );
    data.growthVersion=1;
  }

  function shell(active, content) {
    const name=db().settings.name || 'Seva Setu Foundation';
    return `<div class="sg-site"><header class="sg-header"><a class="sg-brand" href="#website"><span class="sg-brand-mark" aria-hidden="true"><svg width="38" height="38" viewBox="0 0 48 48" fill="none"><path d="M24 39C15 34 6 27 6 19c0-9 11-12 18-4C31 7 42 10 42 19c0 8-9 15-18 20Z" fill="#e6b56d"/><path d="M24 31V17m0 7c-10 0-11-9-11-9 10 0 11 9 11 9m0-5c0-9 10-12 10-12 1 10-10 12-10 12" stroke="#235d46" stroke-width="2.8" stroke-linejoin="round"/></svg></span><span>${e(name)}<small>A bridge to a better tomorrow</small></span></a><nav aria-label="Foundation navigation">${[['impact','See Your Impact'],['opportunities','Volunteer'],['partnerships','Partner With Us']].map(([route,label])=>`<a href="#${route}" ${route===active?'aria-current="page"':''}>${label}</a>`).join('')}<a class="sg-home-link" href="#website">Home ↗</a></nav></header><main id="sg-main">${content}</main><footer class="sg-footer"><div><strong>${e(name)}</strong><p>People. Purpose. Possibility.</p></div><div><a href="#website">Foundation home</a><a href="#dashboard">Management workspace</a></div></footer></div>`;
  }
  function hero(kicker, title, text, aside='') {
    return `<section class="sg-hero"><div><span class="sg-kicker">${e(kicker)}</span><h1>${title}</h1><p>${e(text)}</p></div>${aside}</section>`;
  }
  function homeSection() {
    return `<section class="sg-home-section"><div class="container"><div class="sg-section-head"><div><span class="sg-kicker">Your next step starts here</span><h2>Three ways to move our mission forward.</h2></div></div><div class="sg-grid three">${[
      ['01','See Your Impact','Follow the funds, milestones and community updates behind every project.','impact','Explore our progress'],
      ['02','Find your place to volunteer','Match your skills and schedule with a meaningful opportunity.','opportunities','Find an opportunity'],
      ['03','Partner with purpose','Bring your company’s resources and people to a shared cause.','partnerships','Explore partnerships']
    ].map(([n,title,body,route,cta])=>`<article class="sg-card"><span class="sg-index">${n}</span><h3>${title}</h3><p>${body}</p>${link(cta,'#'+route,true)}</article>`).join('')}</div></div></section>`;
  }
  function funding(p) {
    const percent=num(p.budget)?Math.round(num(p.raised)/num(p.budget)*100):0;
    return `<div class="sg-funding"><div><strong>${money(p.raised)}</strong><span>of ${money(p.budget)} target</span></div><progress max="100" value="${Math.min(percent,100)}" aria-label="${e(p.name)} funding">${percent}%</progress><small>${percent}% funded · ${money(p.spent)} used for the programme</small></div>`;
  }
  function impactCard(p) {
    const u=publishedUpdates(p.id)[0];
    return `<article class="sg-card sg-project-card"><img src="${e(image(p.image))}" alt="${e(p.name)} programme illustration" loading="lazy"><div class="sg-card-content">${chip(p.category)}<h2>${e(p.name)}</h2><p>${e(p.description)}</p>${funding(p)}<div class="sg-card-meta">${u?'Updated '+date(u.date):'Updates coming soon'}</div>${link('Follow this project','#impact/'+encodeURIComponent(p.id))}</div></article>`;
  }
  function impactPage() {
    const ps=projects();
    return shell('impact',hero('See Your Impact','Small acts.<br><em>Visible progress.</em>','Follow the journey from support to action. Explore how each programme is funded, what is happening, and what comes next.',`<div class="sg-hero-note"><span class="sg-big">${ps.length.toString().padStart(2,'0')}</span><strong>programmes. One shared purpose.</strong><p>Education, wellbeing, livelihoods and a greener community.</p></div>`)+`<div class="sg-container">${notice}<div class="sg-section-head"><div><h2>Follow the work you care about</h2><p>Project totals include the programme’s opening balances.</p></div></div><div class="sg-grid two">${ps.map(impactCard).join('')||empty('No projects to show','New programmes will appear here when published.')}</div></div>`);
  }
  function projectPage(pid) {
    const p=projects().find(p=>p.id===pid);
    if(!p) return shell('impact',`<div class="sg-container">${empty('Project unavailable','This project may be on hold or no longer listed.')}${link('Explore projects','#impact')}</div>`);
    const ms=milestones(pid), updates=publishedUpdates(pid);
    const categories={};
    db().expenses.filter(x=>x.project===p.name&&x.status==='Paid').forEach(x=>{categories[x.category]=(categories[x.category]||0)+num(x.amount);});
    const itemized=Object.values(categories).reduce((a,b)=>a+b,0), opening=Math.max(0,num(p.spent)-itemized);
    if(opening) categories['Opening / other programme spending']=opening;
    const latestMetrics=[...new Map(updates.filter(u=>u.metric).reverse().map(u=>[u.metric,u])).values()];
    updates.sort((a,b)=>b.date.localeCompare(a.date));
    return shell('impact',`<div class="sg-container"><a class="sg-back" href="#impact">← All projects</a><section class="sg-project-hero"><div>${chip(p.category)}<h1>${e(p.name)}</h1><p>${e(p.description)}</p><div class="sg-tags">${chip(p.location)}${chip(p.status)}</div></div><img src="${e(image(p.image))}" alt="${e(p.name)} programme illustration"></section>${notice}<div class="sg-detail-grid"><div><section class="sg-card"><div class="sg-section-head"><h2>Progress, step by step</h2><span class="sg-muted">${ms.filter(m=>m.status==='Completed').length}/${ms.length} milestones complete</span></div><ol class="sg-timeline">${ms.map(m=>`<li class="${m.status==='Completed'?'done':''}"><span class="sg-timeline-dot" aria-hidden="true"></span><div><small>${date(m.date)}</small><h3>${e(m.title)}</h3>${chip(m.status)}</div></li>`).join('')}</ol>${ms.length?'':empty('Milestones coming soon','The programme team has not published its plan yet.')}</section><section class="sg-updates"><div class="sg-section-head"><h2>From the field</h2><span class="sg-muted">Reviewed programme updates</span></div>${updates.map(u=>`<article class="sg-card"><span class="sg-kicker">${date(u.date)}${u.demo?' · Sample update':''}</span><h3>${e(u.title)}</h3><p class="sg-prewrap">${e(u.body)}</p>${u.photo&&image(u.photo)?`<figure><img class="sg-update-photo" src="${e(image(u.photo))}" alt="${e(u.photoCaption)}" loading="lazy"><figcaption>${e(u.photoCaption)}</figcaption></figure>`:''}${u.metric?`<div class="sg-result"><strong>${num(u.value).toLocaleString('en-IN')}</strong><span>${e(u.metric)}<small>Reported as of ${date(u.date)}</small></span></div>`:''}</article>`).join('')||empty('The story is just beginning','Approved updates will appear here as work progresses.')}</section></div><aside><section class="sg-card sg-support"><span class="sg-kicker">Your support at work</span><h2>Every contribution counts.</h2>${funding(p)}<div class="sg-mini-grid"><div><strong>${money(Math.max(0,num(p.budget)-num(p.raised)))}</strong><small>Still to raise</small></div><div><strong>${num(p.beneficiaries)}</strong><small>Reported beneficiaries</small></div></div>${button('Support '+p.name,'support',pid)}<p class="sg-fine">Save a donation pledge. Payments are not collected in this preview.</p></section><section class="sg-card"><h2>Where the funds go</h2><dl class="sg-spending">${Object.entries(categories).map(([label,value])=>`<div><dt>${e(label)}</dt><dd>${money(value)}</dd></div>`).join('')||'<p>No spending recorded yet.</p>'}</dl><p class="sg-fine">Paid expenses and opening programme spending. Pending expenses are excluded.${itemized>num(p.spent)?' Itemized expenses exceed the project total; the team should reconcile these records.':''}</p></section>${latestMetrics.length?`<section class="sg-card"><h2>Latest reported outcomes</h2>${latestMetrics.map(u=>`<div class="sg-result"><strong>${num(u.value)}</strong><span>${e(u.metric)}<small>${date(u.date)}</small></span></div>`).join('')}</section>`:''}</aside></div></div>`);
  }

  function places(op) { return Math.max(0,num(op.capacity)-db().volunteerMatches.filter(a=>a.opportunityId===op.id&&a.status==='Assigned').length); }
  function availableOpportunities() { return db().opportunities.filter(o=>o.status==='Open'&&project(o.projectId)?.status!=='On hold'&&project(o.projectId)); }
  function filterOpportunities(ops, f) {
    const words=String(f.skills||'').toLowerCase().split(/[\s,]+/).filter(Boolean);
    return ops.filter(o=>(!f.location||o.location===f.location)&&(!f.cause||o.cause===f.cause)&&(!f.availability||o.availability===f.availability)&&words.every(w=>(o.title+' '+o.skills+' '+o.description).toLowerCase().includes(w)));
  }
  function opportunityCards() {
    const ops=filterOpportunities(availableOpportunities(),filters);
    return `<p class="sg-result-count" role="status">${ops.length} ${ops.length===1?'opportunity':'opportunities'} matching your preferences</p><div class="sg-grid two">${ops.map(o=>`<article class="sg-card sg-opportunity">${chip(o.cause)}<h2>${e(o.title)}</h2><p>${e(o.description)}</p><ul class="sg-facts"><li><span>Where</span>${e(o.location)}</li><li><span>When</span>${e(o.schedule)}</li><li><span>Commitment</span>${num(o.hours)} hours per session</li><li><span>Skills</span>${e(o.skills)}</li></ul><div class="sg-card-bottom"><span class="sg-muted">${places(o)} assignment places available</span>${places(o)?button('Apply to volunteer','apply',o.id):'<span class="sg-chip">Fully assigned</span>'}</div></article>`).join('')||empty('No matching opportunities','Try a different location, availability or skill, or clear the filters.')}</div>`;
  }
  function select(name,label,options,value='',required=false) {
    return `<label class="sg-field"><span>${e(label)}</span><select name="${e(name)}" ${required?'required':''}>${options.map(option=>{const [val,text]=Array.isArray(option)?option:[option,option];return `<option value="${e(val)}" ${String(value)===String(val)?'selected':''}>${e(text)}</option>`;}).join('')}</select></label>`;
  }
  function field(name,label,value='',type='text',extra='') {
    return `<label class="sg-field"><span>${e(label)}</span><input name="${e(name)}" type="${type}" value="${e(value)}" ${extra} ${type==='text'?'maxlength="180"':''}></label>`;
  }
  function area(name,label,value='',required=true) { return `<label class="sg-field sg-full"><span>${e(label)}</span><textarea name="${name}" maxlength="3000" ${required?'required':''}>${e(value)}</textarea></label>`; }
  function consent(name,label,checked=false) { return `<label class="sg-check sg-full"><input type="checkbox" name="${name}" ${checked?'checked':''}><span>${label}</span></label>`; }
  const formEnd = (label='Save changes') => `<div class="sg-form-actions"><button type="button" class="sg-button secondary" data-action="close-modal">Cancel</button><button type="submit" class="sg-button">${label}</button></div>`;
  function opportunitiesPage() {
    const ops=availableOpportunities();
    return shell('opportunities',hero('Volunteer with Seva Setu','Your time.<br><em>Someone’s turning point.</em>','Find a role that fits your skills, your schedule and the change you want to see.',`<div class="sg-hero-note"><span class="sg-big">01—04</span><strong>Apply. Meet. Contribute. Grow.</strong><p>Start with an opportunity. Our coordinator helps you take the next step.</p></div>`)+`<div class="sg-container">${notice}<div class="sg-steps">${['Choose your opportunity','Apply & attend orientation','Join your assigned team','Record verified service'].map((s,i)=>`<div><b>0${i+1}</b><span>${s}</span></div>`).join('')}</div><form id="sg-filter-form" class="sg-filter-bar">${select('location','Location',[['','All locations'],...[...new Set(ops.map(o=>o.location))]],filters.location)}${select('cause','Cause',[['','All causes'],...[...new Set(ops.map(o=>o.cause))]],filters.cause)}${select('availability','Availability',[['','Any availability'],'Weekends','Weekdays','Flexible'],filters.availability)}${field('skills','Skills or keywords',filters.skills,'search','placeholder="Teaching, design…"')}<button type="reset" class="sg-clear">Clear filters</button></form><div id="sg-opportunity-results">${opportunityCards()}</div></div>`);
  }

  function partnershipsPage() {
    return shell('partnerships',hero('Corporate partnerships','Shared purpose.<br><em>Greater possibility.</em>','Bring your company’s people, resources and expertise to programmes that strengthen communities.',`<div class="sg-hero-note"><span class="sg-big">Together</span><strong>A partnership with a clear plan.</strong><p>Agree the scope, define milestones and follow the work through regular reporting.</p></div>`)+`<div class="sg-container">${notice}<div class="sg-grid three sg-partner-types">${[['01','Fund a programme','Support a defined project budget and follow its milestones.'],['02','Share your team’s skills','Create meaningful employee volunteering opportunities.'],['03','Build a longer partnership','Combine funding, mentoring and agreed reporting.']].map(([n,t,p])=>`<article class="sg-card"><span class="sg-index">${n}</span><h2>${t}</h2><p>${p}</p></article>`).join('')}</div><div class="sg-section-head"><div><span class="sg-kicker">Explore a starting point</span><h2>Choose a cause that fits your company</h2></div></div><div class="sg-grid two">${projects().filter(p=>p.status!=='Completed').map(p=>`<article class="sg-card"><div class="sg-partner-project"><img src="${e(image(p.image))}" alt="${e(p.name)} programme illustration" loading="lazy"><div>${chip(p.category)}<h2>${e(p.name)}</h2><p>${e(p.description)}</p></div></div><div class="sg-mini-grid"><div><strong>${money(p.budget)}</strong><small>Programme budget</small></div><div><strong>${money(Math.max(0,num(p.budget)-num(p.raised)))}</strong><small>Remaining funding target</small></div></div><div class="sg-actions">${button('Discuss a partnership','partner-enquiry',p.id)}${button('Download proposal','proposal',p.id,true)}</div></article>`).join('')||empty('Let’s explore a partnership','Share your interests using the enquiry form below.')}</div><section class="sg-partner-cta"><div><span class="sg-kicker">Have something else in mind?</span><h2>Start a conversation.</h2><p>Tell us your focus, team size and timeline. Build the scope together.</p></div>${button('Make a partnership enquiry','partner-enquiry')}</section></div>`);
  }
  function showForm(title,body,subtitle='') { api().modal(title,`<div class="sg-form">${body}</div>`,subtitle,true); }
  function transact(action, fn) {
    const previous=JSON.parse(JSON.stringify(db()));
    try { fn(); } catch(error) { api().db=previous; api().toast(error.message); return false; }
    if(!api().save(action)) { api().db=previous; window.foundationData=previous; return false; }
    return true;
  }
  function bindForm(handler) {
    const form=document.getElementById('sg-form');
    form.onsubmit=event=>{event.preventDefault();const values=Object.fromEntries(new FormData(form));Object.keys(values).forEach(k=>values[k]=values[k].trim());handler(values,form);};
  }
  function confirmation(title,reference,body) {
    showForm(title,`<div class="sg-confirm"><span aria-hidden="true">✓</span><h3>${e(reference)}</h3><p>${e(body)}</p><p class="sg-demo">Saved in this browser only. The foundation has not been notified.</p>${button('Done','close')}</div>`);
  }
  function applicationForm(opId) {
    const o=availableOpportunities().find(o=>o.id===opId);
    if(!o||!places(o)) return api().toast('This opportunity is no longer available.');
    showForm('Apply to volunteer',`<p class="sg-form-intro"><strong>${e(o.title)}</strong><br>${e(o.location)} · ${e(o.schedule)}</p>${notice}<form id="sg-form"><div class="sg-form-grid">${field('name','Full name','','text','required autocomplete="name"')}${field('email','Email address','','email','required autocomplete="email" maxlength="180"')}${field('phone','Phone (optional)','','tel','maxlength="25" autocomplete="tel"')}${field('skills','Your skills & interests','','text','required')}${area('motivation','What would you like to contribute?')}${consent('consent','I agree to share these details with the foundation for this volunteer application.')}</div>${formEnd('Save application')}</form>`,'Find your place in a programme that matters.');
    bindForm(v=>{
      if(!v.name||!v.skills||!v.motivation) return api().toast('Complete your name, skills and message.');
      if(v.consent!=='on') return api().toast('Please agree to share your application details.');
      const current=availableOpportunities().find(x=>x.id===opId);
      if(!current||!places(current)) return api().toast('This opportunity is no longer available.');
      if(db().volunteerMatches.some(a=>a.opportunityId===opId&&a.email.toLowerCase()===v.email.toLowerCase()&&a.status!=='Declined')) return api().toast('You already have an application for this opportunity.');
      const ref=id('VA');
      if(transact('Volunteer opportunity application saved',()=>db().volunteerMatches.unshift({...v,id:ref,opportunityId:opId,date:today(),status:'Applied',verifiedHours:0,personId:'',orientationDate:'',notes:''}))) confirmation('Your application is saved',ref,'Your next step is coordinator review and orientation. You can review this demo application under Volunteer opportunities → Applications in the management workspace.');
    });
  }
  function partnershipForm(pid='') {
    showForm('Let’s build a partnership',`${notice}<form id="sg-form"><div class="sg-form-grid">${field('company','Company name','','text','required autocomplete="organization"')}${field('name','Contact name','','text','required autocomplete="name"')}${field('email','Work email','','email','required autocomplete="email" maxlength="180"')}${field('phone','Phone (optional)','','tel','maxlength="25"')}${select('projectId','Programme',[['','Open to suggestions'],...projects().map(p=>[p.id,p.name])],pid)}${select('type','Partnership interest',['Programme funding','Employee volunteering','Funding & volunteering'])}${field('budget','Indicative budget (₹, optional)','','number','min="0" step="1"')}${field('teamSize','Volunteer team size (optional)','','number','min="0" max="10000" step="1"')}${area('message','Your goals and preferred timeline')}${consent('consent','I agree to share these details with the foundation about this partnership enquiry.')}</div>${formEnd('Save enquiry')}</form>`,'A starting point for a shared plan.');
    bindForm(v=>{
      if(!v.company||!v.name||!v.message) return api().toast('Complete the company, contact name and goals.');
      if(v.consent!=='on') return api().toast('Please agree to share your enquiry details.');
      const ref=id('CP');
      if(transact('Corporate partnership enquiry saved',()=>db().partnershipEnquiries.unshift({...v,budget:num(v.budget),teamSize:num(v.teamSize),id:ref,date:today(),status:'New',owner:'',followUp:'',reportDue:'',notes:''}))) confirmation('Your enquiry is saved',ref,'The enquiry is available in Corporate partnerships in this browser’s management workspace. A partnership is confirmed only after the foundation agrees the scope.');
    });
  }
  function downloadProposal(pid) {
    const p=project(pid); if(!p) return api().toast('Project unavailable.');
    const PDF=window.jspdf?.jsPDF; if(!PDF) return api().toast('PDF download is unavailable. Please reload and try again.');
    const pdf=new PDF();let y=25;
    const write=(text,size=11,bold=false)=>{pdf.setFont('helvetica',bold?'bold':'normal');pdf.setFontSize(size);const lines=pdf.splitTextToSize(String(text).replace(/₹/g,'INR ').replace(/[—–·]/g,'-'),170);for(const line of lines){if(y>270){pdf.addPage();y=25;}pdf.text(line,20,y);y+=size*.48+2;}y+=5;};
    pdf.setTextColor(0,65,125);write(db().settings.name,18,true);write('PARTNERSHIP DISCUSSION PROPOSAL',10,true);write(p.name,22,true);pdf.setTextColor(45,62,80);
    write('Illustrative proposal - for discussion only. Programme figures and content are samples. This is not a signed funding commitment.');write('Prepared: '+date(today()));
    write('Programme overview',14,true);write(p.description);write('Focus: '+p.category+' | Location: '+p.location);write('Programme period: '+date(p.startDate)+' to '+date(p.endDate));
    write('Funding overview',14,true);write('Programme budget: INR '+num(p.budget).toLocaleString('en-IN'));write('Recorded funds raised: INR '+num(p.raised).toLocaleString('en-IN'));write('Remaining funding target: INR '+Math.max(0,num(p.budget)-num(p.raised)).toLocaleString('en-IN'));
    write('Possible partnership scope',14,true);write('Programme funding, employee volunteering, or a combination. Final contribution, activities, responsibilities and outcomes are to be agreed with the foundation.');
    write('Programme milestones',14,true);const ms=milestones(pid);write(ms.length?ms.map(m=>date(m.date)+': '+m.title+' ('+m.status+')').join('\n'):'Milestones to be agreed.');
    write('Reporting plan',14,true);write('Agree reporting dates at onboarding. Reports can include approved field updates, completed milestones, programme spending and the latest reported outcomes.');
    const outcomes=publishedUpdates(pid).filter(u=>u.metric);if(outcomes.length){write('Illustrative reported outcomes',14,true);write(outcomes.map(u=>u.metric+': '+num(u.value)+' (as of '+date(u.date)+')').join('\n'));}
    write('Next step',14,true);write('Submit a partnership enquiry through the foundation website. Contact details: '+(db().settings.email||'To be confirmed by the foundation.'));
    pdf.save('Seva-Setu-'+p.name.replace(/[^a-z0-9]+/gi,'-')+'-Partnership-Proposal.pdf');
    api().toast('Sample proposal downloaded.');
  }

  function adminHeader(title,body,actions='') {return `<div class="sg-section-head"><div><h2>${e(title)}</h2><p>${e(body)}</p></div><div class="sg-actions">${actions}</div></div>`;}
  function table(headers,rows) {return `<div class="sg-table-wrap"><table class="sg-table"><thead><tr>${headers.map(h=>`<th>${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${headers.length}">No records yet.</td></tr>`}</tbody></table></div>`;}
  const adminName = (name,sub='')=>`<strong>${e(name)}</strong>${sub?`<small>${e(sub)}</small>`:''}`;
  const projectOptions = () => db().projects.map(p=>[p.id,p.name]);
  const overdue = value => value&&value<today()?'<span class="sg-overdue">Overdue</span>':'';
  function renderAdmin(route) {
    if(route==='impactManager') return `<div class="sg-admin">${adminHeader('Make progress visible','Publish reviewed milestones and updates to the project tracker.',link('View public tracker','#impact',true)+button('Add milestone','milestone')+button('Write update','update'))}<section class="sg-card"><h3>Milestones</h3>${table(['Project','Milestone','Target date','Progress','Visibility','Actions'],db().impactMilestones.map(m=>[e(project(m.projectId)?.name||'Project unavailable'),e(m.title),date(m.date),chip(m.status),chip(m.visibility),button('Edit','milestone',m.id,true)]))}</section><section class="sg-card"><h3>Field updates</h3>${table(['Project','Update','Date','Publication','Actions'],db().impactUpdates.map(u=>[e(project(u.projectId)?.name||'Project unavailable'),adminName(u.title,u.metric?num(u.value)+' '+u.metric:''),date(u.date),chip(u.status)+(u.status==='Published'&&u.date>today()?'<small>Scheduled for future date</small>':''),button('Edit','update',u.id,true)]))}</section></div>`;
    if(route==='opportunityManager') {
      const apps=db().volunteerMatches;
      return `<div class="sg-admin">${adminHeader('Connect people with purpose','Manage roles, orientations, assignments and verified hours.',link('View opportunities','#opportunities',true)+button('Add opportunity','opportunity'))}<div class="sg-admin-tabs"><button data-action="sg-tab" data-id="opportunities" aria-pressed="${adminTab==='opportunities'}">Opportunities (${db().opportunities.length})</button><button data-action="sg-tab" data-id="applications" aria-pressed="${adminTab==='applications'}">Applications (${apps.length})</button></div>${adminTab==='opportunities'?`<section class="sg-card">${table(['Opportunity','Schedule','Capacity','Status','Actions'],db().opportunities.map(o=>[adminName(o.title,o.location+' · '+o.cause),e(o.schedule),num(o.capacity)-places(o)+' / '+num(o.capacity)+' assigned',chip(o.status),button('Edit','opportunity',o.id,true)]))}</section>`:`<div class="sg-stage-summary">${stages.map(s=>`<span>${s}<b>${apps.filter(a=>a.status===s).length}</b></span>`).join('')}</div><section class="sg-card">${table(['Applicant','Opportunity','Stage','Orientation','Verified hours','Actions'],apps.map(a=>[adminName(a.name,a.email),e(db().opportunities.find(o=>o.id===a.opportunityId)?.title||'Opportunity unavailable'),chip(a.status),date(a.orientationDate),num(a.verifiedHours),button('Review','review-application',a.id,true)]))}</section>`}</div>`;
    }
    const inquiries=db().partnershipEnquiries;
    return `<div class="sg-admin">${adminHeader('From first conversation to shared action','Track enquiries, ownership and the next commitment.',link('View partnership portal','#partnerships',true))}<div class="sg-stage-summary">${partnerStages.map(s=>`<span>${s}<b>${inquiries.filter(a=>a.status===s).length}</b></span>`).join('')}</div><section class="sg-card">${table(['Company','Programme & interest','Stage','Coordinator','Next follow-up','Report due','Actions'],inquiries.map(a=>[adminName(a.company,a.name+' · '+a.email),adminName(project(a.projectId)?.name||'Open to suggestions',a.type),chip(a.status),e(a.owner||'Unassigned'),date(a.followUp)+(a.status!=='Closed'?overdue(a.followUp):''),date(a.reportDue)+(a.status!=='Closed'?overdue(a.reportDue):''),button('Review','review-partner',a.id,true)]))}${inquiries.length?'':empty('Your next partnership starts with a conversation','Enquiries saved through the partnership portal will appear here.')}</section></div>`;
  }
  function milestoneForm(recordId='') {
    const m=db().impactMilestones.find(m=>m.id===recordId)||{date:today(),status:'Planned',visibility:'Draft'};
    if(!db().projects.length)return api().toast('Create a project first.');
    showForm(recordId?'Edit milestone':'Add a milestone',`<form id="sg-form"><div class="sg-form-grid">${select('projectId','Project',projectOptions(),m.projectId,true)}${field('title','Milestone',m.title,'text','required')}${field('date','Target date',m.date,'date','required')}${select('status','Progress',['Planned','In progress','Completed'],m.status)}${select('visibility','Visibility',['Draft','Published'],m.visibility)}</div>${formEnd()}</form>`,'Published milestones appear on the project’s public timeline.');
    bindForm(v=>{
      if(!v.title)return api().toast('Enter a milestone title.');
      if(transact('Saved project milestone',()=>{if(recordId)Object.assign(db().impactMilestones.find(x=>x.id===recordId),v);else db().impactMilestones.push({...v,id:id('MS')});})){api().closeModal();api().render();api().toast('Milestone saved.');}
    });
  }
  function updateForm(recordId='') {
    const u=db().impactUpdates.find(u=>u.id===recordId)||{date:today(),status:'Draft',value:0};
    if(!db().projects.length)return api().toast('Create a project first.');
    showForm(recordId?'Edit field update':'Write a field update',`<form id="sg-form"><div class="sg-form-grid">${select('projectId','Project',projectOptions(),u.projectId,true)}${field('title','Headline',u.title,'text','required')}${field('date','Report date',u.date,'date','required')}${select('status','Publication',['Draft','Published'],u.status)}${area('body','What happened?',u.body)}${field('metric','Outcome label (optional)',u.metric)}${field('value','Total reported outcome',u.value,'number','min="0" step="1"')}<p class="sg-fine sg-full">Report the total as of this date, for example “Learning kits distributed: 120”. The tracker shows the latest total for each label.</p>${field('photo','Photo URL or bundled asset path (optional)',u.photo)}${field('photoCaption','Photo description / caption',u.photoCaption)}${consent('approved','I have reviewed the figures and wording, and have permission to publish any included personal stories or photos.',u.approved===true)}</div>${formEnd()}</form>`,'Drafts stay in the workspace. Published updates require review.');
    bindForm(v=>{
      if(!v.title||!v.body)return api().toast('Enter a headline and update.');
      if(v.status==='Published'&&v.approved!=='on') return api().toast('Review the update and confirm permission before publishing.');
      if(v.photo&&!image(v.photo))return api().toast('Use an HTTPS image URL or a bundled asset path.');
      if(v.photo&&!v.photoCaption)return api().toast('Add a description for the photo.');
      v.approved=v.approved==='on';v.value=num(v.value);
      if(transact('Saved project field update',()=>{if(recordId)Object.assign(db().impactUpdates.find(x=>x.id===recordId),v);else db().impactUpdates.unshift({...v,id:id('UP'),demo:false});})){api().closeModal();api().render();api().toast(v.status==='Published'?'Reviewed update published.':'Draft saved.');}
    });
  }
  function opportunityForm(recordId='') {
    const o=db().opportunities.find(o=>o.id===recordId)||{status:'Open',hours:2,capacity:5,availability:'Weekends'};
    if(!db().projects.length)return api().toast('Create a project first.');
    showForm(recordId?'Edit opportunity':'Create an opportunity',`<form id="sg-form"><div class="sg-form-grid">${field('title','Opportunity title',o.title,'text','required')}${select('projectId','Project',projectOptions(),o.projectId,true)}${field('location','Location or Remote',o.location,'text','required')}${select('availability','Availability',['Weekends','Weekdays','Flexible'],o.availability)}${field('schedule','Session schedule',o.schedule,'text','required placeholder="Saturdays · 10:00–12:00"')}${field('hours','Hours per session',o.hours,'number','required min="0.5" max="24" step="0.5"')}${field('skills','Useful skills (comma-separated)',o.skills,'text','required')}${field('capacity','Concurrent assignment capacity',o.capacity,'number','required min="1" max="10000" step="1"')}${select('status','Listing status',['Open','Closed'],o.status)}${area('description','Role and onboarding details',o.description)}</div>${formEnd()}</form>`,'Open opportunities appear in the public matching page.');
    bindForm(v=>{
      if(!v.title||!v.location||!v.schedule||!v.skills||!v.description)return api().toast('Complete all required details.');
      const count=db().volunteerMatches.filter(a=>a.opportunityId===recordId&&a.status==='Assigned').length;
      if(num(v.capacity)<count)return api().toast('Capacity cannot be below the number already assigned.');
      v.hours=num(v.hours);v.capacity=num(v.capacity);v.cause=project(v.projectId)?.category||'Community Outreach';
      if(transact('Saved volunteer opportunity',()=>{if(recordId)Object.assign(db().opportunities.find(x=>x.id===recordId),v);else db().opportunities.push({...v,id:id('OP')});})){api().closeModal();api().render();api().toast('Opportunity saved.');}
    });
  }
  function reviewApplication(recordId) {
    const a=db().volunteerMatches.find(a=>a.id===recordId),o=db().opportunities.find(o=>o.id===a?.opportunityId);
    if(!a)return;
    showForm('Review volunteer application',`<div class="sg-form-intro"><h3>${e(a.name)}</h3><p>${e(a.email)}${a.phone?' · '+e(a.phone):''}</p><p><strong>${e(o?.title||'Opportunity unavailable')}</strong></p><p>Skills: ${e(a.skills)}</p><p class="sg-prewrap">${e(a.motivation)}</p></div><div class="sg-steps compact">${stages.slice(0,4).map((s,i)=>`<div class="${a.status===s?'current':''}"><b>0${i+1}</b><span>${s}</span></div>`).join('')}</div><form id="sg-form"><div class="sg-form-grid">${select('status','Application stage',stages,a.status)}${field('orientationDate','Orientation date',a.orientationDate,'date')}${area('notes','Coordinator notes',a.notes,false)}</div><p class="sg-fine">Assigning creates or links a volunteer record. Orientation must be completed before assignment. Recording service adds verified hours to that volunteer.</p>${formEnd('Save review')}</form><div class="sg-service-summary"><strong>${num(a.verifiedHours)} verified service hours</strong>${a.status==='Assigned'?button('Record verified service','service',a.id,true):''}</div>${table(['Service date','Hours'],db().attendance.filter(x=>x.applicationId===a.id).map(x=>[date(x.date),num(x.hours)]))}`,'Application '+a.id);
    bindForm(v=>{
      if(v.status==='Orientation'&&!v.orientationDate)return api().toast('Set an orientation date.');
      if(v.status==='Assigned'){
        if(!['Orientation','Assigned'].includes(a.status))return api().toast('Move this application through orientation before assignment.');
        if(!v.orientationDate||v.orientationDate>today())return api().toast('Complete orientation before assigning the volunteer.');
        if(!o||o.status!=='Open'||!project(o.projectId)||project(o.projectId).status==='On hold')return api().toast('The opportunity must be open and its project available.');
        if(a.status!=='Assigned'&&!places(o))return api().toast('This opportunity is fully assigned.');
      }
      if(v.status==='Completed'&&(a.status!=='Assigned'&&a.status!=='Completed'||!num(a.verifiedHours)))return api().toast('Assign the volunteer and record their verified service before completing.');
      if(a.status==='Completed'&&v.status!=='Completed')return api().toast('Completed applications remain in the service history.');
      if(a.status==='Assigned'&&['Applied','Orientation'].includes(v.status))return api().toast('An assigned application can be completed or declined.');
      if(transact('Reviewed volunteer opportunity application',()=>{
        const row=db().volunteerMatches.find(x=>x.id===recordId);Object.assign(row,v);
        if(v.status==='Assigned'){
          let person=db().volunteers.find(x=>x.email.toLowerCase()===row.email.toLowerCase());
          if(person&&person.status==='Blocked')throw new Error('This volunteer is blocked. Review their record first.');
          if(!person){person={id:id('V'),name:row.name,email:row.email,phone:row.phone,skills:row.skills,department:o.cause,status:'Active',joined:today(),hours:0};db().volunteers.unshift(person);}
          else if(person.status!=='Active')person.status='Active';
          row.personId=person.id;
        }
      })){api().closeModal();api().render();api().toast('Application updated.');}
    });
  }
  function recordService(recordId) {
    const a=db().volunteerMatches.find(a=>a.id===recordId);
    if(!a||a.status!=='Assigned')return api().toast('Assign the volunteer before recording service.');
    showForm('Record verified service',`<p class="sg-form-intro">Confirm attendance and hours for ${e(a.name)}.</p><form id="sg-form"><div class="sg-form-grid">${field('date','Service date',today(),'date',`required max="${today()}"`)}${field('hours','Hours verified','','number','required min="0.5" max="24" step="0.5"')}${consent('verified','I have verified attendance and these service hours.')}</div>${formEnd('Record hours')}</form>`);
    bindForm(v=>{
      if(v.verified!=='on')return api().toast('Confirm that the service was verified.');
      const row=db().volunteerMatches.find(x=>x.id===recordId),person=db().volunteers.find(x=>x.id===row?.personId);
      if(!person||row.status!=='Assigned')return api().toast('The assigned volunteer record is unavailable.');
      if(v.date>today()||v.date<(row.orientationDate||row.date))return api().toast('Use a service date after orientation and no later than today.');
      if(db().attendance.some(x=>x.personId===person.id&&x.date===v.date))return api().toast('Attendance already exists for this volunteer on that date.');
      if(transact('Verified volunteer service hours',()=>{
        const hours=num(v.hours);row.verifiedHours=num(row.verifiedHours)+hours;person.hours=num(person.hours)+hours;
        db().attendance.unshift({id:id('ATT'),personId:person.id,name:person.name,date:v.date,status:'Present',hours,applicationId:row.id,opportunityId:row.opportunityId});
      })){api().render();reviewApplication(recordId);api().toast('Verified service added to volunteer attendance.');}
    });
  }
  function reviewPartner(recordId) {
    const a=db().partnershipEnquiries.find(a=>a.id===recordId);if(!a)return;
    const owners=[['','Unassigned'],...db().staff.filter(x=>x.status==='Active').map(x=>x.name)];if(a.owner&&!owners.includes(a.owner))owners.push(a.owner);
    showForm('Review partnership enquiry',`<div class="sg-form-intro"><h3>${e(a.company)}</h3><p>${e(a.name)} · ${e(a.email)}${a.phone?' · '+e(a.phone):''}</p><p>${e(project(a.projectId)?.name||'Open to suggestions')} · ${e(a.type)}</p><p>Indicative budget: ${a.budget?money(a.budget):'Not specified'} · Team: ${a.teamSize||'Not specified'}</p><p class="sg-prewrap">${e(a.message)}</p></div><form id="sg-form"><div class="sg-form-grid">${select('status','Partnership stage',partnerStages,a.status)}${select('owner','Coordinator',owners,a.owner)}${field('followUp','Next follow-up',a.followUp,'date')}${field('reportDue','Next report due',a.reportDue,'date')}${area('notes','Discussion notes and agreed next steps',a.notes,false)}</div><p class="sg-fine">These dates are tracked here; no automated messages are sent. Agreed budgets do not count as received donations.</p>${formEnd('Save partnership')}</form>${a.projectId?button('Download project proposal','proposal',a.projectId,true):''}`,'Enquiry '+a.id);
    bindForm(v=>{if(transact('Updated corporate partnership enquiry',()=>Object.assign(db().partnershipEnquiries.find(x=>x.id===recordId),v))){api().closeModal();api().render();api().toast('Partnership follow-up saved.');}});
  }

  function bind() {
    const filter=document.getElementById('sg-filter-form');
    if(filter){
      const apply=()=>{filters=Object.fromEntries(new FormData(filter));document.getElementById('sg-opportunity-results').innerHTML=opportunityCards();};
      filter.addEventListener('input',apply);filter.addEventListener('change',apply);filter.addEventListener('submit',event=>event.preventDefault());
      filter.addEventListener('reset',event=>{event.preventDefault();filters={location:'',cause:'',availability:'',skills:''};for(const input of filter.querySelectorAll('input,select'))input.value='';apply();});
    }
  }
  function isPublic(route) {return ['impact','opportunities','partnerships'].includes(route)||route.startsWith('impact/');}
  function isAdmin(route) {return ['impactManager','opportunityManager','partnershipManager'].includes(route);}
  function renderPublic(route) {
    if(route==='impact')return impactPage();
    if(route.startsWith('impact/')){let pid='';try{pid=decodeURIComponent(route.slice(7));}catch{}return projectPage(pid);}
    return route==='opportunities'?opportunitiesPage():partnershipsPage();
  }
  function handleAction(action,el) {
    if(!action.startsWith('sg-'))return false;
    const recordId=el.dataset.id||'';
    switch(action){
      case 'sg-close':api().closeModal();break;
      case 'sg-support':{const p=project(recordId);if(p)window.openDonation({project:p.name});break;}
      case 'sg-apply':applicationForm(recordId);break;
      case 'sg-partner-enquiry':partnershipForm(recordId);break;
      case 'sg-proposal':downloadProposal(recordId);break;
      case 'sg-tab':adminTab=recordId;api().render();break;
      case 'sg-milestone':milestoneForm(recordId);break;
      case 'sg-update':updateForm(recordId);break;
      case 'sg-opportunity':opportunityForm(recordId);break;
      case 'sg-review-application':reviewApplication(recordId);break;
      case 'sg-service':recordService(recordId);break;
      case 'sg-review-partner':reviewPartner(recordId);break;
    }
    return true;
  }
  window.SevaGrowth={initialize,isPublic,isAdmin,renderPublic,renderAdmin,bind,homeSection,handleAction,filterOpportunities};
})();
